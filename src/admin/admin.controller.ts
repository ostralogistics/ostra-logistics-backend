import { Body, Controller, Delete, Get, Param, Patch, Post, UploadedFile, UseGuards, UseInterceptors } from "@nestjs/common";
import { AdminService } from "./admin.service";
import { JwtGuard } from "src/auth/guard/jwt.guard";
import { RegisterVehicleDto, ReturnedVehicleDto, UpdateVehicleDto } from "./admin.dto";
import { FileInterceptor } from "@nestjs/platform-express";
import { RoleGuard } from "src/auth/guard/role.guard";
import { Roles } from "src/auth/decorator/role.decorator";
import { AdminAccessLevels, AdminType, Role } from "src/Enums/all-enums";
import { AdminTypeGuard } from "src/auth/guard/admintype.guard";
import { AdminTypes } from "src/auth/decorator/admintype.decorator";
import { AdminAcessLevelGuard } from "src/auth/guard/accesslevel.guard";
import { AdminAccessLevel } from "src/auth/decorator/accesslevel.decorator";

@UseGuards(JwtGuard,RoleGuard,AdminTypeGuard,AdminAcessLevelGuard)
@Roles(Role.ADMIN)
@AdminTypes(AdminType.CEO,AdminType.STAFF)


@Controller('admin')
export class Admincontroller{
    constructor(private readonly adminservice:AdminService){}

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

    @AdminAccessLevel(AdminAccessLevels.LEVEL3,AdminAccessLevels.LEVEL2,)
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



}