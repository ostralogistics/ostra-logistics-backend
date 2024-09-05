// import { Inject, Injectable, ServiceUnavailableException } from '@nestjs/common';
// import * as admin from 'firebase-admin';

// import { Provider } from '@nestjs/common';

// // export const FirebaseAdminProvider: Provider = {
// //     provide: 'firebase-admin',
// //     useFactory: () => {
// //       if (!admin.apps.length) {
// //         return admin.initializeApp({
// //           credential: admin.credential.cert({
// //             projectId: process.env.PROJECT_ID,
// //             clientEmail: process.env.CLIENT_EMAIL,
// //             privateKey: process.env.PRIVATE_KEY?.replace(/\\n/g, '\n'),
// //           }),
// //         });
// //       } else {
// //         return admin.app();
// //       }
// //     },
// // }

// admin.initializeApp({
//   credential: admin.credential.cert({
//     projectId: process.env.FIREBASE_PROJECT_ID,
//     clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
//     privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
//   }),
// });

// @Injectable()
// export class PushNotificationsService {
//   constructor(@Inject('firebase-admin') private readonly firebaseAdmin: typeof admin) {
//   }

//   async sendNotification(
//     token: string,
//     title: string,
//     body: string,
//     data?: any,
//   ) {
//     const message = {
//       notification: {
//         title,
//         body,
//       },
//       token,
//       data,
//     };

//     try {
//       const response = await admin.messaging().send(message);
//       console.log('Successfully sent message:', response);
//       return response;
//     } catch (error) {
//       console.error('Error sending message:', error);
//       throw new ServiceUnavailableException(error);
//     }
//   }

//   async sendToTopic(topic: string, title: string, body: string, data?: any) {
//     const message = {
//       notification: {
//         title,
//         body,
//       },
//       topic, // Send to topic
//       data,
//     };

//     try {
//       const response = await admin.messaging().send(message);
//       console.log('Successfully sent message to topic:', response);
//       return response;
//     } catch (error) {
//       console.error('Error sending message to topic:', error);
//       throw new ServiceUnavailableException(error);
//     }
//   }
// }