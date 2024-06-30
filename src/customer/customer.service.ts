import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotAcceptableException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CustomerEntity } from 'src/Entity/customers.entity';
import {
  CartItemEntity,
  OrderCartEntity,
  OrderEntity,
  OrderItemEntity,
} from 'src/Entity/orders.entity';
import {
  CartItemRepository,
  OrderCartRepository,
  OrderItemRepository,
  OrderRepository,
} from 'src/order/order.reposiroty';
import {
  CardRepository,
  CustomerRepository,
  NewsLetterRepository,
  complaintRepository,
} from './customer.repository';
import { DistanceService } from 'src/common/services/distance.service';
import { GeoCodingService } from 'src/common/services/goecoding.service';
import {
  ApplypromoCodeDto,
  BidActionDto,
  OrderDto,
  counterBidDto,
} from 'src/common/common.dto';
import {
  BidEvent,
  BidStatus,
  BiddingAction,
  OrderDisplayStatus,
  OrderStatus,
  PaymentStatus,
  channelforconversation,
  complainResolutionStatus,
} from 'src/Enums/all-enums';
import { BidEntity, IBids } from 'src/Entity/bids.entity';
import {
  BidRepository,
  DiscountUsageRepository,
  NotificationRepository,
} from 'src/common/common.repositories';
import axios from 'axios';
import * as nanoid from 'nanoid';

import { IOrder } from 'src/order/order';
import { ILike } from 'typeorm';
import {
  CardDetailsDto,
  ChangePasswordDto,
  ComplaintDto,
  NewsLetterDto,
  UpdateCustomerDto,
  addPasswordDto,
  markNotificationAsReadDto,
} from './customer.dto';
import { CardEntity, ICard } from 'src/Entity/card.entity';
import { ICustomer } from './customer';
import { CustomerAuthService } from './customer-auth/customer.auth.service';
import { UploadService } from 'src/common/helpers/upload.service';
import { Mailer } from 'src/common/mailer/mailer.service';
import { GeneatorService } from 'src/common/services/generator.service';
import { INotification, Notifications } from 'src/Entity/notifications.entity';
import { NewsLetterEntity } from 'src/Entity/newsletter.entity';
import { ComplaintEntity, IComplaints } from 'src/Entity/complaints.entity';
import { DiscountRepository, VehicleRepository, VehicleTypeRepository } from 'src/admin/admin.repository';
import { DiscountEntity } from 'src/Entity/discount.entity';
import { DiscountUsageEntity } from 'src/Entity/discountUsage.entity';
import { CloudinaryService } from 'src/common/services/claudinary.service';
import { plainToInstance } from 'class-transformer';
import { VehicleTypeEntity } from 'src/Entity/vehicleType.entity';


@Injectable()
export class CustomerService {
  constructor(
    @InjectRepository(OrderEntity) private readonly orderRepo: OrderRepository,
    @InjectRepository(CustomerEntity)
    private readonly customerRepo: CustomerRepository,
    @InjectRepository(BidEntity)
    private readonly bidRepo: BidRepository,
    @InjectRepository(CardEntity)
    private readonly cardRepo: CardRepository,
    @InjectRepository(Notifications)
    private readonly notificationripo: NotificationRepository,
    @InjectRepository(NewsLetterEntity)
    private readonly newsletterripo: NewsLetterRepository,
    @InjectRepository(ComplaintEntity)
    private readonly complaintripo: complaintRepository,
    @InjectRepository(DiscountEntity)
    private readonly discountripo: DiscountRepository,
    @InjectRepository(DiscountUsageEntity)
    private readonly discountusageripo: DiscountUsageRepository,
    @InjectRepository(OrderCartEntity)
    private readonly orderCartRepo: OrderCartRepository,
    @InjectRepository(CartItemEntity)
    private readonly cartItemRepo: CartItemRepository,
    @InjectRepository(DiscountEntity)
    private readonly discountRepo: DiscountRepository,
    @InjectRepository(DiscountUsageEntity)
    private readonly discountusageRepo: DiscountUsageRepository,
    @InjectRepository(VehicleTypeEntity)
    private readonly vehicletypeRepo: VehicleTypeRepository,
    private distanceservice: DistanceService,
    private geocodingservice: GeoCodingService,
    private genratorservice: GeneatorService,
    private cloudinaryservice: CloudinaryService,
   
  ) {}

