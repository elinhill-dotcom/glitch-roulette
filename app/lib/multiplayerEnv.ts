// Online multiplayer is the default experience.
// Firebase config has safe fallbacks in `app/lib/firebase.ts`, so we don't block on env vars.
export const ONLINE_MULTIPLAYER_AVAILABLE = true;

export function onlineMultiplayerDisabledReason(): string | null {
  return null;
}

