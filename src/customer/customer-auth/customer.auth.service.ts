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
import { CustomerRepository } from '../customer.repository';
import * as bcrypt from 'bcrypt';
import * as nanoid from 'nanoid';
import { customAlphabet } from 'nanoid';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { ICustomer } from '../customer';
import { RegisterCustomerDto, addPasswordDto } from '../customer.dto';
import { NotificationType, Role } from 'src/Enums/all-enums';
import { UserOtp } from 'src/Entity/otp.entity';
import {
  NotificationRepository,
  OtpRepository,
} from 'src/common/common.repositories';
import { Notifications } from 'src/Entity/notifications.entity';
import {
  GetDeviceTokenDto,
  Logindto,
  RequestOtpResendDto,
  SendPasswordResetLinkDto,
  VerifyOtpDto,
  VerifyOtpForResetPasswordDto,
} from 'src/common/common.dto';
import { Mailer } from 'src/common/mailer/mailer.service';
import exp from 'constants';
import { CustomerService } from '../customer.service';
import { GeneatorService } from 'src/common/services/generator.service';
//import { SmsSenderService } from 'src/common/twilioSmsSender/sms';

@Injectable()
export class CustomerAuthService {
  constructor(
    @InjectRepository(CustomerEntity)
    private readonly customerrepo: CustomerRepository,
    @InjectRepository(UserOtp) private readonly otprepo: OtpRepository,
    @InjectRepository(Notifications)
    private readonly notificationrepo: NotificationRepository,
    private mailerservice: Mailer,
    private generatorservice: GeneatorService,
    //private smsservice:SmsSenderService
  ) {}

  // get customer profile
  async getProfile(customer: CustomerEntity, dto:GetDeviceTokenDto): Promise<ICustomer> {
    try {
      if (!customer) {
        throw new NotFoundException('Customer not found');
      }
       // Handle device tokens
       const devicetoken = dto.deviceToken;

       if (devicetoken) {
         // Ensure the deviceToken array is initialized
         if (!customer.deviceToken) {
           customer.deviceToken = [];
         }
   
         // Check if the token already exists
         if (!customer.deviceToken.includes(devicetoken)) {
           // Add the new token
           customer.deviceToken.push(devicetoken);
   
           // If there are more than 3 tokens, remove the oldest one
           if (customer.deviceToken.length > 3) {
             customer.deviceToken.shift();
           }
             // Save the updated customer entity
          await this.customerrepo.save(customer);
         }
       }
      return customer;
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(
        'something happened while trying to fetch user profile',
        error.message,
      );
    }
  }

  //sign up customer

  async RegisterCustomer(
    dto: RegisterCustomerDto,
  ): Promise<{ message: string }> {
    try {
      const checkemail = await this.customerrepo.findOne({
        where: { email: dto.email },
      });
      if (checkemail)
        throw new NotFoundException('This customer already exists');

      const hashedpassword = await this.generatorservice.hashpassword(
        dto.password,
      );

      const devicetoken = dto.deviceToken

      const customer = new CustomerEntity();
      customer.customerID = `#OslC-${await this.generatorservice.generateUserID()}`;

      customer.email = dto.email;
      customer.password = hashedpassword;
      customer.firstname = dto.firstname;
      customer.lastname = dto.lastname;
      customer.mobile = dto.mobile
      customer.role = Role.CUSTOMER;
      customer.RegisteredAt = new Date();
      customer.isRegistered = true;
      await this.customerrepo.save(customer);

      //2fa authentication
      const emiailverificationcode =
        await this.generatorservice.generateEmailToken();

    


      //otp
      const otp = new UserOtp();
      otp.email = dto.email;
      otp.otp = emiailverificationcode;
      otp.role = customer.role;
      const twominuteslater = new Date();
      await twominuteslater.setMinutes(twominuteslater.getMinutes() + 10);
      otp.expiration_time = twominuteslater;
      await this.otprepo.save(otp);

      // mail
      await this.mailerservice.SendVerificationeMail(
        dto.email,
        dto.firstname,
        emiailverificationcode,
        twominuteslater,
      );

        // //sms verification
        // const text = `Hello ${customer.firstname}, your one time password (OTP) for verification is ${emiailverificationcode}. This OTP is valid for a single use and expires in the next 2 minutes. If you did not request this OTP from OSTRA LOGISTICS, please ignore this SMS`
        // const formatNumber = await this.generatorservice.formatPhoneNumber(customer.mobile)
        // await this.smsservice.sendSms(formatNumber,text)

      //save the notification
      const notification = new Notifications();
      notification.account = customer.firstname;
      notification.subject = 'New Customer Created!';
      notification.message = `new admin created successfully `;
      await this.notificationrepo.save(notification);

      return {
        message:
          'You have successfully registered as a customer, please check your email for the otp verification',
      };
    } catch (error) {
      if (error instanceof NotFoundException)
        throw new NotFoundException(error.message);
      else {
        console.log(error);
        throw new InternalServerErrorException(
          'something happen while trying to sign up',
          error.message,
        );
      }
    }
  }

