import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotAcceptableException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AdminEntity } from 'src/Entity/admins.entity';
import { RiderBankDetailsEntity, RiderEntity } from 'src/Entity/riders.entity';
import {
  RidersRepository,
  TaskRepository,
  riderBankDetailsRepository,
} from 'src/Riders/riders.repository';
import { AdminRepository, VehicleRepository } from '../admin.repository';
import { Notifications } from 'src/Entity/notifications.entity';
import {
  NotificationRepository,
  RequestRepository,
  TransactionRespository,
} from 'src/common/common.repositories';
import { UploadService } from 'src/common/helpers/upload.service';
import { Mailer } from 'src/common/mailer/mailer.service';
import { customAlphabet } from 'nanoid';
import { IChangeRiderPassword, IRider } from 'src/Riders/riders';
import {
  AssignTaskDto,
  BankDetailsDto,
  EditBankDetailsDto,
  LogtransactionDto,
  RegisterRiderByAdminDto,
  UpdateRiderInfoByAdminDto,
} from '../admin.dto';
import {
  PaymentStatus,
  RequestType,
  RiderStatus,
  TaskStatus,
  TransactionConfirmation,
  TransactionType,
} from 'src/Enums/all-enums';
import { ILike } from 'typeorm';
import { OrderEntity } from 'src/Entity/orders.entity';
import { OrderRepository } from 'src/order/order.reposiroty';
import { TaskEntity } from 'src/Entity/ridersTasks.entity';
import { IRequests, RequestEntity } from 'src/Entity/requests.entity';
import { GeneatorService } from 'src/common/services/generator.service';
import {
  ITransactions,
  TransactionEntity,
} from 'src/Entity/transactions.entity';
import { all } from 'axios';
import { CloudinaryService } from 'src/common/services/claudinary.service';
import { VehicleEntity } from 'src/Entity/vehicle.entity';
//import * as firebase from 'firebase-admin';
import { FcmService } from 'src/firebase/fcm-node.service';

@Injectable()
export class AdminRiderDashboardService {
  constructor(

    @InjectRepository(RiderEntity) private readonly riderripo: RidersRepository,
    @InjectRepository(AdminEntity) private readonly adminripo: AdminRepository,
    @InjectRepository(Notifications)
    private readonly notificationripo: NotificationRepository,
    @InjectRepository(OrderEntity)
    private readonly orderripo: OrderRepository,
    @InjectRepository(TaskEntity) private readonly taskRepo: TaskRepository,
    @InjectRepository(RequestEntity)
    private readonly requestrepo: RequestRepository,
    @InjectRepository(RiderBankDetailsEntity)
    private readonly riderbankdetailsRepo: riderBankDetailsRepository,
    @InjectRepository(TransactionEntity)
    private readonly transactionRepo: TransactionRespository,
    @InjectRepository(VehicleEntity)
    private readonly vehicleRepository: VehicleRepository,
    private uploadservice: UploadService,
    private cloudinaryservice: CloudinaryService,
    private mailer: Mailer,
    private genratorservice: GeneatorService,
    private readonly fcmService: FcmService,

  ) {}

