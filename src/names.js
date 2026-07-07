// names.js — 귀여운 이름 무작위 생성기

const FIRST = [
  "하", "소", "별", "달", "라", "미", "유", "지", "루", "은",
  "다", "보", "새", "온", "初", "여", "노", "구", "설", "봄",
];
const SECOND = [
  "율", "아", "온", "결", "빈", "이", "찬", "린", "우", "슬",
  "한", "결", "별", "솔", "리", "안", "겸", "봄", "샘", "휘",
];

// 실제로는 조합형 한글 음절이 필요하므로 사전 정의된 예쁜 이름 풀을 사용
const NAME_POOL = [
  "하율", "소온", "별하", "달래", "라온", "미소", "유리", "지호", "루아", "은결",
  "다온", "보리", "새봄", "온유", "여울", "노을", "구름", "설아", "봄이", "初하",
  "하늘", "바다", "가온", "나린", "두리", "마루", "사랑", "아리", "예솔", "재이",
  "찬희", "태오", "하람", "이슬", "주안", "시아", "레아", "빛나", "슬기", "한결",
];

export function randomName(exclude = []) {
  const pool = NAME_POOL.filter((n) => !exclude.includes(n));
  if (!pool.length) return NAME_POOL[Math.floor(Math.random() * NAME_POOL.length)];
  return pool[Math.floor(Math.random() * pool.length)];
}

export function randomNames(count, exclude = []) {
  const used = [...exclude];
  const out = [];
  for (let i = 0; i < count; i++) {
    const n = randomName(used);
    used.push(n);
    out.push(n);
  }
  return out;
}
