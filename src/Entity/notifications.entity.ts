
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
    
}

export interface INotification{
    id:number
    account:string | any
    message:string
    subject:string
    date:Date
    
}