  //admin register rider
  async RegisterRider(
    dto: RegisterRiderByAdminDto,
    files: Express.Multer.File[],
  ) {
    try {
      const genpassword = await this.genratorservice.generatePassword();
      const hashedpassword =
        await this.genratorservice.hashpassword(genpassword);

      const genEmailsuffix =
        await this.genratorservice.generatEmailSuffixNumber();
      const emailnow = `${dto.firstname}${genEmailsuffix}.rider@ostralogistics.com`;

      const dob = new Date(dto.DOB);
      const age = new Date().getFullYear() - dob.getFullYear();

      const fileUploadPromises = files.map((file) =>
        this.cloudinaryservice.uploadFile(file),
      );
      const uploadResults = await Promise.all(fileUploadPromises);

      const profilepicsUrl = uploadResults[0].secure_url;
      const firstgurantorpicsurl = uploadResults[1].secure_url;
      const secondguarantorpicsurl = uploadResults[2].secure_url;
      const frontLicenseUrl = uploadResults[3].secure_url;
      const backLicenseUrl = uploadResults[4].secure_url;

      const rider = new RiderEntity();
      rider.riderID = `#OslR-${await this.genratorservice.generateUserID()}`;
      rider.firstname = dto.firstname;
      rider.lastname = dto.lastname;
      rider.email = emailnow;
      rider.password = hashedpassword;
      rider.isVerified = true;
      rider.isRegistered = true;
      rider.DOB = dto.DOB;
      rider.age = age;
      rider.status = RiderStatus.OFFLINE;
      rider.mobile = dto.mobile;
      rider.RegisteredAt = new Date();
      rider.marital_status = dto.marital_status;
      rider.home_address = dto.home_address;
      rider.state_of_orgin = dto.state_of_origin;
      rider.LGA_of_origin = dto.LGA_of_origin;
      rider.guarantor1_name = dto.guarantor1_name;
      rider.guarantor1_relatioship_with_rider =
        dto.guarantor1_relatioship_with_rider;
      rider.gurantor1_mobile = dto.mobile;
      rider.guarantor2_name = dto.guarantor2_name;
      rider.driver_license_front = frontLicenseUrl;
      rider.driver_license_back = backLicenseUrl;
      rider.profile_picture = profilepicsUrl;
      rider.guarantor1_picture = firstgurantorpicsurl;
      rider.guarantor2_picture = secondguarantorpicsurl;
      rider.gurantor2_mobile = dto.gurantor2_mobile
      rider.guarantor2_relatioship_with_rider =
        dto.guarantor2_relatioship_with_rider;

      const findrider = await this.riderripo.findOne({
        where: { email: emailnow },
      });
      if (findrider) {
        throw new NotAcceptableException(
          `email: ${emailnow} already exists, please generate another one`,
        );
      }

      await this.riderripo.save(rider);

      console.log(rider.RegisteredAt);

      const notification = new Notifications();
      4;
      notification.account = rider.id;
      notification.subject = 'Admin Registered a Rider !';
      notification.message = `a new rider has been created on ostra logistics platform `;
      await this.notificationripo.save(notification);

      return {
        message:
          'The rider has been Registered Successfully, these are the login credentials generated for the rider',
        email: emailnow,
        password: genpassword,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      } else {
        console.error(error);
        throw new InternalServerErrorException(
          'Something went wrong while trying to Register a Rider, please try again later',
          error.message,
        );
      }
    }
  }

  async UpdateRiderInfoByAdmin(
    riderId: string,
    dto: UpdateRiderInfoByAdminDto,
    files: Express.Multer.File[],
  ) {
    try {
      const rider = await this.riderripo.findOne({ where: { id: riderId } });

      if (!rider) {
        throw new NotFoundException(
          `Rider with id:${riderId} is not found in the Ostra Logistics rider database`,
        );
      }

      const dob = new Date(dto.DOB);
      const age = new Date().getFullYear() - dob.getFullYear();

      const fileUploadPromises = files.map((file) =>
        this.cloudinaryservice.uploadFile(file),
      );
      const uploadResults = await Promise.all(fileUploadPromises);

      if (files[0]) rider.profile_picture = uploadResults[0].secure_url;
      if (files[1]) rider.guarantor1_picture = uploadResults[1].secure_url;
      if (files[2]) rider.guarantor2_picture = uploadResults[2].secure_url;
      if (files[3]) rider.driver_license_front = uploadResults[3].secure_url;
      if (files[4]) rider.driver_license_back = uploadResults[4].secure_url;

      rider.firstname = dto.firstname;
      rider.lastname = dto.lastname;
      rider.mobile = dto.mobile;
      rider.marital_status = dto.marital_status;
      rider.home_address = dto.home_address;
      rider.state_of_orgin = dto.state_of_origin;
      rider.LGA_of_origin = dto.LGA_of_origin;
      rider.guarantor1_name = dto.guarantor1_name;
      rider.guarantor1_relatioship_with_rider =
        dto.guarantor1_relatioship_with_rider;
      rider.gurantor1_mobile = dto.mobile;
      rider.guarantor2_name = dto.guarantor2_name;
      rider.gurantor2_mobile = dto.gurantor2_mobile
      rider.guarantor2_relatioship_with_rider =
        dto.guarantor2_relatioship_with_rider;
      rider.UpdatedAt = new Date();

      await this.riderripo.save(rider);

      const notification = new Notifications();
      notification.account = rider.id;
      notification.subject = 'Admin Updated The Record of a Rider!';
      notification.message = `The record of the rider ${rider.firstname} has been updated on Ostra Logistics platform`;
      await this.notificationripo.save(notification);

      return {
        message: 'The information of the Rider has been Updated Successfully',
        response: rider,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      } else {
        console.error(error);
        throw new InternalServerErrorException(
          'Something went wrong while trying to update the info of a Rider, please try again later',
          error.message,
        );
      }
    }
  }

