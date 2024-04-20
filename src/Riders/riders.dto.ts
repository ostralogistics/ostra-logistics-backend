import { IsEmail, IsEnum, IsNotEmpty, IsNumber, IsString } from "class-validator";
import { AcceptOrDeclineTask, RiderMileStones } from "src/Enums/all-enums";

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