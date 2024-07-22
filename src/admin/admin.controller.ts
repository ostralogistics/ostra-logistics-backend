import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UploadedFile, UseGuards, UseInterceptors } from "@nestjs/common";
import { AdminService } from "./admin.service";
import { JwtGuard } from "src/auth/guard/jwt.guard";
import { ChannelDto, DiscountDto, PriceListDto, RegisterVehicleDto, ReplyDto, ReturnedVehicleDto, UpdateAdminDto, UpdateDiscountDto, UpdatePriceListDto, UpdateVehicleDto, VehicleTypeDto, updateResolutionStatusDto } from "./admin.dto";
import { FileInterceptor } from "@nestjs/platform-express";
import { RoleGuard } from "src/auth/guard/role.guard";
import { Roles } from "src/auth/decorator/role.decorator";
import { AdminAccessLevels, AdminType, Role } from "src/Enums/all-enums";
import { AdminTypeGuard } from "src/auth/guard/admintype.guard";
import { AdminTypes } from "src/auth/decorator/admintype.decorator";
import { AdminAcessLevelGuard } from "src/auth/guard/accesslevel.guard";
import { AdminAccessLevel } from "src/auth/decorator/accesslevel.decorator";
import { ChangePasswordDto, ComplaintDto, markNotificationAsReadDto } from "src/customer/customer.dto";
import { ApplypromoCodeDto } from "src/common/common.dto";

@UseGuards(JwtGuard,RoleGuard,AdminTypeGuard,AdminAcessLevelGuard)
@Roles(Role.ADMIN)
@AdminTypes(AdminType.CEO,AdminType.STAFF)


@Controller('admin')
export class Admincontroller{
    constructor(private readonly adminservice:AdminService){}

    @AdminAccessLevel(AdminAccessLevels.LEVEL3)
    @Patch('update-profile')    
    async UpdateProfile(@Body()dto:UpdateAdminDto, @Req()req){
        return await this.adminservice.EditAdminProfile(dto,req.user)
    }

    @AdminAccessLevel(AdminAccessLevels.LEVEL3)
    @Patch('upload-profile-pics')
    @UseInterceptors(FileInterceptor('image')) 
    async UpdateProfilePics(@Body()dto:UpdateAdminDto, @Req()req, @UploadedFile()file:Express.Multer.File){
        return await this.adminservice.UploadAdminProfilePics(file,req.user)
    }

    @AdminAccessLevel(AdminAccessLevels.LEVEL3)
    @Patch('change-password')
    async ChangePassword(@Body()dto:ChangePasswordDto,@Req()req){
     return await this.adminservice.changeCustomerPassword(dto,req.user)
    }




    @AdminAccessLevel(AdminAccessLevels.LEVEL3,AdminAccessLevels.LEVEL2)
    @Post('add-vehicleType')
    async AddVehicleType(@Body()dto:VehicleTypeDto){
        return await this.adminservice.AddVehicleType(dto)
    }

    @AdminAccessLevel(AdminAccessLevels.LEVEL3,AdminAccessLevels.LEVEL2,AdminAccessLevels.LEVEL1)
    @Get('all-vehicleType')
    async GetAllVehicleTypes(){
        return await this.adminservice.GetAllVehicleType()
    }

    @AdminAccessLevel(AdminAccessLevels.LEVEL3,AdminAccessLevels.LEVEL2,AdminAccessLevels.LEVEL1)
    @Get('one-vehicleType/:vehicletypeID')
    async GetOneVehicletype(@Param('vehicletypeID')vehicletypeID:number){
        return await this.adminservice.GetOneVehicleType(vehicletypeID)
    }

    @AdminAccessLevel(AdminAccessLevels.LEVEL3,AdminAccessLevels.LEVEL2)
    @Delete('delete-vehicleType/:vehicletypeID')
    async DeleteVehicletype(@Param('vehicletypeID')vehicletypeID:number){
        return await this.adminservice.DeleteOneVehicleType(vehicletypeID)
    }



    @AdminAccessLevel(AdminAccessLevels.LEVEL3,AdminAccessLevels.LEVEL2)
    @Post('register-vehicle')
    @UseInterceptors(FileInterceptor('image'))
    async RegisterVehicle(@Body()dto:RegisterVehicleDto,@UploadedFile()file:Express.Multer.File){
        return await this.adminservice.RegisterVehicle(dto,file)
    }
    

