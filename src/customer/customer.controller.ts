import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UploadedFile, UseGuards, UseInterceptors } from "@nestjs/common";
import { CustomerService } from "./customer.service";
import { BidActionDto, OrderDto, counterBidDto } from "src/common/common.dto";
import { Request } from "express";
import { JwtGuard } from "src/auth/guard/jwt.guard";
import { CardDetailsDto, ChangePasswordDto, ComplaintDto, NewsLetterDto, UpdateCustomerDto } from "./customer.dto";
import { CustomerEntity } from "src/Entity/customers.entity";
import { FileInterceptor } from "@nestjs/platform-express";
import { RoleGuard } from "src/auth/guard/role.guard";
import { Roles } from "src/auth/decorator/role.decorator";
import { Role } from "src/Enums/all-enums";

@UseGuards(JwtGuard,RoleGuard)
@Roles(Role.CUSTOMER)


@Controller('customer-action')
export class CustomerController{
    constructor(private readonly customerservice:CustomerService){}
    
   
    
    @Post('make-order')
    async MakeOrder(@Req()req, @Body()dto:OrderDto | OrderDto[]){
        return await this.customerservice.PlaceOrder(req.user,dto)
    }

   
    @Post('accept-decline-bid/:orderID/:bidID')
    async AcceptOrDeclineBid(@Body()dto:BidActionDto,@Param("orderID")orderId:number,@Req()req,@Param('bidID')bidID:number){
        return await this.customerservice.AcceptORDeclineBid(dto,orderId,req.user,bidID)
     }

     @Patch('counter-bid/:bidID')
     async CounterBid(@Body()dto:counterBidDto,@Param('bidID')bidID:number){
        return await  this.customerservice.CounterBid(dto,bidID)
     }

    
     @Post('process-payment/:orderID')
     async PayWithPaystackForTheOrder(@Param('orderID')orderID:number){
        return await this.customerservice.processPayment(orderID)
     }

     @Get('track-order/')
     async TrackOrder(@Query('keyword')keyword:string|any){
      await this.customerservice.TrackOrder(keyword)
     }

     //this route is unprotected so you dont need to be logged in to perform this action 
     @Get('offline-track-order/')
     async OfflineTrackOrder(@Query('keyword')keyword:string|any){
      await this.customerservice.OfflineTrackOrder(keyword)
     }


     @Get('in-transit-orders')
     async GetallOrdersinTransit(@Req()req){
      return await this.customerservice.fetchallOngoingOrders(req.user)
     }

   
     @Get('pickedup-orders')
     async GetallOrdersPickup(@Req()req){
      return await this.customerservice.fetchallPickedupOrders(req.user)
     }

     
     @Get('droppedOff-orders')
     async GetallOrdersdroppedOff(@Req()req){
      return await this.customerservice.fetchalldroppedoff(req.user)
     }

     //debit card 

     @Post('add-card')
     async AddCard(@Body()dto:CardDetailsDto, @Req()req){
      return await this.customerservice.AddCards(dto,req.user)
     }

   
     @Get('all-my-cards')
     async GetAllMyCard(@Req()req){
      console.log(req.user)
      return await this.customerservice.getAllCardsByCustomer(req.user)
     }


  
     @Get('one-card/:cardID')
     async GetOneCard(@Req()req, @Param('cardID')cardID:number){
      return await this.customerservice.GetOneCard(req.user,cardID)
     }

  
     @Delete('delete-card/:cardID')
     async DeleteOneCard(@Req()req, @Param('cardID')cardID:number){
      return await this.customerservice.DeleteOneCard(req.user,cardID)
     }

     //user profile 

     @Patch('update-customer-info')
     async UpdateCustomerInfo(@Body()dto:UpdateCustomerDto,@Req()req){
      return await this.customerservice.UpdateCustomerInfo(dto,req.user)
     }

   
     @Patch('change-password')
     async ChangePassword(@Body()dto:ChangePasswordDto,@Req()req){
      return await this.customerservice.changeCustomerPassword(dto,req.user)
     }

  
     @Patch('upload-profile-pics')
     @UseInterceptors(FileInterceptor('image'))
     async UploadProfilePics (@UploadedFile()file:Express.Multer.File,@Req()req){
      return await this.customerservice.UploadCustomerProfilePics(file,req.user)
     }


     @Get('all-my-notification')
     async GetAllMyNotification(@Req()req){
      return await this.customerservice.AllNotificationsRelatedTocustomer(req.user)
     }



   //   @Get('all-my-transactions')
   //   async GetAllMytransctions(@Req()req){
   //    console.log(req.user)
   //    return await this.customerservice(req.user)
   //   }


   
     //access wthout authentication 
     @Post('newsletter')
     async NewsLetter(@Body()dto: NewsLetterDto){
      return await this.customerservice.SubsribeToNewsLetter(dto)
     }

  
     @Post('complain')
     async Complaint(@Body()dto: ComplaintDto,@Req()req){
      return await this.customerservice.FileComplaint(dto,req.user.id)
     }



   
     @Get('ticket')
     async Ticket(@Query('keyword')keyword:string|any){
      return await this.customerservice.CheckComplaintStatus(keyword)
     }










     




}