// import { Injectable } from '@nestjs/common';
// import { ConfigService } from '@nestjs/config';
// import { Vonage } from '@vonage/server-sdk';
// import { Auth } from '@vonage/auth';

// @Injectable()
// export class SmsSenderService {
//   private readonly vonage: Vonage;

//   constructor(private readonly configService: ConfigService) {
//     const apiKey = this.configService.get<string>('VONAGE_API_KEY');
//     const apiSecret = this.configService.get<string>('VONAGE_API_SECRET');

//     const auth = new Auth({
//       apiKey: apiKey,
//       apiSecret: apiSecret,
//     });

//     this.vonage = new Vonage(auth);
//   }

//   async sendSms(to: string, text: string,): Promise<void> {
//     const from = 'Vonage APIs';

//     try {
//       const response = await this.vonage.sms.send({ to, from, text, });
//       console.log('Message sent successfully');
//       console.log(response);
//     } catch (err) {
//       console.log('There was an error sending the messages.');
//       console.error(err);
//       throw new Error('Failed to send SMS');
//     }
//   }
// }
