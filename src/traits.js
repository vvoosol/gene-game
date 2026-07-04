// traits.js — 형질(유전자좌)과 대립유전자 정의
// 각 형질은 여러 대립유전자를 가지며, dominance 숫자가 낮을수록 우성이다.
// 표현형(phenotype)은 유전자형(genotype)에 존재하는 대립유전자 중
// dominance가 가장 낮은(=가장 우성인) 것으로 결정된다. (멘델의 우열 법칙)

export const TRAITS = {
  skin: {
    id: "skin",
    label: "피부톤",
    alleles: [
      { id: "tan", label: "구릿빛", dominance: 0, color: "#e8b088" },
      { id: "medium", label: "보통", dominance: 1, color: "#f6c9a4" },
      { id: "fair", label: "밝은", dominance: 2, color: "#ffe0c8" },
    ],
  },
  face: {
    id: "face",
    label: "얼굴형",
    alleles: [
      { id: "round", label: "동그란", dominance: 0 },
      { id: "oval", label: "갸름한", dominance: 1 },
    ],
  },
  hairColor: {
    id: "hairColor",
    label: "머리색",
    alleles: [
      { id: "black", label: "검정", dominance: 0, color: "#33313b" },
      { id: "brown", label: "갈색", dominance: 1, color: "#7d4a2a" },
      { id: "blonde", label: "금발", dominance: 2, color: "#e9c46a" },
      { id: "pink", label: "분홍(희귀)", dominance: 3, color: "#f4a7c4", rare: true },
    ],
  },
  hairStyle: {
    id: "hairStyle",
    label: "머리모양",
    alleles: [
      { id: "curly", label: "곱슬", dominance: 0 },
      { id: "straight", label: "생머리", dominance: 1 },
    ],
  },
  eyeColor: {
    id: "eyeColor",
    label: "눈색",
    alleles: [
      { id: "brown", label: "갈색", dominance: 0, color: "#6b4423" },
      { id: "green", label: "초록", dominance: 1, color: "#4a9e6b" },
      { id: "blue", label: "파랑", dominance: 2, color: "#5b8fd6" },
    ],
  },
  eyeShape: {
    id: "eyeShape",
    label: "눈모양",
    alleles: [
      { id: "round", label: "동그란", dominance: 0 },
      { id: "almond", label: "아몬드", dominance: 1 },
    ],
  },
  freckles: {
    id: "freckles",
    label: "주근깨",
    alleles: [
      { id: "none", label: "없음", dominance: 0 },
      { id: "freckles", label: "있음(열성)", dominance: 1, recessiveTrait: true },
    ],
  },
  oddeye: {
    id: "oddeye",
    label: "오드아이",
    alleles: [
      { id: "normal", label: "보통", dominance: 0 },
      { id: "odd", label: "오드아이(희귀 열성)", dominance: 1, recessiveTrait: true, rare: true },
    ],
  },
};

export const TRAIT_ORDER = [
  "skin",
  "face",
  "hairColor",
  "hairStyle",
  "eyeColor",
  "eyeShape",
  "freckles",
  "oddeye",
];

// 커스터마이징에서 사용자가 직접 고르는 형질(가시적인 것 위주)
export const CUSTOMIZABLE = [
  "skin",
  "face",
  "hairColor",
  "hairStyle",
  "eyeColor",
  "eyeShape",
];

export function getAllele(traitId, alleleId) {
  return TRAITS[traitId].alleles.find((a) => a.id === alleleId);
}

// 특정 형질에서 가장 우성인(기본) 대립유전자
export function dominantAllele(traitId) {
  return TRAITS[traitId].alleles.reduce((a, b) =>
    a.dominance <= b.dominance ? a : b
  );
}
