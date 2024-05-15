import { BidEntity } from "src/Entity/bids.entity";
import { DiscountUsageEntity } from "src/Entity/discountUsage.entity";
import { Notifications } from "src/Entity/notifications.entity";
import { UserOtp } from "src/Entity/otp.entity";
import { ReceiptEntity } from "src/Entity/receipt.entity";
import { RequestEntity } from "src/Entity/requests.entity";
import { TransactionEntity } from "src/Entity/transactions.entity";
import { EntityRepository, Repository } from "typeorm";

@EntityRepository(UserOtp)
export class OtpRepository extends Repository<UserOtp>{}

   

@EntityRepository(Notifications)
export class NotificationRepository extends Repository<Notifications>{}

@EntityRepository(BidEntity)
export class BidRepository extends Repository<BidEntity>{}

@EntityRepository(RequestEntity)
export class RequestRepository extends Repository<RequestEntity>{}


@EntityRepository(DiscountUsageEntity)
export class DiscountUsageRepository extends Repository<DiscountUsageEntity>{}


@EntityRepository(TransactionEntity)
export class TransactionRespository extends Repository<TransactionEntity>{}

@EntityRepository(ReceiptEntity)
export class ReceiptRespository extends Repository<ReceiptEntity>{}