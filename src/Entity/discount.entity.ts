import { BeforeUpdate, Column, Entity, PrimaryGeneratedColumn } from "typeorm"

export interface IDiscount{
    id:number
    OneTime_discountCode:string
    createdAT:Date
    updatedAT:Date
    DiscountDuration_weeks:number
    DiscountDuration_days:number
    percentageOff:number
    expires_in:Date
    isActive:boolean

}

@Entity({name:"Discount"})
export class DiscountEntity implements IDiscount{
    @PrimaryGeneratedColumn()
    id: number

    @Column({nullable:false})
    OneTime_discountCode: string

    @Column({nullable:true, type:"timestamp"})
    createdAT: Date

    @Column({nullable:true})
    DiscountDuration_days: number

    @Column({nullable:true})
    DiscountDuration_weeks: number

    @Column('numeric',{nullable:true})
    percentageOff: number

    @Column({nullable:true, type:"timestamp"})
    expires_in: Date

    @Column({nullable:true, type:"timestamp"})
    updatedAT: Date

    @Column({nullable:true})
    isActive: boolean

    @Column({nullable:true})
    isExpired:boolean

    @BeforeUpdate()
    checkExpiration() {
        if (this.expires_in && this.expires_in < new Date()) {
            this.isActive = false;
            this.isExpired = true
        }
    }

}