    @AdminAccessLevel(AdminAccessLevels.LEVEL3,AdminAccessLevels.LEVEL2)
    @Patch('update-vehicle-info/:vehicleID')
    @UseInterceptors(FileInterceptor('image'))
    async UpdateVehicle(@Body()dto:UpdateVehicleDto,@Param('vehicleID')vehicleID:number,@UploadedFile()file:Express.Multer.File){
        return await this.adminservice.updateVehicle(dto,file,vehicleID)
    }

    @AdminAccessLevel(AdminAccessLevels.LEVEL3,AdminAccessLevels.LEVEL2)
    @Delete('delete-vehicle/:vehicleID')
    async DeleteVehicle(@Param('vehicleID')vehicleID:number){
        return await this.adminservice.DeleteVehicle(vehicleID)
    }

    @AdminAccessLevel(AdminAccessLevels.LEVEL3,AdminAccessLevels.LEVEL2,AdminAccessLevels.LEVEL1)
    @Get('all-vehicles')
    async GetAllVehicle(){
        return await this.adminservice.fetchAllVehicle()
    }

    @AdminAccessLevel(AdminAccessLevels.LEVEL3,AdminAccessLevels.LEVEL2,AdminAccessLevels.LEVEL1)
    @Get('/search-vehicle')
    async SearchVehicle(
      @Query('keyword') keyword: string,
      @Query('page') page?: number,
      @Query('perPage') perPage?: number,
      @Query('sort') sort?: string,) {
      return await this.adminservice.SearchVehicle(keyword,page,perPage,sort);
    }


    @AdminAccessLevel(AdminAccessLevels.LEVEL3,AdminAccessLevels.LEVEL2,AdminAccessLevels.LEVEL1)
    @Get('one-vehicle/:vehicleID')
    async GetOneVehicle(@Param('vehicleID')vehicleID:number){
        return await this.adminservice.fetchOneVehicle(vehicleID)
    }

    @AdminAccessLevel(AdminAccessLevels.LEVEL3,AdminAccessLevels.LEVEL2,AdminAccessLevels.LEVEL1)
    @Post('assign-vehicle/:vehicleID/:riderID')
    async AssignVehicle(@Param('vehicleID')vehicleID:number,@Param('riderID')riderID:string){
        return await this.adminservice.assignAVhicleToADriver(riderID,vehicleID)
    }

    @AdminAccessLevel(AdminAccessLevels.LEVEL3,AdminAccessLevels.LEVEL2,AdminAccessLevels.LEVEL1)
    @Patch('report-vehicle-return/:vehicleID/:riderID')
    async ReturnVehile(@Param('vehicleID')vehicleID:number,@Param('riderID')riderID:string,@Body()dto:ReturnedVehicleDto){
        return await this.adminservice.ReportVehicleReturnStatus(dto,vehicleID,riderID)
    }

    @AdminAccessLevel(AdminAccessLevels.LEVEL3,AdminAccessLevels.LEVEL2,AdminAccessLevels.LEVEL1)
    @Get('all-complaints')
    async FetchAllComplaints(){
        return await this.adminservice.FetchAllComplaint()
    }

    @AdminAccessLevel(AdminAccessLevels.LEVEL3,AdminAccessLevels.LEVEL2,AdminAccessLevels.LEVEL1)
    @Get('one-complaint/:complaintID')
    async FetchOneComplaints(@Param('complaintID') complaintID:number){
        return await this.adminservice.FetchOneComplaint(complaintID)
    }

    @AdminAccessLevel(AdminAccessLevels.LEVEL3,AdminAccessLevels.LEVEL2,AdminAccessLevels.LEVEL1)
    @Post('reply-complaint/:complaintID')
    async ReplyCompliant(@Param('complaintID')compliantID:number, @Body()dto:ReplyDto,@Req()req){
        return await this.adminservice.ReplyComplaint(req.user.id,dto,compliantID)
    }

    @AdminAccessLevel(AdminAccessLevels.LEVEL3,AdminAccessLevels.LEVEL2)
    @Delete('delete-complaint/:complaintID')
    async DeleteCompliant(@Param('complaintID')compliantID:number){
        return await this.adminservice.deleteResolvedcomplain(compliantID)
    }

