import {
  BadGatewayException,
  BadRequestException,
  ConflictException,
  ConsoleLogger,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotAcceptableException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AdminEntity } from 'src/Entity/admins.entity';
import {
  AdminRepository,
  DiscountRepository,
  PriceListRepository,
  RepliesRepository,
  VehicleRepository,
  VehicleTypeRepository,
} from './admin.repository';
import {
  ChannelDto,
  DiscountDto,
  PriceListDto,
  RegisterVehicleDto,
  ReplyDto,
  ReturnedVehicleDto,
  UpdateAdminDto,
  UpdateDiscountDto,
  UpdatePriceListDto,
  UpdateVehicleDto,
  VehicleTypeDto,
  updateResolutionStatusDto,
} from './admin.dto';
import { VehicleEntity } from 'src/Entity/vehicle.entity';
import { UploadService } from 'src/common/helpers/upload.service';
import { RiderEntity } from 'src/Entity/riders.entity';
import { RidersRepository } from 'src/Riders/riders.repository';
import {
  AdminType,
  BidStatus,
  OrderDisplayStatus,
  OrderStatus,
  PaymentStatus,
  ReturnedVehicle,
  RiderStatus,
  VehicleAssignedStatus,
  channelforconversation,
  complainResolutionStatus,
} from 'src/Enums/all-enums';
import { CustomerService } from 'src/customer/customer.service';
import { customAlphabet } from 'nanoid';
import * as nanoid from 'nanoid';
import { Notifications } from 'src/Entity/notifications.entity';
import {
  DiscountUsageRepository,
  NotificationRepository,
} from 'src/common/common.repositories';
import { ComplaintEntity } from 'src/Entity/complaints.entity';
import {
  NewsLetterRepository,
  complaintRepository,
} from 'src/customer/customer.repository';
import { RepliesEntity } from 'src/Entity/replies.entity';
import {
  ChangePasswordDto,
  ComplaintDto,
  markNotificationAsReadDto,
} from 'src/customer/customer.dto';
import { GeneatorService } from 'src/common/services/generator.service';
import { DiscountEntity } from 'src/Entity/discount.entity';
import { DiscountUsageEntity } from 'src/Entity/discountUsage.entity';
import { ApplypromoCodeDto } from 'src/common/common.dto';
import { PriceListEntity } from 'src/Entity/pricelist.entity';
import { OrderRepository } from 'src/order/order.reposiroty';
import { OrderEntity } from 'src/Entity/orders.entity';
import { NewsLetterEntity } from 'src/Entity/newsletter.entity';
import { CloudinaryService } from 'src/common/services/claudinary.service';
import { VehicleTypeEntity } from 'src/Entity/vehicleType.entity';
import { LessThan, MoreThanOrEqual } from 'typeorm';
@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(AdminEntity) private readonly adminRepo: AdminRepository,
    @InjectRepository(VehicleEntity)
    private readonly vehiclerepo: VehicleRepository,
    @InjectRepository(VehicleTypeEntity)
    private readonly vehicletyperepo: VehicleTypeRepository,
    @InjectRepository(RiderEntity) private readonly riderrepo: RidersRepository,
    @InjectRepository(Notifications)
    private readonly notificationripo: NotificationRepository,
    @InjectRepository(ComplaintEntity)
    private readonly complaintripo: complaintRepository,
    @InjectRepository(DiscountEntity)
    private readonly discountripo: DiscountRepository,
    @InjectRepository(DiscountUsageEntity)
    private readonly discountusageripo: DiscountUsageRepository,
    @InjectRepository(PriceListEntity)
    private readonly pricelistripo: PriceListRepository,
    @InjectRepository(OrderEntity) private readonly orderRepo: OrderRepository,
    @InjectRepository(NewsLetterEntity)
    private readonly newsletterripo: NewsLetterRepository,

    @InjectRepository(RepliesEntity)
    private readonly repliesripo: RepliesRepository,
    private uploadservice: UploadService,
    private genratorservice: GeneatorService,
    private cloudinaryservice: CloudinaryService,
  ) {}

  async EditAdminProfile(dto: UpdateAdminDto, Admin: AdminEntity) {
    try {
      const admin = await this.adminRepo.findOne({
        where: { id: Admin.id, admintype: AdminType.CEO },
      });
      if (!admin) throw new NotFoundException('ceo not found');
  
      // Validate and update DOB if provided
      if (dto.DOB) {
        const dob = new Date(dto.DOB);
        if (isNaN(dob.getTime())) {
          throw new BadRequestException('Invalid date of birth');
        }
  
        const today = new Date();
        let age = today.getFullYear() - dob.getFullYear();
        const monthDifference = today.getMonth() - dob.getMonth();
        const dayDifference = today.getDate() - dob.getDate();
  
        // Adjust age if the birthday hasn't occurred yet this year
        if (monthDifference < 0 || (monthDifference === 0 && dayDifference < 0)) {
          age--;
        }
  
        admin.DOB = dto.DOB;
        admin.age = age;
      }
  
      // Update other fields if provided
      if (dto.LGA !== undefined) admin.LGA_of_origin = dto.LGA;
      if (dto.email !== undefined) admin.email = dto.email;
      if (dto.fullname !== undefined) admin.fullname = dto.fullname;
      if (dto.state_of_origin !== undefined) admin.state_of_origin = dto.state_of_origin;
      if (dto.Address !== undefined) admin.home_address = dto.Address;
      if (dto.gender !== undefined) admin.gender = dto.gender;
      if (dto.mobile !== undefined) admin.mobile = dto.mobile;
      if (dto.Nationality !== undefined) admin.Nationality = dto.Nationality;
  
      admin.UpdatedAt = new Date();
  
      await this.adminRepo.save(admin);
  
      // Save the notification
      const notification = new Notifications();
      notification.account = 'super admin';
      notification.subject = 'ceo updated Record!';
      notification.message = `ceo with id ${admin.id} has updated their record on Ostra Logistics.`;
      await this.notificationripo.save(notification);
  
      return {
        message:'Ceo profile updated successfully',
        admin }
      
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      } else if (error instanceof BadRequestException) {
        throw new BadRequestException(error.message);
      } else {
        console.error(error);
        throw new InternalServerErrorException(
          'Something went wrong while trying to update the record of a super admin',
          error.message,
        );
      }
    }
  }
  

  async UploadAdminProfilePics(
    mediafile: Express.Multer.File,
    Admin: AdminEntity,
  ): Promise<{ message: string }> {
    try {
      const admin = await this.adminRepo.findOne({
        where: { id: Admin.id, admintype: AdminType.CEO },
      });
      if (!admin) throw new NotFoundException('ceo not found');

      const display_pics = await this.cloudinaryservice.uploadFile(mediafile);
      const mediaurl = display_pics.secure_url;

      //update the image url

      admin.profile_picture = mediaurl;

      await this.adminRepo.save(admin);

      //save the notification
      const notification = new Notifications();
      notification.account = admin.id;
      notification.subject = 'CEO Uploaded Profile Pics!';
      notification.message = `CEO with id ${admin.id} have uploaded a profile picture in the admin app of ostra logistics `;
      await this.notificationripo.save(notification);

      return { message: 'your profile picture has been uploaded successully ' };
    } catch (error) {
      if (error instanceof NotFoundException)
        throw new NotFoundException(error.message);
      else {
        console.log(error);
        throw new InternalServerErrorException(
          'something went wrong while trying to upload profile picture ',
          error.message,
        );
      }
    }
  }

  // change password
  async changeCustomerPassword(
    dto: ChangePasswordDto,
    customer: AdminEntity,
  ): Promise<{ message: string }> {
    try {
      const { oldPassword, password, confirmPassword } = dto;

      const comparepass = await this.genratorservice.comaprePassword(
        dto.oldPassword,
        customer.password,
      );
      if (!comparepass)
        throw new NotAcceptableException(
          'the old password provided does not match the existing passworod',
        );

      const hashpass = await this.genratorservice.hashpassword(dto.password);

      customer.password = hashpass;

      await this.adminRepo.save(customer);

      //save the notification
      const notification = new Notifications();
      notification.account = customer.id;
      notification.subject = 'CEO Changed Password!';
      notification.message = `the ceo with id ${customer.id} have made changes to his existing record in the admin dashboard of ostra logistics `;
      await this.notificationripo.save(notification);

      return { message: 'password changed successfully' };
    } catch (error) {
      if (error instanceof NotAcceptableException) {
        throw new NotAcceptableException(error.message);
      } else {
        console.error(error);
        throw new InternalServerErrorException(
          'Something went wrong while trying to change password. Please try again later.',
          error.message,
        );
      }
    }
  }

  async AddVehicleType(dto: VehicleTypeDto) {
    try {
      const vehicletype = new VehicleTypeEntity();
      vehicletype.name = dto.name;
      vehicletype.status = dto.status;
      vehicletype.addedAt = new Date();

      await this.vehicletyperepo.save(vehicletype);

      //save the notification
      const notification = new Notifications();
      notification.account = 'super admin';
      notification.subject = 'Vehicle Type Added!';
      notification.message = `a new vehicleType have been added on the admin portal of ostra ogistics by superadmin  `;
      await this.notificationripo.save(notification);

      return vehicletype;
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(
        'something went wrong while adding a vehicletype, please try again later',
        error.message,
      );
    }
  }

  //get the vehicle types
  async GetAllVehicleType() {
    try {
      const vehicletype = await this.vehicletyperepo.findAndCount();
      if (vehicletype[1] === 0)
        throw new NotFoundException(
          'you have no vehicle type added at the moment',
        );

      return vehicletype;
    } catch (error) {
      if (error instanceof NotFoundException)
        throw new NotFoundException(error.message);
      else {
        console.log(error);
        throw new InternalServerErrorException(
          'something went wrong while fetching all vehicletype, please try again later',
          error.message,
        );
      }
    }
  }

  //get one vehicletype
  async GetOneVehicleType(vehicletypeID: number) {
    try {
      const vehicletype = await this.vehicletyperepo.findOne({
        where: { id: vehicletypeID },
      });
      if (!vehicletype)
        throw new NotFoundException(
          `you have no vehicleType with the ID ${vehicletype}`,
        );

      return vehicletype;
    } catch (error) {
      if (error instanceof NotFoundException)
        throw new NotFoundException(error.message);
      else {
        console.log(error);
        throw new InternalServerErrorException(
          'something went wrong while fetching one vehicletype, please try again later',
          error.message,
        );
      }
    }
  }

  //delete vehicletype
  async DeleteOneVehicleType(vehicletypeID: number) {
    try {
      const vehicletype = await this.vehicletyperepo.findOne({
        where: { id: vehicletypeID },
      });
      if (!vehicletype)
        throw new NotFoundException(
          `you have no vehicleType with the ID ${vehicletypeID}`,
        );

      await this.vehicletyperepo.remove(vehicletype);
      return {
        message: `vehicleType with ID ${vehicletypeID} have been deleted`,
      };
    } catch (error) {
      if (error instanceof NotFoundException)
        throw new NotFoundException(error.message);
      else {
        console.log(error);
        throw new InternalServerErrorException(
          'something went wrong while deleting one vehicletype, please try again later',
          error.message,
        );
      }
    }
  }

  //register vehicle
  async RegisterVehicle(dto: RegisterVehicleDto, file: Express.Multer.File) {
    try {
      let imageurl: string | null = null;
      if (file) {
        const display_pics = await this.cloudinaryservice.uploadFile(file);
        imageurl = display_pics.secure_url;
      }

      const newVehicle = new VehicleEntity();
      newVehicle.vehicleID = `#OslV-${await this.genratorservice.generateUserID()}`;
      newVehicle.vehicle_type = dto.vehicle_type;
      newVehicle.color = dto.color;
      newVehicle.registration_number = dto.registration_number;
      newVehicle.state_of_vehicle = dto.state_of_vehicle;
      if (imageurl) {
        newVehicle.vehiclePics = imageurl;
      }

      newVehicle.vehicle_model = dto.vehicle_model;
      newVehicle.status = dto.status;
      newVehicle.RegisteredAt = new Date();

      await this.vehiclerepo.save(newVehicle);

      //save the notification
      const notification = new Notifications();
      notification.account = 'super admin';
      notification.subject = 'Vehicle Registered!';
      notification.message = `a new vehicle with id ${newVehicle.vehicleID} have been registered on the admin portal of ostra ogistics by superadmin  `;
      await this.notificationripo.save(notification);

      return newVehicle;
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(
        'something went wrong while registering a vehicle, please try again later',
        error.message,
      );
    }
  }

  async SearchVehicle(keyword: string, page?:number, perPage?:number, sort?:string): Promise<{ data: VehicleEntity[]; total: number }> {
    try {
      const qb = this.vehiclerepo.createQueryBuilder('vehicle')

      qb.where('vehicle.vehicle_type ILIKE :keyword',{keyword:`%${keyword}%`})
      qb.orWhere('vehicle.vehicle_model ILIKE :keyword',{keyword:`%${keyword}%`})
      qb.orWhere('vehicle.registration_number ILIKE :keyword',{keyword:`%${keyword}%`})
      qb.cache(false)


      if (sort) {
        const [sortField] = sort.split(',');
        qb.orderBy(`vehicle.${sortField}`, 'DESC');
      }

      if (page && perPage) {
        qb.skip((page - 1) * perPage).take(perPage);
      }

      const [vehicle, total] = await qb.getManyAndCount();

      if (!vehicle.length) {
        throw new NotFoundException(
          `No vehicle found matching your search criteria for "${keyword}".`,
        );
      }
  
      return { data: vehicle, total };

      
    } catch (error) {
      if (error instanceof NotFoundException)
        throw new NotFoundException(error.message);
      else {
        console.log(error);
        throw new InternalServerErrorException(
          'something went wrong while tryig to search for an admin, please try again later',
          error.message,
        );
      }
    }
  }

  //register vehicle
  async updateVehicle(
    dto: UpdateVehicleDto,
    file: Express.Multer.File,
    vehicleiD: number,
  ) {
    try {
      const vehicle = await this.vehiclerepo.findOne({
        where: { id: vehicleiD },
      });
      if (!vehicle)
        throw new NotFoundException(
          `the vehicle with id ${vehicleiD} does not exist`,
        );

      let imageurl: string | null = null;
      if (file) {
        const display_pics = await this.cloudinaryservice.uploadFile(file);
        imageurl = display_pics.secure_url;
      }

      vehicle.color = dto.color;
      vehicle.vehicle_type = dto.vehicle_type;
      vehicle.registration_number = dto.registration_number;
      vehicle.state_of_vehicle = dto.state_of_vehicle;
      if (imageurl) {
        vehicle.vehiclePics = imageurl;
      }
      vehicle.vehicle_model = dto.vehicle_model;
      vehicle.UpdatedAt = new Date();

      await this.vehiclerepo.save(vehicle);

      //save the notification
      const notification = new Notifications();
      notification.account = 'admin';
      notification.subject = 'vehicle Record Updated !';
      notification.message = `an existing vehicle with id ${vehicle.vehicleID} records have been updated on the admin portal of ostra ogistics by superadmin  `;
      await this.notificationripo.save(notification);

      return vehicle;
    } catch (error) {
      if (error instanceof NotFoundException)
        throw new NotFoundException(error.message);
      else {
        console.log(error);
        throw new InternalServerErrorException(
          'something went wrong while updating a vehicle record, please try again later',
          error.message,
        );
      }
    }
  }

  //delete vehicle
  async DeleteVehicle(vehicleID: number) {
    try {
      const vehicle = await this.vehiclerepo.findOne({
        where: { id: vehicleID },
      });
      if (!vehicle)
        throw new NotFoundException(
          `the vehicle with id ${vehicleID} does not exist`,
        );

      //remove the vehicle
      await this.vehiclerepo.remove(vehicle);

      //save the notification
      const notification = new Notifications();
      notification.account = 'admin';
      notification.subject = 'vehicle Record Deleted !';
      notification.message = `an existing vehicle with id ${vehicle.vehicleID} records have been deleted on the admin portal of ostra ogistics by superadmin  `;
      await this.notificationripo.save(notification);

      return { message: `vehicle with id ${vehicle}` };
    } catch (error) {
      if (error instanceof NotFoundException)
        throw new NotFoundException(error.message);
      else {
        console.log(error);
        throw new InternalServerErrorException(
          'something went wrong while deleting a vehicle record, please try again later',
        );
      }
    }
  }

  //fetch all vehicle
  async fetchAllVehicle() {
    try {
      const vehicles = await this.vehiclerepo.findAndCount({
        relations: ['assigned_Rider'],
      });
      if (vehicles[1] === 0)
        throw new NotFoundException('there are currently no vehicle records ');

      return vehicles;
    } catch (error) {
      if (error instanceof NotFoundException)
        throw new NotFoundException(error.message);
      else {
        console.log(error);
        throw new InternalServerErrorException(
          'something went wrong while assigning  fetching all vehicles, please try again later',
          error.message,
        );
      }
    }
  }

  //fetch all vehicle
  async fetchOneVehicle(VehicleID) {
    try {
      const vehicles = await this.vehiclerepo.findOne({
        where: { id: VehicleID },
        relations: ['assigned_Rider'],
      });
      if (!vehicles)
        throw new NotFoundException(
          `there are currently no vehicle records with the id ${VehicleID}`,
        );

      return vehicles;
    } catch (error) {
      if (error instanceof NotFoundException)
        throw new NotFoundException(error.message);
      else {
        console.log(error);
        throw new InternalServerErrorException(
          'something went wrong while assigning  fetching all vehicles, please try again later',
          error.message,
        );
      }
    }
  }

  //assign vehicle for a day to a rider

  async assignAVhicleToADriver(riderID: string, vehicleID: number) {
    try {
      const rider = await this.riderrepo.findOne({ where: { id: riderID } });
      if (!rider)
        throw new NotFoundException(
          `rider with id ${riderID}is not found, so this vehilcle cannot be assigned`,
        );

      const vehicle = await this.vehiclerepo.findOne({
        where: { id: vehicleID },
        relations: ['assigned_Rider'],
      });
      if (!vehicle)
        throw new NotFoundException(
          `the vehicle with id ${vehicleID} does not exist`,
        );

      //assingn vehicle
      vehicle.assigned_Rider = rider;
      vehicle.status = VehicleAssignedStatus.ASSIGNED;
      vehicle.assignedAT = new Date();
      await this.vehiclerepo.save(vehicle);

      //update rider entity
      rider.status = RiderStatus.AVAILABLE;
      await this.riderrepo.save(rider);

      //save the notification
      const notification = new Notifications();
      notification.account = rider.id;
      notification.subject = 'vehicle Assigned For The Day !';
      notification.message = ` vehicle with id ${vehicle.vehicleID} have been assigned to rider ${rider.id} on the admin portal of ostra ogistics by superadmin  `;
      await this.notificationripo.save(notification);

      return vehicle;
    } catch (error) {
      if (error instanceof NotFoundException)
        throw new NotFoundException(error.message);
      else {
        console.log(error);
        throw new InternalServerErrorException(
          'something went wrong while assigning  a vehicle to this rider, please try again later',
          error.message,
        );
      }
    }
  }

  //report when a rider returns back a bike
  async ReportVehicleReturnStatus(
    dto: ReturnedVehicleDto,
    vehicleID: number,
    riderID: string,
  ) {
    try {
      const vehicle = await this.vehiclerepo.findOne({
        where: { id: vehicleID },
        relations: ['assigned_Rider'],
      });
      if (!vehicle)
        throw new NotFoundException(
          `the vehicle with id ${vehicleID} does not exist`,
        );

      //if the case is when the vehicle is not assigned
      if (vehicle && vehicle.assigned_Rider === null)
        throw new BadRequestException(
          'this vehicle is not yet assigned to any rider, so you cannot return what was not assigned',
        );

      const rider = await this.riderrepo.findOne({
        where: { vehicle_for_the_day: { id: vehicleID } },
        relations: ['vehicle_for_the_day'],
      });
      if (!rider)
        throw new ConflictException(
          'this is not same vehicle that was assigned to this driver',
        );

      if ( dto.returned === ReturnedVehicle.YES) {
        //report
        vehicle.returned_vehicle = dto.returned;
        vehicle.status = VehicleAssignedStatus.UNASSIGNED;
        vehicle.assigned_Rider = null;
        vehicle.retrnedAt = new Date();
        await this.vehiclerepo.save(vehicle);

        //save the notification
        const notification = new Notifications();
        notification.account = rider.id;
        notification.subject = 'Assigned Vehicle Returned !';
        notification.message = ` vehicle with id ${vehicle.vehicleID} initially assigned to rider ${rider.id} has been returned  on the admin portal of ostra ogistics by superadmin  `;
        await this.notificationripo.save(notification);

        //update the rider db too
        rider.vehicle_for_the_day = null;
        rider.status = RiderStatus.OFFLINE;
        await this.riderrepo.save(rider);
      }

      if (dto && dto.returned === ReturnedVehicle.NOT_YET) {
        vehicle.returned_vehicle = dto.returned;
        vehicle.UpdatedAt = new Date();
        await this.vehiclerepo.save(vehicle);
      }

      return vehicle;
    } catch (error) {
      if (error instanceof ConflictException)
        throw new ConflictException(error.message);
      else if (error instanceof NotFoundException)
        throw new NotFoundException(error.message);
      else if (error instanceof BadRequestException)
        throw new BadRequestException(error.message);
      else {
        console.log(error);
        throw new InternalServerErrorException(
          'something happened, while reporting the return status of a vehicle',
          error.message,
        );
      }
    }
  }

  //fetch complains
  async FetchAllComplaint() {
    try {
      const complaint = await this.complaintripo.findAndCount({
        relations: ['customer', 'replies','admin','assigned_staff'],
      });

      if (complaint[1] === 0)
        throw new NotFoundException('there are no complaints at the moment');
      return complaint;
    } catch (error) {
      if (error instanceof NotFoundException)
        throw new NotFoundException(error.message);
      else {
        console.log(error);
        throw new InternalServerErrorException(
          'something went wrong while trying to fetch all complaint filed',
          error.message,
        );
      }
    }
  }

  async FetchOneComplaint(complaintID: number) {
    try {
      const complaint = await this.complaintripo.findOne({
        where: { id: complaintID },
        relations: ['customer', 'replies','admin','assigned_staff'],
      });

      if (!complaint)
        throw new NotFoundException(
          'there are no complaints associated with this complaint ID ',
        );
      return complaint;
    } catch (error) {
      if (error instanceof NotFoundException)
        throw new NotFoundException(error.message);
      else {
        console.log;
        throw new InternalServerErrorException(
          'something went wrong while trying to fetch all complaint filed',
          error.message,
        );
      }
    }
  }

  //reply complains

  async ReplyComplaint(Admin: AdminEntity, dto: ReplyDto, complaintID: number) {
    try {
      const complaint = await this.complaintripo.findOne({
        where: { id: complaintID },
        relations: ['customer', 'replies'],
      });

      if (!complaint) throw new NotFoundException('compalaint not found');

      //reply compliant
      const reply = new RepliesEntity();
      reply.complaint = complaint;
      reply.repliedBy = Admin;
      reply.reply = dto.reply;
      reply.repliedAT = new Date();

      await this.repliesripo.save(reply);

      //notification
      const notification = new Notifications();
      notification.account = 'admin';
      notification.subject = 'Replied a complaint!';
      notification.message = ` complaint with ticket ${complaint.ticket} has been replied by admin with id ${Admin.id}   on the admin portal of ostra ogistics by superadmin  `;
      await this.notificationripo.save(notification);

      return reply;
    } catch (error) {
      if (error instanceof NotFoundException)
        throw new NotFoundException(error.message);
      else {
        console.log;
        throw new InternalServerErrorException(
          'something went wrong while trying to reply a complaint filed',
          error.message,
        );
      }
    }
  }

  //delete complains
  async deleteResolvedcomplain(complaintID: number) {
    try {
      const complaint = await this.complaintripo.findOne({
        where: { id: complaintID },
        relations: ['customer', 'replies'],
      });
      if (!complaint) throw new NotFoundException('compalaint not found');

      //check if complaint is closed before deleting
      if (complaint && complaint.status !== complainResolutionStatus.RESOLVED)
        throw new NotAcceptableException(
          ' this complaint cannot be deleted, because it has not been reported as resolved yet',
        );
      //delete the complliant
      await this.complaintripo.remove(complaint);

      //notification
      const notification = new Notifications();
      notification.account = 'admin';
      notification.subject = 'delete a complaint!';
      notification.message = ` complaint with ticket ${complaint.ticket} has been deleted on the admin portal of ostra ogistics by superadmin  `;
      await this.notificationripo.save(notification);

      return { message: 'complaint has been successfully deleted' };
    } catch (error) {
      if (error instanceof NotFoundException)
        throw new NotFoundException(error.message);
      else if (error instanceof NotAcceptableException)
        throw new NotAcceptableException(error.message);
      else {
        console.log;
        throw new InternalServerErrorException(
          'something went wrong while trying to delete a complaint filed',
          error.message,
        );
      }
    }
  }

  //change channel status to open or close
  async changeChannelStatus(dto: ChannelDto, complaintID: number) {
    try {
      const complaint = await this.complaintripo.findOne({
        where: { id: complaintID },
        relations: ['customer', 'replies'],
      });
      if (!complaint) throw new NotFoundException('compalaint not found');

      if (dto && dto.action === channelforconversation.CLOSE) {
        complaint.channel = channelforconversation.CLOSE;
        complaint.closedAT = new Date();
        await this.complaintripo.save(complaint);

        //notification
        const notification = new Notifications();
        notification.account = 'admin';
        notification.subject = 'changed the channel status';
        notification.message = ` the channel for complaint with ticket ${complaint.ticket} has been closed  `;
        await this.notificationripo.save(notification);
      } else if (dto && dto.action === channelforconversation.OPEN) {
        //check if complaint is closed before deleting
        if (complaint && complaint.status === complainResolutionStatus.RESOLVED)
          throw new NotAcceptableException(
            ' the channel of this complaint cannot be opened  , because it has been reported as resolved',
          );

        complaint.channel = channelforconversation.OPEN;
        complaint.openedAT = new Date();
        await this.complaintripo.save(complaint);

        //notification
        const notification = new Notifications();
        notification.account = complaint.customer.id;
        notification.subject = 'changed the channel status';
        notification.message = ` the channel for complaint with ticket ${complaint.ticket} has been opened  `;
        await this.notificationripo.save(notification);
      }

      return complaint;
    } catch (error) {
      if (error instanceof NotFoundException)
        throw new NotFoundException(error.message);
      else if (error instanceof NotAcceptableException)
        throw new NotAcceptableException(error.message);
      else {
        console.log;
        throw new InternalServerErrorException(
          'something went wrong while trying to change the channel status  of the  complaint thread',
          error.message,
        );
      }
    }
  }

  //change resolution status to on_hold or resolved
  async changeresolutionStatus(
    dto: updateResolutionStatusDto,
    complaintID: number,
  ) {
    try {
      const complaint = await this.complaintripo.findOne({
        where: { id: complaintID },
        relations: ['customer', 'replies'],
      });
      if (!complaint) throw new NotFoundException('compalaint not found');

      if (dto && dto.action === complainResolutionStatus.ON_HOLD) {
        complaint.status = complainResolutionStatus.ON_HOLD;
        complaint.updatedAT = new Date();
        await this.complaintripo.save(complaint);

        //notification
        const notification = new Notifications();
        notification.account = 'admin';
        notification.subject = 'changed the resolution status';
        notification.message = ` the resolution status for the  complaint with ticket ${complaint.ticket} has been updated to on_hold  `;
        await this.notificationripo.save(notification);
      } else if (dto && dto.action === complainResolutionStatus.RESOLVED) {
        //check if complaint is already resolved
        if (complaint && complaint.status === complainResolutionStatus.RESOLVED)
          throw new NotAcceptableException(
            ' you cannot resolve a complaint that has already been reported as resolved',
          );

        complaint.status = complainResolutionStatus.RESOLVED;
        complaint.updatedAT = new Date();
        await this.complaintripo.save(complaint);

        //notification
        const notification = new Notifications();
        notification.account = complaint.customer.id;
        notification.subject = 'changed the resolution status';
        notification.message = ` the resolution status for the  complaint with ticket ${complaint.ticket} has been updated to resolved  `;
        await this.notificationripo.save(notification);
      }

      return complaint;
    } catch (error) {
      if (error instanceof NotFoundException)
        throw new NotFoundException(error.message);
      else if (error instanceof NotAcceptableException)
        throw new NotAcceptableException(error.message);
      else {
        console.log;
        throw new InternalServerErrorException(
          'something went wrong while trying to change the resolution  status  of the  complaint filed',
          error.message,
        );
      }
    }
  }

    //admin search for an admin
    async SearchForComplaints(keyword: string, page?:number, perPage?:number, sort?:string): Promise<{ data: ComplaintEntity[]; total: number }> {
      try {
        const qb = this.complaintripo.createQueryBuilder('ticket')
  
        qb.where('ticket.ticket ILIKE :keyword',{keyword:`%${keyword}%`})
        qb.orWhere('ticket.title ILIKE :keyword',{keyword:`%${keyword}%`})
        qb.cache(false)
  
  
        if (sort) {
          const [sortField] = sort.split(',');
          qb.orderBy(`ticket.${sortField}`, 'DESC');
        }
  
        if (page && perPage) {
          qb.skip((page - 1) * perPage).take(perPage);
        }
  
        const [ticket, total] = await qb.getManyAndCount();
  
        if (!ticket.length) {
          throw new NotFoundException(
            `No complaints found matching your search criteria for "${keyword}".`,
          );
        }
    
        return { data: ticket, total };
  
        
      } catch (error) {
        if (error instanceof NotFoundException)
          throw new NotFoundException(error.message);
        else {
          console.log(error);
          throw new InternalServerErrorException(
            'something went wrong while tryig to search for an admin, please try again later',
            error.message,
          );
        }
      }
    }

  // create compliant conflict manually from the admin desk

  //file a complaint and get a ticket
  async FileComplaintfromAdmin(dto: ComplaintDto, admin: AdminEntity) {
    try {
      const ticket = `#${await this.genratorservice.generateComplaintTcket()}`;

      const findadmin = await this.adminRepo.findOne({
        where: { id: admin.id },
      });

      //file complaint
      const newcomplaint = new ComplaintEntity();
      newcomplaint.complaints = dto.complaint;
      newcomplaint.admin = findadmin
      newcomplaint.email = dto.email;
      newcomplaint.title = dto.title;
      newcomplaint.createdAt = new Date();
      newcomplaint.ticket = ticket;
      newcomplaint.channel = channelforconversation.OPEN;
      newcomplaint.status = complainResolutionStatus.IN_PROGRESS;

      await this.complaintripo.save(newcomplaint);

      //notifiction
      const notification = new Notifications();
      notification.account = findadmin.id;
      notification.subject = 'complaint filed and ticket created!';
      notification.message = `the admin with id ${admin.id} have filed a complaint on behalf of a customer on ostra logistics `;
      await this.notificationripo.save(notification);

      return {
        message:
          'you have succefully filed a complaint, here is your ticket, please query this over time to track the compliant status of your issue.',
        ticket,
        newcomplaint
      };
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(
        'something went wrong while filing a complaint, please try again later.',
        error.message,
      );
    }
  }


  async assignAcomplaintToAstaff(complaintID: number, staffID: string) {
    try {
      const complaint = await this.complaintripo.findOne({ where: { id: complaintID } });
      if (!complaint)
        throw new NotFoundException(
          `complaint with id ${complaintID}is not found, so this complaint  cannot be assigned`,
        );

      const staff = await this.adminRepo.findOne({
        where: { id: staffID , admintype:AdminType.STAFF},
        
      });
      if (!staff)
        throw new NotFoundException(
          `the staff with id ${staffID} does not exist`,
        );

      //assingn complaint
      complaint.updatedAT = new Date();
      complaint.assigned_staff = staff
      await this.complaintripo.save(complaint);

     
     

      //save the notification
      const notification = new Notifications();
      notification.account = staff.id;
      notification.subject = 'complaint Assigned to a staff !';
      notification.message = ` ticket with id ${complaint.ticket} have been assigned to staff ${staff.adminID} on the admin portal of ostra ogistics by superadmin  `;
      await this.notificationripo.save(notification);

      return complaint;
    } catch (error) {
      if (error instanceof NotFoundException)
        throw new NotFoundException(error.message);
      else {
        console.log(error);
        throw new InternalServerErrorException(
          'something went wrong',
          error.message,
        );
      }
    }
  }

  // set discount
  async SetDiscountAndDuration(dto: DiscountDto) {
    try {
      // Check for an existing active discount
      const activeDiscount = await this.discountripo.findOne({
        where: { isActive:true },
      });
  
      if (activeDiscount) {
        throw new BadRequestException('An active discount already exists');
      }
  
      const discount = new DiscountEntity();
      discount.OneTime_discountCode = dto.discountCode;
      discount.createdAT = new Date();
      discount.isActive = true 
      discount.DiscountDuration_days = dto.DiscountDuration_days;
     
      if (dto.DiscountDuration_days) {
        discount.expires_in = new Date(
          discount.createdAT.getTime() +
            dto.DiscountDuration_days * 24 * 60 * 60 * 1000,
        );
      } 
  
      discount.percentageOff = dto.percentageOff;
  
      await this.discountripo.save(discount);
  
      // Notification
      const notification = new Notifications();
      notification.account = 'super admin';
      notification.subject = 'Discount Created!';
      notification.message = `The admin has set a new promo discount on Ostra Logistics.`;
      await this.notificationripo.save(notification);
  
      return discount;
    } catch (error) {
      if (error instanceof BadRequestException)
        throw new BadRequestException(error.message);
      else {
        console.log(error);
        throw new InternalServerErrorException(
          'Something went wrong.',
          error.message,
        )
    }
  }
}

  //get discount
  async GetDiscount() {
    try {
      const now = new Date();
      const discounts = await this.discountripo.findAndCount({
        where: { isActive:true},
      });
  
      if (discounts[1] === 0)
        throw new NotFoundException(
          'Oops! No discount has been set at the moment',
        );
  
      return discounts;
    } catch (error) {
      if (error instanceof NotFoundException)
        throw new NotFoundException(error.message);
      else {
        console.log(error);
        throw new InternalServerErrorException(
          'Something went wrong while trying to fetch the promo code.',
          error.message,
        );
      }
    }
  }
  

  //update discount

  async Updatediscount(dto: UpdateDiscountDto, discountID: number) {
    try {
      const discount = await this.discountripo.findOne({
        where: { id: discountID },
      });
      if (!discount)
        throw new NotFoundException(
          `discount with  ${discountID} is not found in the system`,
        );

      discount.OneTime_discountCode = dto.discountCode;
      discount.updatedAT = new Date();
      discount.DiscountDuration_days = dto.DiscountDuration_days;
      discount.DiscountDuration_weeks = dto.DiscountDuration_weeks;

      // scnerio where discount duration in days was given
      if (dto.DiscountDuration_days) {
        discount.expires_in = new Date(
          discount.updatedAT.getTime() +
            dto.DiscountDuration_days * 24 * 60 * 60 * 1000,
        );
        //scenerio where duration in weeks is given
      } else if (dto.DiscountDuration_weeks) {
        discount.expires_in = new Date(
          discount.updatedAT.getTime() +
            dto.DiscountDuration_weeks * 7 * 24 * 60 * 60 * 1000,
        );
      }

      discount.percentageOff = dto.percentageOff;
    

      await this.discountripo.save(discount);

      //notifiction
      const notification = new Notifications();
      notification.account = 'super admin';
      notification.subject = 'Discount updated!';
      notification.message = `the Admin have update a promo discount  on ostra logistics `;
      await this.notificationripo.save(notification);

      return discount;
    } catch (error) {
      if (error instanceof NotFoundException)
        throw new NotFoundException(error.message);
      else {
        console.log(error);
        throw new InternalServerErrorException(
          'something went wrong while trying to update the promo discount ',
          error.message,
        );
      }
    }
  }

  //delete discount
  async deleteDiscount(discountID: number) {
    try {
      const discount = await this.discountripo.findOne({
        where: { id: discountID },
      });
      if (!discount)
        throw new NotFoundException(
          `discount with  ${discountID} is not found in ostra logistics`,
        );

      //remove the discount
      await this.discountripo.remove(discount);
    } catch (error) {
      if (error instanceof NotFoundException)
        throw new NotFoundException(error.message);
      else {
        console.log(error);
        throw new InternalServerErrorException(
          'something went wrong while trying to delete a promo discount ',
          error.message,
        );
      }
    }
  }

  //price list
  async PriceList(dto: PriceListDto) {
    try {
      //add a price
      const pricelist = new PriceListEntity();
      pricelist.location = dto.location;
      pricelist.amount = dto.amount;
      pricelist.createdAT = new Date();

      await this.pricelistripo.save(pricelist);

      //notifiction
      const notification = new Notifications();
      notification.account = 'super admin';
      notification.subject = 'Added A PriceList!';
      notification.message = `the Admin have added a price list  on ostra logistics `;
      await this.notificationripo.save(notification);

      return pricelist;
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(
        'something went wrong while adding a price list, please try again later',
        error.message,
      );
    }
  }


  async SearchPricelist(keyword: string, page?:number, perPage?:number, sort?:string): Promise<{ data: PriceListEntity[]; total: number }> {
    try {
      const qb = this.pricelistripo.createQueryBuilder('price')

      qb.where('price.location ILIKE :keyword',{keyword:`%${keyword}%`})
      qb.orWhere('price.amount ILIKE :keyword',{keyword:`%${keyword}%`})
      qb.cache(false)


      if (sort) {
        const [sortField] = sort.split(',');
        qb.orderBy(`price.${sortField}`, 'DESC');
      }

      if (page && perPage) {
        qb.skip((page - 1) * perPage).take(perPage);
      }

      const [price, total] = await qb.getManyAndCount();

      if (!price.length) {
        throw new NotFoundException(
          `No pricelist found matching your search criteria for "${keyword}".`,
        );
      }
  
      return { data: price, total };

      
    } catch (error) {
      if (error instanceof NotFoundException)
        throw new NotFoundException(error.message);
      else {
        console.log(error);
        throw new InternalServerErrorException(
          'something went wrong while tryig to search for an admin, please try again later',
          error.message,
        );
      }
    }
  }

  //get all pricelist
  async GetAllPriceList(page: number = 1, limit: number = 30) {
    try {
      const skip = (page - 1) * limit;
      const pricelist = await this.pricelistripo.findAndCount({
        take: limit,
        skip: skip,
      });
      if (pricelist[1] === 0)
        throw new NotFoundException(
          'you have no pricelist at the moment, please create one',
        );

      return pricelist;
    } catch (error) {
      if (error instanceof NotFoundException)
        throw new NotFoundException(error.message);
      else {
        console.log(error);
        throw new InternalServerErrorException(
          'something went wrong while trying to fetch all pricelist, please try again later',
          error.message,
        );
      }
    }
  }

  //get one price list
  async GetOnePriceList(pricelistID: number) {
    try {
      const pricelist = await this.pricelistripo.findOne({
        where: { id: pricelistID },
      });
      if (!pricelist)
        throw new NotFoundException(
          `pricelist with the ID ${pricelistID} does not exist`,
        );

      return pricelist;
    } catch (error) {
      if (error instanceof NotFoundException)
        throw new NotFoundException(error.message);
      else {
        console.log(error);
        throw new InternalServerErrorException(
          'something went wrong while trying to fetch one pricelist, please try again later',
          error.message,
        );
      }
    }
  }
  //update pricelist

  async UpdatePriceList(dto: UpdatePriceListDto, pricelistID: number) {
    try {
      const pricelist = await this.pricelistripo.findOne({
        where: { id: pricelistID },
      });
      if (!pricelist)
        throw new NotFoundException(
          `the pricelist with the ID ${pricelistID} is not found`,
        );

      //update the list
      pricelist.location = dto.location;
      pricelist.amount = dto.amount;
      pricelist.updatedAT = new Date();

      await this.pricelistripo.save(pricelist);

      //notifiction
      const notification = new Notifications();
      notification.account = 'super admin';
      notification.subject = 'Pricelist updated!';
      notification.message = `the Admin have updated  the price list  on ostra logistics `;
      await this.notificationripo.save(notification);

      return pricelist;
    } catch (error) {
      if (error instanceof NotFoundException)
        throw new NotFoundException(error.message);
      else {
        console.log(error);
        throw new InternalServerErrorException(
          'something went wrong while trying to edit a pricelist',
          error.message,
        );
      }
    }
  }

  //delete one in the priclist

  async DeletePriceList(pricelistID: number) {
    try {
      const pricelist = await this.pricelistripo.findOne({
        where: { id: pricelistID },
      });
      if (!pricelist)
        throw new NotFoundException(
          `the pricelist with the ID ${pricelistID} is not found`,
        );

      //remove the pricelist
      await this.pricelistripo.remove(pricelist);

      //notifiction
      const notification = new Notifications();
      notification.account = 'super admin';
      notification.subject = 'Pricelist deleted!';
      notification.message = `the Admin have a pricelist  the price list  on ostra logistics `;
      await this.notificationripo.save(notification);

      return { message: 'price list successfully deleted' };
    } catch (error) {
      if (error instanceof NotFoundException)
        throw new NotFoundException(error.message);
      else {
        console.log(error);
        throw new InternalServerErrorException(
          'something went wrong while trying to delete a pricelist',
          error.message,
        );
      }
    }
  }

  async GetAllNewsLetterSubscribers(page: number = 1, limit: number) {
    try {
      const skip = (page - 1) * limit;
      const subscribers = await this.newsletterripo.findAndCount({
        take: limit,
        skip: skip,
      });

      if (subscribers[1] === 0)
        throw new NotFoundException(
          'you have no news letter sunscribers  at the moment, please create one',
        );
      return subscribers;
    } catch (error) {
      if (error instanceof NotFoundException)
        throw new NotFoundException(error.message);
      else {
        console.log(error);
        throw new InternalServerErrorException(
          'something went wrong while trying to fetch all news letter, please try again later',
          error.message,
        );
      }
    }
  }

  //get all notifications related to the customer

  async AllNotifications() {
    try {
     
      const notification = await this.notificationripo.findAndCount({
        order:{}
       
      });
      if (notification[1] === 0)
        throw new NotFoundException(
          'oops! you have no notifications at this time',
        );

      return notification;
    } catch (error) {
      if (error instanceof NotFoundException)
        throw new NotFoundException(error.message);
      else {
        console.log(error);
        throw new InternalServerErrorException(
          'something went wrong while trying to fetch notifications',
          error.message,
        );
      }
    }
  }

  //get one notification and mark it as read
  async OpenOneNotification(
    notificationId: number,
    dto: markNotificationAsReadDto,
  ) {
    try {
      const notification = await this.notificationripo.findOne({
        where: { id: notificationId },
      });
      if (!notification) throw new NotFoundException('notification not found');

      if (dto) {
        notification.isRead = dto.isRead;
        await this.notificationripo.save(notification);
      }

      return notification;
    } catch (error) {
      if (error instanceof NotFoundException)
        throw new NotFoundException(error.message);
      else {
        console.log(error);
        throw new InternalServerErrorException(
          'something went wrong while trying to fetch a notifications',
          error.message,
        );
      }
    }
  }

  //get one notification and mark it as read
  async DeleteOneNotification(notificationId: number) {
    try {
      const notification = await this.notificationripo.findOne({
        where: { id: notificationId },
      });
      if (!notification) throw new NotFoundException('notification not found');

      await this.notificationripo.remove(notification);
      return notification;
    } catch (error) {
      if (error instanceof NotFoundException)
        throw new NotFoundException(error.message);
      else {
        console.log(error);
        throw new InternalServerErrorException(
          'something went wrong while trying to delete a notification',
          error.message,
        );
      }
    }
  }

  //dashboard counts and mapping 
  async activeorderCount():Promise<number>{
    const count = await this.orderRepo.count({where:{order_display_status:OrderDisplayStatus.IN_TRANSIT}})
    return count
  }

  async activecompletedCount():Promise<number>{
    const count = await this.orderRepo.count({where:{order_display_status:OrderDisplayStatus.COMPLETED}})
    return count
  }

  async activependingCount():Promise<number>{
    const count = await this.orderRepo.count({where:{order_display_status:OrderDisplayStatus.PENDING}})
    return count
  }

  async AllorderCount():Promise<number>{
    const count = await this.orderRepo.count()
    return count
  }

  async DeliveryPaymentCount():Promise<number>{
    const count = await this.orderRepo.count({where:{payment_status:PaymentStatus.SUCCESSFUL}})
    return count
  }


  async calculateHourlyRevenue() {

    const orders = await this.orderRepo.find({
      where: {
        payment_status: PaymentStatus.SUCCESSFUL,
      },
      relations: ['items'],
    });

    const hourlyRevenue = [
      { name: '9am', income: 0, previous: 0 },
      { name: '10am', income: 0, previous: 0 },
      { name: '11am', income: 0, previous: 0 },
      { name: '12pm', income: 0, previous: 0 },
      { name: '1pm', income: 0, previous: 0 },
      { name: '2pm', income: 0, previous: 0 },
      { name: '3pm', income: 0, previous: 0 },
      { name: '4pm', income: 0, previous: 0 },
      { name: '5pm', income: 0, previous: 0 },
    ];

    orders.forEach(order => {
      const hour = order.orderPlacedAt.getHours();
      const hourSlot = hourlyRevenue.find(slot => {
        const hourLabel = parseInt(slot.name);
        return hour === hourLabel || (hour === 12 && slot.name === '12pm');
      });

      if (hourSlot) {
        hourSlot.income += order.accepted_cost_of_delivery;
      }
    });

    // Optionally, populate the `previous` values with historical data if available.
    return hourlyRevenue;
  }


  async calculateTotalRevenue(): Promise<number> {
    const successfulOrders = await this.orderRepo.find({
      where: { payment_status: PaymentStatus.SUCCESSFUL },
    });

    const totalRevenue = successfulOrders.reduce(
      (sum, order) => sum + Number(order.accepted_cost_of_delivery),
      0,
    );

    return totalRevenue;
  }


}

