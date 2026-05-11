import {
  addDoc,
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  type Unsubscribe,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { getDb, getStorageBucket } from "./firebase";

const WALL_COLLECTION = "wallOfFlinchers";
const WALL_STORAGE_PREFIX = "wallOfFlinchers";

export type WallPost = {
  id: string;
  imageUrl: string;
  playerName: string;
  roomCode: string | null;
  createdAt: number;
};

export type UploadInput = {
  blob: Blob;
  playerName: string;
  roomCode?: string | null;
};

function safeId(prefix: string) {
  const stamp = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${stamp}_${rand}`;
}

/**
 * Upload a captured photo to Firebase Storage and write a Firestore doc that
 * the public wall page subscribes to.
 */
export async function uploadFlinchPhoto({
  blob,
  playerName,
  roomCode,
}: UploadInput): Promise<WallPost> {
  const storage = getStorageBucket();
  const id = safeId("flinch");
  const ext = blob.type.includes("png") ? "png" : "jpg";
  const path = `${WALL_STORAGE_PREFIX}/${id}.${ext}`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, blob, {
    contentType: blob.type || "image/jpeg",
    customMetadata: { playerName, roomCode: roomCode ?? "" },
  });
  const imageUrl = await getDownloadURL(storageRef);
  const db = getDb();
  const docRef = await addDoc(collection(db, WALL_COLLECTION), {
    imageUrl,
    playerName: playerName.slice(0, 40) || "Anonymous",
    roomCode: roomCode ?? null,
    createdAt: serverTimestamp(),
    createdAtMs: Date.now(),
    storagePath: path,
  });
  return {
    id: docRef.id,
    imageUrl,
    playerName,
    roomCode: roomCode ?? null,
    createdAt: Date.now(),
  };
}

/**
 * Subscribe to the latest wall posts. Returns an unsubscribe function.
 */
export function subscribeToWall(
  onChange: (posts: WallPost[]) => void,
  options?: { max?: number },
): Unsubscribe {
  const db = getDb();
  const q = query(
    collection(db, WALL_COLLECTION),
    orderBy("createdAt", "desc"),
    limit(options?.max ?? 60),
  );
  return onSnapshot(
    q,
    (snap) => {
      const posts: WallPost[] = [];
      snap.forEach((doc) => {
        const data = doc.data() as {
          imageUrl?: string;
          playerName?: string;
          roomCode?: string | null;
          createdAt?: Timestamp | number | null;
          createdAtMs?: number;
        };
        if (!data.imageUrl) return;
        let createdAt = 0;
        if (data.createdAt && typeof data.createdAt === "object" && "toMillis" in data.createdAt) {
          createdAt = (data.createdAt as Timestamp).toMillis();
        } else if (typeof data.createdAt === "number") {
          createdAt = data.createdAt;
        } else if (typeof data.createdAtMs === "number") {
          createdAt = data.createdAtMs;
        }
        posts.push({
          id: doc.id,
          imageUrl: data.imageUrl,
          playerName: data.playerName ?? "Anonymous",
          roomCode: data.roomCode ?? null,
          createdAt,
        });
      });
      onChange(posts);
    },
    (err) => {
      // Surface read failures in dev but don't crash the page.
      // eslint-disable-next-line no-console
      console.warn("[wallOfFlinchers] subscription error", err);
      onChange([]);
    },
  );
}
