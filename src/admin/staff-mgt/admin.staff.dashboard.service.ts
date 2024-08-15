import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotAcceptableException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AdminEntity } from 'src/Entity/admins.entity';
import { Notifications } from 'src/Entity/notifications.entity';
import { RiderEntity } from 'src/Entity/riders.entity';
import { NotificationRepository } from 'src/common/common.repositories';
import { UploadService } from 'src/common/helpers/upload.service';
import { AdminRepository, PassCodeRepository } from '../admin.repository';
import { RidersRepository } from 'src/Riders/riders.repository';
import { IAdmin, ICreateAdmins } from '../admin';
import { AdminRiderDashboardService } from '../rider-mgt/admin.riders.dashboard.service';
import {
  AdminAccessLevels,
  AdminType,
  NotificationType,
  Role,
} from 'src/Enums/all-enums';
import {
  AdminchangestaffAccessLevelDto,
  RegisterOtherAdminByAdminDto,
  UpdateOtherAdminInfoByAdminDto,
} from '../admin.dto';
import { IChangeRiderPassword } from 'src/Riders/riders';
import { ILike } from 'typeorm';
import { AdminService } from '../admin.service';
import { GeneatorService } from 'src/common/services/generator.service';
import { CloudinaryService } from 'src/common/services/claudinary.service';
import { PasscodeEntity } from 'src/Entity/passcode.entity';
import { Mailer } from 'src/common/mailer/mailer.service';

@Injectable()
export class AdminStaffDasboardService {
  constructor(
    @InjectRepository(RiderEntity) private readonly riderripo: RidersRepository,
    @InjectRepository(AdminEntity) private readonly adminripo: AdminRepository,
    @InjectRepository(PasscodeEntity)
    private readonly passcodeRipo: PassCodeRepository,
    @InjectRepository(Notifications)
    private readonly notificationripo: NotificationRepository,
    private generatorservice: GeneatorService,
    private mailer:Mailer
  ) {}


  async UpdatePasscode(admin: AdminEntity, id: number) {
    try {
      const findadmin = await this.adminripo.findOne({
        where: {
          id: admin.id,
          adminAccessLevels: AdminAccessLevels.LEVEL3,
          admintype: AdminType.CEO,
        },
      });
      if (!findadmin)
        throw new NotFoundException('this super admin is not found');

      const findpasscode = await this.passcodeRipo.findOne({
        where: { id: id },
      });
      if (!findpasscode)
        throw new NotFoundException(
          `passcode associated to id ${id} is not found`,
        );

      const code = await this.generatorservice.generatePassCode();
      //const hashcode = await this.generatorservice.hashpassword(code);

      findpasscode.passcode = code;
      findpasscode.updatedAT = new Date();
      await this.passcodeRipo.save(findpasscode);

      //forward passcode to mail
      await this.mailer.updatePasscodeMail(admin.email,admin.fullname,code)


      return { message: 'pass code updated by the superadmin, please check your email for the new passcode' };
    } catch (error) {
      if (error instanceof NotFoundException)
        throw new NotFoundException(error.message);
      else {
        console.log(error);
        throw new InternalServerErrorException(
          'something went wrong while updating passcode, please try again later',
          error.message,
        );
      }
    }
  }

  //admin register rider
  async RegisterStaff(dto: RegisterOtherAdminByAdminDto) {
    try {
      const genpassword = await this.generatorservice.generatePassword();
      const hashedpassword =
        await this.generatorservice.hashpassword(genpassword);

      const genEmailsuffix =
        await this.generatorservice.generatEmailSuffixNumber();
      const emailfromfirstname = dto.firstname;
      const emaildomain = '.staff@ostralogistics.com';
      const emailnow = emailfromfirstname+genEmailsuffix+emaildomain;

      const dob = new Date(dto.DOB);
      const today = new Date();
      const age = today.getFullYear() - dob.getFullYear();

      //register new rider
      const staff = new AdminEntity();
      (staff.firstname = dto.firstname), (staff.lastname = dto.lastname);
      staff.email = emailnow;
      staff.password = hashedpassword;
      staff.admintype = AdminType.STAFF;
      staff.RegisteredAt = new Date();
      staff.isVerified = true;
      staff.isRegistered = true;

      (staff.DOB = dto.DOB),
        (staff.age = age),
        (staff.mobile = dto.mobile),
        (staff.marital_status = dto.marital_status);
      staff.home_address = dto.home_address;
      (staff.state_of_origin = dto.state_of_origin),
        (staff.LGA_of_origin = dto.LGA_of_origin);
      (staff.role = Role.ADMIN), (staff.adminAccessLevels = dto.accesslevel);

      //find if rider already exists
      const findstaff = await this.adminripo.findOne({
        where: { email: emailnow },
      });
      if (findstaff)
        throw new NotAcceptableException(
          `email: ${emailnow} already exists, please generate another one`,
        );

      await this.adminripo.save(staff);

      //save notification
      const notification = new Notifications();
      notification.account = "admin";
      notification.subject = 'Admin Registered staff  !';
      notification.message = `a new staff  have been created on ostra logistics platform `;
      await this.notificationripo.save(notification);

      return {
        message: 'the staff have been Registered Successfuly,these are the login credentials generated for the newly created Staff',
        email: emailnow,
        password: genpassword,
      };
    } catch (error) {
      if (error instanceof NotAcceptableException)
        throw new NotAcceptableException(error.message);
      else {
        console.log(error);
        throw new InternalServerErrorException(
          'something went wrong while trying to fetch all staffs, please try again later',
          error.message,
        );
      }
    } 
  }

