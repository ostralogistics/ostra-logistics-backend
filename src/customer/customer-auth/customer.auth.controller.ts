import { Controller,Post,Patch,Body, Req,Get, UseGuards, Param } from "@nestjs/common";
import {  GetDeviceTokenDto, Logindto, RequestOtpResendDto, SendPasswordResetLinkDto, VerifyOtpDto, VerifyOtpForResetPasswordDto } from "src/common/common.dto";
import { JwtGuard } from "src/auth/guard/jwt.guard";
import { CustomerAuthService } from "./customer.auth.service";
import { RegisterCustomerDto, addPasswordDto } from "../customer.dto";
import { Request } from "express";

@Controller('customer-auth')
export class CustomerAuthController{
    constructor(private readonly customerauthservice:CustomerAuthService){}


    @UseGuards(JwtGuard)
    @Post('profile')
    async getProfile(@Req()req, @Body()dto:GetDeviceTokenDto): Promise<any> {
      
      return this.customerauthservice.getProfile(req.user,dto);
    }

    @Post('/register')
    async Registeradmin(@Body()dto:RegisterCustomerDto):Promise<{message:string}>{
        return await this.customerauthservice.RegisterCustomer(dto)
    }

    @Post('/verify-email')
    async Verify_email(@Body()dto:VerifyOtpDto):Promise<{isValid:boolean; accessToken:any}>{
        return await this.customerauthservice.verifyEmail(dto)
    }

 
    @Post('/resend-otp')
    async resendVerificationLink(@Req()req:Request):Promise<{message:string}>{
        const email = req.headers.email
        console.log(email)
        return await this.customerauthservice.ResendExpiredOtp(email)

    }

    @Post('/send-password-reset-token')
    async sendPasswordResetLink (@Body()dto:SendPasswordResetLinkDto):Promise<{message:string}>{
        return await this.customerauthservice.sendPasswordResetToken(dto)
    }

    @Post('/verify-reset-password-token')
    async VerifyResetPasswordToken(@Body()dto:VerifyOtpForResetPasswordDto):Promise<{message:string}>{
        return await this.customerauthservice.VerifyResetPasswordOtp(dto)

    }

    @Patch('/reset-password')
    async ResetPassword (@Body()dto:addPasswordDto):Promise<{message:string}>{
        return await this.customerauthservice.FinallyResetPasswordAfterVerification(dto)
    }

   

    @Post('/login')
    async Login(@Body()dto:Logindto){
        return await this.customerauthservice.login(dto)
    }


}