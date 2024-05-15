import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import { PublicService } from "./services/public.service";
import { NewsLetterDto } from "src/customer/customer.dto";

@Controller('unprotected')
export class CommonController{
    constructor(private readonly publicservice:PublicService){}

    @Get('track-order-unprotected')
    async TrackOrder(@Query('keyword')keyword: string|any){
        return await this.publicservice.TrackOrder(keyword)
    }

    @Get('scan-barcode-unprotected/:barcodeDigit')
    async ScanBarcode(@Param('barcodeDigit')barcodeDegit: string){
        return await this.publicservice.scanBarcode(barcodeDegit)
    }

    @Post('newsletter')
     async NewsLetter(@Body()dto: NewsLetterDto){
      return await this.publicservice.SubsribeToNewsLetter(dto)
     }
    
}