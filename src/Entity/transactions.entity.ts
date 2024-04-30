import { TransactionType } from "src/Enums/all-enums"

export interface ITransactions{
    id:string
    transactedAT:Date
    transactionType:TransactionType
    orderID:string


}