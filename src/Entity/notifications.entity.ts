
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm"; 
@Entity("notifications")
export class Notifications implements INotification{
    @PrimaryGeneratedColumn()
    id:number

    @CreateDateColumn()
    date:Date 

    @Column('varchar',{nullable:false})
    account:string


    @Column({nullable:false})
    message:string


    @Column({nullable:false})
    subject:string

    @Column({nullable:true, type:'boolean',default:false})
    isRead: boolean;
    
}

export interface INotification{
    id:number
    account:string | any
    message:string
    subject:string
    date:Date
    isRead:boolean
    
}

