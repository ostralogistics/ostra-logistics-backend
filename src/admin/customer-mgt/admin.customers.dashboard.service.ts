import { InjectRepository } from '@nestjs/typeorm';
import { AdminEntity } from 'src/Entity/admins.entity';
import {
  AdminRepository,
  DiscountRepository,
  VehicleRepository,
  VehicleTypeRepository,
} from '../admin.repository';
import { CustomerEntity } from 'src/Entity/customers.entity';
import { CustomerRepository } from 'src/customer/customer.repository';
import {
  BidRepository,
  DiscountUsageRepository,
  NotificationRepository,
  ReceiptRespository,
} from 'src/common/common.repositories';
import { BidEntity, IBids, IInitialBidsResponse } from 'src/Entity/bids.entity';
import { IOrder } from 'src/order/order';
import {
  CartItemRepository,
  OrderCartRepository,
  OrderItemRepository,
  OrderRepository,
} from 'src/order/order.reposiroty';
import {
  CartItemEntity,
  OrderCartEntity,
  OrderEntity,
  OrderItemEntity,
} from 'src/Entity/orders.entity';
import axios from 'axios';
import {
  BidEvent,
  BidStatus,
  BiddingAction,
  DeliveryVolume,
  OrderBasedOnDates,
  OrderDisplayStatus,
  OrderStatus,
  PaymentStatus,
} from 'src/Enums/all-enums';
import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotAcceptableException,
  NotFoundException,
} from '@nestjs/common';
import {
  AdminPlaceBidDto,
  ApplypromoCodeDto,
  InOfficeOrderDto,
  OrderDto,
  adminCheckOutDto,
  counterBidDto,
} from 'src/common/common.dto';
import { Between, ILike, In } from 'typeorm';
import { Notifications } from 'src/Entity/notifications.entity';
import * as JsBarcode from 'jsbarcode';
import { GeneatorService } from 'src/common/services/generator.service';
import { DistanceService } from 'src/common/services/distance.service';
import { GeoCodingService } from 'src/common/services/goecoding.service';
import { DiscountUsageEntity } from 'src/Entity/discountUsage.entity';
import { DiscountEntity } from 'src/Entity/discount.entity';
import { VehicleTypeEntity } from 'src/Entity/vehicleType.entity';
import { ReceiptEntity } from 'src/Entity/receipt.entity';
// import { FirebaseService } from 'src/firebase/firebase.service';
// import * as admin from 'firebase-admin';

@Injectable()
export class AdminCustomerDashBoardService {
  constructor(
    //@Inject('FIREBASE_ADMIN') private readonly firebaseAdmin: admin.app.App,
    @InjectRepository(AdminEntity) private readonly adminrepo: AdminRepository,
    @InjectRepository(CustomerEntity)
    private readonly customerRepo: CustomerRepository,
    @InjectRepository(OrderEntity) private readonly orderRepo: OrderRepository,
    @InjectRepository(BidEntity) private readonly bidRepo: BidRepository,
    @InjectRepository(Notifications)
    private readonly notificationripo: NotificationRepository,
    @InjectRepository(OrderCartEntity)
    private readonly orderCartRepo: OrderCartRepository,
    @InjectRepository(CartItemEntity)
    private readonly cartItemRepo: CartItemRepository,
    @InjectRepository(VehicleTypeEntity)
    private readonly vehicleRepo: VehicleTypeRepository,
    @InjectRepository(DiscountEntity)
    private readonly discountRepo: DiscountRepository,
    private genratorservice: GeneatorService,
    private distanceservice: DistanceService,
    private geocodingservice: GeoCodingService,
    @InjectRepository(ReceiptEntity)
    private readonly receiptrepo: ReceiptRespository,
    //private firebaseservice: FirebaseService,
  ) {}

  //make openning bid based on influenced matrix cost calculations
  async MakeOpenningBid(
    orderID: number,
    dto: AdminPlaceBidDto,
    admin: AdminEntity,
  ) {
    try {
      const order = await this.orderRepo.findOne({
        where: { id: orderID },
        relations: ['bid', 'customer', 'items', 'admin'],
      });
      if (!order)
        throw new NotFoundException(
          `order with the id: ${orderID} is not found`,
        );

      // new bid
      const bid = new BidEntity();
      bid.order = order;
      bid.bid_value = dto.bid;
      bid.initialBidPlacedAt = new Date();
      bid.bidStatus = BidStatus.BID_PLACED;
      bid.madeby = admin;
      await this.bidRepo.save(bid);

      order.processingOrderAT = new Date();
      await this.orderRepo.save(order);

      // Assume 'order' and 'bid' are already defined

      // // Construct the payload for the push notification
      // const payload: admin.messaging.MessagingPayload = {
      //   notification: {
      //     title: 'Opening Bid Sent!',
      //     body: `Starting bid for order ${order.orderID} made by ${order.customer.firstname} is ${bid.bid_value}. Please note that you can only counter this bid once. We believe our bid is very reasonable. Thank you.`,
      //   },
      // };

      // // Retrieve the most recent device token
      // const recentDeviceToken =
      //   order.customer.deviceToken[order.customer.deviceToken.length - 1];

      // if (recentDeviceToken) {
      //   // Send the push notification to the most recent device token
      //   await this.firebaseservice.sendNotification(
      //     [recentDeviceToken],
      //     payload,
      //   );
      // } else {
      //   console.log('No device token available for the customer.');
      // }

      //save the notification
      const notification = new Notifications();
      notification.account = order.customer.id;
      notification.subject = 'Openning Bid made !';
      notification.message = `starting bid for order ${order.orderID} made by ${order.customer} is ${bid.bid_value}. Please note that, you can only counter this bid once, we believe our bid is very reasonable. Thank you `;
      await this.notificationripo.save(notification);

      return bid;
    } catch (error) {
      if (error instanceof NotFoundException)
        throw new NotFoundException(error.message);
      else {
        console.log(error);
        throw new InternalServerErrorException(
          'something went wrong while making opening bid, please try again later',
          error.message,
        );
      }
    }
  }

