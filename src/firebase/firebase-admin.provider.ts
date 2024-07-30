import * as admin from 'firebase-admin';

let firebaseApp: admin.app.App | undefined;

export const firebaseAdminProvider = {
  provide: 'FIREBASE_ADMIN',
  useFactory: () => {
    if (!firebaseApp) {
      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert({
          projectId: "ostra-3585a",
          clientEmail: "firebase-adminsdk-yhnql@ostra-3585a.iam.gserviceaccount.com",
          privateKey: "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCrDcVyVgMkusSY\nnZ0rtcLxVZfNbyS9aiav7dt05rOgGIC3ZxHuaKRP7zP/rbI9uyKeWwd3lU/JPsDo\nDjXLvn1VrPgCcjs75KR6kVVSDlpGCAbKHiFsynhfMyFxUJYwIm2Z5xOAJNSClOD+\n3zL9D23u4k2AsK85EysXi8EoBXkMlD7xrW1ybEzRTe2lPvxputh/iER72Ke5aonf\nPdmi5fxWKiXzkt3NHT+A/ZDNnhlfDLbNqX5v7VA1CES7MChje4xc42dadrAo//Q4\nH0d383z38mzCZJ+5k+TQ+ZoKk5me47U3MxxhQuDetap/LLzNGPAPxMUXK5cUp/D2\niI5wnMeHAgMBAAECggEAHLMu0cREusDrg3/Ogyr4Dm4CDmH7lBxfaV1LWQ3sTYxO\n7HbKt2mvSAome1u1cE4ZvOAhHJtcy7NPwp+/vvOzK9Ddu+tWrPHr9vSzkBUAaIeo\nO/laOlquX6rAjbarvF/Ka+wthW6oiVBZf+oLMBKKq24k+taqT7U7obO9MO3aJZXj\nMJ1CseuTzmUlCbMVRURQ7LTqYwx75aC67Esdb1xOkLAIYU/JJmaK5pCpYiXCLGA2\nvIj8bSnP+MtPnlN0gPtxd5waSaVAOjr/iavSB/bEjQ6pBAQhwjM2PM4FT1bx1WFb\nKdy9M1d6KRSOwUGA59sFTHPW8OxvRNTnFCpZJyQqIQKBgQDvJK4p+1dNESf1fpWg\nhgvp0iZEv1o31pesbLSr6x+Jz/V3DDlzRudYeUNxWl7M/OBgzC7cOv1X/NeESZqv\nKSHbwwK9UbVVOL6eOwYn+ZSb78k3EEGBAdVp7nsFE90yVdmp7TQxWWR13lKIsog1\n9+fnQSCuLZQGjR+AO6yOVC60uwKBgQC3HGwMoj0wUNeSTKdVjHtKScoiMXwiK7nN\nOEkRiVvGUDnfk6BR42+EMvJ27AzROQyxt1uxnY64jfmcvSEwHWPIjmL+pNfZCqCn\njOXRdcjX0QyqUaIZ0is9VDGckXrekhFjZz09iZNq5TmCU9qU9MM2owg2dsijCCJg\nsAYP6FexpQKBgQDm+wLNwdo8sclqsO1MsqxnF3enBzvYmwi8nfKT6vH3Zkmsxr3m\nviFNrzKZFbRjQgxm8lCAnul8RtbTC1TAwnXVkbHfsj/3JGvY4SG9Eq+bPiuXZ7gd\nJuw++P0RlnIb4BfwrQ+waqtBvY7yQZ6Woe/3yUwLcDJ9cWlvrjOo9V53aQKBgCmt\noXZaszy9GeQl6GyTdjiZhRW1V8DbXQY2CoOgVTBVcGbQTkx1TRu1EPU6k0xIBPiq\neId8ClE9l5QyhExUVDMBHc1CLhMr1Rdt/Z1ohteAsLZPsGraKJdkA4rUnjfs3WJX\nzFumZdSN6kIc3gLLl2dnQmZLMS3SmyiQyEB0rQk1AoGBAIOTZdhQbLX2Nnc7cPTk\nhEACWjaorizPE4xmQhIGk44bbQ09ilVRe/gnX3krkyN/bjN1Jl75bCzebDgVdpGN\ntIHAPR64WnybeBVJxR3V+I0xpe+12TvwfXNqTcwAouXzS+RyzWA3uu6hgEHf7MTf\no6ZU2RPuJXVKmOs+10vSNTE5\n-----END PRIVATE KEY-----\n"
          .replace(/\\n/g, '\n'),
        }),
      });
    }
    return firebaseApp;
  },
};
