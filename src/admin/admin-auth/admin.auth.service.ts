import {
  ConflictException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  NotAcceptableException,
  NotFoundException,
  RequestTimeoutException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CustomerEntity } from 'src/Entity/customers.entity';
import { LessThan, Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  AdminAccessLevels,
  AdminType,
  NotificationType,
  Role,
} from 'src/Enums/all-enums';
import { UserOtp } from 'src/Entity/otp.entity';
import {
  NotificationRepository,
  OtpRepository,
} from 'src/common/common.repositories';

import {
  Logindto,
  RequestOtpResendDto,
  SendPasswordResetLinkDto,
  VerifyOtpDto,
  VerifyOtpForResetPasswordDto,
} from 'src/common/common.dto';
import { Mailer } from 'src/common/mailer/mailer.service';
import { AdminEntity } from 'src/Entity/admins.entity';
import { AdminRepository } from '../admin.repository';
import { RegisterAdminDto } from '../admin.dto';
import { IAdmin } from '../admin';
import { addPasswordDto } from 'src/customer/customer.dto';
import { CustomerService } from 'src/customer/customer.service';
import { AdminService } from '../admin.service';
import { GeneatorService } from 'src/common/services/generator.service';
import { Notifications } from 'src/Entity/notifications.entity';

@Injectable()
export class AdminAuthService {
  constructor(
    @InjectRepository(AdminEntity) private readonly adminrepo: AdminRepository,
    @InjectRepository(UserOtp) private readonly otprepo: OtpRepository,
    @InjectRepository(Notifications)
    private readonly notificationrepo: NotificationRepository,
    private configservice: ConfigService,
    private genratorservice: GeneatorService,
    private jwt: JwtService,
    private mailerservice: Mailer,
    private adminservice: AdminService,
  ) {}

  // get customer profile
  async getProfile(Admin: AdminEntity): Promise<IAdmin> {
    try {
      const admin = await this.adminrepo.findOne({ where: { id: Admin.id } });
      if (!admin) {
        throw new NotFoundException('Super admin not found');
      }
      return admin;
    } catch (error) {
      if (error instanceof NotFoundException)
        throw new NotFoundException(error.message);
      else {
        console.log(error);
        throw new InternalServerErrorException(
          'something went wrong while fetching admin profile, please try again later',
        );
      }
    }
  }

  //sign up user

  async RegisterSuperAdmin(
    dto: RegisterAdminDto,
  ): Promise<{ message: string }> {
    try {
      // Check if a CEO already exists
      // const existingCEO = await this.adminrepo.findOne({
      //   where: { admintype: AdminType.CEO },
      // });

      // if (existingCEO) {
      //   throw new ConflictException('oops! A CEO already exists in ostra logitics and only one CEO can exist.');
      // }
      const checkemail = await this.adminrepo.findOne({
        where: { email: dto.email },
      });
      if (checkemail)
        throw new ConflictException('This super admin already exists');

      const hashedpassword = await this.genratorservice.hashpassword(
        dto.password,
      );

      const admin = new AdminEntity();
      admin.adminID = `#OslA-${await this.genratorservice.generateUserID()}`;
      admin.email = dto.email;
      admin.fullname = dto.fullname;
      admin.password = hashedpassword;
      admin.mobile = dto.mobile;
      admin.role = Role.ADMIN;
      admin.adminAccessLevels = AdminAccessLevels.LEVEL3;
      admin.admintype = AdminType.CEO;
      admin.RegisteredAt = new Date();
      admin.isRegistered = true;

      await this.adminrepo.save(admin);

      //2fa authentication
      const emiailverificationcode =
        await this.genratorservice.generateEmailToken();

      //otp
      const otp = new UserOtp();
      otp.email = dto.email;
      otp.otp = emiailverificationcode;
      otp.role = admin.role;
      const twominuteslater = new Date();
      await twominuteslater.setMinutes(twominuteslater.getMinutes() + 2);
      otp.expiration_time = twominuteslater;
      await this.otprepo.save(otp);

      // mail
      await this.mailerservice.SendVerificationeMail(
        dto.email,
        dto.fullname,
        emiailverificationcode,
        twominuteslater,
      );

      //save the notification
      const notification = new Notifications();
      notification.account = admin.id;
      notification.subject = 'New Super Admin Created!';
      notification.message = `new admin created successfully `;
      await this.notificationrepo.save(notification);

      return {
        message:
          'You have successfully registered as a super admin, please check your email for the otp verification',
      };
    } catch (error) {
      if (error instanceof NotFoundException)
        throw new NotFoundException(error.message);
      else if (error instanceof ConflictException)
        throw new ConflictException(error.message);
      else {
        console.log(error);
        throw new InternalServerErrorException(
          'something happen while trying to sign up',
          error.message,
        );
      }
    }
  }

