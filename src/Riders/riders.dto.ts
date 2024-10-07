import {
  ArrayMinSize,
  ArrayNotEmpty,
  IsArray,
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import {
  AcceptOrDeclineTask,
  BankDetailsStatus,
  RiderMileStones,
} from 'src/Enums/all-enums';

export class RequestResetPasswordDto {
  @IsEmail()
  email: string;
}

export class DropOffCodeDto {
  @IsString()
  @IsNotEmpty()
  dropOff_code: string;

  @IsArray() // Validate as an array
  @IsInt({ each: true }) // Ensure each item in the array is an integer
  @Min(1, { each: true }) // Each integer must be greater than or equal to 1
  itemsDroppedOff: number[];
}

export class AcceptOrDeclineTaskDto {
  @IsEnum(AcceptOrDeclineTask)
  action: AcceptOrDeclineTask;

  @IsString()
  @IsOptional()
  reason?: string;
}

export class CancelRideDto {
  @IsString()
  @IsNotEmpty()
  reason: string;
}

export class ChangeBankPreferenceDto {
  @IsEnum(BankDetailsStatus)
  @IsNotEmpty()
  preference: BankDetailsStatus;
}

export class MakeRequestDto {
  @IsString()
  @IsNotEmpty()
  body: string;
}
