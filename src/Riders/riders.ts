import { RequestEntity } from "src/Entity/requests.entity"
import { TaskEntity } from "src/Entity/ridersTasks.entity"
import { VehicleEntity } from "src/Entity/vehicle.entity"
import { MaritalStatus, StateOFOrigin, TaskStatus, VehicleType } from "src/Enums/all-enums"

export interface IRider{
    id:string
    riderID:string
    firstname:string
    lastname:string
    profile_picture:string
    state_of_orgin:StateOFOrigin
    DOB: string
    age:number
    marital_status:MaritalStatus
    mobile: string 
    driver_license :string //file to be uploaded the drivers license 
    email:string
    password:string
    guarantor1_name:string
    guarantor1_relatioship_with_rider:string
    gurantor1_mobile:string
    guarantor1_picture:string
    guarantor2_name:string
    guarantor2_relatioship_with_rider:string
    gurantor2_mobile:string
    guarantor2_picture:string
    home_address:string
    LGA_of_origin:string
    UpdatedAt:Date
    RegisteredAt:Date
    isLoggedIn:boolean
    isVerified:boolean
    isRegistered:boolean
    isLoggedOut:boolean 
    loginCount:number
    locked_until : Date
    tasks : TaskEntity[]
    my_requests: RequestEntity[];
    vehicle_for_the_day:VehicleEntity
}

export interface IRegisterRider{
    id:string,
    firstname:string,
    lastname:string,
    profile_picture:string
    email:string,
    password:string,
    DOB: string
    age:number
    mobile: string 
    driver_licence :string
    RegisteredAt:Date
    guarantor1_name:string
    guarantor1_relatioship_with_rider:string
    gurantor1_mobile:string
    guarantor1_picture:string
    guarantor2_name:string
    guarantor2_relatioship_with_rider:string
    gurantor2_mobile:string
    guarantor2_picture:string
    home_address:string
    state_of_origin:StateOFOrigin
    LGA_of_origin:string

}

export interface IChangeRiderPassword{
    password:string
}

export interface IChangeOtherAdminPassword{
    password:string
}