import { Module } from '@nestjs/common';
import { PaystackWebhookService } from './webhook.service';
import { WebhookController } from './webhook.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderEntity } from 'src/Entity/orders.entity';
import { Mailer } from 'src/common/mailer/mailer.service';
import { TransactionEntity } from 'src/Entity/transactions.entity';
import { GeneatorService } from 'src/common/services/generator.service';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { ReceiptEntity } from 'src/Entity/receipt.entity';
import { PaymentMappingEntity } from 'src/Entity/refrencemapping.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([OrderEntity, TransactionEntity, ReceiptEntity,PaymentMappingEntity]),
  ],
  providers: [PaystackWebhookService, Mailer, GeneatorService, JwtService],
  controllers: [WebhookController],
})
export class WebHookModule {}
