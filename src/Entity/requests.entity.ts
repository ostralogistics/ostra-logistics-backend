import { RequestType } from "src/Enums/all-enums"
import { RiderEntity } from "./riders.entity"
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm"

export interface IRequests{
    id:number
    requestedAt:Date
    requestType:RequestType
    body:string
    Rider:RiderEntity
}

@Entity({name:'Requests'})
export class RequestEntity implements IRequests{
    @PrimaryGeneratedColumn()
    id:number

    @Column({nullable:true})
    body: string

    @Column({nullable:true,type:'enum', enum:RequestType})
    requestType: RequestType

    @Column({nullable:true, type:'timestamp'})
    requestedAt: Date

    @ManyToOne(()=>RiderEntity, request=> request.my_requests,{nullable:true,onDelete:'CASCADE'} )
    Rider: RiderEntity
}