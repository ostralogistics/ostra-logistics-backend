import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notifications } from 'src/Entity/notifications.entity';
import { RiderBankDetailsEntity, RiderEntity } from 'src/Entity/riders.entity';
import { RiderAuthController } from './riders.auth.controller';
import { RiderAuthService } from './riders.auth.service';
import { UserOtp } from 'src/Entity/otp.entity';
import { CustomerAuthService } from 'src/customer/customer.auth.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { CustomerEntity } from 'src/Entity/customers.entity';
import { Mailer } from 'src/common/mailer/mailer.service';
import { TaskEntity } from 'src/Entity/ridersTasks.entity';
import { RiderService } from './riders.service';
import { RiderController } from './riders.controller';
import { OrderEntity } from 'src/Entity/orders.entity';
import { RequestEntity } from 'src/Entity/requests.entity';
import { CustomerService } from 'src/customer/customer.service';
import { GeneatorService } from 'src/common/services/generator.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      RiderEntity,
      Notifications,
      UserOtp,
      CustomerEntity,
      TaskEntity,
      OrderEntity,
      RequestEntity,
      RiderBankDetailsEntity
    ]),
  ],
  providers: [
    RiderAuthService,
    CustomerAuthService,
    JwtService,
    ConfigService,
    Mailer,
    RiderService,
    GeneatorService
  ],
  controllers: [RiderAuthController, RiderController],
})
export class RiderModule {}
