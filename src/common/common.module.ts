import { Module } from "@nestjs/common";
import { websocketgw } from "./gateways/websockets.gateway";
import { DistanceService } from "./services/distance.service";
import { UploadService } from "./helpers/upload.service";
import { Mailer } from "./mailer/mailer.service";
import { GeoCodingService } from "./services/goecoding.service";
import { GeneatorService } from "./services/generator.service";
import { JwtService } from "@nestjs/jwt";

@Module({
    imports:[],
    providers:[websocketgw,DistanceService,UploadService,Mailer,GeoCodingService,GeneatorService,JwtService],
    controllers:[],
    exports:[DistanceService,UploadService,Mailer,GeoCodingService,GeneatorService]
})
export class CommonModule{}

