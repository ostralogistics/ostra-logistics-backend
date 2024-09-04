import { Module } from '@nestjs/common';
import { FcmService } from './fcm-node.service';
import { FirebaseAdminProvider, PushNotificationsService } from './firebase-admin.provider';


@Module({
  providers: [FcmService,PushNotificationsService,FirebaseAdminProvider],
  exports: [FcmService],
})
export class FcmModule {}
