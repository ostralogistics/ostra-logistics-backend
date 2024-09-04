import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as FCM from 'fcm-node';



@Injectable()
export class FcmService {
  
  private readonly logger = new Logger(FcmService.name);
  private fcm: FCM;

  constructor() {
    
    this.fcm = new FCM(process.env.FCM_SERVER_KEY);
  }

  async sendNotification(token: string, title: string, body: string, data: object = {}) {
    const message = {
      to: token,
      notification: {
        title,
        body,
      },
      data,
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          channelId: 'default',
        },
      },
      apns: {
        headers: {
          'apns-priority': '10',
        },
        payload: {
          aps: {
            contentAvailable: true,
            sound: 'default',
          },
        },
      },
    };

    this.fcm.send(message, (err, response) => {
      if (err) {
        this.logger.error('Error sending notification', err);
      } else {
        this.logger.log('Notification sent successfully', response);
      }
    });
  }
}