    @AdminAccessLevel(AdminAccessLevels.LEVEL3,AdminAccessLevels.LEVEL2,AdminAccessLevels.LEVEL1)
    @Patch('change-channel-status/:complaintID')
    async changeChannelStatus(@Param('complaintID')compliantID:number, @Body()dto:ChannelDto){
        return await this.adminservice.changeChannelStatus(dto,compliantID)
    }

    @AdminAccessLevel(AdminAccessLevels.LEVEL3,AdminAccessLevels.LEVEL2,AdminAccessLevels.LEVEL1)
    @Patch('change-resolution-status/:complaintID')
    async changeResolutionStatus(@Param('complaintID')compliantID:number, @Body()dto:updateResolutionStatusDto){
        return await this.adminservice.changeresolutionStatus(dto,compliantID)
    }

    @AdminAccessLevel(AdminAccessLevels.LEVEL3,AdminAccessLevels.LEVEL2)
    @Post('assign-complaint/:complaintID/:staffID')
    async AssignComplaintToStaff(@Param('complaintID')complaintID:number,@Param('staffID')staffID:string){
        return await this.adminservice.assignAcomplaintToAstaff(complaintID,staffID)
    }

    @AdminAccessLevel(AdminAccessLevels.LEVEL3,AdminAccessLevels.LEVEL2,AdminAccessLevels.LEVEL1)
    @Get('/search-complaint')
    async SearchStaff(
      @Query('keyword') keyword: string,
      @Query('page') page?: number,
      @Query('perPage') perPage?: number,
      @Query('sort') sort?: string,) {
      return await this.adminservice.SearchForComplaints(keyword,page,perPage,sort);
    }


    @AdminAccessLevel(AdminAccessLevels.LEVEL3,AdminAccessLevels.LEVEL2,AdminAccessLevels.LEVEL1)
    @Post('file-complaint')
    async filecomplaint(@Req()req, @Body()dto:ComplaintDto){
        return await this.adminservice.FileComplaintfromAdmin(dto,req.user.id)
    }

    //dicount 
    @AdminAccessLevel(AdminAccessLevels.LEVEL3,AdminAccessLevels.LEVEL2)
    @Post('set-discount')
    async SetDiscount(@Body()dto:DiscountDto){
        return await this.adminservice.SetDiscountAndDuration(dto)
    }

    @AdminAccessLevel(AdminAccessLevels.LEVEL3,AdminAccessLevels.LEVEL2,AdminAccessLevels.LEVEL1)
    @Get('fetch-discount')
    async GetDiscount(){
        return await this.adminservice.GetDiscount()
    }

    @AdminAccessLevel(AdminAccessLevels.LEVEL3,AdminAccessLevels.LEVEL2)
    @Patch('update-discount/:discountID')
    async UpdateDiscount(@Body()dto:UpdateDiscountDto, @Param('discountID')discountID:number){
        return await this.adminservice.Updatediscount(dto,discountID)
    }

    @AdminAccessLevel(AdminAccessLevels.LEVEL3,AdminAccessLevels.LEVEL2)
    @Delete('delete-discount/:discountID')
    async DeleteDiscount( @Param('discountID')discountID:number){
        return await this.adminservice.deleteDiscount(discountID)
    }


    @AdminAccessLevel(AdminAccessLevels.LEVEL3,AdminAccessLevels.LEVEL2,AdminAccessLevels.LEVEL1)
    @Post('create-priceList')
    async CreatePriceist(@Body()dto:PriceListDto){
        return await this.adminservice.PriceList(dto)
    }

    @AdminAccessLevel(AdminAccessLevels.LEVEL3,AdminAccessLevels.LEVEL2,AdminAccessLevels.LEVEL1)
    @Patch('update-priceList/:pricelistID')
    async UpdatePriceist(@Body()dto:UpdatePriceListDto, @Param('pricelistID')pricelistId:number){
        return await this.adminservice.UpdatePriceList(dto,pricelistId)
    }