  //admin delete rider
  async AdminDeleteRider(riderID: string): Promise<{ message: string }> {
    try {
      const findriderbyid = await this.riderripo.findOne({
        where: { id: riderID },
        relations: ['vehicle_for_the_day'],
      });
      if (!findriderbyid)
        throw new NotFoundException(
          `rider with id:${riderID} is not found in the ostra logistics rider database`,
        );

      // Set assigned_Rider to null in related vehicle
      if (findriderbyid.vehicle_for_the_day) {
        findriderbyid.vehicle_for_the_day.assigned_Rider = null;
        await this.vehicleRepository.save(findriderbyid.vehicle_for_the_day);
      }

      //remove rider from the platorm
      await this.riderripo.remove(findriderbyid);

      //save the notification
      const notification = new Notifications();
      notification.account = 'super admin';
      notification.subject = 'Rider deleted !';
      notification.message = `the rider ${findriderbyid.firstname}  has been deleted from the ostra logistics application by superAdmin  `;
      await this.notificationripo.save(notification);

      return {
        message: ` ${riderID}  has been deleted  by the super admin `,
      };
    } catch (error) {
      if (error instanceof NotFoundException)
        throw new NotFoundException(error.message);
      else {
        console.log(error);
        throw new InternalServerErrorException(
          'something went wrong while trying to delete Rider, Please try again',
          error.message,
        );
      }
    }
  }

  // admin change rider password
  async AdminChangeRiderPassword(
    riderID: string,
  ): Promise<{ message: string; response: IChangeRiderPassword }> {
    try {
      const findriderbyid = await this.riderripo.findOne({
        where: { id: riderID },
      });
      if (!findriderbyid)
        throw new NotFoundException(
          `rider with id:${riderID} is not found in the ostra logistics rider database`,
        );

      //change tthe password
      const genpassword = await this.genratorservice.generatePassword();
      const hashedpassword =
        await this.genratorservice.hashpassword(genpassword);

      findriderbyid.password = hashedpassword;
      await this.riderripo.save(findriderbyid);

      //save the notification
      const notification = new Notifications();
      notification.account = findriderbyid.id;
      notification.subject = 'Rider password changed !';
      notification.message = `the rider ${findriderbyid.firstname} password has been changed on the admin portal of ostra ogistics by superadmin `;
      await this.notificationripo.save(notification);

      // customised response
      const newpasswordresponse: IChangeRiderPassword = {
        password: genpassword,
      };

      return {
        message: 'Rider password have been changed successflly ',
        response: newpasswordresponse,
      };
    } catch (error) {
      if (error instanceof NotFoundException)
        throw new NotFoundException(error.message);
      else {
        console.log(error);
        throw new InternalServerErrorException(
          'something went wrong while trying to reset Rider Password based on request',
          error.message,
        );
      }
    }
  }

