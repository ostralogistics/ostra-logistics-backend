import { Module } from '@nestjs/common';
import { EventsGateway,} from './gateways/websockets.gateway';
import { DistanceService } from './services/distance.service';
import { UploadService } from './helpers/upload.service';
import { Mailer } from './mailer/mailer.service';
import { GeoCodingService } from './services/goecoding.service';
import { GeneatorService } from './services/generator.service';
import { JwtService } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderEntity } from 'src/Entity/orders.entity';
import { CommonController } from './common.controller';
import { PublicService } from './services/public.service';
import { Notifications } from 'src/Entity/notifications.entity';
import { NewsLetterEntity } from 'src/Entity/newsletter.entity';
import { CloudinaryConfig } from './config/claudinary.config';
import { CloudinaryService } from './services/claudinary.service';
import { TaskEntity } from 'src/Entity/ridersTasks.entity';
//import { SmsSenderService } from './twilioSmsSender/sms';


@Module({
  imports: [
    TypeOrmModule.forFeature([OrderEntity, Notifications, NewsLetterEntity,TaskEntity]),
  ],
  providers: [
    EventsGateway,
    DistanceService,
    UploadService,
    Mailer,
    GeoCodingService,
    GeneatorService,
    JwtService,
    PublicService,
    CloudinaryConfig,
    CloudinaryService,
    //SmsSenderService
  ],
  controllers: [CommonController],
  exports: [
    DistanceService,
    UploadService,
    Mailer,
    GeoCodingService,
    GeneatorService,
    CloudinaryService,
    CloudinaryConfig,
    EventsGateway
    //SmsSenderService
  ],
})
export class CommonModule {}
