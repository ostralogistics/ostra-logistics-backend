// where the tasks can be stored for the rider to see and follwo up with 

import { RiderMileStones,  TaskStatus } from "src/Enums/all-enums";
import { OrderEntity } from "./orders.entity";
import { Column, CreateDateColumn, Entity, ManyToOne, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { RiderEntity } from "./riders.entity";

export interface IRiderTask{
    id:number,
    task:string,
    reason_for_cancelling_ride:string
    reason_for_cancelling_declining:string
    rider:RiderEntity
    acceptedAt:Date
    declinedAT:Date,
    assigned_order:OrderEntity,
    status:TaskStatus
    milestone :RiderMileStones
    assignedAT:Date
}

@Entity({name:'Tasks'})
export class TaskEntity implements IRiderTask{
    @PrimaryGeneratedColumn()
    id: number;

    @Column({nullable:true})
    task: string;

    @Column({nullable:true})
    reason_for_cancelling_ride:string

    @Column({nullable:true})
    reason_for_cancelling_declining:string

    @Column({nullable:true, type:'boolean', default:false})
    isCancelled:boolean

    @Column({ nullable: true,type:'timestamp' })
    cancelledAt: Date;

   
    @ManyToOne(()=>RiderEntity,rider=>rider.tasks,{onDelete:'CASCADE'})
    rider: RiderEntity;

    @Column({ nullable: true,type:'timestamp' })
    acceptedAt: Date;

    @Column({ nullable: true,type:'timestamp' })
    declinedAT: Date;

    @Column({nullable:true, type:'enum', enum:TaskStatus})
    status: TaskStatus;


    @Column({nullable:true, type:'enum', enum:RiderMileStones})
    milestone: RiderMileStones;

    @Column("jsonb", { nullable: false, default: '{}' })
    checkpointStatus: { [key in RiderMileStones]: boolean };


    @Column({ nullable: true,type:'timestamp' })
    enroute_to_pickup_locationAT:Date

    @Column({ nullable: true,type:'timestamp' })
    at_pickup_locationAT:Date

    @Column({ nullable: true,type:'timestamp' })
    picked_up_parcelAT:Date

    @Column({ nullable: true,type:'timestamp' })
    enroute_to_office_for_rebrandingAT:Date

    @Column({ nullable: true,type:'timestamp' })
    at_the_office_for_rebrandingAT:Date

    @Column({ nullable: true,type:'timestamp' })
    enroute_to_dropoff_locationAT:Date

    @Column({ nullable: true,type:'timestamp' })
    at_dropoff_locationAT:Date

    @Column({ nullable: true,type:'timestamp' })
    dropped_off_parcelAT:Date


    @ManyToOne(()=>OrderEntity,order =>order.assigned_task)
    assigned_order: OrderEntity;

    @Column({ nullable: true,type:'timestamp' })
    assignedAT: Date;







}