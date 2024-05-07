import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm"
import { CustomerEntity } from "./customers.entity"
import { channelforconversation, complainResolutionStatus } from "src/Enums/all-enums"
import { RepliesEntity } from "./replies.entity"
import { RiderEntity } from "./riders.entity"

export interface IComplaints{
    id:number
    ticket:string
    complaints:string
    status:complainResolutionStatus
    channel:channelforconversation
    createdAt:Date
    customer:CustomerEntity
    closedAT:Date
    openedAT:Date
    updatedAT:Date
    replies:RepliesEntity[]

}

@Entity({name:'Complaints'})
export class ComplaintEntity implements IComplaints{

    @PrimaryGeneratedColumn()
    id: number

    @Column({nullable:true})
    ticket: string

    @Column({nullable:true})
    complaints: string

    @Column({nullable:true,type:'timestamp'})
    createdAt: Date

    @Column({nullable:true,type:'enum', enum:complainResolutionStatus,default:complainResolutionStatus.IN_PROGRESS})
    status: complainResolutionStatus

    @Column({nullable:true,type:'enum', enum:channelforconversation})
    channel: channelforconversation

    @Column({nullable:true,type:'timestamp'})
    closedAT: Date

    @Column({nullable:true,type:'timestamp'})
    openedAT: Date

    @Column({nullable:true,type:'timestamp'})
    updatedAT:Date


    @ManyToOne(()=>CustomerEntity, customer=>customer.my_complains)
    customer: CustomerEntity

    @OneToMany(()=>RepliesEntity,replies=>replies.complaint)
    replies: RepliesEntity[]



}