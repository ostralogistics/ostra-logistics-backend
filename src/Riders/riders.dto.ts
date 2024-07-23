import { IsEmail, IsEnum, IsNotEmpty, IsNumber, IsString } from "class-validator";
import { AcceptOrDeclineTask, BankDetailsStatus, RiderMileStones } from "src/Enums/all-enums";

export class RequestResetPasswordDto{
    @IsEmail()
    email:string
}

export class DropOffCodeDto{
    @IsString()
    @IsNotEmpty()
    dropOff_code:string

    @IsNumber()
    itemsDroppedOff:number
}

export class AcceptOrDeclineTaskDto{
    @IsEnum(AcceptOrDeclineTask)
    action:AcceptOrDeclineTask
}

export class  CancelRideDto{
    @IsString()
    @IsNotEmpty()
    reason:string
}

export class ChangeBankPreferenceDto{
    @IsEnum(BankDetailsStatus)
    @IsNotEmpty()
    preference:BankDetailsStatus
}

export class MakeRequestDto{
    @IsString()
    @IsNotEmpty()
    body:string
}

