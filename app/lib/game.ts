export function randomRoomCode() {
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 6; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return out;
}

export function randomGlitchyBites() {
  const a = Math.floor(Math.random() * 12);
  let b = Math.floor(Math.random() * 12);
  while (b === a) b = Math.floor(Math.random() * 12);
  return [a, b].sort((x, y) => x - y);
}

export function wagerLabel(wager: string) {
  if (wager === "hot-seat") return "🔥 The Hot Seat";
  if (wager === "appetizer") return "🍽️ Winner Takes It All";
  if (wager === "dare") return "🎭 Custom Dare";
  if (wager === "glitch") return "🌶️ The Flinch";
  return "Wager";
}

export function wagerDescription(wager: string) {
  if (wager === "hot-seat") return "Loser pays for the next round of drinks.";
  if (wager === "appetizer") return "Loser pays for the appetizer box.";
  if (wager === "dare") return "Loser performs a dare chosen by the group.";
  if (wager === "glitch") return "The one who flinches loses and has to live with that.";
  return "Host chooses what you play for.";
}