  //counter bids sent in

  async counterCustomerCouterBid(
    bidID: number,
    dto: counterBidDto,
    admin: AdminEntity,
  ): Promise<IBids> {
    try {
      //check if order is related to the countered bid
      const bid = await this.bidRepo.findOne({
        where: { id: bidID },
        relations: ['order', 'order.items', 'madeby'],
      });
      if (!bid) throw new NotFoundException('this bis isnt found');

      //check if bid has been accepted first before countering
      if (bid && bid.bidStatus === BidStatus.ACCEPTED)
        throw new NotAcceptableException(
          'these bid has  been accepted by the customer so you cannot counter this bid',
        );

      //check if the bid has been countered first before sending in a counter bid
      if (bid && bid.bidStatus !== BidStatus.COUNTERED)
        throw new NotAcceptableException(
          'these bid has not been countered so you cannot counter this bid',
        );

      //finally counter the bid and set a new counter bid
      bid.counter_bid_offer = dto.counter_bid;
      bid.bidStatus = BidStatus.COUNTERED;
      bid.counteredAt = new Date();

      await this.bidRepo.save(bid);

      // // // Send push notification to the admin
      // const payload: admin.messaging.MessagingPayload = {
      //   notification: {
      //     title: 'Bid Countered!',
      //     body: `the bid for ${bid.order.orderID} has been countered with ${bid.counter_bid_offer}. This offer cannot be countered again, you can either decline or accept the bid. Thank You`,
      //   },
      // };

      // // Retrieve the most recent device token
      // const recentDeviceToken =
      //   bid.order.customer.deviceToken[bid.order.customer.deviceToken.length - 1];

      // if (recentDeviceToken) {
      //   // Send the push notification to the most recent device token
      //   await this.firebaseservice.sendNotification(
      //     [recentDeviceToken],
      //     payload,
      //   );
      // } else {
      //   console.log('No device token available for the customer.');
      // }

      //save the notification
      const notification = new Notifications();
      notification.account = bid.order.customer.id;
      notification.subject = 'Counter Bid made !';
      notification.message = `the bid for ${bid.order.orderID} has been countered with ${bid.counter_bid_offer}. This offer cannot be countered again, you can either decline or accept the bid. Thank You  `;
      await this.notificationripo.save(notification);

      return bid;
    } catch (error) {
      if (error instanceof NotFoundException)
        throw new NotFoundException(error.message);
      else if (error instanceof NotAcceptableException)
        throw new NotAcceptableException(error.message);
      else {
        console.log(error);
        throw new InternalServerErrorException(
          'something went wrong while countering bid, please try again later',
          error.message,
        );
      }
    }
  }

  //fetch all customers
  async GetAllCustomers(page: number = 1, limit: number = 30) {
    try {
      const skip = (page - 1) * limit;
      const customers = await this.customerRepo.findAndCount({
        relations: ['my_orders', 'my_cards', 'my_orders', 'my_orders.items'],
        skip: skip,
        take: limit,
      });
      if (customers[1] === 0)
        throw new NotFoundException('there are no customers found');

      return customers;
    } catch (error) {
      if (error instanceof NotFoundException)
        throw new NotFoundException(error.message);
      else {
        console.log(error);
        throw new InternalServerErrorException(
          'something went wrong while fetching all customers, please try again later',
          error.message,
        );
      }
    }
  }

  //one customer

  async GetOneCustomer(customerID: string) {
    try {
      const customers = await this.customerRepo.findOne({
        where: { id: customerID },
        relations: ['my_orders', 'my_cards', 'my_orders', 'my_orders.items'],
      });
      if (!customers)
        throw new NotFoundException(
          'the customer with the passed ID does not exist',
        );

      return customers;
    } catch (error) {
      if (error instanceof NotFoundException)
        throw new NotFoundException(error.message);
      else {
        console.log(error);
        throw new InternalServerErrorException(
          'something went wrong while fetching one customer, please try again later',
          error.message,
        );
      }
    }
  }

  async GetOrderReceipt(orderID: number) {
    try {
      const receipt = await this.receiptrepo.findOne({
        where: { order: { id: orderID } },
        relations: ['order', 'order.items'],
      });
      if (!receipt)
        throw new NotFoundException(
          'the order with the passed ID does not exist',
        );

      return receipt;
    } catch (error) {
      if (error instanceof NotFoundException)
        throw new NotFoundException(error.message);
      else {
        console.log(error);
        throw new InternalServerErrorException(
          'something went wrong while fetching receipt assocated with order, please try again later',
          error.message,
        );
      }
    }
  }

  //get orders that are delivered
  async GetOrdersThatAreInTransit(page: number = 1, limit: number = 30) {
    try {
      const skip = (page - 1) * limit;

      const orders = await this.orderRepo.findAndCount({
        where: {
          order_display_status: OrderDisplayStatus.IN_TRANSIT,
        },
        relations: ['bid', 'Rider', 'customer', 'items'], // Assuming relations are correctly defined
        order: { orderPlacedAt: 'DESC' },
        take: limit,
        skip: skip,
      });

      if (orders[1] === 0)
        throw new NotFoundException(
          'there are no  orders in transit at the moment',
        );

      return orders;
    } catch (error) {
      if (error instanceof NotFoundException)
        throw new NotFoundException(error.message);
      else {
        console.log(error);
        throw new InternalServerErrorException(
          'something went wrong while fetching all orders in transit, please try again later',
          error.message,
        );
      }
    }
  }

