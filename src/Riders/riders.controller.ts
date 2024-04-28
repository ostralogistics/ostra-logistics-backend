import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from "@nestjs/common";
import { RiderService } from "./riders.service";
import { JwtGuard } from "src/auth/guard/jwt.guard";
import { AcceptOrDeclineTaskDto, DropOffCodeDto } from "./riders.dto";
import { RoleGuard } from "src/auth/guard/role.guard";
import { Roles } from "src/auth/decorator/role.decorator";
import { Role } from "src/Enums/all-enums";

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

    @Patch('checkin-pickup-location/:taskID/:orderID')
    async RiderChecksToPickupLocInWhenHeGetation (@Param('taskID')taskID:number, @Param('orderID')orderID:number, @Req()req){
        return await this.riderservice.RiderChecksToPickupLocInWhenHeGetation(taskID,orderID,req.user)
    }

    @Patch('checkin-pickup-parcel/:taskID/:orderID')
    async RiderChecksWhenRiderPicsUpParcel (@Param('taskID')taskID:number, @Param('orderID')orderID:number, @Req()req){
        return await this.riderservice.RiderCheckInWhenHePicksUp(taskID,orderID,req.user)
    }

    @Patch('checkin-at-the-office/:taskID/:orderID')
    async RiderChecksWhenRiderIsAtOfficeForReranding (@Param('taskID')taskID:number, @Param('orderID')orderID:number, @Req()req){
        return await this.riderservice.RiderCheckInWhenRiderArrivesATTheOfficeForRebranding(taskID,orderID,req.user)
    }

    @Patch('checkin-dropoff-location/:taskID/:orderID')
    async RiderChecksinWhenHegetsToDropOffLocation (@Param('taskID')taskID:number, @Param('orderID')orderID:number, @Req()req){
        return await this.riderservice.RiderCheckInWhenHeGetsToDropoffLocation(taskID,orderID,req.user)
    }

    @Patch('checkin-dropoff-parcel/:taskID/:orderID')
    async RiderChecksWhenHeDropsOffParcel (@Param('taskID')taskID:number, @Param('orderID')orderID:number, @Req()req, @Body()dto:DropOffCodeDto){
        return await this.riderservice.RiderCheckInWhenHeDropsOff(taskID,orderID,req.user,dto)
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

    @Get('all-ongoing-task')
    async GetAllConcludedTasks(@Req()req){
        return await this.riderservice.fetchAllConcludedTasks(req.user)
        
    }


}