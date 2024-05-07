import { Injectable, Req, Res } from '@nestjs/common';
import * as crypto from 'crypto';
import { Request, Response } from 'express';
// Import your OrderEntity here
import { OrderRepository } from 'src/order/order.reposiroty';
import { InjectRepository } from '@nestjs/typeorm';
import { OrderEntity } from 'src/Entity/orders.entity';
import { PaymentStatus, TransactionType } from 'src/Enums/all-enums';
import * as nanoid from 'nanoid';
import { Mailer } from 'src/common/mailer/mailer.service';
import { TransactionEntity } from 'src/Entity/transactions.entity';
import { TransactionRespository } from 'src/common/common.repositories';
import { GeneatorService } from 'src/common/services/generator.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PaystackWebhookService {
  constructor(
    @InjectRepository(OrderEntity) private readonly orderRepo: OrderRepository,
    @InjectRepository(TransactionEntity) private readonly transactionRepo: TransactionRespository,
    private genservice:GeneatorService,
    private mailer: Mailer,
    private configservice:ConfigService
  ) {}

  

  handleWebhook(req: Request, res: Response): void {
    try {
      // Validate event
      const hash = crypto
        .createHmac(
          'sha512',
          this.configservice.get('PAYSTACK_TEST_SECRET')
          //'sk_test_c86ebe0afdc2c1f27920173207a28287c956b1eb',
        )
        .update(JSON.stringify(req.body))
        .digest('hex');

      if (hash === req.headers['x-paystack-signature']) {
        // Retrieve the request's body
        const event = req.body;
        if (event.event === 'charge.success') {
          this.handleChargeSuccessEvent(event.data.reference);
        } else {
          console.log('Unsupported Paystack webhook event', event.event);
        }
        // Do something with event
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

  private async handleChargeSuccessEvent(event:any) {
    try {

      const orderReference = event.data.reference;
      const order = await this.orderRepo.findOne({
        where: { id: orderReference },
        relations: ['customer', 'rider', 'assigned_task'],
      });

      if (order) {
        order.payment_status = PaymentStatus.SUCCESSFUL;
        const trackingToken = `osl-${this.genservice.generateTrackingID()}`;
        const dropoffCode = this.genservice.generateDropOffCode();
        order.trackingID = trackingToken;
        order.dropoffCode = dropoffCode;
        await this.orderRepo.save(order);

        //update the transaction tble 
        const transaction  = new TransactionEntity()
        transaction.transactedAT = new Date()
        transaction.amount = order.accepted_cost_of_delivery
        transaction.transactionID = `#osl-${this.genservice.generateTransactionCode()}`
        transaction.transactionType = TransactionType.ORDER_PAYMENT
        transaction.customer = order.customer
        transaction.paymentMethod = event.data.channel
        transaction.cardType = event.data.authorization.card_type; 
        transaction.paymentStatus = event.data.status;

        await this.transactionRepo.save(transaction)



        console.log(
          'Order payment status updated successfully:',
          orderReference,
          'trackingID:',
          order.trackingID,
          'dropoffCode:',
          order.dropoffCode,
        );

        //send mail to customer
        await this.mailer.OrderAcceptedMail(
          order.customer.email,
          order.customer.firstname,
          order.trackingID,
          order.dropoffCode,
        );

        // Return the tracking ID and dropoff code in the response
        return {
          trackingID: order.trackingID,
          dropoffCode: order.dropoffCode,
          transaction: transaction
        };
      } else {
        console.error('Order not found for reference:', orderReference);
      }
    } catch (error) {
      console.error('Error handling charge success event:', error);
    }
  }
}
