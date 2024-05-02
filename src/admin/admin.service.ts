import {
  BadGatewayException,
  BadRequestException,
  ConflictException,
  ConsoleLogger,
  Injectable,
  InternalServerErrorException,
  NotAcceptableException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AdminEntity } from 'src/Entity/admins.entity';
import {
  AdminRepository,
  RepliesRepository,
  VehicleRepository,
} from './admin.repository';
import {
  ChannelDto,
  RegisterVehicleDto,
  ReplyDto,
  ReturnedVehicleDto,
  UpdateVehicleDto,
  updateResolutionStatusDto,
} from './admin.dto';
import { VehicleEntity } from 'src/Entity/vehicle.entity';
import { UploadService } from 'src/common/helpers/upload.service';
import { RiderEntity } from 'src/Entity/riders.entity';
import { RidersRepository } from 'src/Riders/riders.repository';
import {
  ReturnedVehicle,
  channelforconversation,
  complainResolutionStatus,
} from 'src/Enums/all-enums';
import { CustomerService } from 'src/customer/customer.service';
import { customAlphabet } from 'nanoid';
import * as nanoid from 'nanoid';
import { Notifications } from 'src/Entity/notifications.entity';
import { NotificationRepository } from 'src/common/common.repositories';
import { ComplaintEntity } from 'src/Entity/complaints.entity';
import { complaintRepository } from 'src/customer/customer.repository';
import { RepliesEntity } from 'src/Entity/replies.entity';
import { ComplaintDto } from 'src/customer/customer.dto';
import { GeneatorService } from 'src/common/services/generator.service';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(AdminEntity) private readonly adminRepo: AdminRepository,
    @InjectRepository(VehicleEntity)
    private readonly vehiclerepo: VehicleRepository,
    @InjectRepository(RiderEntity) private readonly riderrepo: RidersRepository,
    @InjectRepository(Notifications)
    private readonly notificationripo: NotificationRepository,
    @InjectRepository(ComplaintEntity)
    private readonly complaintripo: complaintRepository,

    @InjectRepository(RepliesEntity)
    private readonly repliesripo: RepliesRepository,
    private uploadservice: UploadService,
    private genratorservice: GeneatorService,
  ) {}

  public generateUserID(): string {
    const gen = nanoid.customAlphabet(
      '1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
      6,
    );
    return gen();
  }

  //register vehicle
  async RegisterVehicle(dto: RegisterVehicleDto, file: Express.Multer.File) {
    try {
      let imageurl: string | null = null;
      if (file) {
        const uploadfile = await this.uploadservice.uploadFile(file);
        imageurl = `${process.env.BASE_URL}/uploadfile/public/${uploadfile}`;
      }

      const newVehicle = new VehicleEntity();
      newVehicle.vehicleID = `#OslV-${await this.generateUserID()}`;
      newVehicle.vehicle_type = dto.vehicle_type;
      newVehicle.color = dto.color;
      newVehicle.registration_number = dto.registration_number;
      newVehicle.state_of_vehicle = dto.state_of_vehicle;
      if (imageurl) {
        newVehicle.vehiclePics = imageurl;
      }

      newVehicle.vehicle_model = dto.vehicle_model;
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
      );
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
        const uploadfile = await this.uploadservice.uploadFile(file);
        imageurl = `${process.env.BASE_URL}/uploadfile/public/${uploadfile}`;
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
      vehicle.assignedAT = new Date();
      await this.vehiclerepo.save(vehicle);

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

      if (dto && dto.returned === ReturnedVehicle.YES) {
        //report
        vehicle.returned_vehicle = dto.returned;
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
        );
      }
    }
  }

  //fetch complains
  async FetchAllComplaint() {
    try {
      const complaint = await this.complaintripo.findAndCount({
        relations: ['customer', 'replies',],
      });

      if (complaint[1] === 0)
        throw new NotFoundException('there are no complaints at the moment');
      return complaint
    } catch (error) {
      if (error instanceof NotFoundException)
        throw new NotFoundException(error.message);
      else {
        console.log(error);
        throw new InternalServerErrorException(
          'something went wrong while trying to fetch all complaint filed',
        );
      }
    }
  }

  async FetchOneComplaint(complaintID: number) {
    try {
      const complaint = await this.complaintripo.findOne({
        where: { id: complaintID },
        relations: ['customer', 'replies'],
      });

      if (!complaint)
        throw new NotFoundException(
          'there are no complaints associated with this complaint ID ',
        );
        return complaint
    } catch (error) {
      if (error instanceof NotFoundException)
        throw new NotFoundException(error.message);
      else {
        console.log;
        throw new InternalServerErrorException(
          'something went wrong while trying to fetch all complaint filed',
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
      notification.account = complaint.customer.id;
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
      notification.account = complaint.customer.id;
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
        notification.account = complaint.customer.id;
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
        notification.account = complaint.customer.id;
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
        );
      }
    }
  }


  // create compliant conflict manually from the admin desk

  //file a complaint and get a ticket
  async FileComplaintfromAdmin(dto: ComplaintDto,admin:AdminEntity ) {
    try {
      const ticket = `#${await this.genratorservice.generateComplaintTcket()}`;

      const findadmin = await this.adminRepo.findOne({where:{id:admin.id}})

      //file complaint
      const newcomplaint = new ComplaintEntity();
      newcomplaint.complaints = dto.complaint;
      newcomplaint.createdAt = new Date();
      newcomplaint.ticket = ticket;
      newcomplaint.channel = channelforconversation.OPEN
      newcomplaint.status =complainResolutionStatus.IN_PROGRESS

      await this.complaintripo.save(newcomplaint);

      //notifiction
      const notification = new Notifications();
      notification.account = findadmin.id;
      notification.subject = 'complaint filed!';
      notification.message = `the admin with id ${admin.id} have filed a complaint on behalf of a customer on ostra logistics `;
      await this.notificationripo.save(notification);

      return {
        message:
          'you have succefully filed a complaint, here is your ticket, please query this over time to track the compliant status of your issue.',
        ticket,
      };
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(
        'something went wrong while filing a complaint, please try again later.',
      );
    }
  }



  // set discount

}
