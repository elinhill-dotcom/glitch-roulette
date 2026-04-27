import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

function env(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

export function getFirebaseApp(): FirebaseApp {
  if (getApps().length) return getApps()[0]!;
  return initializeApp({
    apiKey: env("NEXT_PUBLIC_FIREBASE_API_KEY"),
    authDomain: env("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN"),
    projectId: env("NEXT_PUBLIC_FIREBASE_PROJECT_ID"),
    storageBucket: env("NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET"),
    messagingSenderId: env("NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID"),
    appId: env("NEXT_PUBLIC_FIREBASE_APP_ID"),
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  });
}

export function getDb() {
  return getFirestore(getFirebaseApp());
}

export function getFirebaseAuth() {
  return getAuth(getFirebaseApp());
}