  async GetOrders(page: number = 1, limit: number = 30) {
    try {
      const skip = (page - 1) * limit;

      const orders = await this.orderRepo.findAndCount({
        relations: [
          'bid',
          'Rider',
          'customer',
          'items',
          'items.vehicleType',
          'admin',
        ], // Assuming relations are correctly defined
        order: { orderPlacedAt: 'DESC' },
        take: limit,
        skip: skip,
      });

      if (orders[1] === 0)
        throw new NotFoundException(
          'there are no  orders that are dropped-off at the moment',
        );

      return orders;
    } catch (error) {
      if (error instanceof NotFoundException)
        throw new NotFoundException(error.message);
      else {
        console.log(error);
        throw new InternalServerErrorException(
          'something went wrong while fetching dropped off orders, please try again later',
          error.message,
        );
      }
    }
  }

  async GetOneOrder(orderID: number) {
    try {
      const order = await this.orderRepo.findAndCount({
        where: { id: orderID },
        relations: [
          'bid',
          'Rider',
          'customer',
          'items',
          'items.vehicleType',
          'admin',
        ], // Assuming relations are correctly defined
      });

      if (!order) throw new NotFoundException('order not found');

      return order;
    } catch (error) {
      if (error instanceof NotFoundException)
        throw new NotFoundException(error.message);
      else {
        console.log(error);
        throw new InternalServerErrorException(
          'something went wrong while fetching dropped off orders, please try again later',
          error.message,
        );
      }
    }
  }

  async GetOrdersThatAreDelivered(page: number = 1, limit: number = 30) {
    try {
      const skip = (page - 1) * limit;

      const orders = await this.orderRepo.findAndCount({
        where: {
          order_display_status: OrderDisplayStatus.COMPLETED,
        },
        relations: [
          'bid',
          'Rider',
          'customer',
          'items',
          'items.vehicleType',
          'admin',
        ], // Assuming relations are correctly defined
        order: { orderPlacedAt: 'DESC' },
        take: limit,
        skip: skip,
      });

      if (orders[1] === 0)
        throw new NotFoundException(
          'there are no  orders that are dropped-off at the moment',
        );

      return orders;
    } catch (error) {
      if (error instanceof NotFoundException)
        throw new NotFoundException(error.message);
      else {
        console.log(error);
        throw new InternalServerErrorException(
          'something went wrong while fetching dropped off orders, please try again later',
          error.message,
        );
      }
    }
  }

  async GetOrdersThatArePending(page: number = 1, limit: number = 30) {
    try {
      const skip = (page - 1) * limit;

      const orders = await this.orderRepo.findAndCount({
        where: {
          order_display_status: OrderDisplayStatus.PENDING,
        },
        relations: [
          'bid',
          'Rider',
          'customer',
          'items',
          'items.vehicleType',
          'admin',
        ],
        order: { orderPlacedAt: 'DESC' },
        take: limit,
        skip: skip,
      });

      if (orders[1] === 0)
        throw new NotFoundException(
          'there are no picked up orders at the moment',
        );

      return orders;
    } catch (error) {
      if (error instanceof NotFoundException)
        throw new NotFoundException(error.message);
      else {
        console.log(error);
        throw new InternalServerErrorException(
          'something went wrong while fetching all picked up orders, please try again later',
          error.message,
        );
      }
    }
  }

  async GetOrdersThatAreDeclined(page: number = 1, limit: number = 30) {
    try {
      const skip = (page - 1) * limit;

      const orders = await this.orderRepo.findAndCount({
        where: {
          order_display_status: OrderDisplayStatus.DECLINED,
        },
        relations: [
          'bid',
          'Rider',
          'customer',
          'items',
          'items.vehicleType',
          'admin',
        ],
        order: { orderPlacedAt: 'DESC' },
        take: limit,
        skip: skip,
      });

      if (orders[1] === 0)
        throw new NotFoundException(
          'there are no picked up orders at the moment',
        );

      return orders;
    } catch (error) {
      if (error instanceof NotFoundException)
        throw new NotFoundException(error.message);
      else {
        console.log(error);
        throw new InternalServerErrorException(
          'something went wrong while fetching all picked up orders, please try again later',
          error.message,
        );
      }
    }
  }

  async GetOrdersThatAreJustPlaced(page: number = 1, limit: number = 30) {
    try {
      const skip = (page - 1) * limit;

      const orders = await this.orderRepo.findAndCount({
        where: {
          order_display_status: OrderDisplayStatus.ORDER_PLACED,
        },
        relations: [
          'bid',
          'Rider',
          'customer',
          'items',
          'items.vehicleType',
          'admin',
        ],
        order: { orderPlacedAt: 'DESC' },
        take: limit,
        skip: skip,
      });

      if (orders[1] === 0)
        throw new NotFoundException(
          'there are no picked up orders at the moment',
        );

      return orders;
    } catch (error) {
      if (error instanceof NotFoundException)
        throw new NotFoundException(error.message);
      else {
        console.log(error);
        throw new InternalServerErrorException(
          'something went wrong while fetching all picked up orders, please try again later',
          error.message,
        );
      }
    }
  }

