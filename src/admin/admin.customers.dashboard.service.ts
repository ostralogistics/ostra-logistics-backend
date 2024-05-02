import { InjectRepository } from '@nestjs/typeorm';
import { AdminEntity } from 'src/Entity/admins.entity';
import { AdminRepository } from './admin.repository';
import { CustomerEntity } from 'src/Entity/customers.entity';
import { CustomerRepository } from 'src/customer/customer.repository';
import { BidRepository, NotificationRepository } from 'src/common/common.repositories';
import { BidEntity, IBids, IInitialBidsResponse } from 'src/Entity/bids.entity';
import { IOrder, IOrderRequestFromCustomerToAdmin } from 'src/order/order';
import { OrderRepository } from 'src/order/order.reposiroty';
import { OrderEntity } from 'src/Entity/orders.entity';
import {
  BidEvent,
  BidStatus,
  DeliveryVolume,
  OrderBasedOnDates,
  OrderStatus,
} from 'src/Enums/all-enums';
import {
  Injectable,
  InternalServerErrorException,
  NotAcceptableException,
  NotFoundException,
} from '@nestjs/common';
import { AdminPlaceBidDto, counterBidDto } from 'src/common/common.dto';
import { BidEventsService } from 'src/common/Events/bid.events.service';
import { Between, ILike, In } from 'typeorm';
import { Notifications } from 'src/Entity/notifications.entity';

@Injectable()
export class AdminCustomerDashBoardService {
  constructor(
    @InjectRepository(AdminEntity) private readonly adminrepo: AdminRepository,
    @InjectRepository(CustomerEntity)
    private readonly customerRepo: CustomerRepository,
    @InjectRepository(OrderEntity) private readonly orderRepo: OrderRepository,
    @InjectRepository(BidEntity) private readonly bidRepo: BidRepository,
    @InjectRepository(Notifications)
    private readonly notificationripo: NotificationRepository,
    private readonly bidevent: BidEventsService,
  ) {}

  //query orders

  async GetOrdersThatArePending(page: number = 1, limit: number = 30) {
    try {
      const skip = (page - 1) * limit;

      const orders = await this.orderRepo.findAndCount({
        where: {
          order_status: OrderStatus.BIDDING_ONGOING,
        },
        relations: ['bid', 'Rider', 'customer'], // Assuming relations are correctly defined
        order: { orderCreatedAtTime: 'DESC' },
        take: limit,
        skip: skip,
      });

      if (orders[1] === 0)
        throw new NotFoundException(
          'there are no new or pending orders at the moment',
        );

      return orders;
    } catch (error) {
      if (error instanceof NotFoundException)
        throw new NotFoundException(error.message);
      else {
        console.log(error);
        throw new InternalServerErrorException(
          'something went wrong while fetching all pending or new orders, please try again later',
        );
      }
    }
  }

  //make openning bid based on influenced matrix cost calculations

  async MakeOpenningBid(
    orderID: number,
    dto: AdminPlaceBidDto,
  ): Promise<IInitialBidsResponse> {
    try {
      const order = await this.orderRepo.findOne({
        where: { id: orderID },
        relations: ['bid','customer'],
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

      //this.bidevent.emitBidEvent(BidEvent.BID_INITIATED,{admin,orderID})

      await this.bidRepo.save(bid);

      const bidresponse: IInitialBidsResponse = {
        id: bid.id,
        bid_value: bid.bid_value,
        bidStatus: bid.bidStatus,
        initialBidPlacedAt: bid.initialBidPlacedAt,
        order: bid.order,
      };

      //save the notification
      const notification = new Notifications();
      notification.account = order.customer.id;
      notification.subject = 'Openning Bid made !';
      notification.message = `an openning bid have been sent on order with id ${orderID} on the admin portal of ostra ogistics by superadmin  `;
      await this.notificationripo.save(notification);

      return bidresponse;
    } catch (error) {
      if (error instanceof NotFoundException)
        throw new NotFoundException(error.message);
      else {
        console.log(error);
        throw new InternalServerErrorException(
          'something went wrong while making opening bid, please try again later',
        );
      }
    }
  }

  //counter bids sent in

  async counterCustomerCouterBid(
    bidID: number,
    dto: counterBidDto,
  ): Promise<IBids> {
    try {
      //check if order is related to the countered bid
      const bid = await this.bidRepo.findOne({
        where: { id: bidID },
        relations: ['order'],
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

       //save the notification
       const notification = new Notifications();
       notification.account = bid.order.customer.id;
       notification.subject = 'Counter Bid made !';
       notification.message = `an counter bid  bid have been sent on bid with id ${bidID} on the admin portal of ostra ogistics by superadmin  `;
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
        );
      }
    }
  }

  //fetch all customers
  async GetAllCustomers(page: number = 1, limit: number = 30) {
    try {
      const skip = (page - 1) * limit;
      const customers = await this.customerRepo.findAndCount({
        relations: ['my_orders','my_cards'],
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
        );
      }
    }
  }

  //one customer

  async GetOneCustomer(customerID: string) {
    try {
      const customers = await this.customerRepo.findOne({
        where: { id: customerID },
        relations: ['my_orders','my_cards']
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
          order_status: OrderStatus.IN_TRANSIT,
        },
        relations: ['bid', 'Rider', 'customer'], // Assuming relations are correctly defined
        order: { orderCreatedAtTime: 'DESC' },
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
        );
      }
    }
  }

  async GetOrdersThatAreDelivered(page: number = 1, limit: number = 30) {
    try {
      const skip = (page - 1) * limit;

      const orders = await this.orderRepo.findAndCount({
        where: {
          order_status: OrderStatus.DROPPED_OFF,
        },
        relations: ['bid', 'Rider', 'customer'], // Assuming relations are correctly defined
        order: { orderCreatedAtTime: 'DESC' },
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
        );
      }
    }
  }

  async GetOrdersThatArePickedUp(page: number = 1, limit: number = 30) {
    try {
      const skip = (page - 1) * limit;

      const orders = await this.orderRepo.findAndCount({
        where: {
          order_status: OrderStatus.PICKED_UP,
        },
        relations: ['bid', 'Rider', 'customer'], // Assuming relations are correctly defined
        order: { orderCreatedAtTime: 'DESC' },
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
          orderCreatedAtTime: Between(startDate, endDate),
        },
        relations: ['bid', 'Rider', 'customer'], // Assuming relations are correctly defined
        order: { orderCreatedAtTime: 'DESC' },
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
          order_status: In([OrderStatus.DROPPED_OFF]),
          dropOffTime: Between(startDate, endDate),
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
        relations: ['customer', 'bid', 'Rider'],
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
        );
      }
    }
  }

