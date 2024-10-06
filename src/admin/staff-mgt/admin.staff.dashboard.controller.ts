import { Body, Controller, Delete, Get, InternalServerErrorException, Param, Patch, Post, Query, Req, UploadedFile, UseGuards, UseInterceptors } from "@nestjs/common";
import { AdminStaffDasboardService } from "./admin.staff.dashboard.service";
import { FileInterceptor } from "@nestjs/platform-express";
import { AdminchangestaffAccessLevelDto, RegisterOtherAdminByAdminDto, UpdateOtherAdminInfoByAdminDto } from "../admin.dto";
import { ICreateAdmins } from "../admin";
import { AdminEntity } from "src/Entity/admins.entity";
import { IChangeRiderPassword } from "src/Riders/riders";
import { JwtGuard } from "src/auth/guard/jwt.guard";
import { RoleGuard } from "src/auth/guard/role.guard";
import { Roles } from "src/auth/decorator/role.decorator";
import { AdminAccessLevels, AdminType, Role } from "src/Enums/all-enums";
import { AdminAcessLevelGuard } from "src/auth/guard/accesslevel.guard";
import { AdminAccessLevel } from "src/auth/decorator/accesslevel.decorator";
import { AdminTypeGuard } from "src/auth/guard/admintype.guard";
import { AdminTypes } from "src/auth/decorator/admintype.decorator";

@UseGuards(JwtGuard,RoleGuard,AdminAcessLevelGuard,AdminTypeGuard)
@Roles(Role.ADMIN)



@Controller('admin-staff-dashboard')
export class AdminStaffDashBoardController{
    constructor(private readonly adminstaffservice:AdminStaffDasboardService){}


    @AdminAccessLevel(AdminAccessLevels.LEVEL3,AdminAccessLevels.LEVEL2)
    @Post('/register')
    async AdminRegisterStaff(@Body()dto:RegisterOtherAdminByAdminDto,@Req()req){
        return await this.adminstaffservice.RegisterStaff(req.user,dto)

    }

    @AdminAccessLevel(AdminAccessLevels.LEVEL3)
    @AdminTypes(AdminType.CEO)
    @Patch('/update-staff-info/:staffId')
    async UpdateStaffInfo(@Param('staffId')staffId:string,@Body()dto:UpdateOtherAdminInfoByAdminDto,@Req()req){
        return await this.adminstaffservice.UpdateStaffInfoByAdmin(req.user,staffId,dto)
    }

    @AdminAccessLevel(AdminAccessLevels.LEVEL3)
    @AdminTypes(AdminType.CEO)
    @Delete('delete-staff/:staffID')
    async DeleteStaff(@Param('staffID') staffID:string) {
        return await this.adminstaffservice.AdminDeleteStaff(staffID)
    }

    @AdminAccessLevel(AdminAccessLevels.LEVEL3)
    @AdminTypes(AdminType.CEO)
    @Patch('/change-staff-password/:staffID')
    async ChangeStaffPassword( @Param('staffID')staffID:string) {
        return await this.adminstaffservice.AdminChangeStaffPassword(staffID)
    }

    @AdminAccessLevel(AdminAccessLevels.LEVEL3,AdminAccessLevels.LEVEL2)
    @Get('/all-staffs')
    async GetAllStaffs(@Query('page')page:number, @Query('limit')limit:number){
        return await this.adminstaffservice.GetAllStaffs(page, limit);
        
    }

    @AdminAccessLevel(AdminAccessLevels.LEVEL3,AdminAccessLevels.LEVEL2)
    @Get('/one-staff/:staffID')
    async GetOneStaff(@Param('staffID')staffID:string) {
        return await this.adminstaffservice.GetOneStaffByID(staffID)
    }


    @AdminAccessLevel(AdminAccessLevels.LEVEL3,AdminAccessLevels.LEVEL2)
    @Get('/one-staff-more-details/:staffID')
    async GetOneStaffMoreDetails(@Param('staffID')staffID:string) {
        return await this.adminstaffservice.GetOneStaffDetails(staffID)
    }

    @AdminAccessLevel(AdminAccessLevels.LEVEL3, AdminAccessLevels.LEVEL2)
    @Get('/search-staff')
    async SearchStaff(
      @Query('keyword') keyword: string,
      @Query('page') page?: number,
      @Query('perPage') perPage?: number,
      @Query('sort') sort?: string,) {
      return await this.adminstaffservice.SearchForOtherAdmin(keyword,page,perPage,sort);
    }

    @AdminAccessLevel(AdminAccessLevels.LEVEL3)
    @AdminTypes(AdminType.CEO)
    @Patch('/change-staff-accesslevel/:staffID')
    async ChangestaffAccessLevel(@Param('staffID')staffID:string, @Body()dto:AdminchangestaffAccessLevelDto){
        return await this.adminstaffservice.ChangeStaffAccessLevel(staffID,dto)
    }

   
    @AdminAccessLevel(AdminAccessLevels.LEVEL3)
    @AdminTypes(AdminType.CEO)
    @Patch('update-passcode/:passcodeID')
    async UpdatePasscode(@Param('passcodeID') passcodeID: number, @Req() req) {
      return await this.adminstaffservice.UpdatePasscode(req.user, passcodeID);
    }

    

}