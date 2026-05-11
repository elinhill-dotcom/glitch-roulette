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
import { getDb } from "./firebase";
import { getSupabase, WALL_BUCKET } from "./supabase";

const WALL_COLLECTION = "wallOfFlinchers";

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
  const id = safeId("flinch");
  const ext = blob.type.includes("png") ? "png" : "jpg";
  const path = `${id}.${ext}`;
  const contentType = blob.type || "image/jpeg";

  // 1) Upload the binary to Supabase Storage. The bucket is public so we can
  //    grab a stable URL with getPublicUrl right away — no signed URL needed.
  let imageUrl: string;
  try {
    const supabase = getSupabase();
    const { error: uploadError } = await supabase.storage
      .from(WALL_BUCKET)
      .upload(path, blob, {
        contentType,
        cacheControl: "31536000",
        upsert: false,
      });
    if (uploadError) throw uploadError;
    const { data: publicUrlData } = supabase.storage
      .from(WALL_BUCKET)
      .getPublicUrl(path);
    imageUrl = publicUrlData.publicUrl;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("[wallOfFlinchers] Supabase upload failed", e);
    throw e;
  }

  // 2) Write the post metadata to Firestore so the existing subscribeToWall
  //    listener keeps working with no changes for the wall page.
  const db = getDb();
  const createdAtMs = Date.now();
  try {
    const docRef = await addDoc(collection(db, WALL_COLLECTION), {
      imageUrl,
      playerName: playerName.slice(0, 40) || "Anonymous",
      roomCode: roomCode ?? null,
      createdAt: serverTimestamp(),
      createdAtMs,
      storagePath: path,
      storageProvider: "supabase",
    });
    return {
      id: docRef.id,
      imageUrl,
      playerName,
      roomCode: roomCode ?? null,
      createdAt: createdAtMs,
    };
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("[wallOfFlinchers] Firestore write failed", e);
    throw e;
  }
}

/**
 * Subscribe to the latest wall posts. Returns an unsubscribe function.
 *
 * NOTE: ordering uses the client-set `createdAtMs` (not the Firestore
 * serverTimestamp) so freshly-posted docs appear immediately, before the
 * server has had a chance to backfill the serverTimestamp field.
 */
export function subscribeToWall(
  onChange: (posts: WallPost[]) => void,
  options?: { max?: number },
): Unsubscribe {
  const db = getDb();
  const q = query(
    collection(db, WALL_COLLECTION),
    orderBy("createdAtMs", "desc"),
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
        if (typeof data.createdAtMs === "number") {
          createdAt = data.createdAtMs;
        } else if (
          data.createdAt &&
          typeof data.createdAt === "object" &&
          "toMillis" in data.createdAt
        ) {
          createdAt = (data.createdAt as Timestamp).toMillis();
        } else if (typeof data.createdAt === "number") {
          createdAt = data.createdAt;
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
