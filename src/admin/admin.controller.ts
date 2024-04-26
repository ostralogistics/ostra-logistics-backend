import { Body, Controller, Delete, Get, Param, Patch, Post, UploadedFile, UseGuards, UseInterceptors } from "@nestjs/common";
import { AdminService } from "./admin.service";
import { JwtGuard } from "src/auth/guard/jwt.guard";
import { RegisterVehicleDto, ReturnedVehicleDto, UpdateVehicleDto } from "./admin.dto";
import { FileInterceptor } from "@nestjs/platform-express";

@UseGuards(JwtGuard)
@Controller('admin')
export class Admincontroller{
    constructor(private readonly adminservice:AdminService){}

    @Post('register-vehicle')
    @UseInterceptors(FileInterceptor('image'))
    async RegisterVehicle(@Body()dto:RegisterVehicleDto,@UploadedFile()file:Express.Multer.File){
        return await this.adminservice.RegisterVehicle(dto,file)
    }

    @Patch('update-vehicle-info/:vehicleID')
    @UseInterceptors(FileInterceptor('image'))
    async UpdateVehicle(@Body()dto:UpdateVehicleDto,@Param('vehicleID')vehicleID:number,@UploadedFile()file:Express.Multer.File){
        return await this.adminservice.updateVehicle(dto,file,vehicleID)
    }

    @Delete('delete-vehicle/:vehicleID')
    async DeleteVehicle(@Param('vehicleID')vehicleID:number){
        return await this.adminservice.DeleteVehicle(vehicleID)
    }

    @Get('all-vehicles')
    async GetAllVehicle(){
        return await this.adminservice.fetchAllVehicle()
    }

    @Get('one-vehicle/:vehicleID')
    async GetOneVehicle(@Param('vehicleID')vehicleID:number){
        return await this.adminservice.fetchOneVehicle(vehicleID)
    }

    @Post('assign-vehicle')
    async AssignVehicle(@Param('vehicleID')vehicleID:number,@Param('vehicleID')riderID:string){
        return await this.adminservice.assignAVhicleToADriver(riderID,vehicleID)
    }

    @Patch('report-vehicle-return')
    async ReturnVehile(@Param('vehicleID')vehicleID:number,@Param('vehicleID')riderID:string,@Body()dto:ReturnedVehicleDto){
        return await this.adminservice.ReportVehicleReturnStatus(dto,vehicleID,riderID)
    }



}