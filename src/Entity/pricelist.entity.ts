import { Column, Entity, PrimaryGeneratedColumn } from "typeorm"

export interface IPriceList{
    id:number
    location:string
    amount:string
    createdAT:Date
    updatedAT:Date
}

@Entity({name:'PriceList'})
export class PriceListEntity implements IPriceList{
    @PrimaryGeneratedColumn()
    id: number

    @Column({nullable:true})
    location: string

    @Column({nullable:true})
    amount: string

    @Column({nullable:true,type:"timestamp"})
    createdAT: Date

    @Column({nullable:true,type:"timestamp"})
    updatedAT: Date
}