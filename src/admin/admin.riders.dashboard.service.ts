import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotAcceptableException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AdminEntity } from 'src/Entity/admins.entity';
import { CustomerEntity } from 'src/Entity/customers.entity';
import { RiderBankDetailsEntity, RiderEntity } from 'src/Entity/riders.entity';
import {
  RidersRepository,
  TaskRepository,
  riderBankDetailsRepository,
} from 'src/Riders/riders.repository';
import { CustomerRepository } from 'src/customer/customer.repository';
import { AdminRepository } from './admin.repository';
import { Notifications } from 'src/Entity/notifications.entity';
import {
  NotificationRepository,
  RequestRepository,
  TransactionRespository,
} from 'src/common/common.repositories';
import { UploadService } from 'src/common/helpers/upload.service';
import { CustomerAuthService } from 'src/customer/customer.auth.service';
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
} from './admin.dto';
import {
  NotificationType,
  PaymentStatus,
  RequestType,
  RiderTask,
  TaskStatus,
  TransactionType,
} from 'src/Enums/all-enums';
import { ILike } from 'typeorm';
import { OrderEntity } from 'src/Entity/orders.entity';
import { OrderRepository } from 'src/order/order.reposiroty';
import { TaskEntity } from 'src/Entity/ridersTasks.entity';
import { IRequests, RequestEntity } from 'src/Entity/requests.entity';
import { GeneatorService } from 'src/common/services/generator.service';
import { TransactionEntity } from 'src/Entity/transactions.entity';
import { all } from 'axios';

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
    private uploadservice: UploadService,
    private mailer: Mailer,
    private genratorservice: GeneatorService,
  ) {}

  //admin register rider
  async RegisterRider(dto: RegisterRiderByAdminDto) {
    try {
      const genpassword = await this.genratorservice.generatePassword();
      const hashedpassword =
        await this.genratorservice.hashpassword(genpassword);

      const genEmailsuffix =
        await this.genratorservice.generatEmailSuffixNumber();
      const emailfromfirstname = dto.firstname;
      const emaildomain = '_rider@ostralogistics.com';
      const emailnow = emailfromfirstname + genEmailsuffix + emaildomain;

      const dob = new Date(dto.DOB);
      const today = new Date();
      const age = today.getFullYear() - dob.getFullYear();

      //register new rider
      const rider = new RiderEntity();
      rider.riderID = `#OslR-${await this.genratorservice.generateUserID}`;
      (rider.firstname = dto.firstname), (rider.lastname = dto.lastname);
      rider.email = emailnow;
      rider.password = hashedpassword;
      (rider.DOB = dto.DOB),
        (rider.age = age),
        (rider.mobile = dto.mobile),
        (rider.marital_status = dto.marital_status);
      rider.home_address = dto.home_address;
      (rider.state_of_orgin = dto.state_of_origin),
        (rider.LGA_of_origin = dto.LGA_of_origin),
        (rider.guarantor1_name = dto.guarantor1_name);

      rider.guarantor1_relatioship_with_rider =
        dto.guarantor1_relatioship_with_rider;
      rider.gurantor1_mobile = dto.mobile;
      rider.guarantor2_name = dto.guarantor2_name;
      rider.guarantor2_relatioship_with_rider =
        dto.guarantor2_relatioship_with_rider;
      //verify the account
      (rider.isVerified = true), (rider.isRegistered = true);

      //find if rider already exists
      const findrider = await this.riderripo.findOne({
        where: { email: emailnow },
      });
      if (findrider)
        throw new NotAcceptableException(
          `email: ${emailnow} already exists, please generate another one`,
        );

      await this.riderripo.save(rider);

      //save notification
      const notification = new Notifications();
      notification.account = rider.id;
      notification.subject = 'Admin Registered a Rider !';
      notification.message = `a new rider has ben created on ostra logistics platform `;
      await this.notificationripo.save(notification);

      return {
        message: 'the rider has been Registered Successfully',
        response: rider,
      };
    } catch (error) {
      if (error instanceof NotFoundException)
        throw new NotFoundException(error.message);
      else {
        console.log(error);
        throw new InternalServerErrorException(
          'something went wrong while trying to Register a Rider, please try again later',
        );
      }
    }
  }

  //update rider information

  async UpdateRiderInfoByAdmin(
    riderId: string,
    dto: UpdateRiderInfoByAdminDto,
  ) {
    try {
      const rider = await this.riderripo.findOne({
        where: { id: riderId },
      });
      if (!rider)
        throw new NotFoundException(
          `rider with id:${riderId} is not found in the ostra logistics rider database`,
        );

      const genpassword = await this.genratorservice.generatePassword();

      const dob = new Date(dto.DOB);
      const today = new Date();
      const age = today.getFullYear() - dob.getFullYear();

      //update record

      (rider.firstname = dto.firstname),
        (rider.lastname = dto.lastname),
        (rider.mobile = dto.mobile),
        (rider.marital_status = dto.marital_status);
      rider.home_address = dto.home_address;
      (rider.state_of_orgin = dto.state_of_origin),
        (rider.LGA_of_origin = dto.LGA_of_origin),
        (rider.guarantor1_name = dto.guarantor1_name);

      rider.guarantor1_relatioship_with_rider =
        dto.guarantor1_relatioship_with_rider;
      rider.gurantor1_mobile = dto.mobile;
      rider.guarantor2_name = dto.guarantor2_name;

      rider.guarantor2_relatioship_with_rider =
        dto.guarantor2_relatioship_with_rider;

      await this.riderripo.save(rider);

      //save notification
      const notification = new Notifications();
      notification.account = rider.id;
      notification.subject = 'Admin Updated The Record of a Rider !';
      notification.message = `the record of the rider with the id ${riderId} has been updated  on ostra logistics platform `;
      await this.notificationripo.save(notification);

      return {
        message: 'The information of the Rider has been Updated Successfully',
        response: rider,
      };
    } catch (error) {
      if (error instanceof NotFoundException)
        throw new NotFoundException(error.message);
      else {
        console.log(error);
        throw new InternalServerErrorException(
          'something went wrong while trying to update the info of a  Rider, please try again later',
        );
      }
    }
  }

  async UploadRiderProfilePics(
    mediafile: Express.Multer.File,
    riderID: string,
  ): Promise<{ message: string }> {
    try {
      const findriderbyid = await this.riderripo.findOne({
        where: { id: riderID },
      });
      if (!findriderbyid)
        throw new NotFoundException(
          `rider with id:${riderID} is not found in the ostra logistics rider database`,
        );
      const display_pics = await this.uploadservice.uploadFile(mediafile);
      const mediaurl = `${process.env.BASE_URL}/uploadfile/public/${display_pics}`;

      //update the image url

      findriderbyid.profile_picture = mediaurl;

      await this.riderripo.save(findriderbyid);

      //save the notification
      const notification = new Notifications();
      notification.account = findriderbyid.id;
      notification.subject = 'Rider Profile Pics Uploaded !';
      notification.message = `the Rider with id ${riderID} proile picture have been uploaded on the admin portal of ostra ogistics by superadmin  `;
      await this.notificationripo.save(notification);

      return { message: 'your profile picture has been uploaded successully ' };
    } catch (error) {
      if (error instanceof NotFoundException)
        throw new NotFoundException(error.message);
      else {
        console.log(error);
        throw new InternalServerErrorException(
          'something went wrong while trying to upload the profile picture of the Rider, please try again later',
        );
      }
    }
  }

  async UploadDriverLicenseFront(
    mediafile: Express.Multer.File,
    riderID: string,
  ): Promise<{ message: string }> {
    try {
      const findriderbyid = await this.riderripo.findOne({
        where: { id: riderID },
      });
      if (!findriderbyid)
        throw new NotFoundException(
          `rider with id:${riderID} is not found in the ostra logistics rider database`,
        );
      const display_pics = await this.uploadservice.uploadFile(mediafile);
      const mediaurl = `${process.env.BASE_URL}/uploadfile/public/uploadfile/public/${display_pics}`;

      //update the image url

      findriderbyid.driver_license = mediaurl;

      await this.riderripo.save(findriderbyid);

      //save the notification
      const notification = new Notifications();
      notification.account = findriderbyid.id;
      notification.subject = 'Rider driver license Uploaded !';
      notification.message = `the Rider with id ${riderID} front driver lisence  have been uploaded on the admin portal of ostra ogistics by superadmin  `;
      await this.notificationripo.save(notification);

      return {
        message: 'your driver license front has been uploaded successully ',
      };
    } catch (error) {
      if (error instanceof NotFoundException)
        throw new NotFoundException(error.message);
      else {
        console.log(error);
        throw new InternalServerErrorException(
          'something went wrong while trying to upload the drivers license front of the Rider, please try again later',
        );
      }
    }
  }

  async UploadDriverLicenseBack(
    mediafile: Express.Multer.File,
    riderID: string,
  ): Promise<{ message: string }> {
    try {
      const findriderbyid = await this.riderripo.findOne({
        where: { id: riderID },
      });
      if (!findriderbyid)
        throw new NotFoundException(
          `rider with id:${riderID} is not found in the ostra logistics rider database`,
        );
      const display_pics = await this.uploadservice.uploadFile(mediafile);
      const mediaurl = `${process.env.BASE_URL}/uploadfile/public/${display_pics}`;

      //update the image url

      findriderbyid.driver_license = mediaurl;

      await this.riderripo.save(findriderbyid);

      //save the notification
      const notification = new Notifications();
      notification.account = findriderbyid.id;
      notification.subject = 'Rider driver license Uploaded !';
      notification.message = `the Rider with id ${riderID} back driver lisence  have been uploaded on the admin portal of ostra ogistics by superadmin  `;
      await this.notificationripo.save(notification);

      return {
        message: 'your driver license back has been uploaded successully ',
      };
    } catch (error) {
      if (error instanceof NotFoundException)
        throw new NotFoundException(error.message);
      else {
        console.log(error);
        throw new InternalServerErrorException(
          'something went wrong while trying to upload the drivers license back of the Rider, please try again later',
        );
      }
    }
  }

  //admin delete rider
  async AdminDeleteRider(riderID: string): Promise<{ message: string }> {
    try {
      const findriderbyid = await this.riderripo.findOne({
        where: { id: riderID },
      });
      if (!findriderbyid)
        throw new NotFoundException(
          `rider with id:${riderID} is not found in the ostra logistics rider database`,
        );

      //remove rider from the platorm
      await this.riderripo.remove(findriderbyid);

      //save the notification
      const notification = new Notifications();
      notification.account = findriderbyid.id;
      notification.subject = 'Rider deleted !';
      notification.message = `the rider with id ${riderID}  has been deleted from the ostra logistics application by superAdmin  `;
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
      notification.message = `the rider with id ${riderID} password has been changed on the admin portal of ostra ogistics by superadmin `;
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
      notification.message = `the rider with id ${riderID} password has been changed on the admin portal of ostra ogistics by superadmin `;
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
        relations: ['vehicle_for_the_day', 'tasks', 'my_requests'],
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
        );
      }
    }
  }
  //admin get one rider by id
  async GetOneRiderByID(riderID: string): Promise<IRider> {
    try {
      const findriderbyid = await this.riderripo.findOne({
        where: { id: riderID },
        relations: ['vehicle_for_the_day', 'tasks', 'my_requests'],
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
        );
      }
    }
  }

  //admin search for a rider
  async SearchForRider(keyword: any | string) {
    try {
      const rider = await this.riderripo.findAndCount({
        where: [
          { firstname: ILike(`%${keyword}%`) },
          { lastname: ILike(`%${keyword}%`) },
          { email: ILike(`%${keyword}%`) },
        ],
        relations: ['vehicle_for_the_day', 'tasks', 'my_requests'],
        cache: false,
        comment:
          'searching for a rider with either of the keywords , lastname or firstname or email',
      });

      if (rider[1] === 0)
        throw new NotFoundException(
          `no search result found for ${keyword} on the rider database `,
        );

      return { message: 'rider found', searchedRider: rider };
    } catch (error) {
      console.log(error);
      if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      } else {
        throw new InternalServerErrorException(
          'Something went wrong when trying to fetch all your cards. Please try again later.',
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
        relations: ['customer'],
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
      (task.rider = order.Rider), (task.task = dto.task);
      (task.assigned_order = order), (task.assignedAT = new Date());

      await this.taskRepo.save(task);

      //save the notification
      const notification = new Notifications();
      notification.account = rider.id;
      notification.subject = 'Rider Assigned Task!';
      notification.message = `the Rider with id ${riderID} have been assigned a task on the admin portal of ostra ogistics by superadmin  `;
      await this.notificationripo.save(notification);

      return task;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      } else if (error instanceof NotAcceptableException)
        throw new NotAcceptableException(error.message);
      else {
        throw new InternalServerErrorException(
          'Something went wrong when trying to assign a task to a rider. Please try again later.',
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
      notification.message = `the Rider with id ${riderID} bank details have been added  on the admin portal of ostra ogistics by superadmin  `;
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
      notification.subject = 'Rider bank details added !';
      notification.message = `the Rider with id ${riderID} bank details have been updated based on request  on the admin portal of ostra ogistics by superadmin  `;
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

      await this.transactionRepo.save(transaction);

      //save the notification
      const notification = new Notifications();
      notification.account = bankDetails.owner.id;
      notification.subject = 'Admin Logs payment !';
      notification.message = `the Rider with id ${riderID}  a payment as been logged in realtionsions to your account  `;
      await this.notificationripo.save(notification);

      return transaction;
    } catch (error) {
      if (error instanceof NotFoundException)
        throw new NotFoundException(error.message);
      else {
        console.log(error);
        throw new InternalServerErrorException(
          'something went wrong while trying to log payments made to a rider, please try again later',
        );
      }
    }
  }

  //admin get all rider tasks
  async getAllriderTask() {
    try {
      const alltasks = await this.taskRepo.findAndCount();
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
        );
      }
    }
  }


  //admin fetch all riders with ongoing tasks
  async getAllriderwithOngoingTaskTask() {
    try {
      const alltasks = await this.taskRepo.findAndCount({
        where: { status: TaskStatus.ONGOING },
        relations:['rider','assigned_order']
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
        );
      }
    }
  }


  //admin fetch all riders with concluded tasks
  async getAllriderwithConcludedTask() {
    try {
      const alltasks = await this.taskRepo.findAndCount({
        where: { status: TaskStatus.CONCLUDED },
        relations:['rider','assigned_order']
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
          'something went wrong while trying fetch all riders with ongoing tasks',
        );
      }
    }
  }

  //admin fetch all riders with pending tasks
}
