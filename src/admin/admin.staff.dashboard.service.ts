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
import { CustomerAuthService } from 'src/customer/customer.auth.service';
import { AdminRepository } from './admin.repository';
import { RidersRepository } from 'src/Riders/riders.repository';
import { IAdmin, ICreateAdmins } from './admin';
import { AdminRiderDashboardService } from './admin.riders.dashboard.service';
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
} from './admin.dto';
import { IChangeRiderPassword } from 'src/Riders/riders';
import { ILike } from 'typeorm';

@Injectable()
export class AdminStaffDasboardService {
  constructor(
    @InjectRepository(RiderEntity) private readonly riderripo: RidersRepository,
    @InjectRepository(AdminEntity) private readonly adminripo: AdminRepository,
    @InjectRepository(Notifications)
    private readonly notificationripo: NotificationRepository,
    private uploadservice: UploadService,
    private customerauthservice: CustomerAuthService,
    private adminriderservice: AdminRiderDashboardService,
  ) {}

  //admin register rider
  async RegisterStaff(
    dto: RegisterOtherAdminByAdminDto,
  ): Promise<{ message: string; response: ICreateAdmins }> {
    try {
      const genpassword = await this.adminriderservice.generatePassword();
      const hashedpassword =
        await this.customerauthservice.hashpassword(genpassword);

      const genEmailsuffix =
        await this.adminriderservice.generatEmailSuffixNumber();
      const emailfromfirstname = dto.firstname;
      const emaildomain = '_staff@ostralogistics.com';
      const emailnow = emailfromfirstname + genEmailsuffix + emaildomain;

      const dob = new Date(dto.DOB);
      const today = new Date();
      const age = today.getFullYear() - dob.getFullYear();

      //register new rider
      const newadmin = new AdminEntity();
      (newadmin.firstname = dto.firstname), (newadmin.lastname = dto.lastname);
      newadmin.email = emailnow;
      newadmin.password = hashedpassword;
      newadmin.admintype = AdminType.STAFF;

      (newadmin.DOB = dto.DOB),
        (newadmin.age = age),
        (newadmin.mobile = dto.mobile),
        (newadmin.marital_status = dto.marital_status);
      newadmin.home_address = dto.home_address;
      (newadmin.state_of_origin = dto.state_of_origin),
        (newadmin.LGA_of_origin = dto.LGA_of_origin);
      (newadmin.role = Role.ADMIN),
        (newadmin.adminAccessLevels = dto.accesslevel);

      //find if rider already exists
      const findadmin = await this.adminripo.findOne({
        where: { email: emailnow },
      });
      if (findadmin)
        throw new NotAcceptableException(
          `email: ${emailnow} already exists, please generate another one`,
        );

      await this.adminripo.save(newadmin);

      //customize return response
      const riderresponse: ICreateAdmins = {
        id: newadmin.id,
        firstname: newadmin.firstname,
        lastname: newadmin.lastname,
        profile_picture: newadmin.profile_picture,
        email: newadmin.email,
        password: genpassword,
        DOB: newadmin.DOB,
        age: newadmin.age,
        mobile: newadmin.mobile,
        home_address: newadmin.home_address,
        state_of_origin: newadmin.state_of_origin,
        LGA_of_origin: newadmin.LGA_of_origin,
        RegisteredAt: newadmin.RegisteredAt,
        role: newadmin.role,
        marital_status: newadmin.marital_status,
        adminAccessLevels: newadmin.adminAccessLevels,
        admintype: newadmin.admintype,
        gender: newadmin.gender,
        LGA_of_Home_Address: newadmin.LGA_of_Home_Address,
      };

      //save notification
      const notification = new Notifications();
      notification.account = 'super admin';
      notification.subject = 'Admin Registered staff  !';
      notification.message = `a new staff  has ben created on ostra logistics platform `;
      await this.notificationripo.save(notification);

      return {
        message: 'the staff have been Registered Successfuly',
        response: riderresponse,
      };
    } catch (error) {
      if (error instanceof NotAcceptableException)
        throw new NotAcceptableException(error.message);
      else {
        console.log(error);
        throw new InternalServerErrorException(
          'something went wrong while trying to fetch all staffs, please try again later',
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

      await this.adminripo.save(admin);

      //save notification
      const notification = new Notifications();
      notification.account = 'super admin';
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
      notification.account = 'super admin';
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
      const genpassword = await this.adminriderservice.generatePassword();
      const hashedpassword =
        await this.customerauthservice.hashpassword(genpassword);

      findstaff.password = hashedpassword;
      await this.adminripo.save(findstaff);

      //save the notification
      const notification = new Notifications();
      notification.account = 'super admin';
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
        );
      }
    }
  }

  //admin get one staff by id
  async GetOneStaffByID(staffID: string) {
    try {
      const staff = await this.adminripo.findOne({
        where: { id: staffID, admintype: AdminType.STAFF },
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
        );
      }
    }
  }

  //admin search for an admin
  async SearchForStaff(keyword: any | string) {
    try {
      const rider = await this.adminripo.findAndCount({
        where: [
          { admintype: AdminType.STAFF },
          { firstname: ILike(`%${keyword}%`) },
          { lastname: ILike(`%${keyword}%`) },
          { email: ILike(`%${keyword}%`) },
        ],
        cache: false,
        comment:
          'searching for a staff with either of the keywords , lastname or firstname or email',
      });

      if (rider[1] === 0)
        throw new NotFoundException(
          `no search result found for ${keyword} on the staff database `,
        );

      return { message: 'staff found', searchedRider: rider };
    } catch (error) {
      throw new InternalServerErrorException(
        'An error occured while searching for staff',
      );
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
        );
      }
    }
  }
}
