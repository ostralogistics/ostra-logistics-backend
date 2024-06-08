import { AdminAccessLevels, AdminType, Gender, MaritalStatus, Role, StateOFOrigin } from "src/Enums/all-enums";
import { IAdmin } from "src/admin/admin";
import { Column, CreateDateColumn, DeleteDateColumn, Entity, OneToMany, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { RepliesEntity } from "./replies.entity";
import { OrderCartEntity, OrderEntity } from "./orders.entity";
import { BidEntity } from "./bids.entity";

@Entity({name:"Admin",})
export class AdminEntity implements IAdmin{
    @PrimaryGeneratedColumn()
    id:string

    @Column({nullable:true})
    adminID:string

    @Column({nullable:false,unique:true})
    email: string;

    @Column({nullable:false, type:'enum', enum:Role, default:Role.ADMIN})
    role: Role;

    @Column({nullable:false, type:'enum', enum:AdminAccessLevels, default:AdminAccessLevels.LEVEL1})
    adminAccessLevels: AdminAccessLevels;

    @Column({nullable:false, type:'enum', enum:AdminType})
    admintype: AdminType;

    @Column({nullable:true})
    DOB: string;

    @Column({nullable:true})
    age:number

    @Column({nullable:true, type:'enum', enum:StateOFOrigin})
    state_of_origin: StateOFOrigin;

    @Column({nullable:true, type:'enum', enum:MaritalStatus,})
    marital_status: MaritalStatus;

    @Column({nullable:true})
    LGA_of_origin: string;

    @Column({nullable:true})
    password: string;

    @Column({nullable:true})
    mobile: string;

    @Column({nullable:true})
    fullname: string;


    @Column({nullable:true})
    firstname: string;


    @Column({nullable:true})
    lastname: string;

   
    @Column({nullable:true,type:'timestamp'})
    UpdatedAt:Date

    @Column({nullable:true,type:'timestamp'})
    RegisteredAt:Date


    @Column({nullable:true})
    home_address:string

    @Column({nullable:true})
    profile_picture: string;

    @Column({nullable:true})
    LGA_of_Home_Address: string

    @Column({nullable:true})
    gender: Gender;

    @Column({nullable:true})
    Nationality: string;

    @Column({nullable:true,type:'simple-array'})
    deviceToken: string[];


    @Column({nullable:true,default:false})
    isLoggedIn: boolean;

    @Column({nullable:true,default:false})
    isLoggedOut: boolean;

    @Column({nullable:true,default:false})
    isRegistered: boolean;

    @Column({nullable:false,default:false})
    isVerified: boolean;

    @Column({nullable:true,type:'timestamp'})
    reset_link_exptime: Date;

    @Column({nullable:true})
    password_reset_link: string;


    @Column({nullable:false, default:false})
    isLocked: boolean;


    @OneToMany(()=>RepliesEntity,replies=>replies.repliedBy)
    replies: RepliesEntity[];


    @OneToMany(()=>OrderCartEntity, cart =>cart.admin)
    carts: OrderCartEntity;

    @OneToMany(()=>OrderEntity, order=>order.admin)
    my_orders: OrderEntity[];

    @OneToMany(()=>BidEntity, bids =>bids.madeby)
    bids_sent: BidEntity[]
    
    
}