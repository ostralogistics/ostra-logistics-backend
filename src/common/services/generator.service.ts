import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from 'bcrypt';
import * as nanoid from 'nanoid';
import { customAlphabet } from 'nanoid';

@Injectable()
export class GeneatorService{
    constructor(private configservice:ConfigService, private jwt:JwtService){}

    public async hashpassword(password): Promise<string> {
        return await bcrypt.hash(password, 12);
      }
    
      public async comaprePassword(userpassword, dbpassword): Promise<boolean> {
        return await bcrypt.compare(userpassword, dbpassword);
      }
    
      public generateEmailToken(): string {
        const gen = customAlphabet('12345678990', 6);
        return gen();
      }

      public generateUUID(): string {
        const gen = customAlphabet('12345678990abcdefghijklmopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ', 12);
        return gen();
      }
    
      //access token
      public async signToken(id: string, email: string, role: string) {
        const payload = {
          sub: id,
          email,
          role,
        };
        const secret = this.configservice.get('SECRETKEY');
        const token = await this.jwt.signAsync(payload, {
          expiresIn: this.configservice.get('EXPIRESIN'),
          secret: secret,
        });
        return { token: token };
      }


      public generateBidGroupID(): string {
        const gen = nanoid.customAlphabet('1234567890', 3);
        return gen();
      }

      public generatePromoCode(): string {
        const gen = nanoid.customAlphabet('1234567890', 6);
        return gen();
      }

      public generateTransactionCode(): string {
        const gen = nanoid.customAlphabet('1234567890', 12);
        return gen();
      }
    
      public generateOrderID(): string {
        const gen = nanoid.customAlphabet('1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz', 8);
        return gen();
      }
    
    
      public generateUserID(): string {
        const gen = nanoid.customAlphabet('1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz', 6);
        return gen();
      }

      public generatePassword(): string {
        const nanoid = customAlphabet(
          '1234567890abcdefghijklmopqrstuvwxyzABCDEFGHIJKLMOPQRSTUVWXYZ@#*!(){}[]/|``^&$',
          12,
        );
        return nanoid();
      }
    
      public generatEmailSuffixNumber(): string {
        const nanoid = customAlphabet('1234567890', 2);
        return nanoid();
      }


      public generateComplaintTcket(): string {
        const nanoid = customAlphabet('1234567890', 10);
        return nanoid();
      }

      //generaete
  public generateTrackingID(): string {
    const trackingcode = nanoid.customAlphabet(
      '1234567890abcdefghijklmnopqrstuvwxyz',
      8,
    );
    return trackingcode();
  }

  //generaete
  public generateDropOffCode(): string {
    const dropoffcode = nanoid.customAlphabet('1234567890', 6);
    return dropoffcode();
  }
    
}