import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { GeneatorService } from '../services/generator.service';
import { ConfigService } from '@nestjs/config';
import * as twilio from 'twilio';
import axios from 'axios';

@Injectable()
export class SMSsenderClass {
  private client: twilio.Twilio;
  private readonly baseUrl = 'https://api.infobip.com/sms/2/text/advanced';
  private readonly apiKey: string;

  constructor(
    private readonly generatorService: GeneatorService,
    private readonly configService: ConfigService,
  ) {
    const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
    const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');
    this.client = twilio(accountSid, authToken);
    this.apiKey = this.configService.get<string>('INFOBIP_API_KEY');
  }

  async sendOtpSMS(to: string, name: string): Promise<void> {
    try {
      const otp = this.generatorService.generateEmailToken();
      const messageBody = `Hello ${name}, your one time password (OTP) for verification is ${otp}. This OTP is valid for a single use and expires in the next 2 minutes. If you did not request this OTP from OSTRA LOGISTICS, please ignore this SMS`;

      await this.client.messages.create({
        body: messageBody,
        from: '23408078236697', // Your Twilio phone number
        to: to,
      });

      console.log(`OTP sent to ${to}: ${otp}`);
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(
        'Unable to send OTP SMS',
        error.message,
      );
    }
  }

  async sendOtpSMSFromInfoBip(
    to: string,
    otp: string,
    name: string,
  ): Promise<void> {
    try {
      // Validate and format phone number
      const formattedNumber = this.formatPhoneNumber(to);
      if (!formattedNumber) {
        throw new Error(`Invalid phone number format: ${to}`);
      }
      const message = `Hello ${name}, your one time password (OTP) for verification is ${otp}. This OTP is valid for a single use and expires in the next 2 minutes. If you did not request this OTP from OSTRA LOGISTICS, please ignore this SMS`;
      const payload = {
        messages: [
          {
            from: 'Ostra Logistics',
            destinations: [
              {
                to:formattedNumber,
              },
            ],
            text: message,
          },
        ],
      };

      const response = await axios.post(this.baseUrl, payload, {
        headers: {
          Authorization: `App ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (
        response.data.messages[0].status.groupName !== 'PENDING' &&
        response.data.messages[0].status.groupName !== 'SENT'
      ) {
        throw new Error(
          `Failed to send SMS: ${response.data.messages[0].status.description}`,
        );
      }

      console.log(`SMS sent to ${to}: ${message}`);
    } catch (error) {
      console.error(
        'Error sending SMS:',
        error.response ? error.response.data : error.message,
      );
      throw new Error('Failed to send SMS');
    }
  }


  
  // Helper method to validate and format phone number
  formatPhoneNumber(phone: string): string | null {
    // Remove non-numeric characters
    const cleaned = phone.replace(/\D/g, '');
    // Check if the number starts with '0' and is 11 digits long (for Nigerian numbers)
    if (cleaned.startsWith('0') && cleaned.length === 11) {
      // Replace leading '0' with '+234'
      return `+234${cleaned.substring(1)}`;
    }
    // Check if the number is already in international format
    if (cleaned.startsWith('234') && cleaned.length === 13) {
      return `+${cleaned}`;
    }
    // Invalid number format
    return null;
  }
}
