// where the tasks can be stored for the rider to see and follwo up with 

import { RiderMileStones, RiderTask, TaskStatus } from "src/Enums/all-enums";
import { OrderEntity } from "./orders.entity";
import { Column, CreateDateColumn, Entity, ManyToOne, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { RiderEntity } from "./riders.entity";

export interface IRiderTask{
    id:number,
    task:RiderTask,
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

    @Column({nullable:true, type:'enum', enum:RiderTask})
    task: RiderTask;

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

    @ManyToOne(()=>OrderEntity,order =>order.assigned_task)
    assigned_order: OrderEntity;

    @Column({ nullable: true,type:'timestamp' })
    assignedAT: Date;





}