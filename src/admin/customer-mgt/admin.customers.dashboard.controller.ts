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



@UseGuards(JwtGuard,RoleGuard,AdminTypeGuard,AdminAcessLevelGuard)
@Roles(Role.ADMIN)
@AdminTypes(AdminType.STAFF,AdminType.CEO)
@AdminAccessLevel(AdminAccessLevels.LEVEL1, AdminAccessLevels.LEVEL2,AdminAccessLevels.LEVEL3)


@Controller('admin-customer-dashboard')
export class AdminCustomerDashBoardController {
  constructor(
    private readonly admincustomerservice: AdminCustomerDashBoardService,
  ) {}


  

  @Get('all-orders')
  async GetAllOrders(
    @Query('page') page: number,
    @Query('limit') limit: number,
  ) {
    return await this.admincustomerservice.GetOrders(page, limit);
  }



  @Get('one-order/:orderID')
  async GetOneOrders(
    @Param('orderID') orderID: number,
  ) {
    return await this.admincustomerservice.GetOneOrder(orderID);
  }

  @Get('receipt/:orderID')
  async GetReceipt(
    @Param('orderID') orderID: number,
  ) {
    return await this.admincustomerservice.GetOrderReceipt(orderID);
  }



  @Get('pending-orders')
  async GetAllPendingOrders(
    @Query('page') page: number,
    @Query('limit') limit: number,
  ) {
    return await this.admincustomerservice.GetOrdersThatArePending(page, limit);
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


  @Get('completed-orders')
  async GetAllDroppedOffOrders(
    @Query('page') page: number,
    @Query('limit') limit: number,
  ) {
    return await this.admincustomerservice.GetOrdersThatAreDelivered(
      page,
      limit,
    );
  }


  @Get('just-placed-orders')
  async GetAllJustPlacedOrder(
    @Query('page') page: number,
    @Query('limit') limit: number,
  ) {
    return await this.admincustomerservice.GetOrdersThatAreJustPlaced(
      page,
      limit,
    );
  }

  @Get('declined-orders')
  async GetAllDeclinedOffOrders(
    @Query('page') page: number,
    @Query('limit') limit: number,
  ) {
    return await this.admincustomerservice.GetOrdersThatAreDeclined(
      page,
      limit,
    );
  }


  @Post('initial-bid/:orderID')
  async MakeFirstBid(
    @Body() dto: AdminPlaceBidDto,
    @Param('orderID') orderID: number,
    @Req()req
  ) {
    return await this.admincustomerservice.MakeOpenningBid(orderID, dto,req.user);
  }

  @Patch('counter-bid/:BidID')
  async CounterBid(@Body() dto: counterBidDto, @Param('BidID') BidID: number, @Req()req) {
    return await this.admincustomerservice.counterCustomerCouterBid(BidID, dto,req.user);
  }

  @Patch('accept-a-counter-bid/:BidID')
  async AcceptCounterBid( @Param('BidID') BidID: number, @Req()req) {
    return await this.admincustomerservice.AcceptCounterOffer(BidID,req.user);
  }

  @Get('fetch-all-bids')
  async FetchAllBid() {
    return await this.admincustomerservice.FetchAllBids();
  }


  @Get('fetch-one-bid/:bidID')
  async FetchoneBid(@Param('bidID')bidID:number) {
    return await this.admincustomerservice.FetchOneBid(bidID);
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


  @Get('/search-customer')
  async SearchStaff(
    @Query('keyword') keyword: string,
    @Query('page') page?: number,
    @Query('perPage') perPage?: number,
    @Query('sort') sort?: string,) {
    return await this.admincustomerservice.SearchForCustomer(keyword,page,perPage,sort);
  }

  @Get('track-order/')
  async TrackOrder(@Query('keyword') keyword: string | any) {
    await this.admincustomerservice.TrackOrder(keyword);
  }

  @Get('/search-order')
  async SearchOrder(
    @Query('keyword') keyword: string,
    @Query('page') page?: number,
    @Query('perPage') perPage?: number,
    @Query('sort') sort?: string,) {
    return await this.admincustomerservice.SearchForanOrder(keyword,page,perPage,sort);
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

  @Post('generate-order-receipt/:orderID')
  async GenerateReceipt(@Param('orderID')orderID:number){
    return await this.admincustomerservice.createReceipt(orderID)
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
      return await this.admincustomerservice.getTotalOrdersCountByCustomer(customerID)
  }


  @Get('one-customer-pending-order-count/:customerID')
  async GetCustomerPendingOrderCount(@Param('customerID')customerID:string){
      return await this.admincustomerservice.getTotalPendingOrdersCountByCustomer(customerID)
  }

  @Get('one-customer-delivered-order-count/:customerID')
  async GetCustomerDeliveredOrderCount(@Param('customerID')customerID:string){
      return await this.admincustomerservice.getTotalPendingOrdersCountByCustomer(customerID)
  }

  @Get('total-revenue-one-customer/:customerID')
  async getTotalRevenueOneCustomer(@Param('customerID')customerID:string){
      return await this.admincustomerservice.getTotalRevenueByCustomer(customerID)
  }

  @Get('customer-payment-transactions/:customerID')
  async CustomerPaymentHistory(@Param('customerID')customerID:string){
      return await this.admincustomerservice.getPaymenthistoryOfOneCustomer(customerID)
  }

  @Delete('delete-customer/:customerID')
  async DeleteCustomer(@Param('customerID')customerID:string){
      return await this.admincustomerservice.DeleteCustomer(customerID)
  }



}
