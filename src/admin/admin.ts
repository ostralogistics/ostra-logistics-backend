import { OrderCartEntity, OrderEntity } from "src/Entity/orders.entity"
import { RepliesEntity } from "src/Entity/replies.entity"
import { AdminAccessLevels, AdminType, Gender, MaritalStatus, Role, StateOFOrigin } from "src/Enums/all-enums"

export interface IAdmin {
    id:string 
    adminID:string
    fullname:string
    firstname:string
    lastname:string
    email:string,
    password:string
    home_address:string 
    mobile: string
    gender: Gender
    marital_status:MaritalStatus
    profile_picture: string
    state_of_origin:StateOFOrigin
    Nationality:string
    LGA_of_origin: string
    LGA_of_Home_Address: string
    RegisteredAt : Date
    UpdatedAt : Date
    role:Role
    DOB:string,
    age:number,
    admintype:AdminType
    adminAccessLevels:AdminAccessLevels
    isLoggedIn:boolean
    isVerified:boolean
    isRegistered:boolean
    isLoggedOut:boolean 
    replies:RepliesEntity[]
    carts: OrderCartEntity
    my_orders: OrderEntity[];

}

export interface ICreateAdmins{
    id:string 
    firstname:string
    lastname:string
    email:string,
    DOB:string,
    age:number
    password:string
    home_address:string 
    state_of_origin:StateOFOrigin
    LGA_of_origin: string
    mobile: string
    marital_status:MaritalStatus
    gender: Gender
    profile_picture: string
    LGA_of_Home_Address: string
    RegisteredAt : Date
    role:Role
    admintype:AdminType
    adminAccessLevels:AdminAccessLevels

}