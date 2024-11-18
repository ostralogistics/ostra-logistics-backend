import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { CartItemEntity } from "./orders.entity";

@Entity({name:'veihicleType'})
export class VehicleTypeEntity {
    @PrimaryGeneratedColumn()
    id:number

    @Column({nullable:true})
    name:string

    @Column({type:'timestamp'})
    addedAt:Date

    @Column({nullable:true})
    status:string

    @OneToMany(()=>CartItemEntity, selected=>selected.vehicleType,{nullable:true})
    selected_vehicle:CartItemEntity[]
}