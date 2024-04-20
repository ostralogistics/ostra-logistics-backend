import { Module } from "@nestjs/common";
import { PaystackWebhookService} from "./webhook.service";
import { WebhookController } from "./webhook.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { OrderEntity } from "src/Entity/orders.entity";
import { Mailer } from "src/common/mailer/mailer.service";

@Module({
    imports:[TypeOrmModule.forFeature([OrderEntity])],
    providers:[PaystackWebhookService,Mailer],
    controllers:[WebhookController],

})
export class WebHookModule{

}