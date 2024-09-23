import { ArrayMinSize, ArrayNotEmpty, IsArray, IsEmail, IsEnum, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from "class-validator";
import { AcceptOrDeclineTask, BankDetailsStatus, RiderMileStones } from "src/Enums/all-enums";

export class RequestResetPasswordDto{
    @IsEmail()
    email:string
}

export class DropOffCodeDto{
    @IsString()
    @IsNotEmpty()
    dropOff_code:string

    // An array of item indices to allow dropping off multiple items
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMinSize(1)
  @IsInt({ each: true })  // Ensure each element in the array is an integer
  @Min(0, { each: true }) // Ensure each element is greater than or equal to 0
  itemsDroppedOff: number[];  
}

export class AcceptOrDeclineTaskDto{
    @IsEnum(AcceptOrDeclineTask)
    action:AcceptOrDeclineTask

    @IsString()
    @IsOptional()
    reason?:string
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

