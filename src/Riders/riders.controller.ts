import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from "@nestjs/common";
import { RiderService } from "./riders.service";
import { JwtGuard } from "src/auth/guard/jwt.guard";
import { AcceptOrDeclineTaskDto, CancelRideDto, ChangeBankPreferenceDto, DropOffCodeDto, MakeRequestDto } from "./riders.dto";
import { RoleGuard } from "src/auth/guard/role.guard";
import { Roles } from "src/auth/decorator/role.decorator";
import { Role } from "src/Enums/all-enums";
import { markNotificationAsReadDto } from "src/customer/customer.dto";

@UseGuards(JwtGuard,RoleGuard)
@Roles(Role.RIDER)
@Controller('rider')
export class RiderController{
    constructor(private readonly riderservice:RiderService){}

    @Get('all-orders')
    async getAllAsignedOrder(@Req()req){
        return await this.riderservice.getAllAsignedOrder(req.user)
    }

    @Get('one-order/:orderID')
    async getOneAssignedOrder(@Req()req, @Param('orderID')orderID:number){
        return await this.riderservice.getOneAsignedOrder(req.user,orderID)
    }

    @Post('accept-or-decline-task/:taskID')
    async AcceptOrDeclineTask(@Body()dto:AcceptOrDeclineTaskDto, @Req()req,@Param('taskID')taskID:number){
        return await this.riderservice.AcceptOrDeclineAssignedTask(dto,req.user,taskID)   
    }

    @Patch('cancel-a-ride/:taskID')
    async CancelARide(@Body()dto:CancelRideDto, @Req()req,@Param('taskID')taskID:number){
        return await this.riderservice.CancelRideOrTask(dto,req.user,taskID)   
    }

    @Get('fetch-all-my-cancelled-rides')
    async fetchMyCancelledARides(@Req()req){
        return await this.riderservice.fetchAllCanceledRides(req.user)   
    }

       


    @Patch('checkin-enroute-to-pickup-location/:taskID/:orderID')
    async RiderChecksINEnrouteToPickupLocInWhenHeGetation (@Param('taskID')taskID:number, @Param('orderID')orderID:number, @Req()req){
        return await this.riderservice.RiderCheckswhenEnrouteToPickupLocation(taskID,orderID,req.user)
    }

    @Patch('checkin-pickup-location/:taskID/:orderID')
    async RiderChecksToPickupLocInWhenHeGetation (@Param('taskID')taskID:number, @Param('orderID')orderID:number, @Req()req){
        return await this.riderservice.RiderChecksToPickupLocInWhenHeGetation(taskID,orderID,req.user)
    }

    @Patch('checkin-pickup-parcel/:taskID/:orderID')
    async RiderChecksWhenRiderPicsUpParcel (@Param('taskID')taskID:number, @Param('orderID')orderID:number, @Req()req){
        return await this.riderservice.RiderCheckInWhenHePicksUp(taskID,orderID,req.user)
    }


    @Patch('checkin-enroute-to-the-office/:taskID/:orderID')
    async RiderChecksWhenRiderIsEnrouteToOfficeForReranding (@Param('taskID')taskID:number, @Param('orderID')orderID:number, @Req()req){
        return await this.riderservice.RiderCheckInWhenRiderEnrouteTotheOfficeForRebranding(taskID,orderID,req.user)
    }

    @Patch('checkin-at-the-office/:taskID/:orderID')
    async RiderChecksWhenRiderIsAtOfficeForReranding (@Param('taskID')taskID:number, @Param('orderID')orderID:number, @Req()req){
        return await this.riderservice.RiderCheckInWhenRiderArrivesATTheOfficeForRebranding(taskID,orderID,req.user)
    }

    @Patch('checkin-enroute-to-dropoff-location/:taskID/:orderID')
    async RiderChecksinWhenEnrouteToDropOffLocation (@Param('taskID')taskID:number, @Param('orderID')orderID:number, @Req()req){
        return await this.riderservice.RiderCheckInWhenHeGetsToDropoffLocation(taskID,orderID,req.user)
    }

    @Patch('checkin-dropoff-location/:taskID/:orderID')
    async RiderChecksinWhenHegetsToDropOffLocation (@Param('taskID')taskID:number, @Param('orderID')orderID:number, @Req()req){
        return await this.riderservice.RiderCheckInWhenHeISEnrouteToDropoffLocation(taskID,orderID,req.user)
    }

    @Patch('checkin-dropoff-parcel/:taskID/:orderID')
    async RiderChecksWhenHeDropsOffParcel (@Param('taskID')taskID:number, @Param('orderID')orderID:number, @Req()req, @Body()dto:DropOffCodeDto){
        return await this.riderservice.RiderCheckInWhenHeDropsOffnew(taskID,orderID,req.user,dto)
    }

    @Get('all-asigned-task')
    async GetAllAsignedTask(@Req()req){
        return await this.riderservice.fetchAssignedTask(req.user)

    }

    @Get('one-assigned-task/:taskID')
    async GetOneAsignedTask(@Req()req,@Param('taskID')taskID:number){
        return await this.riderservice.fetchOneTask(req.user,taskID)

    }

    @Get('all-ongoing-task')
    async GetAllOngoingTasks(@Req()req){
        return await this.riderservice.fetchAllOngoingTasks(req.user)
        
    }

    @Get('all-concluded-task')
    async GetAllConcludedTasks(@Req()req){
        return await this.riderservice.fetchAllConcludedTasks(req.user)
        
    }


    @Get('my-bank-details')
    async GetMybankDetials(@Req()req){
        return await this.riderservice.GetMyBankDetials(req.user)
        
    }

    @Get('one-bank-detail/:detailsID')
    async GetOnebankDetial(@Req()req,@Param('detailsID')detailsID:number){
        return await this.riderservice.GetOneBankDetials(detailsID,req.user.id)
        
    }

    @Patch('bank-preference-status/:detailsID')
    async BankPreferenceStatus(@Req()req,@Param('detailsID')detailsID:number,@Body()dto:ChangeBankPreferenceDto){
        return await this.riderservice.BankPreferenceStatus(detailsID,req.user.id,dto)
        
    }

    @Post('request-bank-details-change/')
    async BankDetailschangeRequest(@Req()req,@Body()dto:MakeRequestDto){
        return await this.riderservice.RequestBankinfoChange(req.user.id,dto)
        
    }
    @Get('all-my-notification')
    async GetAllMyNotification(@Req()req){
     return await this.riderservice.AllNotificationsRelatedToRider(req.user)
    }

    @Patch('one-of-my-notification/:notificationId')
    async GetOneOfMyNotification(@Req()req,@Param('notificationId')notificationId:number,@Body()dto:markNotificationAsReadDto){
     return await this.riderservice.OpenOneNotificationRelatedTocustomer(req.user,notificationId,dto)
    }

    @Delete('delete-one-of-my-notification/:notificationId')
    async DeleteOneOfMyNotification(@Req()req,@Param('notificationId')notificationId:number){
     return await this.riderservice.DeleteOneNotificationRelatedTocustomer(req.user,notificationId)
    }

     @Get('track-order/')
     async TrackOrder(@Query('keyword')keyword:string|any){
      return await this.riderservice.TrackOrder(keyword)
     }

     @Get('scan-barcode/:barcodeDigit')
    async ScanBarcode(@Param('barcodeDigit')barcodeDegit: string){
        return await this.riderservice.scanBarcode(barcodeDegit)
    }

     

    


}