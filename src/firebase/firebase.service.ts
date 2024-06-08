import { Injectable, Inject } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseService {
  constructor(@Inject('FIREBASE_ADMIN') private readonly firebaseAdmin: admin.app.App) {}

  async sendNotification(deviceTokens: string[], payload: admin.messaging.MessagingPayload) {
    try {
      const messages = deviceTokens.map(token => ({
        token,
        ...payload,
      }));
      await this.firebaseAdmin.messaging().sendToDevice(deviceTokens, payload);
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }
}