  async GetOrdersBasedOnDates(
    page: number = 1,
    limit: number = 30,
    timeRange: OrderBasedOnDates = OrderBasedOnDates.TODAY,
    //timeRange: 'today' | 'lastWeek' | 'lastMonth' | 'lastYear' = 'today'
  ) {
    try {
      const skip = (page - 1) * limit;

      let startDate = new Date();
      let endDate = new Date();

      switch (timeRange) {
        case OrderBasedOnDates.LAST_WEEK:
          startDate.setDate(startDate.getDate() - 7);
          break;
        case OrderBasedOnDates.LAST_MONTH:
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        case OrderBasedOnDates.LAST_YEAR:
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
        default:
          // For 'today', no change needed to startDate and endDate
          break;
      }

      const orders = await this.orderRepo.findAndCount({
        where: {
          orderPlacedAt: Between(startDate, endDate),
        },
        relations: ['bid', 'Rider', 'customer', 'items', 'admin'], // Assuming relations are correctly defined
        order: { orderPlacedAt: 'DESC' },
        take: limit,
        skip: skip,
      });

      if (orders[1] === 0)
        throw new NotFoundException('There are no order record');

      return orders;
    } catch (error) {
      if (error instanceof NotFoundException)
        throw new NotFoundException(error.message);
      else {
        console.log(error);
        throw new InternalServerErrorException(
          'Something went wrong while fetching orders. Please try again later.',
          error.message,
        );
      }
    }
  }

  async GetDeliveryVolume(timeRange: DeliveryVolume = DeliveryVolume.DAY) {
    try {
      let startDate = new Date();
      let endDate = new Date();

      switch (timeRange) {
        case DeliveryVolume.WEEk:
          startDate.setDate(startDate.getDate() - 7);
          break;
        case DeliveryVolume.MONTH:
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        default:
          // For 'day', no change needed to startDate
          break;
      }

      // Set endDate to today's date for all cases
      endDate = new Date();

      const deliveryVolume = await this.orderRepo.count({
        where: {
          order_status: In([OrderStatus.DELIVERED]),
          DeliveredAT: Between(startDate, endDate),
        },
      });

      return deliveryVolume;
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(
        'something happened while fetching delivery volume.',
      );
    }
  }

  // admin track order (guarded)
  async TrackOrder(keyword: string | any): Promise<IOrder> {
    try {
      //find order
      const trackorder = await this.orderRepo.findOne({
        where: { trackingID: ILike(`%${keyword}`) },
        relations: ['customer', 'bid', 'Rider', 'items'],
        cache: false,
        comment:
          'tracking order with the trackingToken generated by the system',
      });
      if (!trackorder)
        throw new NotFoundException(
          `oops! this trackingID ${keyword} is not associated with any order in ostra logistics`,
        );

      return trackorder;
    } catch (error) {
      if (error instanceof NotFoundException)
        throw new NotFoundException(error.message);
      else {
        console.log(error);
        throw new InternalServerErrorException(
          'something went wrong while tracking order, please try again later',
          error.message,
        );
      }
    }
  }

  async createAirWaybill(barcodeDigit: string) {
    try {
      const checkbarcode = await this.orderRepo.findOne({
        where: { barcodeDigits: barcodeDigit },
        relations: ['customer', 'bid', 'items'],
      });
      if (!checkbarcode) throw new NotFoundException('trackingID not found');

      // Generate barcode as base64 image
      const barcode = await this.genratorservice.generateBarcode(barcodeDigit);

      return { order: checkbarcode, barcodeUrl: barcode };
    } catch (error) {
      if (error instanceof NotFoundException)
        throw new NotFoundException(error.message);
      else {
        console.log(error);
        throw new InternalServerErrorException(
          'an error occured while generating air waybill, please try again later',
          error.message,
        );
      }
    }
  }

  // get counts of orders

  //all active orders count
  async getAllActiveOrdersCount(): Promise<number> {
    const activeOrder = await this.orderRepo.count({
      where: { order_display_status: OrderDisplayStatus.IN_TRANSIT },
    });
    return activeOrder;
  }

  //counts of active order
  async getAllOrdersInTheOfficeCount(): Promise<number> {
    const activeOrder = await this.orderRepo.count({
      where: { order_status: OrderStatus.ARRIVES_AT_THE_OFFICE },
    });
    return activeOrder;
  }

  //counts of
  async getAllCompletedOrderCount(): Promise<number> {
    const activeOrder = await this.orderRepo.count({
      where: { order_status: OrderStatus.DELIVERED },
    });
    return activeOrder;
  }

  //counts of pending
  async getAllPendingOrderCount(): Promise<number> {
    const activeOrder = await this.orderRepo.count({
      where: { order_display_status: OrderDisplayStatus.PENDING },
    });
    return activeOrder;
  }

  //counts active based on week, month or year

  async getCompletedOrderCountBasedOnDate(
    timeRange: OrderBasedOnDates = OrderBasedOnDates.TODAY,
  ): Promise<number> {
    try {
      let startDate = new Date();
      let endDate = new Date();

      switch (timeRange) {
        case OrderBasedOnDates.LAST_WEEK:
          startDate.setDate(startDate.getDate() - 7);
          break;
        case OrderBasedOnDates.LAST_MONTH:
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        case OrderBasedOnDates.LAST_YEAR:
          startDate.setFullYear(startDate.getFullYear() - 1);
        default:
          // For 'today', no change needed to startDate
          break;
      }

      // Set endDate to today's date for all cases
      endDate = new Date();

      const completedOrderCount = await this.orderRepo.count({
        where: {
          order_status: OrderStatus.DELIVERED,
          DeliveredAT: Between(startDate, endDate),
        },
      });

      return completedOrderCount;
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(
        'Error occurred while fetching completed order count.',
        error.message,
      );
    }
  }

