import {
  Controller,
  UploadedFile,
  UseInterceptors,
  Post,
  Get,
  Patch,
  Delete,
  Query,
  Body,
  Param,
  UseGuards,
  UploadedFiles,
} from '@nestjs/common';
import { AdminRiderDashboardService } from './admin.riders.dashboard.service';
import {
  AssignTaskDto,
  BankDetailsDto,
  EditBankDetailsDto,
  LogtransactionDto,
  RegisterRiderByAdminDto,
  UpdateRiderInfoByAdminDto,
} from '../admin.dto';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';

import { JwtGuard } from 'src/auth/guard/jwt.guard';
import { RoleGuard } from 'src/auth/guard/role.guard';
import { Roles } from 'src/auth/decorator/role.decorator';
import { AdminAccessLevels, AdminType, Role } from 'src/Enums/all-enums';
import { AdminTypeGuard } from 'src/auth/guard/admintype.guard';
import { AdminTypes } from 'src/auth/decorator/admintype.decorator';
import { AdminAcessLevelGuard } from 'src/auth/guard/accesslevel.guard';
import { AdminAccessLevel } from 'src/auth/decorator/accesslevel.decorator';

@UseGuards(JwtGuard, RoleGuard, AdminTypeGuard, AdminAcessLevelGuard)
@Roles(Role.ADMIN)
@Controller('admin-rider-dashboard')
export class AdminRiderDashBoardController {
  constructor(private readonly adminriderservice: AdminRiderDashboardService) {}

  @AdminTypes(AdminType.CEO, AdminType.STAFF)
  @AdminAccessLevel(AdminAccessLevels.LEVEL3, AdminAccessLevels.LEVEL2)
  @Post('/register')
  @UseInterceptors(FilesInterceptor('media', 5)) // Expecting five files: front and back of the driver's license, profile picture, 2 guarantors pics
  async AdminRegisterRider(
    @Body() dto: RegisterRiderByAdminDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    // if (files.length !== 4) {
    //     throw new BadRequestException('Two files are required: front and back of the driver\'s license');
    //   }
    return await this.adminriderservice.RegisterRider(dto, files);
  }

  @AdminTypes(AdminType.CEO, AdminType.STAFF)
  @AdminAccessLevel(AdminAccessLevels.LEVEL3, AdminAccessLevels.LEVEL2)
  @Patch('/update-rider-info/:riderId')
  @UseInterceptors(FilesInterceptor('media', 5))
  async UpdateRiderInfo(
    @Param('riderId') riderId: string,
    @Body() dto: UpdateRiderInfoByAdminDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return await this.adminriderservice.UpdateRiderInfoByAdmin(
      riderId,
      dto,
      files,
    );
  }

  @AdminTypes(AdminType.CEO)
  @AdminAccessLevel(AdminAccessLevels.LEVEL3)
  @Delete('delete-rider/:riderID')
  async DeleteRider(@Param('riderID') riderID: string) {
    return await this.adminriderservice.AdminDeleteRider(riderID);
  }

  @AdminTypes(AdminType.CEO)
  @AdminAccessLevel(AdminAccessLevels.LEVEL3)
  @Patch('/change-rider-password/:riderID')
  async ChangeRiderPassword(
    @Param('adminID') adminID: string,
    @Param('riderID') riderID: string,
  ) {
    return await this.adminriderservice.AdminChangeRiderPassword(riderID);
  }

  @AdminTypes(AdminType.CEO)
  @AdminAccessLevel(AdminAccessLevels.LEVEL3)
  @Patch('/change-rider-password-onRequest/:riderID/:requestID')
  async ChangeRiderPasswordBasedOnRequest(
    @Param('requestID') requestID: number,
    @Param('riderID') riderID: string,
  ) {
    return await this.adminriderservice.AdminChangeRiderPasswordBasedOnRequest(
      riderID,
      requestID,
    );
  }

