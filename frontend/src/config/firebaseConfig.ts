// frontend/src/config/firebaseConfig.ts
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
// Optional: Import other Firebase services you might use
// import { getFirestore, Firestore } from 'firebase/firestore';
// import { getStorage, FirebaseStorage } from 'firebase/storage';
// import { getMessaging, FirebaseMessaging } from 'firebase/messaging';
// import { getAnalytics, FirebaseAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID, // Optional
};

let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0]; 
}

export const auth: Auth = getAuth(app);
// Optional:
// export const firestore: Firestore = getFirestore(app);
// export const storage: FirebaseStorage = getStorage(app);
// export const messaging: FirebaseMessaging = getMessaging(app);
// export const analytics: FirebaseAnalytics | null = typeof window !== 'undefined' ? getAnalytics(app) : null;

export { app };