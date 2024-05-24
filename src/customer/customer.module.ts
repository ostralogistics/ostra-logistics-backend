import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomerEntity } from 'src/Entity/customers.entity';
import { CustomerAuthService } from './customer.auth.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserOtp } from 'src/Entity/otp.entity';
import { Notifications } from 'src/Entity/notifications.entity';
import { Mailer } from 'src/common/mailer/mailer.service';
import { CustomerAuthController } from './customer.auth.controller';
import { DistanceService } from 'src/common/services/distance.service';
import { GeoCodingService } from 'src/common/services/goecoding.service';
import { OrderEntity } from 'src/Entity/orders.entity';
import { CustomerController } from './customer.controller';
import { CustomerService } from './customer.service';
import { BidEntity } from 'src/Entity/bids.entity';
import { BidEventsService } from 'src/common/Events/bid.events.service';
import { CardEntity } from 'src/Entity/card.entity';
import { UploadService } from 'src/common/helpers/upload.service';
import { GeneatorService } from 'src/common/services/generator.service';
import { NewsLetterEntity } from 'src/Entity/newsletter.entity';
import { ComplaintEntity } from 'src/Entity/complaints.entity';
import { DiscountDto } from 'src/admin/admin.dto';
import { DiscountEntity } from 'src/Entity/discount.entity';
import { DiscountUsageEntity } from 'src/Entity/discountUsage.entity';
import { CloudinaryService } from 'src/common/services/claudinary.service';

@Module({
  imports: [    
    TypeOrmModule.forFeature([
      CustomerEntity,
      UserOtp,
      Notifications,
      OrderEntity,
      BidEntity,
      CardEntity,
      NewsLetterEntity,
      ComplaintEntity,
      DiscountEntity,
      DiscountUsageEntity,
    ]),
  ],
  providers: [
    CustomerAuthService,
    JwtService,
    ConfigService,
    Mailer,
    DistanceService,
    GeoCodingService,
    CustomerService,
    UploadService,
    BidEventsService,
    GeneatorService,
    CloudinaryService
  ],
  controllers: [CustomerAuthController, CustomerController],

})
export class CustomerModule {}