  async verifyEmail(
    dto: VerifyOtpDto,
  ): Promise<{ isValid: boolean; accessToken: any }> {
    try {
      //find the otp provided if it matches with the otp stored
      const findotp = await this.otprepo.findOne({ where: { otp: dto.otp } });
      if (!findotp)
        throw new NotFoundException(
          'you provided an invalid OTP,please go back to your email and confirm the OTP sent to you',
        );

      //find if the otp is expired
      if (findotp.expiration_time <= new Date())
        throw new RequestTimeoutException(
          'OTP is expired, please request for another one',
        );

      // Find the admin associated with the OTP
      const admin = await this.adminrepo.findOne({
        where: { email: findotp.email },
      });
      if (!admin)
        throw new NotFoundException('No admin found for the provided OTP.');

      // Verify and update the customer's status
      admin.isVerified = true;
      admin.isLoggedIn = true;
      await this.adminrepo.save(admin);

      const notification = new Notifications();
      (notification.account = admin.id),
        (notification.subject = 'Super Admin Verified!');
      notification.message = `Hello ${admin.fullname}, your email has been successfully verified `;
      await this.notificationrepo.save(notification);

      //await this.mailerservice.SendWelcomeEmail(admin.email,admin.brandname)

      await this.adminrepo.save(admin);

      //send welcome mail
      await this.mailerservice.WelcomeMailAdmin(admin.email, admin.fullname);

      const accessToken = await this.genratorservice.signToken(
        admin.id,
        admin.email,
        admin.role,
      );

      return { isValid: true, accessToken };
    } catch (error) {
      if (error instanceof NotFoundException)
        throw new NotFoundException(error.message);
      else if (error instanceof RequestTimeoutException)
        throw new RequestTimeoutException(error.message);
      else {
        console.log(error);
        throw new InternalServerErrorException(
          'an error occured while verifying the email of the admin pls try again',
          error.message,
        );
      }
    }
  }

  // resend email verification otp

  async ResendExpiredOtp(email: string | any): Promise<{ message: string }> {
    try {
      const emailexsist = await this.adminrepo.findOne({
        where: { email: email },
      });
      if (!emailexsist)
        throw new ConflictException(
          `customer with email: ${email}doesn't exists, please use an already registered email`,
        );

      // Check if there is an expired OTP for the user
      const expiredOtp = await this.otprepo.findOne({
        where: { email: email, expiration_time: LessThan(new Date()) },
      });
      if (!expiredOtp) {
        throw new NotFoundException('No expired OTP found for this user.');
      }
      // Generate a new OTP
      const emiailverificationcode =
        await this.genratorservice.generateEmailToken(); // Your OTP generated tokens

      // Save the token with expiration time
      const twominuteslater = new Date();
      await twominuteslater.setMinutes(twominuteslater.getMinutes() + 2);

      //save the token
      const newOtp = this.otprepo.create({
        email: email,
        otp: emiailverificationcode,
        expiration_time: twominuteslater,
        role: emailexsist.role,
      });
      await this.otprepo.save(newOtp);

      //save the notification
      const notification = new Notifications();
      notification.account = emailexsist.id;
      notification.subject = 'Otp Resent!';
      notification.message = `Hello ${emailexsist.fullname}, a new verification Link has been resent to your mail `;
      await this.notificationrepo.save(notification);

      //send mail
      await this.mailerservice.SendVerificationeMail(
        newOtp.email,
        emailexsist.fullname,
        emiailverificationcode,
        twominuteslater,
      );

      return {
        message: 'New Otp verification code has been sent successfully',
      };
    } catch (error) {
      if (error instanceof NotFoundException)
        throw new NotFoundException(error.message);
      else if (error instanceof ConflictException)
        throw new ConflictException(error.message);
      else {
        console.log(error);
        throw new InternalServerErrorException(
          'somethig went wrong when trying to resend otp, please try again',
          error.message,
        );
      }
    }
  }