  async getPendingOrderCountBasedOnDate(
    timeRange: OrderBasedOnDates = OrderBasedOnDates.TODAY,
  ): Promise<number> {
    try {
      let startDate = new Date();
      let endDate = new Date();

      switch (timeRange) {
        case OrderBasedOnDates.LAST_WEEK:
          startDate.setDate(startDate.getDate() - 7);
          break;
        case OrderBasedOnDates.LAST_MONTH:
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        case OrderBasedOnDates.LAST_YEAR:
          startDate.setFullYear(startDate.getFullYear() - 1);
        default:
          // For 'today', no change needed to startDate
          break;
      }

      // Set endDate to today's date for all cases
      endDate = new Date();

      const completedOrderCount = await this.orderRepo.count({
        where: {
          order_display_status: OrderDisplayStatus.PENDING,
          orderPlacedAt: Between(startDate, endDate),
        },
      });

      return completedOrderCount;
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(
        'Error occurred while fetching pending  order count.',
        error.message,
      );
    }
  }

  async getActiveOrderCountBasedOnDate(
    timeRange: OrderBasedOnDates = OrderBasedOnDates.TODAY,
  ): Promise<number> {
    try {
      let startDate = new Date();
      let endDate = new Date();

      switch (timeRange) {
        case OrderBasedOnDates.LAST_WEEK:
          startDate.setDate(startDate.getDate() - 7);
          break;
        case OrderBasedOnDates.LAST_MONTH:
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        case OrderBasedOnDates.LAST_YEAR:
          startDate.setFullYear(startDate.getFullYear() - 1);
        default:
          // For 'today', no change needed to startDate
          break;
      }

      // Set endDate to today's date for all cases
      endDate = new Date();

      const completedOrderCount = await this.orderRepo.count({
        where: {
          order_display_status: OrderDisplayStatus.IN_TRANSIT,
          RiderRecieveParcelAT: Between(startDate, endDate),
        },
      });

      return completedOrderCount;
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(
        'Error occurred while fetching Active order count.',
        error.message,
      );
    }
  }

  async getofficeBrandingOrderCountBasedOnDate(
    timeRange: OrderBasedOnDates = OrderBasedOnDates.TODAY,
  ): Promise<number> {
    try {
      let startDate = new Date();
      let endDate = new Date();

      switch (timeRange) {
        case OrderBasedOnDates.LAST_WEEK:
          startDate.setDate(startDate.getDate() - 7);
          break;
        case OrderBasedOnDates.LAST_MONTH:
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        case OrderBasedOnDates.LAST_YEAR:
          startDate.setFullYear(startDate.getFullYear() - 1);
        default:
          // For 'today', no change needed to startDate
          break;
      }

      // Set endDate to today's date for all cases
      endDate = new Date();

      const completedOrderCount = await this.orderRepo.count({
        where: {
          order_status: OrderStatus.ARRIVES_AT_THE_OFFICE,
          ArrivesAtTheOfficeAT: Between(startDate, endDate),
        },
      });

      return completedOrderCount;
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(
        'Error occurred while fetching parcel in office for rebranding order count.',
        error.message,
      );
    }
  }

  //set the price of the order after manual inoffice negotiations with the customer, so there woont be a back and fort

  async setPriceForOrder(orderID: number, dto: AdminPlaceBidDto) {
    try {
      const order = await this.orderRepo.findOne({
        where: { id: orderID },
        relations: ['bid', 'customer'],
      });
      if (!order)
        throw new NotFoundException(
          `order with the id: ${orderID} is not found`,
        );

      // new aggreed set price bid
      const bid = new BidEntity();
      bid.order = order;
      bid.bid_value = dto.bid;
      bid.initialBidPlacedAt = new Date();
      bid.bidStatus = BidStatus.ACCEPTED;
      await this.bidRepo.save(bid);

      //update the order table
      order.bidStatus = BidStatus.ACCEPTED;
      order.accepted_cost_of_delivery = bid.bid_value;
      await this.orderRepo.save(order);

      //save the notification
      const notification = new Notifications();
      notification.account = 'admin';
      notification.subject = 'Order Price Set from the office!';
      notification.message = `the price for order wth orderID ${order.orderID} have being set and agreed on ostra logistics `;
      await this.notificationripo.save(notification);

      return bid;
    } catch (error) {
      if (error instanceof NotFoundException)
        throw new NotFoundException(error.message);
      else {
        console.log(error);
        throw new InternalServerErrorException(
          `something went wrong while setting the price for the order}`,
          error.message,
        );
      }
    }
  }

  // after bid is being finalized make payment

