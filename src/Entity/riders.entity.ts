import { BankDetailsStatus, MaritalStatus, RiderStatus, Role, StateOFOrigin } from "src/Enums/all-enums";
import { IMyBankAccountDetails, IRider } from "src/Riders/riders";
import { Column, CreateDateColumn, DeleteDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { OrderEntity } from "./orders.entity";
import { TaskEntity } from "./ridersTasks.entity";
import { RequestEntity } from "./requests.entity";
import { VehicleEntity } from "./vehicle.entity";

@Entity({name:"Riders",})
export class RiderEntity implements IRider{
    @PrimaryGeneratedColumn()
    id:string

    @Column({nullable:true})
    riderID:string

    @Column({nullable:false,unique:true})
    email: string;

    @Column({nullable:false})
    firstname: string;

    @Column({nullable:false})
    lastname: string;

    @Column({nullable:true})
    profile_picture: string;

    @Column({nullable:false, type:'enum', enum:Role, default:Role.RIDER})
    role: Role;

    @Column({nullable:false})
    password: string;

    @Column({nullable:false})
    mobile: string;

    @Column({nullable:true})
    age:number


    @Column({nullable:true})
    driver_license_front: string;

    @Column({nullable:true})
    driver_license_back: string;


    @Column({nullable:true})
    DOB: string;

    @Column({type:'enum', enum:StateOFOrigin})
    state_of_orgin: StateOFOrigin;

    @Column({type:'enum', enum:MaritalStatus})
    marital_status: MaritalStatus;

    @Column({nullable:true})
    home_address: string;

    @Column({nullable:true})
    LGA_of_origin: string;

    @Column({nullable:true})
    guarantor1_name: string;

    @Column({nullable:true})
    guarantor1_picture: string;

    @Column({nullable:true})
    guarantor1_relatioship_with_rider: string;

    @Column({nullable:true})
    gurantor1_mobile: string;

    @Column({nullable:true})
    guarantor2_name: string;

    @Column({nullable:true})
    guarantor2_picture: string;

    @Column({nullable:true})
    guarantor2_relatioship_with_rider: string;

    @Column({nullable:true})
    gurantor2_mobile: string;


    @Column({ nullable: true,type:'timestamp' })
    UpdatedAt:Date

    @Column({ nullable: true,type:'timestamp' })
    RegisteredAt:Date

    @Column({nullable:false,default:false})
    isLoggedIn: boolean;


    @Column({nullable:false,default:false})
    isRegistered: boolean;

    @Column({nullable:false,default:false})
    isVerified: boolean;

    @Column({nullable:true})
    reset_link_exptime: Date;

    @Column({nullable:true})
    password_reset_link: string;

    @Column({nullable:false, default:false})
    isLocked: boolean;


    @Column({nullable:true})
    deviceToken:string

    @Column({nullable:true,  type:'enum', enum:RiderStatus})
    status :RiderStatus


    @OneToOne(()=>OrderEntity,order=> order.Rider, {nullable:true,onDelete:'SET NULL'
    })
    assigned_order:OrderEntity

    @OneToMany(()=>TaskEntity, task=>task.rider,{nullable:true,onDelete:'CASCADE'})
    tasks: TaskEntity[];

    @OneToMany(()=>RequestEntity, request=>request.Rider,{nullable:true,onDelete:'CASCADE'})
    my_requests: RequestEntity[];

    @OneToOne(()=>VehicleEntity, Vehicle=>Vehicle.assigned_Rider,{nullable:true,onDelete:'SET NULL'})
    vehicle_for_the_day: VehicleEntity;

    @OneToMany(()=>RiderBankDetailsEntity,details=>details.owner,{ nullable:true,onDelete:'CASCADE'})
    bank_details : RiderBankDetailsEntity[]
    
    
}

@Entity({name:'Rider_Bank_Details'})
export class RiderBankDetailsEntity implements IMyBankAccountDetails{
    @PrimaryGeneratedColumn()
    id:number

     @Column({nullable:true})
     Bank_account_name: string;
 
     @Column({nullable:true})
     Bank_account_number: string;
 
     @Column({nullable:true})
     Bank_name: string;

     @Column({nullable:true, type:'enum', enum:BankDetailsStatus})
     status: BankDetailsStatus;

     @ManyToOne(()=>RiderEntity, rider=>rider.bank_details,{nullable:true, onDelete:'CASCADE'})
     owner: RiderEntity;
 


}

