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
import {
  ReceiptRespository,
  TransactionRespository,
} from 'src/common/common.repositories';
import { GeneatorService } from 'src/common/services/generator.service';
import { ConfigService } from '@nestjs/config';
import JsBarcode from 'jsbarcode';
import { ReceiptEntity } from 'src/Entity/receipt.entity';

@Injectable()
export class PaystackWebhookService {
  constructor(
    @InjectRepository(OrderEntity) private readonly orderRepo: OrderRepository,
    @InjectRepository(TransactionEntity)
    private readonly transactionRepo: TransactionRespository,
    @InjectRepository(ReceiptEntity)
    private readonly receiptrepo: ReceiptRespository,

    private genservice: GeneatorService,
    private mailer: Mailer,
    private configservice: ConfigService,
  ) {}

  handleWebhook(req: Request, res: Response): void {
    try {
      // Validate event
      const hash = crypto
        .createHmac(
          'sha512',
          this.configservice.get('PAYSTACK_TEST_SECRET'),
          //'sk_test_c86ebe0afdc2c1f27920173207a28287c956b1eb',
        )
        .update(JSON.stringify(req.body))
        .digest('hex');

      if (hash === req.headers['x-paystack-signature']) {
        // Retrieve the request's body
        const event = req.body;
        if (event.event === 'charge.success') {
          this.handleChargeSuccessEvent(event.data.reference,event.event);
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

  private async handleChargeSuccessEvent(orderReference: number, eventData: any) {
    try {
      const order = await this.orderRepo.findOne({ where: { id: orderReference }, relations: ['customer'] });
  
      if (order) {
        order.payment_status = PaymentStatus.SUCCESSFUL;
        const trackingToken = `osl-${this.genservice.generateTrackingID()}`;
        const dropoffCode = this.genservice.generateDropOffCode();
        order.trackingID = trackingToken;
        order.dropoffCode = dropoffCode;
        await this.orderRepo.save(order);

        await this.mailer.OrderAcceptedMail(
          order.customer.email,
          order.customer.firstname,
          order.trackingID,
          order.dropoffCode,
        );
  
        const transaction = new TransactionEntity();
        transaction.transactedAT = new Date();
        transaction.amount = order.accepted_cost_of_delivery;
        transaction.transactionID = `#osl-${this.genservice.generateTransactionCode()}`;
        transaction.transactionType = TransactionType.ORDER_PAYMENT;
        transaction.customer = order.customer;
        transaction.paymentMethod = eventData.channel; // Extract payment method from Paystack response
        //transaction.cardType = eventData.authorization.card_type; // Extract card type from Paystack response
        transaction.paymentStatus = eventData.status; // Extract payment status from Paystack response
        await this.transactionRepo.save(transaction);
  
        const vatPercentage = 0.07;
        const vatAmount = +(
          order.accepted_cost_of_delivery * vatPercentage
        ).toFixed(2);

        let discountAmount = 0;
        if (order.discount && order.IsDiscountApplied) {
          const discountPercentage = order.discount;
          discountAmount = +((order.accepted_cost_of_delivery * discountPercentage) / 100).toFixed(2);
        }
        const totalBeforeVAT = order.accepted_cost_of_delivery - discountAmount;
        const total = Number(totalBeforeVAT) + Number(vatAmount);
  
        const receipt = new ReceiptEntity();
        receipt.ReceiptID = `#${this.genservice.generatereceiptID()}`;
        receipt.dueAt = new Date();
        receipt.issuedAt = new Date();
        receipt.order = order;
        receipt.subtotal = totalBeforeVAT;
        receipt.VAT = vatAmount;
        receipt.total = total;
        receipt.discount = discountAmount;
        await this.receiptrepo.save(receipt);
  
        return {
          trackingID: order.trackingID,
          dropoffCode: order.dropoffCode,
          receipt: receipt,
        };
      } else {
        console.error('Order not found for reference:', orderReference);
      }
    } catch (error) {
      console.error('Error handling charge success event:', error);
    }
  }
  

}



// private async handleChargeSuccessEvent(orderReference: number) {
//   try {
//     const order = await this.orderRepo.findOne({ where: { id: orderReference } });

//     if (order) {
//       order.payment_status = PaymentStatus.SUCCESSFUL;
//       const trackingToken = `osl-${this.generateTrackingID()}`;
//       const dropoffCode = this.generateDropOffCode();
//       order.trackingID = trackingToken;
//       order.dropoffCode = dropoffCode;
//       await this.orderRepo.save(order);

//       console.log('Order payment status updated successfully:', orderReference, 'trackingID:', order.trackingID, 'dropoffCode:', order.dropoffCode);
      
//       // Return the tracking ID and dropoff code in the response
//       return {
//         trackingID: order.trackingID,
//         dropoffCode: order.dropoffCode,
//       };
//     } else {
//       console.error('Order not found for reference:', orderReference);
//     }
//   } catch (error) {
//     console.error('Error handling charge success event:', error);
//   }
// }