  async processPayment(orderID: number): Promise<PaymentResponse> {
    try {
      const order = await this.orderRepo.findOne({
        where: { id: orderID },
        relations: ['admin', 'bid', 'items'],
      });
      if (!order)
        throw new NotFoundException(
          `the order with the ID ${orderID} does not exist`,
        );
      const orderItem = order.items.find((item) => item.email !== undefined);

      if (!orderItem) {
        throw new NotFoundException('No email associated with this order');
      }

      const email = orderItem.email;

      // Check if order is ready for payment (bid accepted)
      if (order.bidStatus !== BidStatus.ACCEPTED) {
        throw new NotAcceptableException(
          'Order cannot be paid for. Bid is not yet accepted',
        );
      }

      //cslculate VAT
      const vatPercentage = 0.07;
      const vatAmount = +(
        order.accepted_cost_of_delivery * vatPercentage
      ).toFixed(2);
      console.log('vatamount', vatAmount);

      //check if discount is applied
      let totalamountpaid = order.accepted_cost_of_delivery;
      if (order.IsDiscountApplied && order.discount) {
        //calculate discounted amount
        const discooutAmount = +(
          (order.accepted_cost_of_delivery * order.discount) /
          100
        ).toFixed(2);
        totalamountpaid -= discooutAmount;
      }

      // Calculate total amount including VAT
      const totalAmountWithVAT = Number(totalamountpaid) + Number(vatAmount);
      // Paystack payment integration
      const response = await axios.post(
        'https://api.paystack.co/transaction/initialize',
        {
          amount: totalAmountWithVAT * 100, // Convert to kobo (Paystack currency)
          email: email, // Customer email for reference
          reference: order.orderID, // Order ID as payment reference
          currency: 'NGN',
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_TEST_SECRET}`,
            'Content-Type': 'application/json',
          },
        },
      );

      if (response.data.status === true) {
        console.log('payment successfully initiated');
      } else {
        throw new InternalServerErrorException(
          'Payment initialization failed. Please try again later',
        );
      }
      //save the notification
      const notification = new Notifications();
      notification.account = 'order';
      notification.subject = 'Payment Order initiated!';
      notification.message = `the customer have initiated payment `;
      await this.notificationripo.save(notification);

      return response.data;
    } catch (error) {
      console.log(error);
      let errorMessage = 'Payment processing failed. Please try again later';

      // Handle specific Paystack errors (optional)
      if (error.response && error.response.data) {
        errorMessage = error.response.data.message;
      }

      throw new InternalServerErrorException(errorMessage);
    }
  }

  //generate receipt and
  async createReceipt(OrderID: number): Promise<ReceiptEntity> {
    try {
      const order = await this.orderRepo.findOne({
        where: { id: OrderID, payment_status: PaymentStatus.SUCCESSFUL },
        relations: ['customer', 'admin', 'items'],
      });
      if (!order)
        throw new NotFoundException(
          'order payment status is not successful yet, so you cant generate a receipt',
        );
      const vatPercentage = 0.07;
      const vatAmount = +(
        order.accepted_cost_of_delivery * vatPercentage
      ).toFixed(2);

      let discountAmount = 0;
      if (order.discount && order.IsDiscountApplied) {
        const discountPercentage = order.discount;
        discountAmount = +(
          (order.accepted_cost_of_delivery * discountPercentage) /
          100
        ).toFixed(2);
      }

      const totalBeforeVAT = order.accepted_cost_of_delivery - discountAmount;
      const total = Number(totalBeforeVAT) + Number(vatAmount);

      const receipt = new ReceiptEntity();
      receipt.ReceiptID = `#${this.genratorservice.generatereceiptID()}`;
      //receipt.dueAt = new Date();
      receipt.issuedAt = new Date();
      receipt.order = order;
      receipt.subtotal = totalBeforeVAT;
      receipt.VAT = vatAmount;
      receipt.total = total;
      receipt.discount = discountAmount;
      await this.receiptrepo.save(receipt);

      return receipt;
    } catch (error) {
      if (error instanceof NotFoundException)
        throw new NotFoundException(error.message);
      else {
        console.log(error);
        throw new InternalServerErrorException(
          'something went wrong while generating a receipt for the order',
          error.message,
        );
      }
    }
  }

  //in office order creation sequence

  // add to cart
  async AdminaddToOrderCart(
    admin: AdminEntity,
    dto: InOfficeOrderDto,
  ): Promise<OrderCartEntity> {
    try {
      // Find the existing cart for the customer that is not checked out
      let cart = await this.orderCartRepo.findOne({
        where: { admin: { id: admin.id }, checkedOut: false },
        relations: ['items'],
      });

      // Debug: Log the found cart or if a new one will be created
      if (cart) {
        console.log('Existing cart found:', cart.id);
      } else {
        console.log('No existing cart found. Creating a new one.');
        cart = new OrderCartEntity();
        cart.items = [];
        cart.admin = admin;
        cart.createdAt = new Date();
        await this.orderCartRepo.save(cart);
      }
      if (cart.items.length >= 3) {
        throw new NotAcceptableException('The limit for multiple orders is 3');
      }

      const pickupCoordinates = await this.geocodingservice.getYahooCoordinates(
        dto.pickup_address,
      );
      const dropOffCoordinates =
        await this.geocodingservice.getYahooCoordinates(dto.dropOff_address);

      if (!pickupCoordinates || !dropOffCoordinates) {
        throw new NotAcceptableException('cordinates not found');
      }

      const distance = this.distanceservice.calculateDistance(
        pickupCoordinates,
        dropOffCoordinates,
      );
      const roundDistance = Math.round(distance);

      const item = new CartItemEntity();
      item.id = `${await this.genratorservice.generateUUID()}`;
      item.name = dto.name;
      item.address = dto.address;
      item.area = dto.area;
      item.landmark = dto.landmark;
      (item.home_apartment_number = dto.home_apartment_number),
        (item.email = dto.email);
      item.phoneNumber = dto.phoneNumber;
      item.parcel_name = dto.parcel_name;
      item.product_category = dto.product_category;
      item.quantity = dto.quantity;
      item.parcelWorth = dto.parcelWorth;
      item.weight_of_parcel = dto.weight_of_parcel;
      item.describe_weight_of_parcel = dto.describe_weight_of_parcel;
      item.note_for_rider = dto.note_for_rider;
      item.pickup_address = dto.pickup_address;
      item.pickup_phone_number = dto.pickup_phone_number;
      item.Area_of_pickup = dto.Area_of_pickup;
      item.landmark_of_pickup = dto.landmark_of_pickup;
      item.home_apartment_number;
      item.Recipient_name = dto.Recipient_name;
      item.Recipient_phone_number = dto.Recipient_phone_number;
      item.dropOff_address = dto.dropOff_address;
      item.Area_of_dropoff = dto.Area_of_dropoff;
      item.landmark_of_dropoff = dto.landmark_of_dropoff;
      item.house_apartment_number_of_dropoff =
        dto.house_apartment_number_of_dropoff;

      if (dto.vehicleTypeID) {
        const vehicle = await this.vehicleRepo.findOne({
          where: { id: dto.vehicleTypeID },
        });
        if (!vehicle) throw new NotFoundException('vehicle not found');
        item.vehicleType = vehicle;
      }

      item.delivery_type = dto.delivery_type;
      item.schedule_date = dto.schedule_date;
      item.pickupLat = pickupCoordinates.lat;
      item.pickupLong = pickupCoordinates.lon;
      item.dropOffLat = dropOffCoordinates.lat;
      item.dropOffLong = dropOffCoordinates.lon;
      item.distance = roundDistance;

      await this.cartItemRepo.save(item);

      cart.items.push(item);
      cart.updatedAt = new Date();
      await this.orderCartRepo.save(cart);

      // Convert cart entity to plain object to avoid circular reference issues
      return cart;
    } catch (error) {
      if (error instanceof NotAcceptableException)
        throw new NotAcceptableException(error.message);
      else {
        console.log(error);
        throw new InternalServerErrorException(
          'something went wrong, while trying to add item to order cart',
          error.message,
        );
      }
    }
  }

  async AdminRemoveItemFromCart(cartItemID: string, admin: AdminEntity) {
    try {
      console.log('Fetching cart for admin:', admin.id);
      const cart = await this.orderCartRepo.findOne({
        where: { admin: { id: admin.id } },
        relations: ['items', 'admin'],
      });

      if (!cart) {
        console.log('Cart not found for admin:', admin.id);
        throw new NotFoundException('Order cart not found');
      }

      console.log('Cart fetched successfully:', cart.id);

      // Check if the cart is already checked out
      if (cart.checkedOut) {
        throw new BadRequestException('Cart has already been checked out');
      }

      console.log('Searching for item with ID:', cartItemID);

      // Find the cart item to remove (ensure cart is not null)
      const cartItemIndex = cart.items.findIndex(
        (item) => item.id === cartItemID,
      );

      if (cartItemIndex === -1) {
        console.log('Cart item with ID', cartItemID, 'not found');
        throw new NotFoundException('Order cart item not found');
      }

      console.log('Found item at index:', cartItemIndex);

      // Remove the cart item
      const removedItem = cart.items.splice(cartItemIndex, 1)[0];
      if (!removedItem) {
        console.log('Failed to remove item at index:', cartItemIndex);
        throw new NotFoundException('Failed to remove the cart item');
      }

      console.log('Item removed successfully:', removedItem.id);

      // Save the updated cart to the database
      await this.orderCartRepo.save(cart);

      return cart;
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      } else {
        console.log('Internal server error:', error.message);
        throw new InternalServerErrorException(
          'Something went wrong',
          error.message,
        );
      }
    }
  }

