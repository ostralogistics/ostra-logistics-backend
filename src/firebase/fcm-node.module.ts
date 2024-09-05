import { Module } from '@nestjs/common';
import { FcmService } from './fcm-node.service';
import { PushNotificationsService } from 'src/pushnotification.service';



@Module({
  providers: [FcmService,PushNotificationsService],
  exports: [FcmService,PushNotificationsService],
})
export class FcmModule {}