  @AdminTypes(AdminType.CEO)
  @AdminAccessLevel(AdminAccessLevels.LEVEL3, AdminAccessLevels.LEVEL2)
  @Get('/all-requests')
  async GetAllRequests() {
    return await this.adminriderservice.GetAllRequests();
  }

  @AdminTypes(AdminType.CEO, AdminType.STAFF)
  @AdminAccessLevel(
    AdminAccessLevels.LEVEL3,
    AdminAccessLevels.LEVEL2,
    AdminAccessLevels.LEVEL1,
  )
  
  @Get('/all-riders')
  async GetAllRiders(
    @Query('page') page: number,
    @Query('limit') limit: number,
  ) {
    return await this.adminriderservice.GetAllRiders(page, limit);
  }

  @AdminTypes(AdminType.CEO, AdminType.STAFF)
  @AdminAccessLevel(
    AdminAccessLevels.LEVEL3,
    AdminAccessLevels.LEVEL2,
    AdminAccessLevels.LEVEL1,
  )
  @Get('/all-riders-offline')
  async GetAllRidersOffline(
    @Query('page') page: number,
    @Query('limit') limit: number,
  ) {
    return await this.adminriderservice.GetAllRidersWithStatusOffline(
      page,
      limit,
    );
  }

  @AdminTypes(AdminType.CEO, AdminType.STAFF)
  @AdminAccessLevel(
    AdminAccessLevels.LEVEL3,
    AdminAccessLevels.LEVEL2,
    AdminAccessLevels.LEVEL1,
  )
  @Get('/all-riders-inTransit')
  async GetAllRidersIntransit(
    @Query('page') page: number,
    @Query('limit') limit: number,
  ) {
    return await this.adminriderservice.GetAllRidersWithStatusIntransit(
      page,
      limit,
    );
  }

  @AdminTypes(AdminType.CEO, AdminType.STAFF)
  @AdminAccessLevel(
    AdminAccessLevels.LEVEL3,
    AdminAccessLevels.LEVEL2,
    AdminAccessLevels.LEVEL1,
  )
  @Get('/all-riders-available')
  async GetAllRidersAvailable(
    @Query('page') page: number,
    @Query('limit') limit: number,
  ) {
    return await this.adminriderservice.GetAllRidersWithStatusIntransit(
      page,
      limit,
    );
  }

  @AdminTypes(AdminType.CEO, AdminType.STAFF)
  @AdminAccessLevel(
    AdminAccessLevels.LEVEL3,
    AdminAccessLevels.LEVEL2,
    AdminAccessLevels.LEVEL1,
  )
  @Get('/one-rider/:riderID')
  async GetOneRider(@Param('riderID') riderID: string) {
    return await this.adminriderservice.GetOneRiderByID(riderID);
  }

  @AdminTypes(AdminType.CEO, AdminType.STAFF)
  @AdminAccessLevel(
    AdminAccessLevels.LEVEL3,
    AdminAccessLevels.LEVEL2,
    AdminAccessLevels.LEVEL1,
  )
  @Get('/search-riders')
  async SearchRider(
    @Query('keyword') keyword:string,
    @Query('page') page:number,
    @Query('perPage') perPage:number,
    @Query('sort') sort:string,
    
  ) {
    return await this.adminriderservice.SearchForRider(keyword,page,perPage,sort);
  }

  @AdminTypes(AdminType.CEO, AdminType.STAFF)
  @AdminAccessLevel(
    AdminAccessLevels.LEVEL3,
    AdminAccessLevels.LEVEL2,
    AdminAccessLevels.LEVEL1,
  )
  @Get('total-number-of-rider')
  async GetTotalNumberOfRiders() {
    return await this.adminriderservice.totalnumberofriders();
  }

