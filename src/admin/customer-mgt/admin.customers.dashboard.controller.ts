import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AdminCustomerDashBoardService } from './admin.customers.dashboard.service';
import { AdminPlaceBidDto, ApplypromoCodeDto, InOfficeOrderDto, OrderDto, adminCheckOutDto, counterBidDto } from 'src/common/common.dto';
import { JwtGuard } from 'src/auth/guard/jwt.guard';
import { AdminAccessLevels, AdminType, DeliveryVolume, OrderBasedOnDates, Role } from 'src/Enums/all-enums';
import { RoleGuard } from 'src/auth/guard/role.guard';
import { Roles } from 'src/auth/decorator/role.decorator';
import { AdminTypeGuard } from 'src/auth/guard/admintype.guard';
import { AdminTypes } from 'src/auth/decorator/admintype.decorator';
import { AdminAcessLevelGuard } from 'src/auth/guard/accesslevel.guard';
import { AdminAccessLevel } from 'src/auth/decorator/accesslevel.decorator';
import { Response } from 'express';



@UseGuards(JwtGuard,RoleGuard,AdminTypeGuard,AdminAcessLevelGuard)
@Roles(Role.ADMIN)
@AdminTypes(AdminType.STAFF,AdminType.CEO)
@AdminAccessLevel(AdminAccessLevels.LEVEL1, AdminAccessLevels.LEVEL2,AdminAccessLevels.LEVEL3)


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
  async CounterBid(@Body() dto: counterBidDto, @Param('BidID') BidID: number) {
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

  @Get('orders-based-on-dates')
  async GetOrdersBasedOnDates(
    @Query('timeRange') timeRange: OrderBasedOnDates = OrderBasedOnDates.TODAY,
    @Query('page') page: number,
    @Query('limit') limit: number,
  ) {
    return await this.admincustomerservice.GetOrdersBasedOnDates(
      page,
      limit,
      timeRange,
    );
  }

  @Get('delivery-volume')
  async GetDeliveryVolume(
    @Query('timeRange') timeRange: DeliveryVolume = DeliveryVolume.DAY,
  ) {
    return await this.admincustomerservice.GetDeliveryVolume(timeRange);
  }

  //counts 
  @Get('active-orders-count')
  async GetAllActiveOrdersCount(){
    return await this.admincustomerservice.getAllActiveOrdersCount()

  }

  @Get('pending-orders-count')
  async GetAllPendingOrdersCount(){
    return await this.admincustomerservice.getAllPendingOrderCount()

  }

  @Get('completed-orders-count')
  async GetAllCompletedOrdersCount(){
    return await this.admincustomerservice.getAllCompletedOrderCount()

  }

  @Get('branding-orders-count')
  async GetAllInOfficeForrandingOrdersCount(){
    return await this.admincustomerservice.getAllOrdersInTheOfficeCount()

  }

  //counts based on dates

  @Get('active-orders-count-based-on-dates')
  async GetActiveOrdersBasedOnDates(
    @Query('timeRange') timeRange: OrderBasedOnDates = OrderBasedOnDates.TODAY,) {
    return await this.admincustomerservice.getActiveOrderCountBasedOnDate( timeRange);
  }

  @Get('pending-orders-count-based-on-dates')
  async GetPendingOrdersBasedOnDates(
    @Query('timeRange') timeRange: OrderBasedOnDates = OrderBasedOnDates.TODAY,) {
    return await this.admincustomerservice.getPendingOrderCountBasedOnDate( timeRange);
  }

  @Get('completed-orders-count-based-on-dates')
  async GetCompletedOrdersBasedOnDates(
    @Query('timeRange') timeRange: OrderBasedOnDates = OrderBasedOnDates.TODAY,) {
    return await this.admincustomerservice.getCompletedOrderCountBasedOnDate( timeRange);
  }

  @Get('inshop-branding-orders-count-based-on-dates')
  async GetBrandingOrdersBasedOnDates(
    @Query('timeRange') timeRange: OrderBasedOnDates = OrderBasedOnDates.TODAY,) {
    return await this.admincustomerservice.getofficeBrandingOrderCountBasedOnDate( timeRange);
  }


  // process payment
  @Post('process-payment-in-office-order/:orderID')
  async PayWithPaystackForTheOrder(@Param('orderID')orderID:number){
     return await this.admincustomerservice.processPayment(orderID)
  }


  //generate air waybill
  @Get('generate-airwaybill/:trackingID')
  async CreateAirWaybill(@Param('trackingID')trackingID:string){
    return await this.admincustomerservice.createAirWaybill(trackingID)
  }


  @Post('admin-cart-items')
  async MakeOrder(@Req()req, @Body()dto:InOfficeOrderDto){
      return await this.admincustomerservice.AdminaddToOrderCart(req.user,dto)
  }

  @Delete('admin-remove-item-from-cart/:cartItemID')
  async RemoveOrderFromCart(@Req()req, @Param('cartItemID')cartItemID:string){
      return await this.admincustomerservice.AdminRemoveItemFromCart(cartItemID,req.user)
  }

  @Get('admin-get-cart')
  async GetCart(@Req()req){
      return await this.admincustomerservice.getAdminCart(req.user)
  }

  @Post('admin-checkout')
  async CheckOut(@Req()req, @Body()dto:adminCheckOutDto){
      return await this.admincustomerservice.CheckOut(req.user,dto)
  }


  @Get('one-customer-total-order-count/:customerID')
  async GetCustomerOrderCount(@Param('customerID')customerID:string){
      return await this.admincustomerservice.getTotalOrdersByCustomer(customerID)
  }

  @Get('total-revenue-one-cutomer/:customerID')
  async getTotalRevenueOneCustomer(@Param('customerID')customerID:string){
      return await this.admincustomerservice.getTotalRevenueByCustomer(customerID)
  }


}