  async sendPasswordResetLink(
    dto: SendPasswordResetLinkDto,
  ): Promise<{ message: string }> {
    try {
      const isEmailReistered = await this.adminrepo.findOne({
        where: { email: dto.email },
      });
      if (!isEmailReistered)
        throw new NotFoundException(
          `this email ${dto.email} does not exist in our system, please try another email address`,
        );

      const resetlink = await this.genratorservice.generateEmailToken();
      const expirationTime = new Date();
      expirationTime.setHours(expirationTime.getHours() + 1);

      //send reset link to the email provided
      await this.mailerservice.SendPasswordResetLinkMail(
        dto.email,
        resetlink,
        isEmailReistered.fullname,
      );

      //save the reset link and the expiration time to the database
      isEmailReistered.password_reset_link = resetlink;
      isEmailReistered.reset_link_exptime = expirationTime;
      await this.adminrepo.save(isEmailReistered);

      const notification = new Notifications();
      (notification.account = isEmailReistered.id),
        (notification.subject = 'password Reset link!');
      notification.message = `Hello ${isEmailReistered.fullname}, password resent link sent `;
      await this.notificationrepo.save(notification);

      return { message: 'The password reset link has been sent successfully' };
    } catch (error) {
      if (error instanceof NotFoundException)
        throw new NotFoundException(error.message);
      else {
        console.log(error);
        throw new InternalServerErrorException(
          'somethig went wrong when trying to request for password reset link, please try again',
          error.message,
        );
      }
    }
  }

  //verify token sent when trying to reset password
  async VerifyResetPasswordOtp(
    dto: VerifyOtpForResetPasswordDto,
  ): Promise<{ message: string }> {
    try {
      //find the user who has the reset otp sent
      const verifyuser = await this.adminrepo.findOne({
        where: { password_reset_link: dto.otp },
      });
      if (!verifyuser)
        throw new NotAcceptableException(
          'the reset password token is incorrect please retry or request for another token',
        );

      //find if the otp is expired
      if (verifyuser.reset_link_exptime <= new Date())
        throw new RequestTimeoutException(
          'reset token is expired, please request for another one',
        );

      const notification = new Notifications();
      (notification.account = verifyuser.id),
        (notification.subject = 'Verify Password Reset Token!');
      notification.message = `Hello ${verifyuser.fullname}, password reset link verified and the password has been recently reseted `;
      await this.adminrepo.save(verifyuser);

      return { message: 'otp has been verified' };
    } catch (error) {
      if (error instanceof NotAcceptableException)
        throw new NotAcceptableException(error.message);
      else if (error instanceof RequestTimeoutException)
        throw new RequestTimeoutException(error.message);
      else {
        console.log(error);
        throw new InternalServerErrorException(
          'somethig went wrong when trying to verify reset link sent , please try again',
        );
      }
    }
  }

  //reset password
  async FinallyResetPasswordAfterVerification(
    adminID: string | any,
    dto: addPasswordDto,
  ): Promise<{ message: string }> {
    try {
      const checkcustomer = await this.adminrepo.findOne({
        where: { id: adminID },
      });
      if (!checkcustomer.isVerified)
        throw new UnauthorizedException(
          'sorry this customer has not been verified yet, please request for an otp to verify your account',
        );

      const hashedpassword = await this.genratorservice.hashpassword(
        dto.password,
      );

      //add the password
      checkcustomer.password = hashedpassword;

      await this.adminrepo.save(checkcustomer);

      return { message: 'password has been reset successfully' };
    } catch (error) {
      if (error instanceof UnauthorizedException)
        throw new UnauthorizedException(error.message);
      else {
        console.log(error);
        throw new InternalServerErrorException(
          'somethig went wrong when trying to reset password , please try again',
          error.message,
        );
      }
    }
  }

  //login admin

  async login(logindto: Logindto) {
    try {
      const findadmin = await this.adminrepo.findOne({
        where: { email: logindto.email },
      });
      if (!findadmin) throw new NotFoundException(`invalid credentials`);
      const comparepass = await this.genratorservice.comaprePassword(
        logindto.password,
        findadmin.password,
      );
      if (!comparepass) {
        throw new NotFoundException('invalid credentials');
      }

      if (!findadmin.isVerified)
        throw new ForbiddenException(
          `Your account has not been verified. Please verify your account by requesting a verification code.`,
        );
      findadmin.isLoggedIn = true;
      await this.adminrepo.save(findadmin);

      //save the notification
      const notification = new Notifications();
      notification.account = findadmin.id;
      notification.subject = ' login!';
      notification.message = `Hello ${findadmin.fullname}, just logged in `;
      await this.notificationrepo.save(notification);

      return await this.genratorservice.signToken(
        findadmin.id,
        findadmin.email,
        findadmin.role,
      );
    } catch (error) {
      if (error instanceof NotFoundException)
        throw new NotFoundException(error.message);
      else if (error instanceof UnauthorizedException)
        throw new UnauthorizedException(error.message);
      else if (error instanceof ForbiddenException)
        throw new ForbiddenException(error.message);
      else {
        console.log(error);
        throw new InternalServerErrorException(
          'somethig went wrong while trying to login , please try again',
          error.message,
        );
      }
    }
  }
}