  // add to cart
  async addToOrderCart(
    customer: CustomerEntity,
    dto: OrderDto,
  ): Promise<OrderCartEntity> {
    try {
      // Find the existing cart for the customer that is not checked out
      let cart = await this.orderCartRepo.findOne({
        where: { customer: { id: customer.id }, checkedOut: false },
        relations: ['items'],
      });

      // Debug: Log the found cart or if a new one will be created
      if (cart) {
        console.log('Existing cart found:', cart.id);
      } else {
        console.log('No existing cart found. Creating a new one.');
        cart = new OrderCartEntity();
        cart.customer = customer;
        cart.items = [];
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
      item.id= `${await this.genratorservice.generateUUID()}`
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
        if (dto.vehicleTypeID){
          const vehicle =await this.vehicletypeRepo.findOne({where:{id:dto.vehicleTypeID}})
          if (!vehicle) throw new NotFoundException('vehicle type not found');
          item.vehicleType = vehicle
        
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

  //remove an item from order cart
  async RemoveItemFromCart(cartItemID: string, customer: CustomerEntity) {
    try {
      // Check if the user has a cart
      const cart = await this.orderCartRepo.findOne({
        where: { customer: {id:customer.id} },
        relations: ['items'],
      });
      if (!cart) throw new NotFoundException('order cart not found');

      // Check if the cart is already checked out
      if (cart.checkedOut)
        throw new BadRequestException('Cart has already been checked out');

      // Find the cart item to remove
      const cartItemIndex = cart.items.findIndex(
        (item) => item.id === cartItemID,
      );
      if (cartItemIndex === -1)
        throw new NotFoundException('order cart item not found');

      //remove the cart order item
      cart.items.splice(cartItemIndex, 1)[0];

      await this.orderCartRepo.save(cart);
      // Convert cart entity to plain object to avoid circular reference issues
      return plainToInstance(OrderCartEntity, cart);
    } catch (error) {
      if (error instanceof BadRequestException)
        throw new BadRequestException(error.message);
      else if (error instanceof NotFoundException)
        throw new NotFoundException(error.message);
      else {
        console.log(error);
        throw new InternalServerErrorException(
          'something went wrong',
          error.message,
        );
      }
    }
  }


  //get cart
  async getCart(Customer: CustomerEntity) {
    try {
      const cart = await this.orderCartRepo.findOne({
        where: { customer: {id:Customer.id}, checkedOut: false },
        relations: ['customer', 'items','items.vehicleType'],
      });
      if (!cart) throw new NotFoundException('cart not found');
      // Convert cart entity to plain object to avoid circular reference issues

      const itemcount = cart.items.length;

      return {...cart, itemcount}

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
  async CheckOut(customer: CustomerEntity, dto?: ApplypromoCodeDto) {
    try {
      const cart = await this.orderCartRepo.findOne({
        where: { customer: { id: customer.id } },
        relations: ['items', 'items.vehicleType','customer'],
      });
  
      if (!cart) {
        throw new NotFoundException('Cart not found');
      }
  
      if (cart.items.length === 0) {
        throw new BadRequestException('Cart is empty');
      }
  
      if (dto.code) {
        // Check if promo code has been used by the customer
        const isCodeUsedByCustomer = await this.discountusageRepo.findOne({
          where: { appliedBy: customer, code: dto.code },
        });
        if (isCodeUsedByCustomer) {
          throw new NotAcceptableException(
            'You have already applied this promo code and it can only be applied once',
          );
        }
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
      order.customer = customer;
  
      if (dto.code && dto.code) {
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
  
        // Record the promo code usage
        const discountUsage = new DiscountUsageEntity();
        discountUsage.appliedBy = customer;
        discountUsage.code = promoCode.OneTime_discountCode;
        await this.discountusageRepo.save(discountUsage);
      }
  
      order.orderPlacedAt = new Date();
      order.order_status = OrderStatus.ORDER_PLACED;
      order.order_display_status = OrderDisplayStatus.ORDER_PLACED
  
      // Add items to the order
      order.items = cart.items.map(cartItem => {
        const orderItem = new OrderItemEntity();
        Object.assign(orderItem, {
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
          house_apartment_number_of_dropoff: cartItem.house_apartment_number_of_dropoff,
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
      notification.account = customer.id;
      notification.subject = 'Customer checked out!';
      notification.message = `The customer with ID ${customer.id} has checked out and initiated the bidding process in the app of Ostra Logistics.`;
      await this.notificationripo.save(notification);
  
      return {
        message: 'Your order has been checked out and sent for bidding. The bidding process will commence shortly.',
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
  

  /////////////////////////////////biding process ///////////////////////////////
  //1. accept or decline bid

  async AcceptORDeclineBid(
    dto: BidActionDto,
    orderID: number,
    customer: CustomerEntity,
    bidID: number,
  ): Promise<IBids> {
    try {
      const order = await this.validateOrder(orderID, customer);
      const bid = await this.validateBid(bidID);
  
      await this.checkCustomerAuthorization(order, customer);
  
      if (dto.action === BiddingAction.ACCEPT) {
        await this.processBidAcceptance(order, bid);
      } else if (dto.action === BiddingAction.DECLINE) {
        await this.processBidDecline(order, bid);
      }

  
      return bid;
    } catch (error) {
      this.handleError(error);
    }
  }
  
  private async validateOrder(orderID: number, customer: CustomerEntity): Promise<OrderEntity> {
    const order = await this.orderRepo.findOne({
      where: { id: orderID, customer: {id:customer.id} },
      relations: ['customer','items','items.vehicleType'],
    });
  
    if (!order) {
      throw new NotFoundException(`The order with ID ${orderID} does not exist`);
    }
  
    return order;
  }
  
  private async validateBid(bidID: number): Promise<BidEntity> {
    const bid = await this.bidRepo.findOne({ where: { id: bidID } });
  
    if (!bid) {
      throw new NotFoundException(`The bid with ID ${bidID} does not exist`);
    }
  
    return bid;
  }
  
  private async checkCustomerAuthorization(order: OrderEntity, customer: CustomerEntity): Promise<void> {
    if (order.customer.id !== customer.id) {
      throw new NotAcceptableException(
        `This customer ${customer.lastname} is not authorized to accept or decline this bid`,
      );
    }
  }
  
  private async processBidAcceptance(order: OrderEntity, bid: BidEntity): Promise<void> {
    
  
    order.bidStatus = BidStatus.ACCEPTED;
    order.accepted_cost_of_delivery = bid.bid_value;
    await this.orderRepo.save(order);
  
    bid.bidStatus = BidStatus.ACCEPTED;
    bid.order = order;
    bid.BidAcceptedAt = new Date();
    await this.bidRepo.save(bid);
  
    await this.sendNotification(order.customer.id, 'Customer accepted a bid!', `The customer with ID ${order.customer.id} has accepted a bid.`);
  }
  
  private async processBidDecline(order: OrderEntity, bid: BidEntity): Promise<void> {
   
  
    order.bidStatus = BidStatus.DECLINED;
    order.order_display_status = OrderDisplayStatus.DECLINED
    await this.orderRepo.save(order);
  
    bid.bidStatus = BidStatus.DECLINED;
    bid.order = order;
    bid.BidDeclinedAt = new Date();
    await this.bidRepo.save(bid);
  
    await this.sendNotification(order.customer.id, 'Customer declined a bid!', `The customer with ID ${order.customer.id} has declined a bid.`);
  }
  
  private async sendNotification(accountId: string, subject: string, message: string): Promise<void> {
    const notification = new Notifications();
    notification.account = accountId;
    notification.subject = subject;
    notification.message = message;
    await this.notificationripo.save(notification);
  }
  
  private handleError(error: any): void {
    if (error instanceof NotFoundException || error instanceof NotAcceptableException) {
      throw error;
    } else {
      console.error(error);
      throw new InternalServerErrorException(
        'Something went wrong while trying to accept or decline bid. Please try again later.',
        error.message,
      );
    }
  }
  
  /////////////////////////////////////////////////////////////////////

  //2. counterbid with an offer
  async CounterBid(dto: counterBidDto, bidID: number): Promise<IBids> {
    try {
      //check bid
      const bid = await this.bidRepo.findOne({
        where: { id: bidID },
        relations: ['order'],
      });
      if (!bid)
        throw new NotFoundException(
          `the bid with the ID ${bidID} does not exist`,
        );

      // Check if order already has a counter offer (enforces one-time counter)
      if (
        bid.bidStatus === BidStatus.COUNTERED ||
        bid.bidStatus === BidStatus.ACCEPTED
      ) {
        throw new NotAcceptableException(
          'Counter offer can only be made once for this order',
        );
      }

      //counter the bid
      bid.counter_bid_offer = dto.counter_bid;
      bid.counteredAt = new Date();
      bid.bidStatus = BidStatus.COUNTERED;

      await this.bidRepo.save(bid);



      //save the notification
      const notification = new Notifications();
      notification.account = bid.order.customer.id;
      notification.subject = 'Customer countered a bid!';
      notification.message = `the customer with id ${bid.order.customer.id} have countered a bid from the admin in the app of ostra logistics with a new offer of ${bid.counter_bid_offer} `;
      await this.notificationripo.save(notification);

      //update ordertable

      return bid;
    } catch (error) {
      if (error instanceof NotFoundException)
        throw new NotFoundException(error.message);
      else if (error instanceof NotAcceptableException)
        throw new NotAcceptableException(error.message);
      else {
        console.log(error);
        throw new InternalServerErrorException(
          'something went wrong while trying to counter bid, please try again later',
          error.message,
        );
      }
    }
  }

  ///////////////////////////////////////////////////  end of biding process /////////////////////////////////////////

  // after bid is being finalized make payment and confirm payment the response will be a payment success and a tracking number for

  async processPayment(orderID: number): Promise<PaymentResponse> {
    try {
      const order = await this.orderRepo.findOne({
        where: { id: orderID },
        relations: ['customer', 'bid','items','items.vehicleType'],
      });
      if (!order)
        throw new NotFoundException(
          `the order with the ID ${orderID} does not exist`,
        );

      console.log(order.accepted_cost_of_delivery);

      // Check if order is ready for payment (bid accepted)
      if (order.bidStatus !== BidStatus.ACCEPTED) {
        throw new NotAcceptableException(
          'Order cannot be paid for. Bid is not yet accepted',
        );
      }

      //calculate VAT
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

      console.log('totalAmountWithVAT', totalAmountWithVAT);

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

        //create transaction and also create the receipt 
      } else {
        throw new InternalServerErrorException(
          'Payment initialization failed. Please try again later',
        );
      }
      //save the notification
      const notification = new Notifications();
      notification.account = order.customer.id;
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

  // track order
  async TrackOrder(keyword: string | any): Promise<IOrder> {
    try {
      //find order
      const trackorder = await this.orderRepo.findOne({
        where: { trackingID: ILike(`%${keyword}`) },
        relations: ['customer', 'bid', 'items', 'items.vehicleType'],
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
          'something went wrong while trackin an order, please try again later',
          error.message,
        );
      }
    }
  }

  //scan barcode for an order
  async scanBarcode(barcode: string): Promise<IOrder> {
    try {
      const order = await this.orderRepo.findOne({
        where: { barcodeDigits: barcode },
        relations: ['customer', 'bid','items','items.vehicleType'],
        comment: 'finding order with the trackingID scanned from the barcode',
      });
      if (!order)
        throw new NotFoundException(
          `Oops! Order associated with barcode ${barcode} is not found`,
        );

      return order;
    } catch (error) {
      if (error instanceof NotFoundException)
        throw new NotFoundException(error.message);
      else {
        console.log(error);
        throw new InternalServerErrorException(
          'something went wrong while scanning the barcode to get order status, please try again later',
          error.message,
        );
      }
    }
  }

  //fetching all orders intransit
  async fetchallOngoingOrders(customer: CustomerEntity) {
    try {
      const findorder = await this.orderRepo.findAndCount({
        where: {
          customer: { id: customer.id },
          order_display_status:OrderDisplayStatus.IN_TRANSIT,
        },
        relations: ['customer', 'bid','items','items.vehicleType'],
        comment: 'fetching orders that are in transit ',
      });

      if (findorder[1] === 0)
        throw new NotFoundException(' you have no order in transit ');

      return findorder;
    } catch (error) {
      if (error instanceof NotFoundException)
        throw new NotFoundException(error.message);
      else {
        console.log(error);
        throw new InternalServerErrorException(
          'something went wrong while fetching all  orders in transit , please try again later',
          error.message,
        );
      }
    }
  }


  //fetching all orders intransit
  async fetchalldroppedoff(customer: CustomerEntity) {
    try {
      const findorder = await this.orderRepo.findAndCount({
        where: {
          customer: { id: customer.id },
          order_display_status:OrderDisplayStatus.COMPLETED
        },
        relations: ['customer', 'bid','items','items.vehicleType'],
        comment: 'fetching orders that have been dropped off ',
      });

      if (findorder[1] === 0)
        throw new NotFoundException(' you have no dropped off orders ');

      return findorder;
    } catch (error) {
      console.log(error);
      if (error instanceof NotFoundException)
        throw new NotFoundException(error.message);
      else {
        console.log(error);
        throw new InternalServerErrorException(
          'something went wrong while fetching all droppedoff orders, please try again later',
          error.message,
        );
      }
    }
  }

  //add cards
  async AddCards(
    dto: CardDetailsDto,
    customer: CustomerEntity,
  ): Promise<ICard> {
    try {
      //add new card
      const card = new CardEntity();
      card.cardNumber = dto.cardNumber;
      card.expiryMonth = dto.expiryMonth;
      card.expiryYear = dto.expiryYear;
      card.cvv = dto.cvv;
      card.card_owner = customer;
      card.addedAT = new Date();

      await this.cardRepo.save(card);

      //save the notification
      const notification = new Notifications();
      notification.account = customer.id;
      notification.subject = 'Customer Added a card!';
      notification.message = `the customer with id ${customer.id} have added a card from the admin in the app of ostra logistics `;
      await this.notificationripo.save(notification);

      return card;
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(
        'something went wrong when trying to add a card,please try again later',
        error.message,
      );
    }
  }

  //get all card

  async getAllCardsByCustomer(customer: CustomerEntity): Promise<CardEntity[]> {
    try {
      const cards = await this.cardRepo.find({
        where: { card_owner: { id: customer.id } },
        relations: ['card_owner'], // Ensure that the relation is correctly set in your CardEntity
        comment: 'Fetch all cards related to this user',
      });

      if (!cards || cards.length === 0) {
        throw new NotFoundException('You have no cards stored yet');
      }

      return cards;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      } else {
        console.error(error);
        throw new InternalServerErrorException(
          'Something went wrong when trying to fetch all your cards. Please try again later.',
          error.message,
        );
      }
    }
  }

  //get one card

  async GetOneCard(customer: CustomerEntity, cardID: number) {
    try {
      const findcard = await this.cardRepo.findOne({
        where: { card_owner: { id: customer.id }, id: cardID },
        relations: ['card_owner'],
        comment: 'fetching one card related to this user ',
      });

      if (!findcard)
        throw new NotFoundException(
          ` there is no card associated wit the cardID: ${cardID} `,
        );

      return findcard;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      } else {
        console.error(error);
        throw new InternalServerErrorException(
          'Something went wrong when trying to fetch all one card. Please try again later.',
          error.message,
        );
      }
    }
  }

  //delete one card

  async DeleteOneCard(customer: CustomerEntity, cardID: number) {
    try {
      const findcard = await this.cardRepo.findOne({
        where: { card_owner: { id: customer.id }, id: cardID },
        relations: ['card_owner'],
        comment: 'fetching one card and then deleting it ',
      });

      if (!findcard)
        throw new NotFoundException(
          ` there is no card associated wit the cardID: ${cardID} `,
        );

      //delete card
      await this.cardRepo.remove(findcard);

      //save the notification
      const notification = new Notifications();
      notification.account = customer.id;
      notification.subject = 'Customer Deleted a card!';
      notification.message = `the customer with id ${customer.id} have added a card with id: ${cardID}  in the customer app of ostra logistics `;
      await this.notificationripo.save(notification);

      return { message: 'card successfully deleted' };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      } else {
        console.error(error);
        throw new InternalServerErrorException(
          'Something went wrong when trying to delete a card. Please try again later.',
          error.message,
        );
      }
    }
  }

  //customer profile

  //update info for onboarding and for profile
  async UpdateCustomerInfo(
    dto: UpdateCustomerDto,
    customer: CustomerEntity,
  ): Promise<{ message: string }> {
    try {
      // Check if the provided email is already in use
      const existingCustomer = await this.customerRepo.findOne({
        where: { email: dto.email },
      });
      if (existingCustomer && existingCustomer.id !== customer.id) {
        throw new ConflictException('Email is already in use');
      }

      //add the updated data from the dto

      customer.LGA_of_Home_Address = dto.LGA_of_Home_Address;
      customer.RegisteredAt = new Date();
      customer.email = dto.email;
      customer.home_address = dto.home_address;
      customer.firstname = dto.firstname;
      customer.lastname = dto.lastname;
      customer.gender = dto.gender;

      await this.customerRepo.save(customer);

      //save the notification
      const notification = new Notifications();
      notification.account = customer.id;
      notification.subject = 'Customer Updated Record!';
      notification.message = `the customer with id ${customer.id} have updated their record in the customer app of ostra logistics `;
      await this.notificationripo.save(notification);

      return { message: 'changes to record made successfully' };
    } catch (error) {
      if (error instanceof ConflictException) {
        throw new ConflictException(error.message);
      } else {
        console.error(error);
        throw new InternalServerErrorException(
          'Something went wrong while trying to update the info of a customer. Please try again later.',
          error.message,
        );
      }
    }
  }

  // change password
  async changeCustomerPassword(
    dto: ChangePasswordDto,
    customer: CustomerEntity,
  ): Promise<{ message: string }> {
    try {
      const { oldPassword, password, confirmPassword } = dto;

      const comparepass = await this.genratorservice.comaprePassword(
        dto.oldPassword,
        customer.password,
      );
      if (!comparepass)
        throw new NotAcceptableException(
          'the old password provided does not match the existing passworod',
        );

      const hashpass = await this.genratorservice.hashpassword(dto.password);

      customer.password = hashpass;

      await this.customerRepo.save(customer);

      //save the notification
      const notification = new Notifications();
      notification.account = customer.id;
      notification.subject = 'Customer Changed Password!';
      notification.message = `the customer with id ${customer.id} have made changes to his existing record in the customer app of ostra logistics `;
      await this.notificationripo.save(notification);

      return { message: 'password changed successfully' };
    } catch (error) {
      if (error instanceof NotAcceptableException) {
        throw new NotAcceptableException(error.message);
      } else {
        console.error(error);
        throw new InternalServerErrorException(
          'Something went wrong while trying to change password. Please try again later.',
          error.message,
        );
      }
    }
  }

  //upload profile pics

  async UploadCustomerProfilePics(
    mediafile: Express.Multer.File,
    customer: CustomerEntity,
  ): Promise<{ message: string }> {
    try {
      const display_pics = await this.cloudinaryservice.uploadFile(mediafile);
      const mediaurl = display_pics.secure_url;

      //update the image url

      customer.profile_picture = mediaurl;

      await this.customerRepo.save(customer);

      //save the notification
      const notification = new Notifications();
      notification.account = customer.id;
      notification.subject = 'Customer Uploaded Profile Pics!';
      notification.message = `the customer with id ${customer.id} have uploaded a profile picture in the customer app of ostra logistics `;
      await this.notificationripo.save(notification);

      return { message: 'your profile picture has been uploaded successully ' };
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(
        'something went wrong during profile picture upload',
        error.message,
      );
    }
  }

  // track orderoffline for customer onboarding and for landing page
  async OfflineTrackOrder(keyword: string | any): Promise<IOrder> {
    try {
      //find order
      const trackorder = await this.orderRepo.findOne({
        where: { trackingID: ILike(`%${keyword}`) },
        relations: ['customer', 'bid', 'item', 'items.vehicleType'],
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
          'something went wrong while trackin an order, please try again later',
          error.message,
        );
      }
    }
  }

  //get all notifications related to the customer

  async AllNotificationsRelatedTocustomer(customer: CustomerEntity,) {
    try {
      const notification = await this.notificationripo.findAndCount({
        where: { account: customer.id },
      });
      if (notification[1] === 0)
        throw new NotFoundException(
          'oops! you have no notifications at this time',
        );

      return notification;
    } catch (error) {
      if (error instanceof NotFoundException)
        throw new NotFoundException(error.message);
      else {
        console.log(error);
        throw new InternalServerErrorException(
          'something went wrong while trying to fetch notifications',
          error.message,
        );
      }
    }
  }

  //get one notification and mark it as read
  async OpenOneNotificationRelatedTocustomer(customer: CustomerEntity,notificationId:number,dto:markNotificationAsReadDto) {
    try {
      const notification = await this.notificationripo.findOne({
        where: { id:notificationId,account: customer.id },
      });
      if (!notification)
        throw new NotFoundException(
          'notification not found',
        );

        if (dto){
          notification.isRead = dto.isRead
          await this.notificationripo.save(notification)
        }

      return notification;
    } catch (error) {
      if (error instanceof NotFoundException)
        throw new NotFoundException(error.message);
      else {
        console.log(error);
        throw new InternalServerErrorException(
          'something went wrong while trying to fetch a notifications',
          error.message,
        );
      }
    }
  }


  //get one notification and mark it as read
  async DeleteOneNotificationRelatedTocustomer(customer: CustomerEntity,notificationId:number) {
    try {
      const notification = await this.notificationripo.findOne({
        where: { id:notificationId,account: customer.id },
      });
      if (!notification)
        throw new NotFoundException(
          'notification not found',
        );

       await this.notificationripo.remove(notification)
      return notification;

      
    } catch (error) {
      if (error instanceof NotFoundException)
        throw new NotFoundException(error.message);
      else {
        console.log(error);
        throw new InternalServerErrorException(
          'something went wrong while trying to delete a notification',
          error.message,
        );
      }
    }
  }

  // sign up for newsletter
  async SubsribeToNewsLetter(dto: NewsLetterDto) {
    try {
      const emailExists = await this.newsletterripo.findOne({
        where: { email: dto.email },
      });
      if (emailExists)
        throw new ConflictException(
          'user with email address already subscribed, please use another email address',
        );

      //subscribe
      const newSubscriber = new NewsLetterEntity();
      newSubscriber.email = dto.email;
      newSubscriber.firstname = dto.firstname;
      newSubscriber.lastname = dto.lastname;
      newSubscriber.SubscribedAt = new Date();

      await this.newsletterripo.save(newSubscriber);

      //notifiction
      const notification = new Notifications();
      notification.account = dto.email;
      notification.subject = 'News Letter Subscription!';
      notification.message = `the customer with email ${newSubscriber.email} have sunscribed to the ostra logistics news letter `;
      await this.notificationripo.save(notification);

      return {
        message:
          'you have successully subscribed to ostra logistics news letter',
      };
    } catch (error) {
      if (error instanceof ConflictException)
        throw new ConflictException(error.message);
      else {
        console.log(error);
        throw new InternalServerErrorException(
          'something went wrong while subscribing for news letter, please try again later',
          error.message,
        );
      }
    }
  }

  //file a complaint and get a ticket
  async FileComplaint(dto: ComplaintDto, customer: CustomerEntity) {
    try {
      const ticket = `#${await this.genratorservice.generateComplaintTcket()}`;

      //file complaint
      const newcomplaint = new ComplaintEntity();
      newcomplaint.complaints = dto.complaint;
      newcomplaint.createdAt = new Date();
      newcomplaint.customer = customer;
      newcomplaint.ticket = ticket;
      newcomplaint.channel = channelforconversation.OPEN;
      newcomplaint.status = complainResolutionStatus.IN_PROGRESS;

      await this.complaintripo.save(newcomplaint);

      //notifiction
      const notification = new Notifications();
      notification.account = customer.id;
      notification.subject = 'complaint filed!';
      notification.message = `the customer with id ${customer.id} have filed a complaint on ostra logistics customer app `;
      await this.notificationripo.save(notification);

      return {
        message:
          'you have succefully filed a complaint, here is your ticket, please query this over time to track the compliant status of your issue.',
        ticket,
      };
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(
        'something went wrong while filing a complaint, please try again later.',
        error.message,
      );
    }
  }

  async CheckComplaintStatus(keyword: string | any) {
    try {
      //find order
      const complaint = await this.complaintripo.findOne({
        where: { ticket: ILike(`%${keyword}`) },
        relations: ['customer', 'replies'],
        cache: false,
        comment: 'checking the status of an issue ticket',
      });
      if (!complaint)
        throw new NotFoundException(
          `oops! this ticket ${keyword} is not associated with any complient filed in ostra logistics`,
        );

      return complaint;
    } catch (error) {
      if (error instanceof NotFoundException)
        throw new NotFoundException(error.message);
      else {
        console.log(error);
        throw new InternalServerErrorException(
          'something went wrong while trying to get the ststus of a complaint filed, please try again later',
          error.message,
        );
      }
    }
  }

}
