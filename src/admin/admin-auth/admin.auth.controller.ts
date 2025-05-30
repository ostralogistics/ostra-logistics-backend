import { Controller,Post,Patch,Body, Req,Get, UseGuards, Param } from "@nestjs/common";
import {  Logindto, RequestOtpResendDto, ResendOtpDto, SendPasswordResetLinkDto, VerifyOtpDto, VerifyOtpForResetPasswordDto } from "src/common/common.dto";
import { JwtGuard } from "src/auth/guard/jwt.guard";
import { AdminAuthService } from "./admin.auth.service";
import { PasscodeDto, RegisterAdminDto } from "../admin.dto";
import { addPasswordDto } from "src/customer/customer.dto";
import { Request } from "express";


@Controller('admin-auth')
export class AdminAuthController{
    adminservice: any;
    constructor(private readonly adminauthservice:AdminAuthService){}



    @UseGuards(JwtGuard)
    @Get('profile')
    async getProfile(@Req() req: any): Promise<any> {
      const userId = req.user;
      return this.adminauthservice.getProfile(userId);
    }


  @Post('/verify-passcode')
  async VerifyPasscode(
    @Body() dto: PasscodeDto,
  ){
    return await this.adminauthservice.VerifyPasscodeBeforeSignup(dto);
  }

  @Post('generate-passcode')
  async GeneratePasscode() {
    return await this.adminauthservice.GeneratePasscode();
  }


    @Post('/register')
    async Registeradmin(@Body()dto:RegisterAdminDto):Promise<{message:string}>{
        return await this.adminauthservice.RegisterSuperAdmin(dto)
    }

    @Post('/verify-email')
    async Verify_email(@Body()dto:VerifyOtpDto):Promise<{isValid:boolean; accessToken:any}>{
        return await this.adminauthservice.verifyEmail(dto)
    }

 

    @Post('/resend-otp')
    async resendVerificationLink(@Body()dto:ResendOtpDto):Promise<{message:string}>{
        return await this.adminauthservice.ResendExpiredOtp(dto)

    }


    @Post('/send-password-reset-token')
    async sendPasswordResetLink (@Body()dto:SendPasswordResetLinkDto):Promise<{message:string}>{
        return await this.adminauthservice.sendPasswordResetLink(dto)
    }


    @Post('/verify-reset-password-token')
    async VerifyResetPasswordToken(@Body()dto:VerifyOtpForResetPasswordDto):Promise<{message:string}>{
        return await this.adminauthservice.VerifyResetPasswordOtp(dto)

    }

    @Patch('/reset-password')
    async ResetPassword(@Body()dto:addPasswordDto):Promise<{message:string}>{
        return await this.adminauthservice.FinallyResetPasswordAfterVerification(dto)

    }

    @Post('/login')
    async Login(@Body()dto:Logindto){
        return await this.adminauthservice.login(dto)
    }


}