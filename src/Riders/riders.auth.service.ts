import {
  ConflictException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { RiderEntity } from 'src/Entity/riders.entity';
import { RidersRepository } from './riders.repository';
import {
  NotificationRepository,
  OtpRepository,
  RequestRepository,
} from 'src/common/common.repositories';
import { UserOtp } from 'src/Entity/otp.entity';
import { Notifications } from 'src/Entity/notifications.entity';
import { IRider } from './riders';
import { ConfigService } from '@nestjs/config';
import { GetDeviceTokenDto, Logindto } from 'src/common/common.dto';
import { NotificationType, RequestType } from 'src/Enums/all-enums';
import { RequestResetPasswordDto } from './riders.dto';
import { customAlphabet } from 'nanoid';
import { Mailer } from 'src/common/mailer/mailer.service';
import { RequestEntity } from 'src/Entity/requests.entity';
import { GeneatorService } from 'src/common/services/generator.service';
//import { PushNotificationsService } from 'src/pushnotification.service';

@Injectable()
export class RiderAuthService {
  constructor(
    private jwt: JwtService,
    private configservice: ConfigService,
    private genratorservice: GeneatorService,
    @InjectRepository(RiderEntity) private readonly riderrepo: RidersRepository,
    @InjectRepository(UserOtp) private readonly otprepo: OtpRepository,
    @InjectRepository(RequestEntity)
    private readonly requestrepo: RequestRepository,
    @InjectRepository(Notifications)
    private readonly notificationripo: NotificationRepository,
    //private readonly fcmService: PushNotificationsService,
    private mailer: Mailer,
  ) {}

  // get rider profile
  async getProfile(rider: RiderEntity): Promise<IRider> {
    try {
      if (!rider) {
        throw new NotFoundException('Rider not found');
      }

      return rider;
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(
        'something went wrong while trying to fetch rider profile',
        error.message,
      );
    }
  }

  async deviceToken(
    rider: RiderEntity,
    dto: GetDeviceTokenDto,
  ): Promise<IRider> {
    try {
      if (!rider) {
        throw new NotFoundException('Rider not found');
      }

      // Handle device tokens
      rider.deviceToken = dto.deviceToken;

      // Save the updated rider entity
      await this.riderrepo.save(rider);

      return rider;
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(
        'something went wrong',
        error.message,
      );
    }
  }

  //login rider

  async login(logindto: Logindto) {
    try {
      const findrider = await this.riderrepo.findOne({
        where: { email: logindto.email },
      });
      if (!findrider) throw new NotFoundException('invalid login credentials');
      const comparepass = await this.genratorservice.comaprePassword(
        logindto.password,
        findrider.password,
      );
      if (!comparepass)
        throw new NotFoundException(`invalid login credentials`);

      if (!findrider.isVerified) {
        throw new ForbiddenException(
          `Your account has not been verified. Please verify your account by sending a request to the admin.`,
        );
      }

      //If the password matches

      findrider.isLoggedIn = true;
      await this.riderrepo.save(findrider);

      //save the notification
      const notification = new Notifications();
      notification.account = findrider.id;
      notification.subject = ' login!';
      notification.message = `Hello ${findrider.firstname}, just logged in `;
      await this.notificationripo.save(notification);

      //   // Push notification
      //   const push = await this.fcmService.sendNotification(
      //     findrider.deviceToken,
      //     'Rider Successfully Logged In!',
      //     `hello ${findrider.firstname} you have successfully logged in. Thank you.`,
          
      //     {
         
      //   }
      // )


      return await this.genratorservice.signToken(
        findrider.id,
        findrider.email,
        findrider.role,
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      } else if (error instanceof ForbiddenException) {
        throw new ForbiddenException(error.message);
      } else {
        console.log(error);
        throw new InternalServerErrorException(
          'something went wrong while trying to Login, please try again later',
          error.message,
        );
      }
    }
  }

  //request for passsword change
  async RequestResetPassword(
    dto: RequestResetPasswordDto,
  ): Promise<{ message: string }> {
    try {
      //checkemail
      const rideremial = await this.riderrepo.findOne({
        where: { email: dto.email },
      });

      if (!rideremial)
        throw new NotFoundException(
          'this email does not belong to any rider on ostra logistics ',
        );

      // create a new request
      const request = new RequestEntity();
      (request.Rider = rideremial),
        (request.requestType = RequestType.PASSWORD_RESET);
      request.requestedAt = new Date();
      request.body =
        "Please kindly reset my password, I couldn't get access into my ostralogistics Rider Account, Thanks.";
      await this.requestrepo.save(request);

      //save notification
      const notification = new Notifications();
      notification.account = rideremial.id;
      notification.subject = 'Rider Requested for password change!';
      notification.message = `Rider with the  id ${rideremial.id} has requested for a pssword reset `;
      await this.notificationripo.save(notification);

      return {
        message:
          'Your request has been sent, the Admin will review and respond in due time, apologies for your inability to gain access into your account.',
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      } else {
        console.log(error);
        throw new InternalServerErrorException(
          'something went wrong when trying to request for reset password, please try again later',
          error.message,
        );
      }
    }
  }
}
