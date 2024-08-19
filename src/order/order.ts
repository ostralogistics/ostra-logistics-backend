import { CustomerEntity } from "src/Entity/customers.entity"
import { OrderItemEntity } from "src/Entity/orders.entity"
import { RiderEntity } from "src/Entity/riders.entity"
import { TaskEntity } from "src/Entity/ridersTasks.entity"
import { TransactionEntity } from "src/Entity/transactions.entity"
import { OrderDisplayStatus, OrderStatus, ParcelStatus, PaymentStatus, PriorityDeliveryType } from "src/Enums/all-enums"
import { BidStatus, VehicleType } from "src/Enums/all-enums"



export interface IOrder{
    id:number
    orderID:string
    orderPlacedAt:Date
    items: OrderItemEntity[];
    processingOrderAT:Date
    payment_status: PaymentStatus
    paymentVerifiedAT: Date
    RiderAssignedAT:Date
    EnrouteToPickupAT:Date
    AtThePickUpLocationAT:Date
    RiderRecieveParcelAT:Date
    EnrouteToOfficeAT:Date
    ArrivesAtTheOfficeAT:Date
    EnrouteToDropOffAT:Date
    RiderAtDropOffLocationAT:Date
    DeliveredAT:Date,
    trackingID:string 
    dropoffCode :string
    barcodeDigits :string
    order_status:OrderStatus
    Rider:RiderEntity
    assigned_task :TaskEntity
    accepted_cost_of_delivery : number
    VAT:number
    IsDiscountApplied:boolean
    discount?:number
    bidStatus: BidStatus;
    order_display_status:OrderDisplayStatus
    customer: CustomerEntity;
    transaction:TransactionEntity
    rating:number,
    review:string


   
}

