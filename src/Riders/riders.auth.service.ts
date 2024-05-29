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
import { Logindto } from 'src/common/common.dto';
import { NotificationType, RequestType } from 'src/Enums/all-enums';
import { RequestResetPasswordDto } from './riders.dto';
import { customAlphabet } from 'nanoid';
import { Mailer } from 'src/common/mailer/mailer.service';
import { RequestEntity } from 'src/Entity/requests.entity';
import { GeneatorService } from 'src/common/services/generator.service';

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

  //login rider

  async login(logindto: Logindto) {
    try {
      const findrider = await this.riderrepo.findOne({
        where: { email: logindto.email },
      });
      if (!findrider) throw new NotFoundException('invalid login credential');
      const comparepass = await this.genratorservice.comaprePassword(
        logindto.password,
        findrider.password,
      );
      if (!comparepass) {
        findrider.loginCount += 1;

        if (findrider.loginCount >= 5) {
          findrider.isLocked = true;
          findrider.locked_until = new Date(Date.now() + 24 * 60 * 60 * 1000); //lock for 24 hours
          await this.riderrepo.save(findrider);
        }

        //  If the customer hasn't reached the maximum login attempts, calculate the number of attempts left
        const attemptsleft = 5 - findrider.loginCount;
        await this.riderrepo.save(findrider);

        throw new NotFoundException(
          `invalid credentials ${attemptsleft} attempts left before your account is locked.`,
        );
      }

      if (!findrider.isVerified) {
        // If the account is not verified, throw an exception
        throw new ForbiddenException(
          `Your account has not been verified. Please verify your account by sending a request to the admin.`,
        );
      }

      //If the password matches, reset the login_count and unlock the account if needed
      findrider.loginCount = 0;
      findrider.isLoggedIn = true;
      await this.riderrepo.save(findrider);

      //save the notification
      const notification = new Notifications();
      notification.account = findrider.firstname;
      notification.subject = ' login!';
      notification.message = `Hello ${findrider.firstname}, just logged in `;
      await this.notificationripo.save(notification);

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
