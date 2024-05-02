import { Controller, UploadedFile, UseInterceptors, Post,Get,Patch,Delete, BadRequestException, Query, InternalServerErrorException, Body, Param, UseGuards } from "@nestjs/common";
import { AdminRiderDashboardService } from "./admin.riders.dashboard.service";
import { AssignTaskDto, BankDetailsDto, EditBankDetailsDto, RegisterRiderByAdminDto, UpdateRiderInfoByAdminDto } from "./admin.dto";
import { FileInterceptor } from "@nestjs/platform-express";
import { IChangeRiderPassword } from "src/Riders/riders";
import { RiderEntity } from "src/Entity/riders.entity";
import { JwtGuard } from "src/auth/guard/jwt.guard";
import { Multer } from "multer";
import { RoleGuard } from "src/auth/guard/role.guard";
import { Roles } from "src/auth/decorator/role.decorator";
import { AdminAccessLevels, AdminType, Role } from "src/Enums/all-enums";
import { AdminTypeGuard } from "src/auth/guard/admintype.guard";
import { AdminTypes } from "src/auth/decorator/admintype.decorator";
import { AdminAcessLevelGuard } from "src/auth/guard/accesslevel.guard";
import { AdminAccessLevel } from "src/auth/decorator/accesslevel.decorator";

@UseGuards(JwtGuard,RoleGuard,AdminTypeGuard,AdminAcessLevelGuard)
@Roles(Role.ADMIN)
@Controller('admin-rider-dashboard')
export class AdminRiderDashBoardController{
    constructor(private readonly adminriderservice:AdminRiderDashboardService){}


    @AdminTypes(AdminType.CEO)
    @AdminAccessLevel(AdminAccessLevels.LEVEL3)
    @Post('/register')
    async AdminRegisterRider(@Body()dto:RegisterRiderByAdminDto){
        return await this.adminriderservice.RegisterRider(dto) 
    }

    @AdminTypes(AdminType.CEO,AdminType.STAFF)
    @AdminAccessLevel(AdminAccessLevels.LEVEL3,AdminAccessLevels.LEVEL2)
    @Patch('/update-rider-info/:riderId')
    async UpdateRiderInfo(@Param('riderId')riderId:string,@Body()dto:UpdateRiderInfoByAdminDto){
        return await this.adminriderservice.UpdateRiderInfoByAdmin(riderId,dto,)
    }

    @AdminTypes(AdminType.CEO)
    @Delete('delete-rider/:riderID')
    async DeleteRider( @Param('riderID')riderID:string) {
        return await this.adminriderservice.AdminDeleteRider(riderID)
    }

    @AdminTypes(AdminType.CEO)
    @AdminAccessLevel(AdminAccessLevels.LEVEL3)
    @Patch('/change-rider-password/:riderID')
    async ChangeRiderPassword(@Param('adminID')adminID:string, @Param('riderID')riderID:string) {
        return await this.adminriderservice.AdminChangeRiderPassword(riderID)
    }

    @AdminTypes(AdminType.CEO)
    @AdminAccessLevel(AdminAccessLevels.LEVEL3)
    @Patch('/change-rider-password-onRequest/:riderID/:requestID')
    async ChangeRiderPasswordBasedOnRequest(@Param('requestID')requestID:number, @Param('riderID')riderID:string) {
        return await this.adminriderservice.AdminChangeRiderPasswordBasedOnRequest(riderID,requestID)
    }

    @AdminTypes(AdminType.CEO)
    @AdminAccessLevel(AdminAccessLevels.LEVEL3,AdminAccessLevels.LEVEL2)
    @Get('/all-requests')
    async GetAllRequests(){
        return await this.adminriderservice.GetAllRequests();  
    }

    @AdminTypes(AdminType.CEO,AdminType.STAFF)
    @AdminAccessLevel(AdminAccessLevels.LEVEL3,AdminAccessLevels.LEVEL2,AdminAccessLevels.LEVEL1)
    @Get('/all-riders')
    async GetAllRiders(@Query('page')page:number, @Query('limit')limit:number){
        return await this.adminriderservice.GetAllRiders(page, limit);  
    }

