// art.js — 표현형(phenotype)을 받아 귀여운 치비 캐릭터 SVG를 생성한다.
import { getAllele } from "./traits.js";

// ---- 색 유틸 ----
function clamp(v) {
  return Math.max(0, Math.min(255, Math.round(v)));
}
function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function rgbToHex([r, g, b]) {
  return "#" + [r, g, b].map((v) => clamp(v).toString(16).padStart(2, "0")).join("");
}
function mix(hex, target, amt) {
  const a = hexToRgb(hex);
  const b = hexToRgb(target);
  return rgbToHex(a.map((v, i) => v + (b[i] - v) * amt));
}
const darken = (hex, amt = 0.2) => mix(hex, "#000000", amt);
const lighten = (hex, amt = 0.2) => mix(hex, "#ffffff", amt);

// 오드아이일 때 반대쪽 눈에 쓸 대비 색
function oddPair(mainColor) {
  return mainColor === "#5b8fd6" ? "#e0a020" : "#5b8fd6";
}

// 곱슬 앞머리: 물결치는 스캘럽 경로
function curlyFringe(color) {
  return `
    <path d="M42 96
      Q40 70 62 60 Q70 44 92 50 Q110 38 130 50 Q150 44 158 62 Q180 72 176 98
      Q168 86 156 92 Q150 78 138 86 Q132 72 120 82 Q110 70 100 82
      Q88 72 82 86 Q70 78 64 92 Q52 84 42 96 Z" fill="${color}"/>
    <circle cx="58" cy="92" r="10" fill="${color}"/>
    <circle cx="80" cy="82" r="11" fill="${color}"/>
    <circle cx="110" cy="76" r="12" fill="${color}"/>
    <circle cx="140" cy="82" r="11" fill="${color}"/>
    <circle cx="162" cy="92" r="10" fill="${color}"/>`;
}

// 생머리 앞머리: 매끈한 뱅과 가르마
function straightFringe(color) {
  const hl = lighten(color, 0.18);
  return `
    <path d="M42 100
      Q40 58 110 52 Q180 58 178 100
      Q176 78 150 72 Q150 96 140 104
      Q140 80 120 74 Q118 96 108 100
      Q108 78 96 74 Q92 94 84 100
      Q82 80 62 74 Q46 80 42 100 Z" fill="${color}"/>
    <path d="M110 54 Q150 60 168 92 Q150 72 130 72 Q120 62 110 54 Z" fill="${hl}" opacity="0.5"/>`;
}

// 뒷머리(실루엣). gender에 따라 길이 조절.
function backHair(color, gender) {
  const long = gender === "female";
  if (long) {
    return `<path d="M40 96 Q30 150 46 196 Q60 176 62 150 L62 120
      Q110 96 158 120 L158 150 Q160 176 174 196 Q190 150 180 96
      Q160 60 110 58 Q60 60 40 96 Z" fill="${darken(color, 0.06)}"/>`;
  }
  return `<path d="M46 92 Q38 132 50 150 Q60 132 62 118 L62 116
    Q110 96 158 116 L158 118 Q160 132 170 150 Q182 132 174 92
    Q158 62 110 60 Q62 62 46 92 Z" fill="${darken(color, 0.06)}"/>`;
}

function eye(cx, color, shape, freckleShadow) {
  const isRound = shape === "round";
  const rx = isRound ? 15 : 15;
  const ry = isRound ? 17 : 11;
  const irisR = isRound ? 10 : 9;
  const white = "#ffffff";
  const iris = color;
  const pupil = darken(color, 0.55);
  const hi = "#ffffff";
  const lidTilt = isRound ? "" : `<path d="M${cx - 15} ${128 - 3} Q${cx} ${128 - 10} ${cx + 15} ${128 - 3}" stroke="${darken("#3a2b2b",0)}" stroke-width="2.5" fill="none" stroke-linecap="round"/>`;
  return `
    <g>
      <ellipse cx="${cx}" cy="128" rx="${rx}" ry="${ry}" fill="${white}"/>
      <circle cx="${cx}" cy="129" r="${irisR}" fill="${iris}"/>
      <circle cx="${cx}" cy="129" r="${irisR * 0.55}" fill="${pupil}"/>
      <circle cx="${cx - 3.5}" cy="125" r="${irisR * 0.32}" fill="${hi}"/>
      <circle cx="${cx + 3}" cy="132" r="${irisR * 0.16}" fill="${hi}" opacity="0.8"/>
      <path d="M${cx - rx} 128 A${rx} ${ry} 0 0 1 ${cx + rx} 128" fill="none"
        stroke="${darken("#3a2b2b", 0)}" stroke-width="2.6" stroke-linecap="round" opacity="0.85"/>
      ${lidTilt}
    </g>`;
}

