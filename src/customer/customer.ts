import { CardEntity } from "src/Entity/card.entity"
import { ComplaintEntity } from "src/Entity/complaints.entity"
import { DiscountUsageEntity } from "src/Entity/discountUsage.entity"
import { OrderCartEntity, OrderEntity } from "src/Entity/orders.entity"
import { Gender, Role, StateOFOrigin } from "src/Enums/all-enums"

export interface ICustomer {
    id:string 
    customerID:string
    firstname:string
    lastname:string
    home_address:string 
    gender: Gender
    profile_picture: string
    LGA_of_Home_Address: string
    RegisteredAt : Date
    UpdatedAt : Date
    role:Role
    promoCode:string
    isLoggedIn:boolean
    isVerified:boolean
    isRegistered:boolean
    isLoggedOut:boolean 
    loginCount:number
    locked_until : Date
    my_orders: OrderEntity[]
    my_cards :CardEntity[]
    my_complains:ComplaintEntity[]
    discountUsages: DiscountUsageEntity[];
    carts:OrderCartEntity


}