    @AdminTypes(AdminType.CEO,AdminType.STAFF)
    @AdminAccessLevel(AdminAccessLevels.LEVEL3,AdminAccessLevels.LEVEL2,AdminAccessLevels.LEVEL1)
    @Get('/one-rider/:riderID')
    async GetOneRider(@Param('riderID')riderID:string){
        return await this.adminriderservice.GetOneRiderByID(riderID)
    }

    @AdminTypes(AdminType.CEO,AdminType.STAFF)
    @AdminAccessLevel(AdminAccessLevels.LEVEL3,AdminAccessLevels.LEVEL2,AdminAccessLevels.LEVEL1)
    @Get('/search-riders')
    async SearchRider(@Query('keyword')keyword:string|any){
        return await this.adminriderservice.SearchForRider(keyword)
    }

    @AdminTypes(AdminType.CEO,AdminType.STAFF)
    @AdminAccessLevel(AdminAccessLevels.LEVEL3,AdminAccessLevels.LEVEL2)
    @Patch('upload-profile-pics/:riderID')
    @UseInterceptors(FileInterceptor('image'))
    async UploadProfilePics(@Param('riderID')riderID:string,@UploadedFile()file:Express.Multer.File){
        return await this.adminriderservice.UploadRiderProfilePics(file,riderID)
    }

    @AdminTypes(AdminType.CEO,AdminType.STAFF)
    @AdminAccessLevel(AdminAccessLevels.LEVEL3,AdminAccessLevels.LEVEL2)
    @Patch('upload-driver-license-front/:riderID')
    @UseInterceptors(FileInterceptor('image'))
    async UploadDriverLicenseFront(@Param('riderID')riderID:string,@UploadedFile()file:Express.Multer.File){
        return await this.adminriderservice.UploadDriverLicenseFront(file,riderID)
    }

    @AdminTypes(AdminType.CEO)
    @Patch('upload-driver-license-back/:riderID')
    @UseInterceptors(FileInterceptor('image'))
    async UploadDriverLicenseBack(@Param('riderID')riderID:string,@UploadedFile()file:Express.Multer.File){
        return await this.adminriderservice.UploadDriverLicenseBack(file,riderID)
    }

    @AdminTypes(AdminType.CEO,AdminType.STAFF)
    @Get('total-number-of-rider')
    async GetTotalNumberOfRiders(){
        return await this.adminriderservice.totalnumberofriders()

    }

    @AdminTypes(AdminType.CEO,AdminType.STAFF)
    @AdminAccessLevel(AdminAccessLevels.LEVEL3,AdminAccessLevels.LEVEL2,AdminAccessLevels.LEVEL1)
    @Patch('assign-order-to-rider/:orderID/:riderID')
    async AssignOrderToRide(@Param('orderID')orderID:number, @Param('riderID')riderID:string,@Body()dto:AssignTaskDto){
        return await this.adminriderservice.AssignOrderToRider(riderID,orderID,dto)
    }


    @AdminTypes(AdminType.CEO,AdminType.STAFF)
    @AdminAccessLevel(AdminAccessLevels.LEVEL3,AdminAccessLevels.LEVEL2)
    @Post('add-rider-bank-details/:riderID')
    async AddRiderBankDetails( @Param('riderID')riderID:string,@Body()dto:BankDetailsDto){
        return await this.adminriderservice.addRiderBankDetails(dto,riderID)
    }

    @AdminTypes(AdminType.CEO,AdminType.STAFF)
    @AdminAccessLevel(AdminAccessLevels.LEVEL3,AdminAccessLevels.LEVEL2)
    @Patch('update-rider-bank-details/:riderID')
    async EditRiderBankDetails( @Param('riderID')riderID:string,@Body()dto:EditBankDetailsDto){
        return await this.adminriderservice.addRiderBankDetails(dto,riderID)
    }
    

    


}