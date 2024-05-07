import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm"
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

    @OneToMany(()=>CustomerEntity,customer => customer)
    appliedBy: CustomerEntity


}