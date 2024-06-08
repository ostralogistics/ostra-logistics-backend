import { RequestEntity } from "src/Entity/requests.entity"
import { RiderEntity } from "src/Entity/riders.entity"
import { TaskEntity } from "src/Entity/ridersTasks.entity"
import { VehicleEntity } from "src/Entity/vehicle.entity"
import { BankDetailsStatus, MaritalStatus, StateOFOrigin, TaskStatus, VehicleType } from "src/Enums/all-enums"

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
    driver_license_front :string
    driver_license_back :string  
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
    deviceToken:string[]
    tasks : TaskEntity[]
    my_requests: RequestEntity[];
    vehicle_for_the_day:VehicleEntity
    bank_details:IMyBankAccountDetails[]
}

export interface IMyBankAccountDetails{
    id:number
    Bank_account_name :string
    Bank_name:string
    Bank_account_number:number
    status:BankDetailsStatus
    owner:RiderEntity

}

export interface IChangeRiderPassword{
    password:string
}

export interface IChangeOtherAdminPassword{
    password:string
}