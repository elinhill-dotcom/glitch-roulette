export const ONLINE_MULTIPLAYER_AVAILABLE =
  process.env.NEXT_PUBLIC_USE_FIRESTORE_ROOMS === "1" &&
  Boolean(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) &&
  Boolean(process.env.NEXT_PUBLIC_FIREBASE_API_KEY);

export function onlineMultiplayerDisabledReason(): string | null {
  if (process.env.NEXT_PUBLIC_USE_FIRESTORE_ROOMS !== "1") {
    return "Disabled: set NEXT_PUBLIC_USE_FIRESTORE_ROOMS=1";
  }
  if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
    return "Missing NEXT_PUBLIC_FIREBASE_PROJECT_ID";
  }
  if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
    return "Missing NEXT_PUBLIC_FIREBASE_API_KEY";
  }
  return null;
}