    @AdminAccessLevel(AdminAccessLevels.LEVEL3,AdminAccessLevels.LEVEL2,AdminAccessLevels.LEVEL1)
    @Get('/search-pricelist')
    async SearchPricelist(
      @Query('keyword') keyword: string,
      @Query('page') page?: number,
      @Query('perPage') perPage?: number,
      @Query('sort') sort?: string,) {
      return await this.adminservice.SearchPricelist(keyword,page,perPage,sort);
    }


    @AdminAccessLevel(AdminAccessLevels.LEVEL3,AdminAccessLevels.LEVEL2)
    @Delete('delete-priceList/:pricelistID')
    async DeletePriceist( @Param('pricelistID')pricelistId:number){
        return await this.adminservice.DeletePriceList(pricelistId)
    }

    @AdminAccessLevel(AdminAccessLevels.LEVEL3,AdminAccessLevels.LEVEL2,AdminAccessLevels.LEVEL1)
    @Get('all-priceList')
    async AllPriceLists( @Query('limit')limit:number, @Query('page')page:number){
        return await this.adminservice.GetAllPriceList(page,limit)
    }

    @AdminAccessLevel(AdminAccessLevels.LEVEL3,AdminAccessLevels.LEVEL2,AdminAccessLevels.LEVEL1)
    @Get('one-priceList/:pricelistID')
    async OnePriceLists( @Param("pricelistID")pricelistID:number){
        return await this.adminservice.GetOnePriceList(pricelistID)
    }


    @AdminAccessLevel(AdminAccessLevels.LEVEL3,AdminAccessLevels.LEVEL2,AdminAccessLevels.LEVEL1)
    @Get('all-subscribers')
    async AllNewsLetterSubscribers( @Query('limit')limit:number, @Query('page')page:number){
        return await this.adminservice.GetAllNewsLetterSubscribers(page,limit)
    }


    @Get('all-notification')
    async GetAllMyNotification(){
     return await this.adminservice.AllNotifications()
    }

    @Patch('one-notification/:notificationId')
    async GetOneOfMyNotification(@Req()req,@Param('notificationId')notificationId:number,@Body()dto:markNotificationAsReadDto){
     return await this.adminservice.OpenOneNotification(notificationId,dto)
    }

    @Delete('delete-one-notification/:notificationId')
    async DeleteOneOfMyNotification(@Req()req,@Param('notificationId')notificationId:number){
     return await this.adminservice.DeleteOneNotification(notificationId)
    }

    @Get('active-order-count')
    @AdminAccessLevel(AdminAccessLevels.LEVEL3,AdminAccessLevels.LEVEL2,AdminAccessLevels.LEVEL1)
    async ActiveOrderCount(){
        return await this.adminservice.activeorderCount()
    }

    @Get('pending-order-count')
    @AdminAccessLevel(AdminAccessLevels.LEVEL3,AdminAccessLevels.LEVEL2,AdminAccessLevels.LEVEL1)
    async pendingOrderCount(){
        return await this.adminservice.activependingCount()
    }

    @Get('completed-order-count')
    @AdminAccessLevel(AdminAccessLevels.LEVEL3,AdminAccessLevels.LEVEL2,AdminAccessLevels.LEVEL1)
    async CompletedOrderCount(){
        return await this.adminservice.activecompletedCount()
    }

    @Get('all-order-count')
    @AdminAccessLevel(AdminAccessLevels.LEVEL3,AdminAccessLevels.LEVEL2,AdminAccessLevels.LEVEL1)
    async AllOrderCount(){
        return await this.adminservice.AllorderCount()
    }

    @Get('delivery-payment-count')
    @AdminAccessLevel(AdminAccessLevels.LEVEL3,AdminAccessLevels.LEVEL2,AdminAccessLevels.LEVEL1)
    async SuccessfullyPaid(){
        return await this.adminservice.DeliveryPaymentCount()
    }

    @AdminAccessLevel(AdminAccessLevels.LEVEL3,AdminAccessLevels.LEVEL2,AdminAccessLevels.LEVEL1)
    @Get('calculate-total-revenue')
    async getTotalRevenue() {
      return this.adminservice.calculateTotalRevenue();
    }


    //graph data 
    @Get('delivery-volume-hourly')
    async getHourlyRevenue() {
      return this.adminservice.calculateHourlyRevenue();
    }




    


   






    



}