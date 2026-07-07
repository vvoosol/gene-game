// personality.js — 성격/취미와 궁합 계산 (유전과 별개의 가벼운 레이어)

export const PERSONALITIES = [
  { id: "cheerful", label: "활발한", emoji: "✨" },
  { id: "calm", label: "차분한", emoji: "🌿" },
  { id: "quirky", label: "엉뚱한", emoji: "🎈" },
  { id: "caring", label: "다정한", emoji: "💗" },
  { id: "cool", label: "도도한", emoji: "❄️" },
  { id: "shy", label: "수줍은", emoji: "🌸" },
];

export const HOBBIES = [
  { id: "game", label: "게임", emoji: "🎮" },
  { id: "cook", label: "요리", emoji: "🍳" },
  { id: "sport", label: "운동", emoji: "⚽" },
  { id: "music", label: "음악", emoji: "🎵" },
  { id: "book", label: "독서", emoji: "📚" },
  { id: "travel", label: "여행", emoji: "✈️" },
  { id: "art", label: "그림", emoji: "🎨" },
];

// 성격 궁합표: 서로 잘 맞는 조합에 보너스
const PERSONALITY_SYNERGY = {
  cheerful: { calm: 15, shy: 20, caring: 10 },
  calm: { cheerful: 15, quirky: 12, cool: 10 },
  quirky: { calm: 12, caring: 15, quirky: 8 },
  caring: { cool: 20, shy: 18, cheerful: 10 },
  cool: { caring: 20, calm: 10 },
  shy: { cheerful: 20, caring: 18 },
};

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function randomPersonality() {
  const p = pick(PERSONALITIES);
  const hobbies = [...HOBBIES].sort(() => Math.random() - 0.5).slice(0, 2);
  return { personality: p.id, hobbies: hobbies.map((h) => h.id) };
}

export function personalityInfo(id) {
  return PERSONALITIES.find((p) => p.id === id);
}
export function hobbyInfo(id) {
  return HOBBIES.find((h) => h.id === id);
}

// 궁합 점수(0~100). 공통 취미 + 성격 시너지 + 약간의 우연.
export function compatibility(a, b) {
  let score = 42;
  const shared = a.hobbies.filter((h) => b.hobbies.includes(h));
  score += shared.length * 16;

  const syn =
    (PERSONALITY_SYNERGY[a.personality] &&
      PERSONALITY_SYNERGY[a.personality][b.personality]) || 0;
  score += syn;

  // 우연 요소
  score += Math.floor(Math.random() * 16) - 4;

  score = Math.max(5, Math.min(99, score));
  return { score, shared };
}

export function heartsFor(score) {
  const full = Math.round(score / 20); // 0~5
  return "❤️".repeat(full) + "🤍".repeat(5 - full);
}