  async UpdateStaffInfoByAdmin(
    adminId: string,
    dto: UpdateOtherAdminInfoByAdminDto,
  ): Promise<{ message: string; response: IAdmin }> {
    try {
      const admin = await this.adminripo.findOne({
        where: { id: adminId },
      });
      if (!admin)
        throw new NotFoundException(
          `staff with id:${adminId} is not found in the ostra logistics staff database`,
        );

      const dob = new Date(dto.DOB);
      const today = new Date();
      const age = today.getFullYear() - dob.getFullYear();

      // Update other admin record directly from DTO
      admin.firstname = dto.firstname;
      admin.lastname = dto.lastname;
      admin.mobile = dto.mobile;
      admin.marital_status = dto.marital_status;
      admin.home_address = dto.home_address;
      admin.state_of_origin = dto.state_of_origin;
      admin.LGA_of_origin = dto.LGA_of_origin;
      admin.gender = dto.gender;
      admin.LGA_of_Home_Address = dto.LGA_of_Home_Address;
      admin.adminAccessLevels = dto.accesslevel
      admin.UpdatedAt = new Date()
      


      await this.adminripo.save(admin);

      //save notification
      const notification = new Notifications();
      notification.account = admin.id;
      notification.subject = 'Staff Record Updated !';
      notification.message = `the record of the rider with the id ${adminId} has been updated  on ostra logistics platform `;
      await this.notificationripo.save(notification);

      return {
        message: 'The information of the Staff have been Updated Successfully',
        response: admin,
      };
    } catch (error) {
      if (error instanceof NotFoundException)
        throw new NotFoundException(error.message);
      else {
        console.log(error);
        throw new InternalServerErrorException(
          'something went wrong while trying to update Staff Records, please try again later',
        );
      }
    }
  }

  //admin delete rider
  async AdminDeleteStaff(adminID: string) {
    try {
      const findotheradmin = await this.adminripo.findOne({
        where: { id: adminID, admintype: AdminType.STAFF },
      });
      if (!findotheradmin)
        throw new NotFoundException(
          `staff with id:${adminID} is not found in the ostra logistics staff database`,
        );

      //remove rider from the platorm
      await this.adminripo.remove(findotheradmin);

      //save the notification
      const notification = new Notifications();
      notification.account = findotheradmin.id;
      notification.subject = 'Staff deleted !';
      notification.message = `the staff with id ${adminID}  has been deleted from the ostra logistics application by superAdmin `;
      await this.notificationripo.save(notification);

      return {
        message: ` staff deleted  by the CEO `,
      };
    } catch (error) {
      if (error instanceof NotFoundException)
        throw new NotFoundException(error.message);
      else {
        console.log(error);
        throw new InternalServerErrorException(
          'something went wrong while trying to delete this staff, please try again later',
          error.message,
        );
      }
    }
  }

  // admin change rider password

  async AdminChangeStaffPassword(
    staffID: string,
  ): Promise<{ message: string; response: IChangeRiderPassword }> {
    try {
      const findstaff = await this.adminripo.findOne({
        where: { id: staffID, admintype: AdminType.STAFF },
      });
      if (!findstaff)
        throw new NotFoundException(
          `staff with id:${staffID} is not found in the ostra logistics staff database`,
        );

      //change tthe password
      const genpassword = await this.generatorservice.generatePassword();
      const hashedpassword =
        await this.generatorservice.hashpassword(genpassword);

      findstaff.password = hashedpassword;
      await this.adminripo.save(findstaff);

      //save the notification
      const notification = new Notifications();
      notification.account = findstaff.id;
      notification.subject = 'Staff password changed !';
      notification.message = `the Staff with id ${staffID} password has been changed on the admin portal of ostra ogistics by superadmin  `;
      await this.notificationripo.save(notification);

      // customised response
      const newpasswordresponse: IChangeRiderPassword = {
        password: genpassword,
      };

      return {
        message: 'Staff password have been changed successfully ',
        response: newpasswordresponse,
      };
    } catch (error) {
      if (error instanceof NotFoundException)
        throw new NotFoundException(error.message);
      else {
        console.log(error);
        throw new InternalServerErrorException(
          'something went wrong while trying to change staffs password, please try again later',
          error.message,
        );
      }
    }
  }

