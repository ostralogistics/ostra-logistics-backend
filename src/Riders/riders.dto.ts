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
}

export class AcceptOrDeclineTaskDto{
    @IsEnum(AcceptOrDeclineTask)
    action:AcceptOrDeclineTask
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