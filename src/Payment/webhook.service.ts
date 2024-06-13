import { Injectable, NotFoundException, Req, Res } from '@nestjs/common';
import * as crypto from 'crypto';
import { Request, Response } from 'express';
// Import your OrderEntity here
import { OrderRepository } from 'src/order/order.reposiroty';
import { InjectRepository } from '@nestjs/typeorm';
import { OrderEntity } from 'src/Entity/orders.entity';
import { OrderDisplayStatus, PaymentStatus, TransactionType } from 'src/Enums/all-enums';
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
      const hash = crypto
        .createHmac(
          'sha512',
          this.configservice.get('PAYSTACK_TEST_SECRET'),
        )
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

  private async handleChargeSuccessEvent(orderReference: number, eventData: any) {
    try {
      const order = await this.findOrder(orderReference);

      if (!order) {
        console.error('Order not found for reference:', orderReference);
        return;
      }

      await this.updateOrderPaymentStatus(order);

      await this.sendOrderAcceptedEmail(order);

      await this.createTransaction(order, eventData);

      const receipt = await this.createReceipt(order);

      return {
        trackingID: order.trackingID,
        dropoffCode: order.dropoffCode,
        receipt: receipt,
      };
    } catch (error) {
      console.error('Error handling charge success event:', error);
    }
  }

  private async findOrder(orderReference: number): Promise<OrderEntity | null> {
    return await this.orderRepo.findOne({ where: { id: orderReference }, relations: ['customer','admin'] });
  }

  private async updateOrderPaymentStatus(order: OrderEntity): Promise<void> {
    order.payment_status = PaymentStatus.SUCCESSFUL;
    order.paymentVerifiedAT = new Date()
    order.order_display_status = OrderDisplayStatus.PENDING
    await this.orderRepo.save(order);
  }

  private async sendOrderAcceptedEmail(order: OrderEntity): Promise<void> {
    const orderItem = order.items.find(item => item.email !== undefined);

    if (!orderItem) {
      throw new NotFoundException('No email associated with this order');
    }

      // Determine if the user is logged in or a guest
  const email = order.customer?.email ?? orderItem.email;
  const name = order.customer?.firstname ?? orderItem.name;

    await this.mailer.OrderAcceptedMail(
       email,
       name,
      order.trackingID,
      order.dropoffCode,
    );
  }

  private async createTransaction(order: OrderEntity, eventData: any): Promise<void> {
    const transaction = new TransactionEntity();
    transaction.transactedAT = new Date();
    transaction.amount = order.accepted_cost_of_delivery;
    transaction.transactionID = `#osl-${this.genservice.generateTransactionCode()}`;
    transaction.transactionType = TransactionType.ORDER_PAYMENT;
    transaction.customer = order.customer;
    transaction.paymentMethod = eventData.channel;
    transaction.paymentStatus = eventData.status;
    await this.transactionRepo.save(transaction);
  }

  private async createReceipt(order: OrderEntity): Promise<ReceiptEntity> {
    const vatPercentage = 0.07;
    const vatAmount = +(order.accepted_cost_of_delivery * vatPercentage).toFixed(2);

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

    return receipt;
  }
}
