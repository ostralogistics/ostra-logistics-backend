import { IsBoolean, IsCreditCard, IsDateString, IsEmail, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsStrongPassword, Matches, Max, MaxLength, Min } from "class-validator";
import { DeliveryPriority, Gender, VehicleType } from "src/Enums/all-enums";
import { Match } from "src/common/helpers/match.decorator";

export class RegisterCustomerDto{
    @IsEmail()
    @IsNotEmpty()
    email:string

    @IsString()
    @IsNotEmpty()
    @IsStrongPassword({
        minLength:8,
        minLowercase:1,
        minNumbers:1,
        minSymbols:1,
        minUppercase:1
    })
    password:string 

    @IsString()
    @IsNotEmpty()
    firstname:string

    @IsString()
    @IsNotEmpty()
    lastname:string

    @IsString()
    @IsNotEmpty()
    mobile:string

    @IsString()
    @IsOptional()
    deviceToken:string
}

export class markNotificationAsReadDto{
    @IsBoolean()
    @IsOptional()
    isRead:boolean
}

export class addPasswordDto{

    @IsString()
    @IsNotEmpty()
    @IsStrongPassword({
        minLength:8,
        minLowercase:1,
        minNumbers:1,
        minSymbols:1,
        minUppercase:1
    })
    password:string 

    @IsString()
    @IsNotEmpty()
    @Match('password', { message: 'ConfirmPassword does not match the new password.' })
    confirmPassword:string 

    @IsEmail()
    @IsNotEmpty()
    email:string

}


export class ChangePasswordDto{

    @IsString()
    @IsNotEmpty()
    oldPassword:string

    @IsString()
    @IsNotEmpty()
    @IsStrongPassword({
        minLength:8,
        minLowercase:1,
        minNumbers:1,
        minSymbols:1,
        minUppercase:1
    })
    password:string 

    @IsString()
    @IsNotEmpty()
    @Match('password', { message: 'ConfirmPassword does not match the new password.' })
    confirmPassword:string 

}

export class UpdateCustomerDto{

    @IsEmail()
    @IsOptional()
    email:string


    @IsString()
    @IsOptional()
    home_address:string

    @IsString()
    @IsOptional()
    firstname:string

    @IsString()
    @IsOptional()
    lastname:string

    @IsString()
    @IsOptional()
    LGA_of_Home_Address: string

    @IsString()
    @IsOptional()
    profile_picture: string 

    @IsEnum(Gender)
    @IsOptional()
    gender:Gender

}

export class placeOrderDto{
    @IsString()
    @IsNotEmpty()
    location: string

    @IsEnum(VehicleType)
    @IsNotEmpty()
    vehicle_type: VehicleType

    @IsNumber()
    @IsNotEmpty()
    bid: number

    @IsEnum(DeliveryPriority)
    @IsNotEmpty()
    delivery_proprity: DeliveryPriority

    delivery_date?: Date
}


export class CardDetailsDto {
    @IsNotEmpty()
    @IsCreditCard()
    cardNumber: string;
  
    @IsNotEmpty()
    @MaxLength(4)
    @IsString()
    expiryMonth: string;
  
    @IsNotEmpty()
    @MaxLength(4)
    @IsString()
    expiryYear: string;
  
    @IsNotEmpty()
    @MaxLength(3)
    @IsString()
    cvv: string;
  }


  export class NewsLetterDto{

    @IsString()
    @IsOptional()
    firstname:string

    @IsString()
    @IsOptional()
    lastname:string

    @IsString()
    @IsNotEmpty()
    email:string
  }

  export class ComplaintDto{
    @IsString()
    @IsNotEmpty()
    complaint:string

    @IsEmail()
    @IsOptional()
    email:string

    @IsString()
    @IsOptional()
    title:string
  }


  export class RatingReviewDto {
    @IsNumber()
    @Min(1)
    @Max(5)
    rating: number;
  
    @IsString()
    @IsOptional()
    review?: string;
  }