  // verify email of customer
  async verifyEmail(
    dto: VerifyOtpDto,
  ): Promise<{ isValid: boolean; accessToken: any }> {
    //find the otp privided if it matches with the otp stored
    try {
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

      // Find the customer associated with the OTP
      const customer = await this.customerrepo.findOne({
        where: { email: findotp.email },
      });
      if (!customer)
        throw new NotFoundException('No customer found for the provided OTP.');

      // Verify and update the customer's status
      customer.isVerified = true;
      customer.isLoggedIn = true;
      await this.customerrepo.save(customer);

      const notification = new Notifications();
      (notification.account = customer.firstname),
        (notification.subject = 'Customer Verified!');
      notification.message = `Hello ${customer.firstname}, your email has been successfully verified `;
      await this.notificationrepo.save(notification);

      //await this.mailerservice.SendWelcomeEmail(admin.email,admin.brandname)

      await this.customerrepo.save(customer);

      //send welcome email
      await this.mailerservice.WelcomeMail(
        customer.email,
        customer.firstname,
       
      );

      const accessToken = await this.generatorservice.signToken(
        customer.id,
        customer.email,
        customer.role,
      );

      return { isValid: true, accessToken };
    } catch (error) {
      console.log(error);
      if (error instanceof NotFoundException)
        throw new NotFoundException(error.message);
      else if (error instanceof RequestTimeoutException)
        throw new RequestTimeoutException(error.message);
      else {
        console.log(error);
        throw new InternalServerErrorException(
          'an error occured while verifying the email of the customer, please try again',
          error.message,
        );
      }
    }
  }

  // resend email verification otp when the one sent is expired
  async ResendExpiredOtp(email: string | any): Promise<{ message: string }> {
    try {
      const emailexsist = await this.customerrepo.findOne({
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
        await this.generatorservice.generateEmailToken(); // Your OTP generated tokens

      // Save the token with expiration time
      const twominuteslater = new Date();
      await twominuteslater.setMinutes(twominuteslater.getMinutes() + 10);

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
      notification.account = emailexsist.firstname;
      notification.subject = 'Otp Resent!';
      notification.message = `Hello ${emailexsist.firstname}, a new verification Link has been resent to your mail `;
      await this.notificationrepo.save(notification);

      //send mail
      await this.mailerservice.SendVerificationeMail(
        newOtp.email,
        emailexsist.firstname,
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

  //request for an otp to verify the user before resetting the password
  async sendPasswordResetToken(
    dto: SendPasswordResetLinkDto,
  ): Promise<{ message: string }> {
    try {
      const isEmailReistered = await this.customerrepo.findOne({
        where: { email: dto.email },
      });
      if (!isEmailReistered)
        throw new NotFoundException(
          `this email ${dto.email} does not exist in our system, please try another email address`,
        );

      const resetlink = await this.generatorservice.generateEmailToken();
      const expirationTime = new Date();
      expirationTime.setHours(expirationTime.getHours() + 1);

      //send reset link to the email provided
      await this.mailerservice.SendPasswordResetLinkMail(
        dto.email,
        resetlink,
        isEmailReistered.firstname,
      );

      //save the reset link and the expiration time to the database
      isEmailReistered.password_reset_link = resetlink;
      isEmailReistered.reset_link_exptime = expirationTime;
      await this.customerrepo.save(isEmailReistered);

      const notification = new Notifications();
      (notification.account = isEmailReistered.firstname),
        (notification.subject = 'password Reset link!');
      notification.message = `Hello ${isEmailReistered.firstname}, password resent link sent `;
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
      const verifyuser = await this.customerrepo.findOne({
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
      (notification.account = verifyuser.firstname),
        (notification.subject = 'Verify Password Reset Token!');
      notification.message = `Hello ${verifyuser.firstname}, password reset link verified and the password has been recently reseted `;
      await this.customerrepo.save(verifyuser);

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
          error.message,
        );
      }
    }
  }

  //reset password
  async FinallyResetPasswordAfterVerification(
    customerID: string | any,
    dto: addPasswordDto,
  ): Promise<{ message: string }> {
    try {
      const checkcustomer = await this.customerrepo.findOne({
        where: { id: customerID },
      });
      if (!checkcustomer.isVerified)
        throw new UnauthorizedException(
          'sorry this customer has not been verified yet, please request for an otp to verify your account',
        );

      const hashedpassword = await this.generatorservice.hashpassword(
        dto.password,
      );

      //add the password
      checkcustomer.password = hashedpassword;

      await this.customerrepo.save(checkcustomer);

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
      const findcustomer = await this.customerrepo.findOne({
        where: { email: logindto.email },
      });
      if (!findcustomer) {
        throw new NotFoundException('Invalid credentials');
      }

      const comparepass = await this.generatorservice.comaprePassword(
        logindto.password,
        findcustomer.password,
      );
      if (!comparepass) {
        throw new NotFoundException('Invalid credentials');
      }

      if (!findcustomer.isVerified) {
        throw new ForbiddenException(
          'Your account has not been verified. Please verify your account by requesting a verification code.',
        );
      }
    

      findcustomer.isLoggedIn = true;
      findcustomer.isLocked = false;
      await this.customerrepo.save(findcustomer);

      // Save the notification
      const notification = new Notifications();
      notification.account = findcustomer.firstname;
      notification.subject = 'Customer just logged in!';
      notification.message = `Hello ${findcustomer.firstname}, just logged in `;
      await this.notificationrepo.save(notification);

      // Generate and return JWT token
      return await this.generatorservice.signToken(
        findcustomer.id,
        findcustomer.email,
        findcustomer.role,
      );
    } catch (error) {
      console.log(error);
      if (
        error instanceof NotFoundException ||
        error instanceof UnauthorizedException ||
        error instanceof ForbiddenException
      ) {
        throw error; // Re-throw specific exceptions
      } else {
        throw new InternalServerErrorException(
          'Something went wrong when trying to login, please try again.',
          error.message,
        );
      }
    }
  }
}
