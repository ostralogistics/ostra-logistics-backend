import {  ReturnedVehicle, Role, VehicleAssignedStatus, VehicleState, VehicleType } from "src/Enums/all-enums";
import { Column, CreateDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { RiderEntity } from "./riders.entity";
import { CartItemEntity } from "./orders.entity";



export interface IVehicle{
    id:number,
    vehicleID:string
    vehicle_model: string,
    vehicle_type: string,
    color: string,
    registration_number: string,
    state_of_vehicle: VehicleState,
    status:VehicleAssignedStatus
    RegisteredAt: Date,
    UpdatedAt: Date,
    DeletedAt: Date
    assigned_Rider:RiderEntity
    assignedAT:Date
    vehiclePics:string
    returned_vehicle:ReturnedVehicle
    retrnedAt:Date


}



@Entity({name:"vehicle",})
export class VehicleEntity implements IVehicle{
    @PrimaryGeneratedColumn()
    id:number

    @Column({nullable:true})
    vehicleID:string

    @Column({nullable:true})
    vehicle_model: string;

    @Column({nullable:true})
    vehicle_type: string;

    @Column({nullable:true})
    color: string;


    @Column({nullable:true})
    registration_number: string;

    
    @Column({nullable:true,type:'enum', enum:VehicleState})
    state_of_vehicle: VehicleState;

    @Column({nullable:true,type:'enum', enum:VehicleAssignedStatus})
    status: VehicleAssignedStatus;

    @Column({nullable:true,type:'timestamp'})
    RegisteredAt: Date;

    @Column({nullable:true,type:'timestamp'})
    UpdatedAt: Date;

    @Column({nullable:true, type:'timestamp'})
    DeletedAt: Date; 

    @ManyToOne(()=>RiderEntity,rider=>rider.vehicle_for_the_day,{nullable:true})
    assigned_Rider: RiderEntity;

    @Column({nullable:true,type:'timestamp'})
    assignedAT: Date;

    @Column({nullable:true})
    vehiclePics:string

    @Column({nullable:true,type:'enum', enum:ReturnedVehicle})
    returned_vehicle: ReturnedVehicle;

    @Column({nullable:true,type:'timestamp'})
    retrnedAt: Date;

    
}