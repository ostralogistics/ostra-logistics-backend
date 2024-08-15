import { Column, JoinColumn, OneToOne, PrimaryGeneratedColumn,Entity } from "typeorm"
import { OrderEntity } from "./orders.entity"

export interface IReceipt{
    id:number
    ReceiptID:string
    issuedAt:Date
    dueAt:Date
    order:OrderEntity
    subtotal:number
    VAT:number
    expressDeliveryCharge: number;
    discount?:number
    total:number
}

@Entity({name:'Receipt'})
export class ReceiptEntity implements IReceipt{
    @PrimaryGeneratedColumn()
    id: number

    @Column({nullable:true})
    ReceiptID: string

    @Column({nullable:true, type:'timestamp'})
    issuedAt: Date

    @Column({nullable:true, type:'timestamp'})
    dueAt: Date

    @Column({nullable:true})
    discount?: number

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    expressDeliveryCharge: number;

    @Column({nullable:true})
    VAT: number

    @Column({nullable:true})
    subtotal: number

    @Column({nullable:true})
    total: number

    @OneToOne(()=>OrderEntity)
    @JoinColumn()
    order: OrderEntity



}