  //get cart
  async getAdminCart(admin: AdminEntity) {
    try {
      const cart = await this.orderCartRepo.findAndCount({
        where: { admin: { id: admin.id }, checkedOut: false },
        relations: ['items', 'items.vehicleType'],
      });
      if (cart[1] == 0) throw new NotFoundException('cart not found');
      return cart;
    } catch (error) {
      if (error instanceof NotFoundException)
        throw new NotFoundException(error.message);
      else {
        console.log(error);
        throw new InternalServerErrorException(
          'something went wrong while trying to fetch cart,',
          error.message,
        );
      }
    }
  }

  //create order from checkout
  async CheckOut(admin: AdminEntity, dto: adminCheckOutDto) {
    try {
      const cart = await this.orderCartRepo.findOne({
        where: { admin: { id: admin.id } },
        relations: ['items', 'items.vehicleType', 'admin'],
      });

      if (!cart) {
        throw new NotFoundException('Cart not found');
      }

      if (cart.items.length === 0) {
        throw new BadRequestException('Cart is empty');
      }

      // Create a new order from the cart items
      const trackingToken = `osl-${this.genratorservice.generateTrackingID()}`;
      const dropoffCode = this.genratorservice.generateDropOffCode();
      const orderID = `osl-${this.genratorservice.generateOrderID()}`;
      const barcode = `${this.genratorservice.generateBarcodeGigits()}`;
      const order = new OrderEntity();
      order.orderID = orderID;
      order.trackingID = trackingToken;
      order.dropoffCode = dropoffCode;
      order.barcodeDigits = barcode;
      order.accepted_cost_of_delivery = dto.cost;
      order.admin = admin;
      order.bidStatus = BidStatus.ACCEPTED;

      if (dto && dto.code) {
        if (cart.items.length <= 1) {
          throw new NotAcceptableException(
            'This promo code can only be used for multiple orders',
          );
        }

        const promoCode = await this.discountRepo.findOne({
          where: { OneTime_discountCode: dto.code },
        });
        if (!promoCode) {
          throw new NotFoundException('The code does not exist');
        }
        if (promoCode.expires_in <= new Date() || promoCode.isExpired) {
          throw new NotAcceptableException('Oops! Code is expired');
        }
        order.IsDiscountApplied = true;
        order.discount = promoCode.percentageOff;
      }

      order.orderPlacedAt = new Date();
      order.order_status = OrderStatus.ORDER_PLACED;
      order.order_display_status = OrderDisplayStatus.ORDER_PLACED;

      // Add items to the order
      order.items = cart.items.map((cartItem) => {
        const orderItem = new OrderItemEntity();
        Object.assign(orderItem, {
          name: cartItem.name,
          landmark: cartItem.landmark,
          area: cartItem.area,
          phoneNumber: cartItem.phoneNumber,
          home_apartment_number: cartItem.home_apartment_number,
          email: cartItem.email,
          address: cartItem.address,
          Area_of_dropoff: cartItem.Area_of_dropoff,
          Area_of_pickup: cartItem.Area_of_pickup,
          Recipient_name: cartItem.Recipient_name,
          Recipient_phone_number: cartItem.Recipient_phone_number,
          delivery_type: cartItem.delivery_type,
          describe_weight_of_parcel: cartItem.describe_weight_of_parcel,
          distance: cartItem.distance,
          dropOffLat: cartItem.dropOffLat,
          dropOffLong: cartItem.dropOffLong,
          pickupLat: cartItem.pickupLat,
          pickupLong: cartItem.pickupLong,
          landmark_of_dropoff: cartItem.landmark_of_dropoff,
          landmark_of_pickup: cartItem.landmark_of_pickup,
          note_for_rider: cartItem.note_for_rider,
          parcelWorth: cartItem.parcelWorth,
          parcel_name: cartItem.parcel_name,
          pickup_address: cartItem.pickup_address,
          dropOff_address: cartItem.dropOff_address,
          pickup_phone_number: cartItem.pickup_phone_number,
          product_category: cartItem.product_category,
          quantity: cartItem.quantity,
          schedule_date: cartItem.schedule_date,
          vehicleType: cartItem.vehicleType,
          house_apartment_number_of_dropoff:
            cartItem.house_apartment_number_of_dropoff,
        });
        return orderItem;
      });

      // Save the new order
      await this.orderRepo.save(order);

      // Clear the cart and reset the checkedOut flag
      cart.checkedOut = false;
      cart.items = [];
      await this.orderCartRepo.save(cart);

      // Save a notification
      const notification = new Notifications();
      notification.account = admin.id;
      notification.subject = 'Admin checked out!';
      notification.message = `The admin with ID ${admin.id} has checked out and proceeded to making payment after successfully completing an in-office order.`;
      await this.notificationripo.save(notification);

      return {
        message:
          'Your order has been checked out and prepared for payment processing',
        order,
      };
    } catch (error) {
      if (error instanceof NotAcceptableException) {
        throw new NotAcceptableException(error.message);
      } else if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      } else if (error instanceof BadRequestException) {
        throw new BadRequestException(error.message);
      } else {
        console.error(error);
        throw new InternalServerErrorException(
          'Something went wrong while checking out',
          error.message,
        );
      }
    }
  }

  async getTotalOrdersCountByCustomer(customerID: string): Promise<number> {
    try {
      const totalOrders = await this.orderRepo.count({
        where: { customer: { id: customerID } },
        relations: ['customer'],
      });

      if (!totalOrders) {
        throw new NotFoundException(
          `order count associated with Customer with ID ${customerID} not found`,
        );
      }

      return totalOrders;
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException(
        'An error occurred while fetching the total number of orders by the customer',
      );
    }
  }

  async getTotalPendingOrdersCountByCustomer(
    customerID: string,
  ): Promise<number> {
    try {
      const totalOrders = await this.orderRepo.count({
        where: {
          customer: { id: customerID },
          order_display_status: OrderDisplayStatus.PENDING,
        },
        relations: ['customer'],
      });

      if (!totalOrders) {
        throw new NotFoundException(
          `pending order count associated with Customer with ID ${customerID} not found`,
        );
      }

      return totalOrders;
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException(
        'An error occurred while fetching the total number of orders by the customer',
      );
    }
  }

  async getTotalDeliveredOrdersCountByCustomer(
    customerID: string,
  ): Promise<number> {
    try {
      const totalOrders = await this.orderRepo.count({
        where: {
          customer: { id: customerID },
          order_status: OrderStatus.DELIVERED,
        },
        relations: ['customer'],
      });

      if (!totalOrders) {
        throw new NotFoundException(
          `delivered order count associated with Customer with ID ${customerID} not found`,
        );
      }

      return totalOrders;
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException(
        'An error occurred while fetching the total number of orders by the customer',
      );
    }
  }

  async getTotalRevenueByCustomer(customerID: string): Promise<number> {
    try {
      const customer = await this.customerRepo.findOne({
        where: { id: customerID },
      });

      if (!customer) {
        throw new NotFoundException(`Customer with ID ${customerID} not found`);
      }

      const orders = await this.orderRepo.find({
        where: { customer: customer, bidStatus: BidStatus.ACCEPTED },
      });

      const totalRevenue = orders.reduce((total, order) => {
        let orderAmount = order.accepted_cost_of_delivery;

        if (order.IsDiscountApplied && order.discount) {
          const discountAmount =
            (order.accepted_cost_of_delivery * order.discount) / 100;
          orderAmount -= discountAmount;
        }

        const vatPercentage = 0.07; // Adjust VAT percentage if needed
        const vatAmount = orderAmount * vatPercentage;

        return total + orderAmount + vatAmount;
      }, 0);

      return totalRevenue;
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException(
        'An error occurred while fetching the total revenue by the customer',
      );
    }
  }
}
