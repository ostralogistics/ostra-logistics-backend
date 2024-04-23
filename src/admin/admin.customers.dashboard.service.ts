import { InjectRepository } from '@nestjs/typeorm';
import { AdminEntity } from 'src/Entity/admins.entity';
import { AdminRepository } from './admin.repository';
import { CustomerEntity } from 'src/Entity/customers.entity';
import { CustomerRepository } from 'src/customer/customer.repository';
import { BidRepository } from 'src/common/common.repositories';
import { BidEntity, IBids, IInitialBidsResponse } from 'src/Entity/bids.entity';
import { IOrder, IOrderRequestFromCustomerToAdmin } from 'src/order/order';
import { OrderRepository } from 'src/order/order.reposiroty';
import { OrderEntity } from 'src/Entity/orders.entity';
import { BidEvent, BidStatus, OrderStatus } from 'src/Enums/all-enums';
import {
  Injectable,
  InternalServerErrorException,
  NotAcceptableException,
  NotFoundException,
} from '@nestjs/common';
import { AdminPlaceBidDto, counterBidDto } from 'src/common/common.dto';
import { BidEventsService } from 'src/common/Events/bid.events.service';
import { ILike } from 'typeorm';

@Injectable()
export class AdminCustomerDashBoardService {
  constructor(
    @InjectRepository(AdminEntity) private readonly adminrepo: AdminRepository,
    @InjectRepository(CustomerEntity)
    private readonly customerRepo: CustomerRepository,
    @InjectRepository(OrderEntity) private readonly orderRepo: OrderRepository,
    @InjectRepository(BidEntity) private readonly bidRepo: BidRepository,
    private readonly bidevent: BidEventsService,
  ) {}

  //query orders

  async GetOrdersThatArePending(page: number = 1, limit: number = 20) {
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
        relations: ['bid'],
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
  async GetAllCustomers(page: number = 1, limit: number = 20) {
    try {
      const skip = (page - 1) * limit;
      const customers = await this.customerRepo.findAndCount({
        relations: ['my_orders'],
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

async GetOneCustomer(customerID:string) {
  try {
   
    const customers = await this.customerRepo.findOne({where:{id:customerID},
      relations: ['my_orders'],
     
    });
    if (!customers)
      throw new NotFoundException('the customer with the passed ID does not exist');

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
  async GetOrdersThatAreInTransit(page: number = 1, limit: number = 20) {
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

  async GetOrdersThatAreDelivered(page: number = 1, limit: number = 20) {
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

  async GetOrdersThatArePickedUp(page: number = 1, limit: number = 20) {
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

  // track order
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

  // and so on....
}