  //get all requests from riders
  async GetAllRequests() {
    try {
      const requests = await this.requestrepo.findAndCount({
        relations: ['Rider'],
      });

      if (requests[1] === 0)
        throw new NotFoundException('no requests from riders yet');

      return requests;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotAcceptableException(error.message);
      } else {
        console.log(error);
        throw new InternalServerErrorException(
          'something went wrong while trying to get all request sent by riders, please try again later',
          error.message,
        );
      }
    }
  }

  //change password based on request
  async AdminChangeRiderPasswordBasedOnRequest(
    riderID: string,
    requestID: number,
  ): Promise<{ message: string; response: IChangeRiderPassword }> {
    try {
      const findriderbyid = await this.riderripo.findOne({
        where: { id: riderID },
      });
      if (!findriderbyid)
        throw new NotFoundException(
          `rider with id:${riderID} is not found in the ostra logistics rider database`,
        );

      //check for request
      const request = await this.requestrepo.findOne({
        where: {
          id: requestID,
          Rider: { id: riderID },
          requestType: RequestType.PASSWORD_RESET,
        },
        relations: ['Rider'],
      });
      if (!request)
        throw new NotAcceptableException(
          'sorry this request cannot be met at the moment, because the request type is not a reset password type.',
        );

      //change tthe password
      const genpassword = await this.genratorservice.generatePassword();
      const hashedpassword =
        await this.genratorservice.hashpassword(genpassword);

      findriderbyid.password = hashedpassword;
      await this.riderripo.save(findriderbyid);

      //send mail to the rider
      await this.mailer.NewPasswordMail(
        findriderbyid.email,
        findriderbyid.firstname,
        genpassword,
      );

      //save the notification
      const notification = new Notifications();
      notification.account = findriderbyid.id;
      notification.subject = 'Rider password changed !';
      notification.message = `the rider ${findriderbyid.firstname} password has been changed on the admin portal of ostra ogistics by superadmin `;
      await this.notificationripo.save(notification);

      // customised response
      const newpasswordresponse: IChangeRiderPassword = {
        password: genpassword,
      };

      return {
        message: 'Rider password have been changed successflly ',
        response: newpasswordresponse,
      };
    } catch (error) {
      if (error instanceof NotFoundException)
        throw new NotFoundException(error.message);
      else if (error instanceof NotAcceptableException)
        throw new NotAcceptableException(error.message);
      else {
        console.log(error);
        throw new InternalServerErrorException(
          'something went wrong while trying to reset Rider Password based on request',
          error.message,
        );
      }
    }
  }

  //admin get all riders
  async GetAllRiders(page: number = 1, limit: number = 15) {
    try {
      const skip = (page - 1) * limit;

      //fetch riders with pagination
      const findallriders = await this.riderripo.findAndCount({
        order: { RegisteredAt: 'DESC' },
        relations: [
          'vehicle_for_the_day',
          'tasks',
          'my_requests',
          'bank_details',
        ],
        take: limit,
        skip: skip,
      });

      if (findallriders[1] === 0)
        throw new NotFoundException('no riders were found');
      return findallriders;
    } catch (error) {
      if (error instanceof NotFoundException)
        throw new NotFoundException(error.message);
      else {
        console.log(error);
        throw new InternalServerErrorException(
          'something went wrong while trying to fetch all riders, please try again',
          error.message,
        );
      }
    }
  }

  async GetAllRidersWithStatusOffline(page: number = 1, limit: number = 15) {
    try {
      const skip = (page - 1) * limit;

      //fetch riders with pagination
      const findallriders = await this.riderripo.findAndCount({
        where: { status: RiderStatus.OFFLINE },
        order: { RegisteredAt: 'DESC' },
        relations: [
          'vehicle_for_the_day',
          'tasks',
          'my_requests',
          'bank_details',
        ],
        take: limit,
        skip: skip,
      });

      if (findallriders[1] === 0)
        throw new NotFoundException('no riders were found');
      return findallriders;
    } catch (error) {
      if (error instanceof NotFoundException)
        throw new NotFoundException(error.message);
      else {
        console.log(error);
        throw new InternalServerErrorException(
          'something went wrong while trying to fetch all riders that are offline, please try again',
          error.message,
        );
      }
    }
  }


  async GetAllRidersWithStatusIntransit(page: number = 1, limit: number = 15) {
    try {
      const skip = (page - 1) * limit;

      //fetch riders with pagination
      const findallriders = await this.riderripo.findAndCount({
        where: { status: RiderStatus.IN_TRANSIT },
        order: { RegisteredAt: 'DESC' },
        relations: [
          'vehicle_for_the_day',
          'tasks',
          'my_requests',
          'bank_details',
        ],
        take: limit,
        skip: skip,
      });

      if (findallriders[1] === 0)
        throw new NotFoundException('no riders were found');
      return findallriders;
    } catch (error) {
      if (error instanceof NotFoundException)
        throw new NotFoundException(error.message);
      else {
        console.log(error);
        throw new InternalServerErrorException(
          'something went wrong while trying to fetch all riders that are in transit, please try again',
          error.message,
        );
      }
    }
  }

  async GetAllRidersWithStatusOfAvailable(
    page: number = 1,
    limit: number = 15,
  ) {
    try {
      const skip = (page - 1) * limit;

      //fetch riders with pagination
      const findallriders = await this.riderripo.findAndCount({
        where: { status: RiderStatus.AVAILABLE },
        order: { RegisteredAt: 'DESC' },
        relations: [
          'vehicle_for_the_day',
          'tasks',
          'my_requests',
          'bank_details',
        ],
        take: limit,
        skip: skip,
      });

      if (findallriders[1] === 0)
        throw new NotFoundException('no riders were found');
      return findallriders;
    } catch (error) {
      if (error instanceof NotFoundException)
        throw new NotFoundException(error.message);
      else {
        console.log(error);
        throw new InternalServerErrorException(
          'something went wrong while trying to fetch all riders that are available, please try again',
          error.message,
        );
      }
    }
  }

  //admin get one rider by id
  async GetOneRiderByID(riderID: string): Promise<IRider> {
    try {
      const findriderbyid = await this.riderripo.findOne({
        where: { id: riderID },
        relations: [
          'vehicle_for_the_day',
          'tasks',
          'my_requests',
          'bank_details',
        ],
      });
      if (!findriderbyid)
        throw new NotFoundException(
          `rider with id:${riderID} is not found in the ostra logistics rider database`,
        );
      return findriderbyid;
    } catch (error) {
      if (error instanceof NotFoundException)
        throw new NotFoundException(error.message);
      else {
        console.log(error);
        throw new InternalServerErrorException(
          'something went wrong while trying to fetch one rider, please try again',
          error.message,
        );
      }
    }
  }

  //admin search for a rider
  async SearchForRider(keyword: string, page?:number, perPage?:number, sort?:string): Promise<{ data: RiderEntity[]; total: number }> {
    try {
      const qb = this.riderripo.createQueryBuilder('rider')

      qb.where('rider.firstname ILIKE :keyword',{keyword:`%${keyword}%`})
      qb.orWhere('rider.lastname ILIKE :keyword',{keyword:`%${keyword}%`})
      qb.orWhere('rider.email ILIKE :keyword',{keyword:`%${keyword}%`})
      qb.cache(false)


      if (sort) {
        const [sortField] = sort.split(',');
        qb.orderBy(`rider.${sortField}`, 'DESC');
      }

      if (page && perPage) {
        qb.skip((page - 1) * perPage).take(perPage);
      }

      const [rider, total] = await qb.getManyAndCount();

      if (!rider.length) {
        throw new NotFoundException(
          `No staff found matching your search criteria for "${keyword}".`,
        );
      }
  
      return { data: rider, total };

      
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
  //admin fetch total number of riders they have
  async totalnumberofriders(): Promise<number> {
    return await this.riderripo.count();
  }

  //admin asign tasks to a rider

  async AssignOrderToRider(
    riderID: string,
    orderID: number,
    dto: AssignTaskDto,
  ) {
    try {
      const rider = await this.riderripo.findOne({
        where: { id: riderID },
      });
      if (!rider)
        throw new NotFoundException(
          `rider with id:${riderID} is not found in the ostra logistics rider database`,
        );

      const order = await this.orderripo.findOne({
        where: { id: orderID },
        relations: ['customer', 'items', 'items.vehicleType'],
      });
      if (!order) throw new NotFoundException('order not found ');

      //find order that the payment status has been updated to successful
      if (order && order.payment_status !== PaymentStatus.SUCCESSFUL)
        throw new NotAcceptableException(
          'the payment on this order is not successful yet, so order cannot be assigned to a driver ',
        );

      //assign the order to a driver
      order.Rider = rider;
      await this.orderripo.save(order);

      //save task to the task table
      const task = new TaskEntity();
      (task.rider = order.Rider), (task.task= dto.task);
      (task.assigned_order = order), (task.assignedAT = new Date());

      await this.taskRepo.save(task)

     
             // Push notification
             await this.fcmService.sendNotification(
              rider.deviceToken,
              ' New Task Assigned!',
              `A new task of ${task.task} for ${order.orderID} made by ${order.customer} Please accept this task or decline it with a solid reason for your decine. Thank you `,
              {
                task: task.task,
                orderID: order.orderID,
                customerId: order.customer.id,
              },
              
            );
        

      //save the notification
      const notification = new Notifications();
      notification.account = rider.id;
      notification.subject = 'Rider Assigned Task!';
      notification.message = `the Rider  ${rider.firstname} have been assigned a task on the admin portal of ostra ogistics by superadmin  `;
      await this.notificationripo.save(notification);

      return task;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      } else if (error instanceof NotAcceptableException)
        throw new NotAcceptableException(error.message);
      else {
        console.log(error)
        throw new InternalServerErrorException(
          'Something went wrong when trying to assign a task to a rider. Please try again later.',
          error.message,
        );
      }
    }
  }

  //add rider bank details
  async addRiderBankDetails(dto: BankDetailsDto, riderID: string) {
    try {
      const findriderbyid = await this.riderripo.findOne({
        where: { id: riderID },
      });
      if (!findriderbyid)
        throw new NotFoundException(
          `rider with id:${riderID} is not found in the ostra logistics rider database`,
        );

      //save rider bank details
      const bankdetails = new RiderBankDetailsEntity();
      bankdetails.Bank_account_name = dto.account_name;
      bankdetails.Bank_account_number = dto.account_number;
      bankdetails.Bank_name = dto.bank_name;
      bankdetails.owner = findriderbyid;

      await this.riderbankdetailsRepo.save(bankdetails);

      //save the notification
      const notification = new Notifications();
      notification.account = findriderbyid.id;
      notification.subject = 'Rider bank details added !';
      notification.message = `the Rider ${findriderbyid.firstname} bank details have been added  on the admin portal of ostra ogistics by superadmin  `;
      await this.notificationripo.save(notification);

      return {
        message: 'your bank details has been added successfully',
        bankdetails,
      };
    } catch (error) {
      if (error instanceof NotFoundException)
        throw new NotFoundException(error.message);
      else {
        console.log(error);
        throw new InternalServerErrorException(
          'something went wrong while trying to add the bank details of the rider, please try again later',
          error.message,
        );
      }
    }
  }

  //change or update driver bank details based on request

  async EditRiderBankDetails(
    dto: EditBankDetailsDto,
    bankdetailsID: number,
    riderID: string,
  ) {
    try {
      const findriderbyid = await this.riderripo.findOne({
        where: { id: riderID },
      });
      if (!findriderbyid)
        throw new NotFoundException(
          `rider with id:${riderID} is not found in the ostra logistics rider database`,
        );

      const bankdetails = await this.riderbankdetailsRepo.findOne({
        where: { id: bankdetailsID, owner: { id: riderID } },
        relations: ['owner'],
      });
      if (!bankdetails)
        throw new NotFoundException(
          `bankdetails with id:${bankdetailsID} is not found in the ostra logistics rider database`,
        );

      //save rider bank details
      bankdetails.Bank_account_name = dto.account_name;
      bankdetails.Bank_account_number = dto.account_number;
      bankdetails.Bank_account_name = dto.account_name;
      bankdetails.owner = findriderbyid;

      await this.riderbankdetailsRepo.save(bankdetails);

      //save the notification
      const notification = new Notifications();
      notification.account = findriderbyid.id;
      notification.subject = 'Rider bank details Updated !';
      notification.message = `the Rider  ${findriderbyid.firstname} bank details have been updated based on request  on the admin portal of ostra ogistics by superadmin  `;
      await this.notificationripo.save(notification);

      return {
        message: 'your bank details has been updated successfully',
        bankdetails,
      };
    } catch (error) {
      if (error instanceof NotFoundException)
        throw new NotFoundException(error.message);
      else {
        console.log(error);
        throw new InternalServerErrorException(
          'something went wrong while trying to update  the bank details  based on request of the Rider, please try again later',
          error.message,
        );
      }
    }
  }

  //delete the bank details 
  async DeleteRiderBankDetails(
    bankdetailsID: number,
    riderID: string,
  ) {
    try {
      const findriderbyid = await this.riderripo.findOne({
        where: { id: riderID },
      });
      if (!findriderbyid)
        throw new NotFoundException(
          `rider with id:${riderID} is not found in the ostra logistics rider database`,
        );

      const bankdetails = await this.riderbankdetailsRepo.findOne({
        where: { id: bankdetailsID, owner: { id: riderID } },
        relations: ['owner'],
      });
      if (!bankdetails)
        throw new NotFoundException(
          `bankdetails with id:${bankdetailsID} is not found in the ostra logistics rider database`,
        );

      await this.riderbankdetailsRepo.remove(bankdetails);

      //save the notification
      const notification = new Notifications();
      notification.account = findriderbyid.id;
      notification.subject = 'Rider bank details deleted !';
      notification.message = `the Rider ${findriderbyid.firstname} bank details have been deleted on the admin portal of ostralogistics  `;
      await this.notificationripo.save(notification);

      return {
        message: 'your bank details has been deleted successfully',
        bankdetails,
      };
    } catch (error) {
      if (error instanceof NotFoundException)
        throw new NotFoundException(error.message);
      else {
        console.log(error);
        throw new InternalServerErrorException(
          'something went wrong while trying to update  the bank details  based on request of the Rider, please try again later',
          error.message,
        );
      }
    }
  }

  //admin log paymet of payment for staff and riders

  async LogPaymentForRiders(
    dto: LogtransactionDto,
    paymentDetailsID: number,
    riderID: string,
  ) {
    try {
      //check for payment details
      const bankDetails = await this.riderbankdetailsRepo.findOne({
        where: { id: paymentDetailsID, owner: { id: riderID } },
        relations: ['owner'],
      });
      if (!bankDetails)
        throw new NotFoundException(
          'bankdetails is not associated with this Rider',
        );

      // manually log transaction
      const transaction = new TransactionEntity();
      transaction.Rider = bankDetails.owner;
      transaction.amount = dto.amount;
      transaction.transactionType = TransactionType.SALARY_PAYMENT;
      transaction.transactionID = `#osl-${this.genratorservice.generateTransactionCode()}`;
      transaction.transactedAT = new Date();
      transaction.bankInfo = bankDetails;
      transaction.status = TransactionConfirmation.CONFIRMED

      await this.transactionRepo.save(transaction);

      //save the notification
      const notification = new Notifications();
      notification.account = bankDetails.owner.id;
      notification.subject = 'Admin Logs payment !';
      notification.message = `the Rider ${bankDetails.owner.firstname}  a payment as been logged in realtionsions to your account  `;
      await this.notificationripo.save(notification);

      return transaction;
    } catch (error) {
      if (error instanceof NotFoundException)
        throw new NotFoundException(error.message);
      else {
        console.log(error);
        throw new InternalServerErrorException(
          'something went wrong while trying to log payments made to a rider, please try again later',
          error.message,
        );
      }
    }
  }

  async fetchRiderPaymentTransactionHistory(riderID: string) {
    try {
      const mytransactions = await this.transactionRepo.findAndCount({
        where: { Rider: { id: riderID } },
        relations: ['Rider', 'bankInfo'],
        order:{transactedAT:'DESC'}
      });
      if (mytransactions[1] == 0)
        throw new NotFoundException(
          'there are no transaction logs for this rider at the moment',
        );

      return mytransactions;
    } catch (error) {
      if (error instanceof NotFoundException)
        throw new NotFoundException(error.message);
      else {
        console.log(error);
        throw new InternalServerErrorException(
          'something went wrong while fetching the logged transactions of this rider',
          error.message,
        );
      }
    }
  }

  //admin get all rider tasks
  async getAllriderTask() {
    try {
      const alltasks = await this.taskRepo.findAndCount({
        relations: ['rider','rider.vehicle_for_the_day', 'assigned_order', 'assigned_order.customer'],
        order:{acceptedAt:"DESC"}
      });
      if (alltasks[1] === 0)
        throw new NotFoundException('there are no Rider tasks at the moment');

      return alltasks;
    } catch (error) {
      if (error instanceof NotFoundException)
        throw new NotFoundException(error.message);
      else {
        console.log(error);
        throw new InternalServerErrorException(
          'something went wrong while trying fetch all rider task',
          error.message,
        );
      }
    }
  }
  //get one rider tasks or rides
  async getOneriderTask(riderID: string) {
    try {
      const alltasks = await this.taskRepo.findAndCount({
        where: { rider: { id: riderID } },
        relations: ['rider','rider.vehicle_for_the_day', 'assigned_order', 'assigned_order.customer'],
        order:{acceptedAt:'DESC'}
      });
      if (alltasks[1] === 0)
        throw new NotFoundException(
          'there are no tasks for this Rider at the moment',
        );

      return alltasks;
    } catch (error) {
      if (error instanceof NotFoundException)
        throw new NotFoundException(error.message);
      else {
        console.log(error);
        throw new InternalServerErrorException(
          'something went wrong while trying fetch this rider task',
          error.message,
        );
      }
    }
  }

   //get one rider tasks or rides
   async getOneTask(taskID: number) {
    try {
      const alltasks = await this.taskRepo.findOne({
        where: { id:taskID },
        relations: ['rider','rider.vehicle_for_the_day', 'assigned_order', 'assigned_order.customer'],
      });
      if (!alltasks)
        throw new NotFoundException(
          'task not found',
        );

      return alltasks;
    } catch (error) {
      if (error instanceof NotFoundException)
        throw new NotFoundException(error.message);
      else {
        console.log(error);
        throw new InternalServerErrorException(
          'something went wrong while trying fetch this rider task',
          error.message,
        );
      }
    }
  }


  //get all the count of the task for one rider
  async getOneriderTaskCount(riderID: string) {
    try {
      const taskcount = await this.taskRepo.count({
        where: { rider: { id: riderID } },
      });

      return taskcount;
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(
        'something went wrong while trying fetch the count of the riders task',
        error.message,
      );
    }
  }

  //admin fetch all riders with ongoing tasks
  async getAllriderwithOngoingTaskTask() {
    try {
      const alltasks = await this.taskRepo.findAndCount({
        where: { status: TaskStatus.ONGOING },
        relations: ['rider', 'rider.vehicle_for_the_day', 'assigned_order', 'assigned_order.customer'],
      });
      if (alltasks[1] === 0)
        throw new NotFoundException(
          'there are no Riders with ongoing tasks at the moment',
        );

      return alltasks;
    } catch (error) {
      if (error instanceof NotFoundException)
        throw new NotFoundException(error.message);
      else {
        console.log(error);
        throw new InternalServerErrorException(
          'something went wrong while trying fetch all riders with ongoing tasks',
          error.message,
        );
      }
    }
  }

  async getOneriderOngoingTaskTask(riderId: string) {
    try {
      const alltasks = await this.taskRepo.findAndCount({
        where: { rider: { id: riderId }, status: TaskStatus.ONGOING },
        relations: ['rider', 'rider.vehicle_for_the_day','assigned_order', 'assigned_order.customer'],
      });
      if (alltasks[1] === 0)
        throw new NotFoundException(
          'there are no  ongoing tasks for this Rider at the moment',
        );

      return alltasks;
    } catch (error) {
      if (error instanceof NotFoundException)
        throw new NotFoundException(error.message);
      else {
        console.log(error);
        throw new InternalServerErrorException(
          'something went wrong while trying fetch this riders with ongoing tasks',
          error.message,
        );
      }
    }
  }

  //get all the count of the ongoing task for one rider
  async getOneriderOngoingTaskCount(riderID: string) {
    try {
      const taskcount = await this.taskRepo.count({
        where: { rider: { id: riderID }, status: TaskStatus.ONGOING },
      });

      return taskcount;
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(
        'something went wrong while trying fetch the count of the riders ongoing task',
        error.message,
      );
    }
  }


  //admin fetch all riders with concluded tasks
  async getAllriderwithConcludedTask() {
    try {
      const alltasks = await this.taskRepo.findAndCount({
        where: { status: TaskStatus.CONCLUDED },
        relations: ['rider', 'rider.vehicle_for_the_day','assigned_order', 'assigned_order.customer'],
      });
      if (alltasks[1] === 0)
        throw new NotFoundException(
          'there are no Riders with concluded tasks at the moment',
        );

      return alltasks;
    } catch (error) {
      if (error instanceof NotFoundException)
        throw new NotFoundException(error.message);
      else {
        console.log(error);
        throw new InternalServerErrorException(
          'something went wrong while trying to fetch all riders with ongoing tasks',
          error.message,
        );
      }
    }
  }

  //admin fetch all riders with concluded tasks
  async getOneriderwithConcludedTask(riderID) {
    try {
      const alltasks = await this.taskRepo.findAndCount({
        where: { rider: { id: riderID }, status: TaskStatus.CONCLUDED },
        relations: ['rider', 'rider.vehicle_for_the_day','assigned_order', 'assigned_order.customer'],
      });
      if (alltasks[1] === 0)
        throw new NotFoundException(
          'there are no concluded Rides For this Rider at the moment',
        );

      return alltasks;
    } catch (error) {
      if (error instanceof NotFoundException)
        throw new NotFoundException(error.message);
      else {
        console.log(error);
        throw new InternalServerErrorException(
          'something went wrong while trying to fetch all riders with ongoing tasks',
          error.message,
        );
      }
    }
  }

  //get all the count of the ongoing task for one rider
  async getOneriderCompletedTaskCount(riderID: string) {
    try {
      const taskcount = await this.taskRepo.count({
        where: { rider: { id: riderID }, status: TaskStatus.CONCLUDED },
      });

      return taskcount;
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(
        'something went wrong while trying fetch the count of the riders ongoing task',
        error.message,
      );
    }
  }

  //admin fetch all riders with pending tasks
}
