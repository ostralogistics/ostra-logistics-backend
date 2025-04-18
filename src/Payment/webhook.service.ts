import { Injectable, NotFoundException, Req, Res } from '@nestjs/common';
import * as crypto from 'crypto';
import { Request, Response } from 'express';
// Import your OrderEntity here
import { OrderRepository } from 'src/order/order.reposiroty';
import { InjectRepository } from '@nestjs/typeorm';
import { OrderEntity } from 'src/Entity/orders.entity';
import {
  OrderDisplayStatus,
  PaymentStatus,
  TransactionType,
} from 'src/Enums/all-enums';
import * as nanoid from 'nanoid';
import { Mailer } from 'src/common/mailer/mailer.service';
import { TransactionEntity } from 'src/Entity/transactions.entity';
import {
  ExpressDeliveryFeeRespository,
  ReceiptRespository,
  TransactionRespository,
  paymentmappingRespository,
} from 'src/common/common.repositories';
import { GeneatorService } from 'src/common/services/generator.service';
import { ConfigService } from '@nestjs/config';
import JsBarcode from 'jsbarcode';
import { ReceiptEntity } from 'src/Entity/receipt.entity';
import { PaymentMappingEntity } from 'src/Entity/refrencemapping.entity';
import { ExpressDeliveryFeeEntity } from 'src/Entity/discount.entity';

@Injectable()
export class PaystackWebhookService {
  constructor(
    @InjectRepository(OrderEntity) private readonly orderRepo: OrderRepository,
    @InjectRepository(TransactionEntity)
    private readonly transactionRepo: TransactionRespository,
    @InjectRepository(ReceiptEntity)
    private readonly receiptrepo: ReceiptRespository,
    @InjectRepository(PaymentMappingEntity)
    private readonly paymentMappingRepo: paymentmappingRespository,
    @InjectRepository(ExpressDeliveryFeeEntity)
    private readonly expressDeliveryFeeRepo: ExpressDeliveryFeeRespository,
    private genservice: GeneatorService,
    private mailer: Mailer,
    private configservice: ConfigService,
  ) {}

  handleWebhook(req: Request, res: Response): void {
    try {
      const hash = crypto
        .createHmac('sha512', this.configservice.get('PAYSTACK_TEST_SECRET'))
        .update(JSON.stringify(req.body))
        .digest('hex');

      if (hash === req.headers['x-paystack-signature']) {
        const event = req.body;
        if (event.event === 'charge.success') {
          this.handleChargeSuccessEvent(event.data.reference, event.event);
        } else {
          console.log('Unsupported Paystack webhook event', event.event);
        }
        console.log('Paystack webhook event:', event);
      } else {
        console.error('Invalid Paystack webhook signature');
      }
    } catch (error) {
      console.error('Error handling Paystack webhook:', error);
    } finally {
      res.sendStatus(200);
    }
  }

  private async handleChargeSuccessEvent(
    paymentReference: string,
    eventData: any,
  ) {
    try {
      // Find the orderID from the payment mapping
      const paymentMapping = await this.paymentMappingRepo.findOne({
        where: { reference: paymentReference },
      });
  
      if (!paymentMapping) {
        console.error('Payment mapping not found for reference:', paymentReference);
        return;
      }
  
      const orderID = paymentMapping.orderID;
      const order = await this.findOrder(orderID);
  
      if (!order) {
        console.error('Order not found for order ID:', orderID);
        return;
      }
  
      await this.updateOrderPaymentStatus(order);
  
      // Send email
      let email: string | undefined;
      let name: string | undefined;
  
      if (order.customer) {
        email = order.customer.email;
        name = order.customer.firstname;
      }
  
      if (!email) {
        email = order.items.map(item => item.email).find(email => email);
      }
  
      if (!name) {
        name = order.items.map(item => item.name).find(name => name);
      }
  
      if (!email) {
        console.error('No email found for order:', paymentReference);
      }
  
      await this.mailer.OrderAcceptedMail(
        email,
        name ?? 'Customer',
        order.trackingID,
        order.dropoffCode,
        order.orderID
      );
  
      return {
        trackingID: order.trackingID,
        dropoffCode: order.dropoffCode,
      };
    } catch (error) {
      console.error('Error handling charge success event:', error);
    }
  }
  private async findOrder(orderReference: string): Promise<OrderEntity | null> {
    return await this.orderRepo.findOne({
      where: { orderID: orderReference },
      relations: ['customer', 'admin', 'items'],
    });
  }

  private async updateOrderPaymentStatus(order: OrderEntity): Promise<void> {
    order.payment_status = PaymentStatus.SUCCESSFUL;
    order.paymentVerifiedAT = new Date();
    order.order_display_status = OrderDisplayStatus.PENDING;
    await this.orderRepo.save(order);
  }




}