function mouth(expression) {
  switch (expression) {
    case "happy":
      return `<path d="M96 168 Q110 184 124 168 Q110 176 96 168 Z" fill="#c0506a"/>
              <path d="M99 170 Q110 178 121 170" fill="#ff8fa3"/>`;
    case "blush":
      return `<path d="M100 168 Q104 176 108 168 Q114 176 118 168" fill="none" stroke="#c0506a" stroke-width="3" stroke-linecap="round"/>`;
    case "neutral":
      return `<path d="M102 170 Q110 174 118 170" fill="none" stroke="#b04a62" stroke-width="3" stroke-linecap="round"/>`;
    default: // smile
      return `<path d="M100 168 Q110 180 120 168" fill="none" stroke="#c0506a" stroke-width="3.2" stroke-linecap="round"/>`;
  }
}

function freckles(skin) {
  const c = darken(skin, 0.28);
  const dots = [
    [80, 146], [86, 150], [92, 147],
    [128, 147], [134, 150], [140, 146],
  ];
  return dots.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2" fill="${c}" opacity="0.75"/>`).join("");
}

/**
 * @param pheno phenotypeOf() 결과
 * @param opts { gender, expression, outfit, size }
 */
export function renderCharacter(pheno, opts = {}) {
  const { gender = "female", expression = "smile", outfit, size = 200 } = opts;

  const skin = pheno.skin.color || "#f6c9a4";
  const skinShadow = darken(skin, 0.12);
  const hairColorObj = getAllele("hairColor", pheno.hairColor.alleleId);
  const hairColor = hairColorObj.color;
  const hairStyle = pheno.hairStyle.alleleId; // curly | straight
  const eyeMain = getAllele("eyeColor", pheno.eyeColor.alleleId).color;
  const eyeShape = pheno.eyeShape.alleleId; // round | almond
  const isOdd = pheno.oddeye.alleleId === "odd";
  const hasFreckles = pheno.freckles.alleleId === "freckles";
  const faceOval = pheno.face.alleleId === "oval";
  const outfitColor = outfit || (gender === "female" ? "#ffb3c6" : "#8ecae6");
  const browColor = darken(hairColor, 0.15);

  // 얼굴형
  const cx = 110;
  const cy = faceOval ? 122 : 120;
  const rx = faceOval ? 60 : 68;
  const ry = faceOval ? 76 : 70;

  const leftEyeColor = eyeMain;
  const rightEyeColor = isOdd ? oddPair(eyeMain) : eyeMain;

  const svg = `
<svg viewBox="0 0 220 240" width="${size}" height="${size * 240 / 220}" xmlns="http://www.w3.org/2000/svg" role="img">
  <!-- 뒷머리 -->
  ${backHair(hairColor, gender)}

  <!-- 몸/어깨 -->
  <path d="M60 240 Q60 196 110 190 Q160 196 160 240 Z" fill="${outfitColor}"/>
  <path d="M96 196 Q110 208 124 196 L124 182 L96 182 Z" fill="${skin}"/>

  <!-- 얼굴 -->
  <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${skin}"/>
  <!-- 귀 -->
  <circle cx="${cx - rx + 4}" cy="${cy + 6}" r="10" fill="${skin}"/>
  <circle cx="${cx + rx - 4}" cy="${cy + 6}" r="10" fill="${skin}"/>
  <circle cx="${cx - rx + 4}" cy="${cy + 6}" r="4" fill="${skinShadow}"/>
  <circle cx="${cx + rx - 4}" cy="${cy + 6}" r="4" fill="${skinShadow}"/>

  <!-- 볼터치 -->
  <ellipse cx="${cx - 40}" cy="150" rx="12" ry="8" fill="#ff9aae" opacity="${expression === "blush" ? 0.6 : 0.4}"/>
  <ellipse cx="${cx + 40}" cy="150" rx="12" ry="8" fill="#ff9aae" opacity="${expression === "blush" ? 0.6 : 0.4}"/>

  ${hasFreckles ? freckles(skin) : ""}

  <!-- 눈썹 -->
  <path d="M70 112 Q84 106 98 112" stroke="${browColor}" stroke-width="4" fill="none" stroke-linecap="round"/>
  <path d="M122 112 Q136 106 150 112" stroke="${browColor}" stroke-width="4" fill="none" stroke-linecap="round"/>

  <!-- 눈 -->
  ${eye(86, leftEyeColor, eyeShape, hasFreckles)}
  ${eye(134, rightEyeColor, eyeShape, hasFreckles)}

  <!-- 코 -->
  <path d="M108 150 Q110 154 112 150" stroke="${skinShadow}" stroke-width="2.5" fill="none" stroke-linecap="round"/>

  <!-- 입 -->
  ${mouth(expression)}

  <!-- 앞머리 -->
  ${hairStyle === "curly" ? curlyFringe(hairColor) : straightFringe(hairColor)}
</svg>`.trim();

  return svg;
}
