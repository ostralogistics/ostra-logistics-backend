import { Column, Entity, PrimaryGeneratedColumn } from "typeorm"

export interface INewsLetter{
    id:number
    firstname:string
    lastname:string
    email:string
    SubscribedAt:Date
}

@Entity({name:'Newsletter'})
export class NewsLetterEntity implements INewsLetter{
    @PrimaryGeneratedColumn()
    id: number

    @Column({nullable:true,unique:true})
    email: string

    @Column({nullable:true})
    firstname: string

    @Column({nullable:true})
    lastname: string

    @Column({nullable:true, type:'timestamp'})
    SubscribedAt: Date
    

}
