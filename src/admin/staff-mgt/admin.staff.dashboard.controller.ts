import { Body, Controller, Delete, Get, InternalServerErrorException, Param, Patch, Post, Query, UploadedFile, UseGuards, UseInterceptors } from "@nestjs/common";
import { AdminStaffDasboardService } from "./admin.staff.dashboard.service";
import { FileInterceptor } from "@nestjs/platform-express";
import { AdminchangestaffAccessLevelDto, RegisterOtherAdminByAdminDto, UpdateOtherAdminInfoByAdminDto } from "../admin.dto";
import { ICreateAdmins } from "../admin";
import { AdminEntity } from "src/Entity/admins.entity";
import { IChangeRiderPassword } from "src/Riders/riders";
import { JwtGuard } from "src/auth/guard/jwt.guard";
import { RoleGuard } from "src/auth/guard/role.guard";
import { Roles } from "src/auth/decorator/role.decorator";
import { AdminAccessLevels, Role } from "src/Enums/all-enums";
import { AdminAcessLevelGuard } from "src/auth/guard/accesslevel.guard";
import { AdminAccessLevel } from "src/auth/decorator/accesslevel.decorator";

@UseGuards(JwtGuard,RoleGuard,AdminAcessLevelGuard)
@Roles(Role.ADMIN)
@AdminAccessLevel(AdminAccessLevels.LEVEL3)


@Controller('admin-staff-dashboard')
export class AdminStaffDashBoardController{
    constructor(private readonly adminstaffservice:AdminStaffDasboardService){}



    @Post('/register')
    async AdminRegisterStaff(@Body()dto:RegisterOtherAdminByAdminDto,){
        return await this.adminstaffservice.RegisterStaff(dto)

        
    }

    @Patch('/update-staff-info/:staffId')
    async UpdateStaffInfo(@Param('staffId')staffId:string,@Body()dto:UpdateOtherAdminInfoByAdminDto){
        return await this.adminstaffservice.UpdateStaffInfoByAdmin(staffId,dto)
    }

    @Delete('delete-staff/:staffID')
    async DeleteStaff(@Param('staffID') staffID:string) {
        return await this.adminstaffservice.AdminDeleteStaff(staffID)
    }

    @Patch('/change-staff-password/:staffID')
    async ChangeStaffPassword( @Param('staffID')staffID:string) {
        return await this.adminstaffservice.AdminChangeStaffPassword(staffID)
    }

    @Get('/all-staffs')
    async GetAllStaffs(@Query('page')page:number, @Query('limit')limit:number){
        return await this.adminstaffservice.GetAllStaffs(page, limit);
        
    }

    @Get('/one-staff/:staffID')
    async GetOneStaff(@Param('staffID')staffID:string) {
        return await this.adminstaffservice.GetOneStaffByID(staffID)
    }

    @Get('/search-staff')
    async SearchStaff(@Query('keyword')keyword:string|any){
        return await this.adminstaffservice.SearchForStaff(keyword)
    }

    @Patch('/change-staff-accesslevel/:staffID')
    async ChangestaffAccessLevel(@Param('staffID')staffID:string, @Body()dto:AdminchangestaffAccessLevelDto){
        return await this.adminstaffservice.ChangeStaffAccessLevel(staffID,dto)

    }

}