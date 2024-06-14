import { TransactionConfirmation, TransactionType } from "src/Enums/all-enums"
import { CustomerEntity } from "./customers.entity"
import { RiderBankDetailsEntity, RiderEntity } from "./riders.entity"
import { IMyBankAccountDetails } from "src/Riders/riders"
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm"

export interface ITransactions{
    id:number
    transactionID:string
    transactedAT:Date
    transactionType:TransactionType

    //from paystack 
    paymentMethod: string //card, transfer or any format the user used while sing paystack
    cardType:string  //ie if card payemt is used
    paymentStatus:string // from pasyatck too, so whether successful or not


    orderID:string
    amount:number
    customer:CustomerEntity
    Rider:RiderEntity
    bankInfo:RiderBankDetailsEntity
    status:TransactionConfirmation



}

@Entity({ name: 'transactions' })
export class TransactionEntity implements ITransactions{
  @PrimaryGeneratedColumn()
  id: number;

  @Column({nullable:true})
  transactionID: string;

  @Column({nullable:true,type:'timestamp'})
  transactedAT: Date;

  @Column({ type: 'enum', enum: TransactionType })
  transactionType: TransactionType;

  @Column({nullable:true})
  paymentMethod: string;

  @Column({nullable:true})
  cardType: string;

  @Column({nullable:true})
  paymentStatus: string;

  @Column({nullable:true})
  orderID: string;

  @Column({nullable:true})
  amount: number;

  @ManyToOne(() => CustomerEntity,{nullable:true,onDelete:'CASCADE'})
  customer: CustomerEntity;

  @ManyToOne(() => RiderEntity,{nullable:true,onDelete:'CASCADE'})
  Rider: RiderEntity;

  @ManyToOne(()=>RiderBankDetailsEntity,{nullable:true,onDelete:'CASCADE'})
  bankInfo: RiderBankDetailsEntity

  @Column({nullable:true, type:'enum', enum:TransactionConfirmation})
  status:TransactionConfirmation


}