  // get counts of orders

  //all active orders count 
  async getAllActiveOrdersCount(): Promise<number> {
    const activeOrder = await this.orderRepo.count({
      where: { order_status: OrderStatus.IN_TRANSIT },
    });
    return activeOrder;
  }

  //counts of active order
  async getAllOrdersInTheOfficeCount(): Promise<number> {
    const activeOrder = await this.orderRepo.count({
      where: { order_status: OrderStatus.PARCEL_REBRANDING },
    });
    return activeOrder;
  }

  //counts of
  async getAllCompletedOrderCount(): Promise<number> {
    const activeOrder = await this.orderRepo.count({
      where: { order_status: OrderStatus.DROPPED_OFF },
    });
    return activeOrder;
  }


  //counts of pending
  async getAllPendingOrderCount(): Promise<number> {
    const activeOrder = await this.orderRepo.count({
      where: { order_status: OrderStatus.BIDDING_ONGOING },
    });
    return activeOrder;
  }

  //counts active based on week, month or year


  async getCompletedOrderCountBasedOnDate(timeRange: OrderBasedOnDates = OrderBasedOnDates.TODAY): Promise<number> {
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
          startDate.setFullYear(startDate.getFullYear()-1)
        default:
          // For 'today', no change needed to startDate
          break;
      }

      // Set endDate to today's date for all cases
      endDate = new Date();

      const completedOrderCount = await this.orderRepo.count({
        where: {
          order_status: OrderStatus.DROPPED_OFF,
          dropOffTime: Between(startDate, endDate)
        },
      });

      return completedOrderCount;
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException('Error occurred while fetching completed order count.');
    }
  }




  async getPendingOrderCountBasedOnDate(timeRange: OrderBasedOnDates = OrderBasedOnDates.TODAY): Promise<number> {
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
          startDate.setFullYear(startDate.getFullYear()-1)
        default:
          // For 'today', no change needed to startDate
          break;
      }

      // Set endDate to today's date for all cases
      endDate = new Date();

      const completedOrderCount = await this.orderRepo.count({
        where: {
          order_status: OrderStatus.BIDDING_ONGOING,
          orderCreatedAtTime: Between(startDate, endDate)
        },
      });

      return completedOrderCount;
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException('Error occurred while fetching pending  order count.');
    }
  }



  async getActiveOrderCountBasedOnDate(timeRange: OrderBasedOnDates = OrderBasedOnDates.TODAY): Promise<number> {
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
          startDate.setFullYear(startDate.getFullYear()-1)
        default:
          // For 'today', no change needed to startDate
          break;
      }

      // Set endDate to today's date for all cases
      endDate = new Date();

      const completedOrderCount = await this.orderRepo.count({
        where: {
          order_status: OrderStatus.IN_TRANSIT,
          pickupTime: Between(startDate, endDate)
        },
      });

      return completedOrderCount;
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException('Error occurred while fetching Active order count.');
    }
  }


  async getofficeBrandingOrderCountBasedOnDate(timeRange: OrderBasedOnDates = OrderBasedOnDates.TODAY): Promise<number> {
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
          startDate.setFullYear(startDate.getFullYear()-1)
        default:
          // For 'today', no change needed to startDate
          break;
      }

      // Set endDate to today's date for all cases
      endDate = new Date();

      const completedOrderCount = await this.orderRepo.count({
        where: {
          order_status: OrderStatus.PARCEL_REBRANDING,
          pickupTime: Between(startDate, endDate)
        },
      });

      return completedOrderCount;
    } catch (error) {
      console.log(error);
      throw new Error('Error occurred while fetching parcel in office for rebranding order count.');
    }
  }


  //in office orders for multiple and non multiple

  


}
