import { Gender, Role, StateOFOrigin } from "src/Enums/all-enums";
import { ICustomer } from "src/customer/customer";
import { Column, CreateDateColumn, DeleteDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { OrderCartEntity, OrderEntity } from "./orders.entity";
import { CardEntity } from "./card.entity";
import { ComplaintEntity } from "./complaints.entity";
import { DiscountUsageEntity } from "./discountUsage.entity";

@Entity({name:"Customer",})
export class CustomerEntity implements ICustomer{
    @PrimaryGeneratedColumn()
    id:string

    @Column({nullable:true})
    customerID:string

    @Column({nullable:false,unique:true})
    email: string;

    @Column({nullable:false, type:'enum', enum:Role, default:Role.CUSTOMER})
    role: Role;

    @Column({nullable:false})
    password: string;

    @Column({nullable:false})
    firstname: string;


    @Column({nullable:false})
    lastname: string;

    @Column({nullable:true})
    mobile: string;

    @UpdateDateColumn({nullable:true,default:null})
    UpdatedAt:Date

    @Column({ nullable: true,type:'timestamp' })
    RegisteredAt:Date

    @Column({nullable:true})
    promoCode: string;


    @Column({nullable:true})
    home_address:string

    @Column({nullable:true})
    profile_picture: string;

    @Column({nullable:true})
    LGA_of_Home_Address: string

    @Column({nullable:true})
    gender: Gender;



    @Column({nullable:false,default:false})
    isLoggedIn: boolean;


    @Column({nullable:false,default:false})
    isRegistered: boolean;

    @Column({nullable:false,default:false})
    isVerified: boolean;

    @Column({nullable:true})
    reset_link_exptime: Date;

    @Column({nullable:true})
    password_reset_link: string;

    @Column({nullable:false, default:0})
    loginCount: number;

    @Column({nullable:false, default:false})
    isLocked: boolean;

    @Column({ nullable: true,type:'timestamp' })
    locked_until: Date;

    @OneToMany(()=>OrderEntity, order=>order.customer)
    my_orders: OrderEntity[];

    @OneToMany(()=>CardEntity,card => card.card_owner )
    my_cards :CardEntity[]

    @OneToMany(()=>ComplaintEntity,complain=>complain.customer)
    my_complains: ComplaintEntity[];

    @OneToMany(()=>OrderCartEntity, cart =>cart.customer)
    carts: OrderCartEntity;

    @OneToMany(() => DiscountUsageEntity, (usage) => usage.appliedBy)
    discountUsages: DiscountUsageEntity[];
    





    

    
    
    
}