import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminCustomerDashBoardService } from './admin.customers.dashboard.service';
import { AdminPlaceBidDto, counterBidDto } from 'src/common/common.dto';
import { JwtGuard } from 'src/auth/guard/jwt.guard';

@UseGuards(JwtGuard)
@Controller('admin-customer-dashboard')
export class AdminCustomerDashBoardController {
  constructor(
    private readonly admincustomerservice: AdminCustomerDashBoardService,
  ) {}

  @Get('pending-orders')
  async GetAllPendingOrders(
    @Query('page') page: number,
    @Query('limit') limit: number,
  ) {
    return await this.admincustomerservice.GetOrdersThatArePending(page, limit);
  }

  @Post('initial-bid/:orderID')
  async MakeFirstBid(
    @Body() dto: AdminPlaceBidDto,
    @Param('orderID') orderID: number,
  ) {
    return await this.admincustomerservice.MakeOpenningBid(orderID, dto);
  }

  @Patch('counter-bid/:BidID')
  async CounterBid(
    @Body() dto: counterBidDto,
    @Param('BidID') BidID: number,
  ) {
    return await this.admincustomerservice.counterCustomerCouterBid(BidID, dto);
  }

  @Get('inTransit-orders')
  async GetAllOrdersInTransit(
    @Query('page') page: number,
    @Query('limit') limit: number,
  ) {
    return await this.admincustomerservice.GetOrdersThatAreInTransit(
      page,
      limit,
    );
  }

  @Get('pickedup-orders')
  async GetAllPickedUpOrders(
    @Query('page') page: number,
    @Query('limit') limit: number,
  ) {
    return await this.admincustomerservice.GetOrdersThatArePickedUp(
      page,
      limit,
    );
  }

  @Get('droppedoff-orders')
  async GetAllDroppedOffOrders(
    @Query('page') page: number,
    @Query('limit') limit: number,
  ) {
    return await this.admincustomerservice.GetOrdersThatAreDelivered(
      page,
      limit,
    );
  }

  @Get('all-customers')
  async GetAllCustomers(
    @Query('page') page: number,
    @Query('limit') limit: number,
  ) {
    return await this.admincustomerservice.GetAllCustomers(page, limit);
  }

  @Get('one-customer/:customerID')
  async GetOneCustomer(@Param('customerID') customerID: string) {
    return await this.admincustomerservice.GetOneCustomer(customerID);
  }

  @Get('track-order/')
  async TrackOrder(@Query('keyword') keyword: string | any) {
    await this.admincustomerservice.TrackOrder(keyword);
  }
}
