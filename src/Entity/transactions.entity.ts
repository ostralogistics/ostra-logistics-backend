import { TransactionType } from "src/Enums/all-enums"
import { CustomerEntity } from "./customers.entity"
import { RiderEntity } from "./riders.entity"
import { IMyBankAccountDetails } from "src/Riders/riders"

export interface ITransactions{
    id:string
    transactionID:string
    transactedAT:Date
    transactionType:TransactionType
    orderID:string
    amount:number
    customer:CustomerEntity
    Rider:RiderEntity
    bankInfo:IMyBankAccountDetails


}