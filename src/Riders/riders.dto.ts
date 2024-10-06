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

  @IsInt()
  @Min(1)
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