  @AdminTypes(AdminType.CEO, AdminType.STAFF)
  @AdminAccessLevel(
    AdminAccessLevels.LEVEL3,
    AdminAccessLevels.LEVEL2,
    AdminAccessLevels.LEVEL1,
  )
  @Patch('assign-order-to-rider/:orderID/:riderID')
  async AssignOrderToRide(
    @Param('orderID') orderID: number,
    @Param('riderID') riderID: string,
    @Body() dto: AssignTaskDto,
  ) {
    return await this.adminriderservice.AssignOrderToRider(
      riderID,
      orderID,
      dto,
    );
  }

  @AdminTypes(AdminType.CEO, AdminType.STAFF)
  @AdminAccessLevel(AdminAccessLevels.LEVEL3, AdminAccessLevels.LEVEL2)
  @Post('add-rider-bank-details/:riderID')
  async AddRiderBankDetails(
    @Param('riderID') riderID: string,
    @Body() dto: BankDetailsDto,
  ) {
    return await this.adminriderservice.addRiderBankDetails(dto, riderID);
  }

  @AdminTypes(AdminType.CEO, AdminType.STAFF)
  @AdminAccessLevel(AdminAccessLevels.LEVEL3, AdminAccessLevels.LEVEL2)
  @Patch('update-rider-bank-details/:bankdetailsID/:riderID')
  async EditRiderBankDetails(
    @Param('riderID') riderID: string,
    @Param('bankdetailsID') bankdetailsID: number,
    @Body() dto: EditBankDetailsDto,
  ) {
    return await this.adminriderservice.EditRiderBankDetails(
      dto,
      bankdetailsID,
      riderID,
    );
  }

  @AdminTypes(AdminType.CEO, AdminType.STAFF)
  @AdminAccessLevel(AdminAccessLevels.LEVEL3)
  @Patch('delete-rider-bank-details/:bankdetailsID/:riderID')
  async DeleteRiderBankDetails(
    @Param('riderID') riderID: string,
    @Param('bankdetailsID') bankdetailsID: number,
  ) {
    return await this.adminriderservice.DeleteRiderBankDetails(
      bankdetailsID,
      riderID,
    );
  }

  @AdminTypes(AdminType.CEO, AdminType.STAFF)
  @AdminAccessLevel(AdminAccessLevels.LEVEL3,AdminAccessLevels.LEVEL2)
  @Post('log-payment/:paymentDetailsID/:riderID')
  async LogPaymentForAdmin(
    @Param('paymentDetailsID') paymentDetailsID: number,
    @Param('riderID') riderID: string,
    @Body() dto: LogtransactionDto,
  ) {
    return await this.adminriderservice.LogPaymentForRiders(
      dto,
      paymentDetailsID,
      riderID,
    );
  }

  @AdminTypes(AdminType.CEO, AdminType.STAFF)
  @AdminAccessLevel(
    AdminAccessLevels.LEVEL3,
    AdminAccessLevels.LEVEL2,
    AdminAccessLevels.LEVEL1,
  )
  @Get('/one-rider-paymet-transaction-history/:riderID')
  async GetRiderTransaction(@Param('riderID') riderID: string) {
    return await this.adminriderservice.fetchRiderPaymentTransactionHistory(
      riderID,
    );
  }

  @AdminTypes(AdminType.CEO, AdminType.STAFF)
  @AdminAccessLevel(
    AdminAccessLevels.LEVEL3,
    AdminAccessLevels.LEVEL2,
    AdminAccessLevels.LEVEL1,
  )
  @Get('all-rider-tasks')
  async GetallriderTasks() {
    return await this.adminriderservice.getAllriderTask();
  }

  @AdminTypes(AdminType.CEO, AdminType.STAFF)
  @AdminAccessLevel(
    AdminAccessLevels.LEVEL3,
    AdminAccessLevels.LEVEL2,
    AdminAccessLevels.LEVEL1,
  )
  @Get('one-rider-tasks/:riderID')
  async GetOneriderTasks(@Param('riderID') riderID: string) {
    return await this.adminriderservice.getOneriderTask(riderID);
  }

