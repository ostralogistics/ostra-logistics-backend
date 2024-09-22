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

    @Column('decimal', { precision: 10, scale: 2,nullable:true,  })
    expressDeliveryCharge: number;
  
    @Column('decimal', { precision: 10, scale: 2,nullable:true,  })
    VAT: number;
  
    @Column('decimal', { precision: 10, scale: 2 ,nullable:true, })
    subtotal: number;
  
    @Column('decimal', { precision: 10, scale: 2,nullable:true,  })
    total: number;
  
    @Column('decimal', { precision: 10, scale: 2,nullable:true,  })
    discount?: number;

    @OneToOne(()=>OrderEntity)
    @JoinColumn()
    order: OrderEntity



}