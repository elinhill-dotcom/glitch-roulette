// Admin can create categories dynamically in Firestore, so ids must be flexible.
export type MenuCategoryId = string;

export type MenuCategory = {
  id: MenuCategoryId;
  label: string;
  tagline: string;
  accent: "green" | "orange";
};

export type MenuProduct = {
  id: string;
  categoryId: MenuCategoryId;
  name: string;
  description: string;
  priceCents: number;
  heat: 0 | 1 | 2 | 3 | 4 | 5;
  isAvailable: boolean;
  image?: string;
};

export type CartLine = {
  productId: string;
  qty: number;
};

export type RoomPlayer = {
  id: string;
  name: string;
  joinedAt: number;
};

export type WagerType = "hot-seat" | "appetizer" | "dare" | "glitch";

export type Guess = "stark" | "mesig";
export type JudgeVote = "yes" | "no";

export type ProtocolStatus =
  | "pending"
  | "safe"
  | "declared_spicy"
  | "panic"
  | "glitch";

export type NotAGlitchPhase =
  | "lobby"
  | "wager"
  | "guess"
  | "countdown"
  | "eat"
  | "confirm"
  | "judge"
  | "finished";

export type PlayerScore = {
  safe: number;
  glitched: number;
  betPoints: number;
};

export type ProtocolEntry = {
  biteIndex: number; // 0..11
  status: ProtocolStatus;
  heat?: "mild" | "hot";
  playerId?: string;
  playerName?: string;
};

export type NotAGlitchState = {
  phase: NotAGlitchPhase;
  hostId: string;
  betAmountCents: number;
  wager?: WagerType;
  playerOrder: string[]; // array of playerIds
  currentPlayerIndex: number;
  biteIndex: number; // 0..11
  glitchyBites: number[]; // 2 indices 0..11
  declaredSpicy: boolean;
  guesses: Record<string, Guess>; // playerId -> guess for current bite
  judgeVotes: Record<string, JudgeVote>; // playerId -> vote for current player
  judgeVerdict?: "safe" | "glitch";
  protocol: ProtocolEntry[]; // 12 entries
  scores: Record<string, PlayerScore>; // playerId -> score
  countdownEndsAt?: number; // ms epoch
  eatEndsAt?: number; // ms epoch
};

