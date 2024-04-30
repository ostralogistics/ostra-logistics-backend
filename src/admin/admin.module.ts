import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminEntity } from 'src/Entity/admins.entity';
import { Notifications } from 'src/Entity/notifications.entity';
import { UserOtp } from 'src/Entity/otp.entity';
//import { AdminAuthController } from "./admin.auth.controller";
//import { AdminAuthService } from "./admin.auth.service";
import { Mailer } from 'src/common/mailer/mailer.service';
import { JwtService } from '@nestjs/jwt';
import { AdminRiderDashboardService } from './admin.riders.dashboard.service';
import { AdminStaffDasboardService } from './admin.staff.dashboard.service';
import { AdminRiderDashBoardController } from './admin.riders.dashboard.controller';
import { AdminStaffDashBoardController } from './admin.staff.dashboard.controller';
import { UploadService } from 'src/common/helpers/upload.service';
import { CustomerAuthService } from 'src/customer/customer.auth.service';
import { RiderEntity } from 'src/Entity/riders.entity';
import { CustomerEntity } from 'src/Entity/customers.entity';
import { BidEntity } from 'src/Entity/bids.entity';
import { AdminAuthController } from './admin.auth.controller';
import { AdminAuthService } from './admin.auth.service';
import { OrderEntity } from 'src/Entity/orders.entity';
import { AdminCustomerDashBoardController } from './admin.customers.dashboard.controller';
import { AdminCustomerDashBoardService } from './admin.customers.dashboard.service';
import { BidEventsService } from 'src/common/Events/bid.events.service';
import { TaskEntity } from 'src/Entity/ridersTasks.entity';
import { RequestEntity } from 'src/Entity/requests.entity';
import { VehicleEntity } from 'src/Entity/vehicle.entity';
import { Admincontroller } from './admin.controller';
import { AdminService } from './admin.service';
import { GeneatorService } from 'src/common/services/generator.service';


@Module({
  imports: [
  
    TypeOrmModule.forFeature([
      AdminEntity,
      Notifications,
      UserOtp,
      RiderEntity,
      CustomerEntity,
      BidEntity,
      OrderEntity,
      TaskEntity,
      RequestEntity,
      VehicleEntity,

    ]),
  ],
  controllers: [
    AdminRiderDashBoardController,
    AdminStaffDashBoardController,
    AdminAuthController,
    AdminCustomerDashBoardController,
    Admincontroller
  ],
  providers: [
    Mailer,
    JwtService,
    AdminRiderDashboardService,
    AdminStaffDasboardService,
    UploadService,
    GeneatorService,
    AdminAuthService,
    AdminCustomerDashBoardService,
    BidEventsService,
    AdminService,
  ],
})
export class AdminModule {}
