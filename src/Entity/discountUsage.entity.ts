import { Column, Entity, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm"
import { CustomerEntity } from "./customers.entity"

export interface IDiscountUsage{
    id:number
    code:string
    appliedBy:CustomerEntity
    appliedAT:Date
    expiredAT:Date
}

@Entity({name:"DiscountUsage"})
export class DiscountUsageEntity implements IDiscountUsage{
    @PrimaryGeneratedColumn()
    id: number

    @Column({nullable:true})
    code: string

    @Column({nullable:true, type:"timestamp"})
    appliedAT: Date

    @Column({nullable:true, type:"timestamp"})
    expiredAT: Date

    @ManyToOne(()=>CustomerEntity, customer => customer.discountUsages,{nullable:true, onDelete:'CASCADE'})
    appliedBy: CustomerEntity

   


}