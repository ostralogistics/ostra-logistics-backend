import { BidStatus } from "src/Enums/all-enums";
import { Column, Entity, ManyToOne, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
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

@OneToOne(()=>OrderEntity,order=>order.bid)
order : OrderEntity

@Column('numeric',{nullable:true})
bid_value: number;

@Column({nullable:true,type:"timestamp"})
initialBidPlacedAt: Date;

@Column({nullable:true,type:"timestamp"})
BidAcceptedAt: Date;

@Column({nullable:true,type:"timestamp"})
BidDeclinedAt: Date;

@Column('numeric',{nullable:true})
counter_bid_offer: number;

@Column({ nullable: true,type:'timestamp' })
counteredAt:Date

@ManyToOne(()=>AdminEntity, admin => admin.bids_sent,{onDelete:'CASCADE'})
madeby: AdminEntity;

}