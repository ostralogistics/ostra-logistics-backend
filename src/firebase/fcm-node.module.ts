import { Module } from '@nestjs/common';
import { FcmService } from './fcm-node.service';


@Module({
  providers: [FcmService],
  exports: [FcmService],
})
export class FcmModule {}
