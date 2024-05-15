import { CustomerEntity } from "src/Entity/customers.entity"
import { RiderEntity } from "src/Entity/riders.entity"
import { TaskEntity } from "src/Entity/ridersTasks.entity"
import { OrderStatus, ParcelStatus, PaymentStatus, PriorityDeliveryType } from "src/Enums/all-enums"
import { BidStatus, VehicleType } from "src/Enums/all-enums"



export interface IOrder{
    id:number
    orderID:string
    is_group_order: boolean
    groupOrderID: string;

    //customer details for in office delivery 
    name:string
    phoneNumber:string
    email:string
    address:string
    home_apartment_number :string
    area:string
    landmark:string
 

    //parcel information and  pick up details
    parcel_name :string,
    product_category:string[],
    quantity:number,
    parcelWorth : string,
    weight_of_parcel:number,
    describe_weight_of_parcel?:string
    customer:CustomerEntity ,
    pickup_phone_number:string,
    pickup_address:string
    house_apartment_number_of_pickup:string,
    Area_of_pickup:string
    landmark_of_pickup:string,
    note_for_rider:string

    //drop off details 
    Recipient_name : string
    Recipient_phone_number :string
    dropOff_address:string
    house_apartment_number_of_dropoff:string,
    Area_of_dropoff:string
    landmark_of_dropoff:string,

    //order info 
    vehicleType:VehicleType
    delivery_type :PriorityDeliveryType
    schedule_date: Date
    initial_cost: number;

    //other related data needed for processses
    distance:number,
    bidStatus : BidStatus
    pickupLat: number;
    pickupLong: number;
    dropOffLat: number;
    dropOffLong: number;

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


   
}

