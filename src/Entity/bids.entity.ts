import { BidStatus } from "src/Enums/all-enums";
import { Column, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { OrderEntity } from "./orders.entity";
import { AdminEntity } from "./admins.entity";

export interface IBids{
    id:number,
    bidStatus: BidStatus,
    order:OrderEntity
    // bidGroupId: string;
    bid_value:number
    initialBidPlacedAt: Date;
    BidAcceptedAt: Date;
    counterOfferAcceptedAt:Date
    isCounterOfferAccepted:boolean
    BidDeclinedAt: Date;
    counter_bid_offer: number
    counteredAt:Date
    madeby:AdminEntity

}

export interface IInitialBidsResponse{
    id:number,
    bidStatus: BidStatus,
    order:OrderEntity
    bid_value:number
    initialBidPlacedAt: Date;

}

export interface ICounterBidResponse{
    id:number,
    bidStatus: BidStatus,
    order:OrderEntity
    bid_value:number,
    counter_bid_offer: number,
    counteredAt:Date


}

@Entity({name:'Bids'})
export class  BidEntity implements IBids{

@PrimaryGeneratedColumn()
id:number

@Column({type:'enum',enum:BidStatus,nullable:false,default:BidStatus.PENDING})
bidStatus : BidStatus

@ManyToOne(() => OrderEntity, order => order.bid, { nullable: true }) // Many-to-one relationship with orders// This is optional; it creates a foreign key column in the BidEntity table
order: OrderEntity;

@Column('numeric',{nullable:true})
bid_value: number;

@Column({nullable:true,type:"timestamp"})
initialBidPlacedAt: Date;

@Column({nullable:true,type:"timestamp"})
BidAcceptedAt: Date;

@Column({nullable:true,type:"timestamp"})
counterOfferAcceptedAt: Date;

@Column({nullable:true,type:'boolean', default:false})
isCounterOfferAccepted: boolean;



@Column({nullable:true,type:"timestamp"})
BidDeclinedAt: Date;

@Column('numeric',{nullable:true})
counter_bid_offer: number;

@Column({nullable:true,type:'boolean', default:false})
isCounterOffer:boolean

@Column({ nullable: true,type:'timestamp' })
counteredAt:Date

@ManyToOne(()=>AdminEntity, admin => admin.bids_sent,{onDelete:'CASCADE'})
madeby: AdminEntity;

}