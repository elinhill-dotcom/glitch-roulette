import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const FALLBACK_FIREBASE_CONFIG = {
  apiKey: "AIzaSyDWAxyUff3t6m8u7M-S8_f6m1YCUipohUs",
  authDomain: "salud-15578.firebaseapp.com",
  projectId: "salud-15578",
  storageBucket: "salud-15578.firebasestorage.app",
  messagingSenderId: "59274196670",
  appId: "1:59274196670:web:69997d65a8e21c9fd9d0ef",
  measurementId: "G-CSZ7CJ2EBP",
} as const;

function env(name: string, fallback?: string) {
  const v = process.env[name];
  return v && String(v).trim() ? String(v) : fallback;
}

export function getFirebaseApp(): FirebaseApp {
  if (getApps().length) return getApps()[0]!;
  return initializeApp({
    apiKey: env("NEXT_PUBLIC_FIREBASE_API_KEY", FALLBACK_FIREBASE_CONFIG.apiKey)!,
    authDomain: env("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN", FALLBACK_FIREBASE_CONFIG.authDomain)!,
    projectId: env("NEXT_PUBLIC_FIREBASE_PROJECT_ID", FALLBACK_FIREBASE_CONFIG.projectId)!,
    storageBucket: env("NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET", FALLBACK_FIREBASE_CONFIG.storageBucket)!,
    messagingSenderId: env(
      "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
      FALLBACK_FIREBASE_CONFIG.messagingSenderId,
    )!,
    appId: env("NEXT_PUBLIC_FIREBASE_APP_ID", FALLBACK_FIREBASE_CONFIG.appId)!,
    measurementId: env("NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID", FALLBACK_FIREBASE_CONFIG.measurementId),
  });
}

export function getDb() {
  return getFirestore(getFirebaseApp());
}

export function getFirebaseAuth() {
  return getAuth(getFirebaseApp());
}

export function getStorageBucket() {
  return getStorage(getFirebaseApp());
}
