import { IsDateString, IsEmail, IsEnum, IsNotEmpty, IsNumber, IsNumberString, IsOptional, IsString, IsStrongPassword, Matches, matches } from "class-validator";
import { AdminAccessLevels, AdminType, DeliveryPriority, Gender, MaritalStatus, ReturnedVehicle,  StateOFOrigin, VehicleAssignedStatus, VehicleState, VehicleType, channelforconversation, complainResolutionStatus } from "src/Enums/all-enums";


export class ReplyDto{
    @IsNotEmpty()
    @IsString()
    reply:string
}

export class ChannelDto{
    @IsEnum(channelforconversation)
    @IsNotEmpty()
    action:channelforconversation
}

export class updateResolutionStatusDto{
    @IsEnum(complainResolutionStatus)
    @IsNotEmpty()
    action : complainResolutionStatus
}

export class BankDetailsDto{

    @IsNotEmpty()
    @IsString()
    bank_name :string

    @IsNotEmpty()
    @IsString()
    account_name :string


    @IsNotEmpty()
    @IsNumber()
    account_number :string

}

export class EditBankDetailsDto{

    @IsOptional()
    @IsString()
    bank_name :string

    @IsOptional()
    @IsString()
    account_name :string


    @IsOptional()
    @IsNumber()
    account_number:string

}

export class AssignTaskDto{
    @IsString()
    @IsNotEmpty()
    task:string

}

export class PasscodeDto{
    @IsString()
    @IsNotEmpty()
    passcode:string
}



export class RegisterAdminDto{
    @IsEmail()
    @IsNotEmpty()
    email:string


    @IsString()
    @IsNotEmpty()
    fullname:string

    @IsString()
    @IsNotEmpty()
    @IsStrongPassword({
        minLength:8,
        minLowercase:1,
        minNumbers:1,
        minSymbols:1,
        minUppercase:1
    })
    password :string

    @IsString()
    @IsNotEmpty()
    //@Matches(/^NGR\+234\d{13}$/,{message:"mobile number must be a valid Nigerian service operator's cell number"})
    mobile:string

    @IsString()
    @IsNotEmpty()
    passcode:string
}

export class UpdateAdminDto{

    @IsEmail()
    @IsOptional()
    email:string


    @IsString()
    @IsOptional()
    fullname:string

    @IsString()
    @IsOptional()
    Nationality:string

    @IsEnum(StateOFOrigin)
    @IsOptional()
    state_of_origin:StateOFOrigin

    @IsString()
    @IsOptional()
    DOB:string

    @IsString()
    @IsOptional()
    Address: string

    @IsString()
    @IsOptional()
    LGA: string 

    @IsEnum(Gender)
    @IsOptional()
    gender:Gender

    @IsString()
    @IsOptional()
    mobile:string

}

export class RegisterRiderByAdminDto{

    @IsString()
    @IsNotEmpty()
    firstname:string

    @IsString()
    @IsNotEmpty()
    lastname:string

    @IsDateString()
    @IsNotEmpty()
    DOB:string

    @IsEnum(MaritalStatus)
    @IsNotEmpty()
    marital_status: MaritalStatus

    @IsEnum(StateOFOrigin)
    @IsNotEmpty()
    state_of_origin: StateOFOrigin

    @IsString()
    @IsNotEmpty()
   // @Matches(/^NGR\+234\d{10}$/,{message:"mobile number must be a valid Nigerian service operator's cell number"})
    mobile:string


    @IsString()
    @IsNotEmpty()
    home_address:string
    
    @IsString()
    @IsNotEmpty()
    LGA_of_origin:string

    @IsString()
    @IsNotEmpty()
    guarantor1_name:string

    @IsString()
    @IsNotEmpty()
    guarantor1_relatioship_with_rider:string

    @IsString()
    @IsNotEmpty()
    //@Matches(/^NGR\+234\d{10}$/,{message:"mobile number must be a valid Nigerian service operator's cell number"})
    gurantor1_mobile:string


    @IsString()
    @IsNotEmpty()
    guarantor2_name:string

    @IsString()
    @IsNotEmpty()
    guarantor2_relatioship_with_rider:string

    @IsString()
    @IsNotEmpty()
    //@Matches(/^NGR\+234\d{10}$/,{message:"mobile number must be a valid Nigerian service operator's cell number"})
    gurantor2_mobile:string

}



export class UpdateRiderInfoByAdminDto{

    @IsString()
    @IsOptional()
    firstname:string

    @IsString()
     @IsOptional()
    lastname:string

   

    @IsDateString()
     @IsOptional()
    DOB:string

    @IsEnum(MaritalStatus)
    @IsOptional()
    marital_status: MaritalStatus

    @IsEnum(StateOFOrigin)
    @IsOptional()
    state_of_origin: StateOFOrigin

    @IsString()
    @IsOptional()
    //@Matches(/^NGR\+234\d{10}$/,{message:"mobile number must be a valid Nigerian service operator's cell number"})
    mobile:string

    @IsString()
    @IsOptional()
    driver_license:string

    @IsString()
    @IsOptional()
    home_address:string
    
