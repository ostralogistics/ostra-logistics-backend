import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('passcodes')
export class PasscodeEntity{
    @PrimaryGeneratedColumn()
    id:number

    @Column({nullable:true})
    passcode:string

    @Column({nullable:true, type:'timestamp'})
    updatedAT:Date
}