  async GetAllStaffs(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    try {
      //fetch staffs with pagination
      const staff = await this.adminripo.findAndCount({
        where: { admintype: AdminType.STAFF },
        order: { RegisteredAt: 'DESC' },
        relations:['my_orders','replies','carts','bids_sent','assigned_complaints','my_filed_complains'],
        take: limit,
        skip: skip,
      });

      if (staff[1] === 0)
        throw new NotFoundException(
          'you have no staff registred at the moment',
        );
      return staff;
    } catch (error) {
      if (error instanceof NotFoundException)
        throw new NotFoundException(error.message);
      else {
        console.log(error);
        throw new InternalServerErrorException(
          'something went wrong while trying to fetch all staffs, please try again later',
          error.message,
        );
      }
    }
  }

  //admin get one staff by id
  async GetOneStaffByID(staffID: string) {
    try {
      const staff = await this.adminripo.findOne({
        where: { id: staffID, admintype: AdminType.STAFF },
        relations:['my_orders','replies','carts','bids_sent','assigned_complaints','my_filed_complains'],
      });
      if (!staff)
        throw new NotFoundException(
          `staff with id:${staffID} is not found in the ostra logistics staff database`,
        );
      return staff;
    } catch (error) {
      if (error instanceof NotFoundException)
        throw new NotFoundException(error.message);
      else {
        console.log(error);
        throw new InternalServerErrorException(
          'something went wrong while tryig to get one staff by id, please try again later',
          error.message,
        );
      }
    }
  }

  async GetOneStaffDetails(staffID: string) {
    try {
      const staff = await this.adminripo.findOne({
        where: { id: staffID, admintype: AdminType.STAFF },
        relations: ['my_orders', 'my_orders.items', 'bids_sent', 'bids_sent.order', 'bids_sent.order.customer'],
      });
  
      if (!staff) {
        throw new NotFoundException(`Staff with id: ${staffID} is not found in the Ostra logistics staff database`);
      }
  
      // Calculate bidCount and orderCount
      const bidCount = staff.bids_sent ? staff.bids_sent.length : 0;
      const orderCount = staff.my_orders ? staff.my_orders.length : 0;
  
      // Return the staff details along with bidCount and orderCount
      return {
        staff,
        bidCount,
        orderCount,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      } else {
        console.log(error);
        throw new InternalServerErrorException(
          'Something went wrong while trying to get one staff by id, please try again later',
          error.message,
        );
      }
    }
  }
  

  //admin search for an admin
  async SearchForOtherAdmin(keyword: string, page?:number, perPage?:number, sort?:string): Promise<{ data: AdminEntity[]; total: number }> {
    try {
      const qb = this.adminripo.createQueryBuilder('admin')

      qb.where('admin.firstname ILIKE :keyword',{keyword:`%${keyword}%`})
      qb.orWhere('admin.lastname ILIKE :keyword',{keyword:`%${keyword}%`})
      qb.cache(false)


      if (sort) {
        const [sortField] = sort.split(',');
        qb.orderBy(`admin.${sortField}`, 'DESC');
      }

      if (page && perPage) {
        qb.skip((page - 1) * perPage).take(perPage);
      }

      const [admin, total] = await qb.getManyAndCount();

      if (!admin.length) {
        throw new NotFoundException(
          `No staff found matching your search criteria for "${keyword}".`,
        );
      }
  
      return { data: admin, total };

      
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

  //admin change astaff access level
  async ChangeStaffAccessLevel(
    staffID: string,
    dto: AdminchangestaffAccessLevelDto,
  ): Promise<{ message: string; response: IAdmin }> {
    try {
      const staff = await this.adminripo.findOne({
        where: { id: staffID, admintype: AdminType.STAFF },
      });
      if (!staff)
        throw new NotFoundException(
          `staff with id:${staffID} is not found in the ostra logistics staff database`,
        );

      //change accesslevel
      staff.adminAccessLevels = dto.accesslevel;
      await this.adminripo.save(staff);

      //save the notification
      const notification = new Notifications();
      notification.account = staff.id;
      notification.subject = 'Staff accesslevel changed !';
      notification.message = `the Staff with id ${staffID} accesslevel have been changed on the admin portal of ostra ogistics by CEO  `;
      await this.notificationripo.save(notification);

      return {
        message: 'staff accesslevel has been changed successfully',
        response: staff,
      };
    } catch (error) {
      if (error instanceof NotFoundException)
        throw new NotFoundException(error.message);
      else {
        console.log(error);
        throw new InternalServerErrorException(
          'something went wrong while trying to chnge the accesslevel of this staff, please try again later',
          error.message,
        );
      }
    }
  }
}