    @IsString()
    @IsOptional()
    LGA_of_origin:string

    @IsString()
    @IsOptional()
    guarantor1_name:string

    @IsString()
     @IsOptional()
    guarantor1_relatioship_with_rider:string

    @IsString()
     @IsOptional()
    //@Matches(/^NGR\+234\d{10}$/,{message:"mobile number must be a valid Nigerian service operator's cell number"})
    gurantor1_mobile:string

   

    @IsString()
    @IsOptional()
    guarantor2_name:string

    @IsString()
    @IsOptional()
    guarantor2_relatioship_with_rider:string

    @IsString()
    @IsOptional()
    //@Matches(/^NGR\+234\d{10}$/,{message:"mobile number must be a valid Nigerian service operator's cell number"})
    gurantor2_mobile:string

   

}




export class RegisterOtherAdminByAdminDto{

    @IsString()
    @IsNotEmpty()
    firstname:string

    @IsString()
    @IsNotEmpty()
    lastname:string

    @IsDateString()
    @IsNotEmpty()
    DOB:string

    @IsEnum(MaritalStatus)
    @IsNotEmpty()
    marital_status: MaritalStatus

    @IsEnum(StateOFOrigin)
    @IsNotEmpty()
    state_of_origin: StateOFOrigin

    @IsString()
    @IsNotEmpty()
    //@Matches(/^NGR\+234\d{10}$/,{message:"mobile number must be a valid Nigerian service operator's cell number"})
    mobile:string

    @IsString()
    @IsNotEmpty()
    home_address:string
    
    @IsString()
    @IsNotEmpty()
    LGA_of_origin:string

    @IsEnum(AdminAccessLevels)
    @IsNotEmpty()
    accesslevel : AdminAccessLevels


}


export class UpdateOtherAdminInfoByAdminDto{

    @IsString()
    @IsOptional()
    firstname:string

    @IsString()
    @IsOptional()
    lastname:string

    @IsDateString()
    @IsOptional()
    DOB:string


    @IsString()
    @IsOptional()
    profile_picture:string

    @IsEnum(MaritalStatus)
    @IsOptional()
    marital_status: MaritalStatus

    @IsEnum(StateOFOrigin)
    @IsOptional()
    state_of_origin: StateOFOrigin

    @IsString()
    @IsOptional()
    mobile:string

    @IsString()
    @IsOptional()
    home_address:string
    
    @IsString()
    @IsOptional()
    LGA_of_origin:string

    @IsString()
    @IsOptional()
    LGA_of_Home_Address:string

    @IsEnum(Gender)
    @IsOptional()
    gender:Gender

  

}

export class VehicleTypeDto{
    @IsString()
    @IsNotEmpty()
    name:string

    @IsString()
    @IsNotEmpty()
    status:string

}


export class RegisterVehicleDto{
    @IsString()
    @IsOptional()
    vehicle_model: string

    @IsString()
    @IsNotEmpty()
    vehicle_type: string

    @IsString()
    @IsNotEmpty()
    color: string

    @IsString()
    @IsNotEmpty()
    registration_number: string

    @IsEnum(VehicleState)
    @IsNotEmpty()
    state_of_vehicle: VehicleState

    @IsEnum(VehicleAssignedStatus)
    @IsOptional()
    status: VehicleAssignedStatus
    
}


export class UpdateVehicleDto{
    @IsString()
    @IsOptional()
    vehicle_model: string

    @IsString()
    @IsOptional()
    vehicle_type: string

    @IsString()
    @IsOptional()
    color: string

    @IsString()
    @IsOptional()
    registration_number: string

    @IsEnum(VehicleState)
    @IsOptional()
    state_of_vehicle: VehicleState

    @IsEnum(VehicleAssignedStatus)
    @IsOptional()
    status: VehicleAssignedStatus
    
}



export class ReturnedVehicleDto{
    @IsEnum(ReturnedVehicle)
    @IsNotEmpty()
    returned : ReturnedVehicle
}

export class AdminchangestaffAccessLevelDto{
    @IsEnum(AdminAccessLevels)
    accesslevel:AdminAccessLevels
}

export class DiscountDto{
    @IsString()
    @IsNotEmpty()
    discountCode:string

    @IsNumber()
    @IsOptional()
    DiscountDuration_weeks:number

    @IsNumber()
    @IsOptional()
    DiscountDuration_days:number


    @IsNumber()
    @IsOptional()
    percentageOff:number
}

export class PriceListDto{
    @IsString()
    @IsNotEmpty()
    location:string

    @IsString()
    @IsNotEmpty()
    amount:string
}

export class LogtransactionDto{
    @IsNumber()
    @IsNotEmpty()
    amount:number
}
export class UpdatePriceListDto{
    @IsString()
    @IsOptional()
    location:string

    @IsString()
    @IsOptional()
    amount:string
}

export class UpdateDiscountDto{
    @IsString()
    @IsOptional()
    discountCode:string

    @IsNumber()
    @IsOptional()
    DiscountDuration_weeks:number

    @IsNumber()
    @IsOptional()
    DiscountDuration_days:number


    @IsNumber()
    @IsOptional()
    percentageOff:number
}