  @AdminTypes(AdminType.CEO, AdminType.STAFF)
  @AdminAccessLevel(
    AdminAccessLevels.LEVEL3,
    AdminAccessLevels.LEVEL2,
    AdminAccessLevels.LEVEL1,
  )
  @Get('one-task/:taskID')
  async GetOneTask(@Param('taskID') taskID: number) {
    return await this.adminriderservice.getOneTask(taskID);
  }

  @AdminTypes(AdminType.CEO, AdminType.STAFF)
  @AdminAccessLevel(
    AdminAccessLevels.LEVEL3,
    AdminAccessLevels.LEVEL2,
    AdminAccessLevels.LEVEL1,
  )
  @Get('one-rider-tasks-count/:riderID')
  async GetOneriderTasksCount(@Param('riderID') riderID: string) {
    return await this.adminriderservice.getOneriderTaskCount(riderID);
  }

  @AdminTypes(AdminType.CEO, AdminType.STAFF)
  @AdminAccessLevel(
    AdminAccessLevels.LEVEL3,
    AdminAccessLevels.LEVEL2,
    AdminAccessLevels.LEVEL1,
  )
  @Get('all-ongoing-tasks')
  async GetallOngoingTaskTasks() {
    return await this.adminriderservice.getAllriderwithOngoingTaskTask();
  }

  @AdminTypes(AdminType.CEO, AdminType.STAFF)
  @AdminAccessLevel(
    AdminAccessLevels.LEVEL3,
    AdminAccessLevels.LEVEL2,
    AdminAccessLevels.LEVEL1,
  )
  @Get('one-rider-ongoing-tasks/:riderID')
  async GetaOneRiderOngoingTaskTasks(@Param('riderID') riderID: string) {
    return await this.adminriderservice.getOneriderOngoingTaskTask(riderID);
  }

  @AdminTypes(AdminType.CEO, AdminType.STAFF)
  @AdminAccessLevel(
    AdminAccessLevels.LEVEL3,
    AdminAccessLevels.LEVEL2,
    AdminAccessLevels.LEVEL1,
  )
  @Get('one-rider-ongoing-tasks-count/:riderID')
  async GetaOneRiderOngoingTaskCount(@Param('riderID') riderID: string) {
    return await this.adminriderservice.getOneriderOngoingTaskCount(riderID);
  }

  @AdminTypes(AdminType.CEO, AdminType.STAFF)
  @AdminAccessLevel(
    AdminAccessLevels.LEVEL3,
    AdminAccessLevels.LEVEL2,
    AdminAccessLevels.LEVEL1,
  )
  @Get('all-concluded-tasks')
  async GetallConcludedTaskTasks() {
    return await this.adminriderservice.getAllriderwithConcludedTask();
  }

  @AdminTypes(AdminType.CEO, AdminType.STAFF)
  @AdminAccessLevel(
    AdminAccessLevels.LEVEL3,
    AdminAccessLevels.LEVEL2,
    AdminAccessLevels.LEVEL1,
  )
  @Get('one-rider-concluded-tasks/:riderID')
  async GetOneRiderConcludedTaskTasks(@Param('riderID') riderID: string) {
    return await this.adminriderservice.getOneriderwithConcludedTask(riderID);
  }

  @AdminTypes(AdminType.CEO, AdminType.STAFF)
  @AdminAccessLevel(
    AdminAccessLevels.LEVEL3,
    AdminAccessLevels.LEVEL2,
    AdminAccessLevels.LEVEL1,
  )
  @Get('one-rider-concluded-tasks-count/:riderID')
  async GetOneRiderConcludedTaskCount(@Param('riderID') riderID: string) {
    return await this.adminriderservice.getOneriderCompletedTaskCount(riderID);
  }

  @Post('push')
  async PushNotification(){
    return await this.adminriderservice.testPushNotification()
  }
}
