import { CustomerEntity } from "src/Entity/customers.entity"
import { RiderEntity } from "src/Entity/riders.entity"
import { TaskEntity } from "src/Entity/ridersTasks.entity"
import { OrderStatus, ParcelStatus, PaymentStatus, PriorityDeliveryType } from "src/Enums/all-enums"
import { BidStatus, VehicleType } from "src/Enums/all-enums"



export interface IOrder{
    id:number
    orderID:string
    //after bid is accepted
    payment_status: PaymentStatus
    payment_verifiedAT: Date
    pickupTime:Date,
    dropOffTime:Date,
    trackingID:string 
    dropoffCode :string
    barcodeDigits :string
    order_status:OrderStatus
    orderCreatedAtTime:Date
    RiderArrivaltime:Date
    RiderAssignedAT:Date
    Rider:RiderEntity
    assigned_task :TaskEntity
    accepted_cost_of_delivery : number
    VAT:number
    IsDiscountApplied:boolean
    discount?:number
    bidStatus: BidStatus;


   
}

