import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm"
import { ComplaintEntity } from "./complaints.entity"
import { AdminEntity } from "./admins.entity"

export interface IReplies{
    id:number
    reply:string
    repliedAT:Date
    repliedBy:AdminEntity
    complaint:ComplaintEntity

}

@Entity({name:"Replies"})
export class RepliesEntity implements IReplies{
    @PrimaryGeneratedColumn()
    id: number

    @Column({nullable:true})
    reply: string

    @Column({nullable:true,type:"timestamp"})
    repliedAT: Date

    @ManyToOne(()=>AdminEntity,admin=>admin,{nullable:true,onDelete:'CASCADE'})
    repliedBy: AdminEntity

    @ManyToOne(()=>ComplaintEntity,complain=>complain.replies,{nullable:true,onDelete:'CASCADE'})
    complaint: ComplaintEntity


}