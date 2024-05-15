import { InjectRepository } from '@nestjs/typeorm';
import { AdminEntity } from 'src/Entity/admins.entity';
import { AdminRepository, DiscountRepository } from './admin.repository';
import { CustomerEntity } from 'src/Entity/customers.entity';
import { CustomerRepository } from 'src/customer/customer.repository';
import {
  BidRepository,
  DiscountUsageRepository,
  NotificationRepository,
} from 'src/common/common.repositories';
import { BidEntity, IBids, IInitialBidsResponse } from 'src/Entity/bids.entity';
import { IOrder } from 'src/order/order';
import { OrderRepository } from 'src/order/order.reposiroty';
import { OrderEntity } from 'src/Entity/orders.entity';
import axios from 'axios';
import {
  BidEvent,
  BidStatus,
  DeliveryVolume,
  OrderBasedOnDates,
  OrderStatus,
  PaymentStatus,
} from 'src/Enums/all-enums';
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotAcceptableException,
  NotFoundException,
} from '@nestjs/common';
import { AdminPlaceBidDto, ApplypromoCodeDto, InOfficeOrderDto, OrderDto, counterBidDto } from 'src/common/common.dto';
import { BidEventsService } from 'src/common/Events/bid.events.service';
import { Between, ILike, In } from 'typeorm';
import { Notifications } from 'src/Entity/notifications.entity';
import * as JsBarcode from 'jsbarcode';
import { GeneatorService } from 'src/common/services/generator.service';
import { DistanceService } from 'src/common/services/distance.service';
import { GeoCodingService } from 'src/common/services/goecoding.service';
import { DiscountUsageEntity } from 'src/Entity/discountUsage.entity';
import { DiscountEntity } from 'src/Entity/discount.entity';

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
    @InjectRepository(DiscountEntity)
    private readonly discountripo: DiscountRepository,
    @InjectRepository(DiscountUsageEntity)
    private readonly discountusageripo: DiscountUsageRepository,
    private readonly bidevent: BidEventsService,
    private genratorservice: GeneatorService,
    private distanceservice: DistanceService,
    private geocodingservice: GeoCodingService
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

  async MakeOpenningBid(orderID: number, dto: AdminPlaceBidDto) {
    try {
      const order = await this.orderRepo.findOne({
        where: { id: orderID },
        relations: ['bid', 'customer'],
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

      //save the notification
      const notification = new Notifications();
      notification.account = order.customer.id;
      notification.subject = 'Openning Bid made !';
      notification.message = `an openning bid have been sent on order with id ${orderID} on the admin portal of ostra ogistics by superadmin  `;
      await this.notificationripo.save(notification);

      return bid;
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
        relations: ['my_orders', 'my_cards'],
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
        relations: ['my_orders', 'my_cards'],
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

  async createAirWaybill(barcodeDigit: string) {
    try {
      const checkbarcode = await this.orderRepo.findOne({
        where: { barcodeDigits: barcodeDigit },
        relations: ['customer', 'bid'],
      });
      if (!checkbarcode) throw new NotFoundException('trackingID not found');

       // Generate barcode as base64 image
       const barcode = await this.genratorservice.generateBarcode(barcodeDigit);
  
      return { order: checkbarcode, barcodeUrl: barcode};
    } catch (error) {
      if(error instanceof NotFoundException) throw new NotFoundException(error.message)
      else{
    console.log(error)
    throw new InternalServerErrorException('an error occured while generating air waybill, please try again later')
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
          order_status: OrderStatus.DROPPED_OFF,
          dropOffTime: Between(startDate, endDate),
        },
      });

      return completedOrderCount;
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(
        'Error occurred while fetching completed order count.',
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
          order_status: OrderStatus.BIDDING_ONGOING,
          orderCreatedAtTime: Between(startDate, endDate),
        },
      });

      return completedOrderCount;
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(
        'Error occurred while fetching pending  order count.',
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
          order_status: OrderStatus.IN_TRANSIT,
          pickupTime: Between(startDate, endDate),
        },
      });

      return completedOrderCount;
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(
        'Error occurred while fetching Active order count.',
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
          order_status: OrderStatus.PARCEL_REBRANDING,
          pickupTime: Between(startDate, endDate),
        },
      });

      return completedOrderCount;
    } catch (error) {
      console.log(error);
      throw new Error(
        'Error occurred while fetching parcel in office for rebranding order count.',
      );
    }
  }



  //in office orders for multiple and non multiple, set price and process payment

  async PlaceOrder(
    dto: InOfficeOrderDto | InOfficeOrderDto[],
    groupId?: string,
  ) {
    try {
      let createdOrders: OrderEntity[] = [];

      if (Array.isArray(dto)) {
        if (dto.length > 3) {
          throw new NotAcceptableException(
            'The limit for multiple orders is 3',
          );
        }

        for (const orderData of dto) {
          const order = await this.createOrder(orderData, groupId);
          createdOrders.push(order);
        }
      } else {
        // If single order
        const order = await this.createOrder(dto);
        createdOrders.push(order);
      }

      return createdOrders;
    } catch (error) {
      if (error instanceof NotAcceptableException) {
        throw new NotAcceptableException(error.message);
      } else {
        console.error(error);
        throw new InternalServerErrorException(
          'Something went wrong while placing order. Please try again later.',
        );
      }
    }
  }



  public async createOrder(
    dto: InOfficeOrderDto,
    groupId?: string,
    // Optional parameter for groupId
  ): Promise<OrderEntity> {
    try {
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
      const flatRate = roundDistance * 4.25;

      const order = new OrderEntity();
      order.orderID = `#OslO-${await this.genratorservice.generateOrderID()}`;
      // Set groupId and isMultipleOrder flag
      if (groupId) {
        order.groupOrderID = `#GrpO-${await this.genratorservice.generateOrderID()}`;
        order.is_group_order = true;
      } else {
        order.is_group_order = false;
      }
 
      order.name = dto.name
      order.phoneNumber = dto.phoneNumber
      order.email = dto.email
      order.address = dto.address
      order.home_apartment_number = dto.home_apartment_number
      order.area = dto.area
      order.landmark = dto.landmark
      order.parcel_name = dto.parcel_name;
      order.product_category = dto.product_category;
      order.quantity = dto.quantity;
      order.parcelWorth = dto.parcelWorth;
      order.weight_of_parcel = dto.weight_of_parcel;
      order.describe_weight_of_parcel = dto.describe_weight_of_parcel;
      order.note_for_rider = dto.note_for_rider;

      order.pickup_address = dto.pickup_address;
      order.pickup_phone_number = dto.pickup_phone_number;
      order.Area_of_pickup = dto.Area_of_pickup;
      order.landmark_of_pickup = dto.landmark_of_pickup;

      order.Recipient_name = dto.Recipient_name;
      order.Recipient_phone_number = dto.Recipient_phone_number;
      order.dropOff_address = dto.dropOff_address;
      order.house_apartment_number_of_dropoff =
        dto.house_apartment_number_of_dropoff;
      order.Area_of_dropoff = dto.Area_of_dropoff;
      order.landmark_of_dropoff = dto.landmark_of_dropoff;

      order.vehicleType = dto.vehicleType;
      order.delivery_type = dto.delivery_type;
      order.schedule_date = dto.schedule_date;

      order.pickupLat = pickupCoordinates.lat;
      order.pickupLong = pickupCoordinates.lon;
      order.dropOffLat = dropOffCoordinates.lat;
      order.dropOffLong = dropOffCoordinates.lon;
      order.distance = roundDistance;

      order.initial_cost = flatRate;
      order.bidStatus = BidStatus.PENDING;
      order.vehicleType = dto.vehicleType;
      order.payment_status = PaymentStatus.PENDING;
      order.order_status = OrderStatus.BIDDING_ONGOING;
      order.orderCreatedAtTime = new Date();

      await this.orderRepo.save(order);

      //save the notification
      const notification = new Notifications();
      notification.account = "admin";
      notification.subject = 'Customer made an in office order !';
      notification.message = `the customer  ${order.name} have made an order from the office throwugh the admin dashboard of otra logistics `;
      await this.notificationripo.save(notification);

      return order;
    } catch (error) {
      if (error instanceof NotAcceptableException)
        throw new NotAcceptableException(error.message);
      else {
        console.log(error);
        throw new InternalServerErrorException(
          'something went wrong while trying to place an order, please try again later',
        );
      }
    }
  }


  //set the price of the order after manual inoffice negotiations with the customer, so there woont be a back and fort 

  async setPriceForOrder (orderID: number, dto: AdminPlaceBidDto){
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
       notification.account = order.name;
       notification.subject = 'Order Price Set from the office!';
       notification.message = `the price for order wth orderID ${order.orderID} have being set and agreed on ostra logistics `;
       await this.notificationripo.save(notification);

       return bid
      
    } catch (error) {
      if (error instanceof NotFoundException) throw new NotFoundException(error.message)
      else {
    console.log(error)
    throw new InternalServerErrorException(`something went wrong while setting the price for the order}`)
    }
      
    }
  }


  //apply discount on multiple order only
  public async ApplyPromocode(
    dto: ApplypromoCodeDto,
    orderID: string,
  ) {
    try {
      const discountcode = await this.discountripo.findOne({
        where: { OneTime_discountCode: dto.code },
      });
      if (!discountcode)
        throw new NotFoundException('promo code does not exist');

      //check if discount code is expired
      if (discountcode.isExpired || discountcode.expires_in < new Date())
        throw new NotAcceptableException(
          'the promo code is expired, sorry you cannot use it anymore',
        );

      // //check if the customer has applied this code before, cuz it is meant to be applied just once
      // const hasAppliedCodeBefore = await this.discountusageripo.findOne({
      //   where: { code: dto.code, appliedBy: { id: customer.id } },
      //   relations: ['appliedBy'],
      // });

      // if (hasAppliedCodeBefore)
      //   throw new NotAcceptableException(
      //     'oops we are so sorry, you can only use this code once',
      //   );

      //check order that the code is being applied to
      const order = await this.orderRepo.find({
        where: { groupOrderID: orderID, is_group_order: true },
        relations: ['customer', 'bid'],
      });
      if (!order)
        throw new NotFoundException(
          `the order with the ID ${orderID} does not exist`,
        );

      //record discount code usage
      const discountUsage = new DiscountUsageEntity();
      discountUsage.code = dto.code;
      discountUsage.appliedAT = new Date();
      await this.discountusageripo.save(discountUsage);

      const discountPercentage = discountcode.percentageOff;
      const discountAmount = order.reduce(
        (acc, order) =>
          acc + (order.accepted_cost_of_delivery * discountPercentage) / 100,
        0,
      );

      //now update the order table
      await this.orderRepo.update(
        { groupOrderID: orderID, is_group_order: true },
        {
          IsDiscountApplied: true,
          discount: discountPercentage,
        },
      );

      //notifiction
      const notification = new Notifications();
      notification.account = "admin";
      notification.subject = 'Discount promo code applied!';
      notification.message = `the customer has applied the promocode on ostra logistics `;
      await this.notificationripo.save(notification);

      return {
        message: `promo code ${dto.code} applied successfully`,
        discountUsage,
      };
    } catch (error) {
      if (error instanceof NotFoundException)
        throw new NotFoundException(error.message);
      else if (error instanceof NotAcceptableException)
        throw new NotAcceptableException(error.message);
      else {
        console.log(error);
        throw new InternalServerErrorException(
          'something went wrong while trying to apply discount on multiple orders',
        );
      }
    }
  }


   // after bid is being finalized make payment

   async processPayment(orderID: number): Promise<PaymentResponse> {
    try {
      const order = await this.orderRepo.findOne({
        where: { id: orderID },
        relations: ['customer', 'bid'],
      });
      if (!order)
        throw new NotFoundException(
          `the order with the ID ${orderID} does not exist`,
        );

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
          email: order.customer.email, // Customer email for reference
          reference: order.id.toString(), // Order ID as payment reference
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
        console.log('payment successful');
      } else {
        throw new InternalServerErrorException(
          'Payment initialization failed. Please try again later',
        );
      }
      //save the notification
      const notification = new Notifications();
      notification.account = order.name;
      notification.subject = 'Payment Order initiated!';
      notification.message = `the customer with id ${order.customer.id} have initiated payment `;
      await this.notificationripo.save(notification);

      return response.data;
    } catch (error) {
      console.error(error);
      let errorMessage = 'Payment processing failed. Please try again later';

      // Handle specific Paystack errors (optional)
      if (error.response && error.response.data) {
        errorMessage = error.response.data.message;
      }

      throw new InternalServerErrorException(errorMessage);
    }
  }


}
