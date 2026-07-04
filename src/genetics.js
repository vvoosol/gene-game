// genetics.js — 유전자형/표현형, 감수분열식 상속, 캐리어 생성
import { TRAITS, TRAIT_ORDER, getAllele } from "./traits.js";

function randPick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// 유전자형: { [traitId]: [alleleIdA, alleleIdB] }

// 표현형 계산: 각 형질좌에서 dominance가 가장 낮은(우성) 대립유전자를 발현.
export function phenotypeOf(genotype) {
  const pheno = {};
  for (const traitId of TRAIT_ORDER) {
    const [a, b] = genotype[traitId];
    const alA = getAllele(traitId, a);
    const alB = getAllele(traitId, b);
    const expressed = alA.dominance <= alB.dominance ? alA : alB;
    pheno[traitId] = {
      alleleId: expressed.id,
      label: expressed.label,
      color: expressed.color,
      homozygous: a === b,
      // 이형접합인데 열성 대립유전자를 하나 숨기고 있으면 캐리어
      carriesRecessive: a !== b,
    };
  }
  return pheno;
}

// 감수분열: 각 부모에서 형질좌마다 대립유전자 하나씩을 무작위로 물려준다.
export function breed(momGenotype, dadGenotype) {
  const child = {};
  for (const traitId of TRAIT_ORDER) {
    const fromMom = randPick(momGenotype[traitId]);
    const fromDad = randPick(dadGenotype[traitId]);
    child[traitId] = [fromMom, fromDad];
  }
  return child;
}

// 한 형질좌의 유전자형 생성.
// expressedId 지정 시 그 표현형을 유지, 미지정 시 무작위.
// 표현형은 유지하되 두 번째 대립유전자로 더 열성인 유전자를 숨겨(캐리어) 세대 재미를 만든다.
export function makeLocus(traitId, expressedId, carrierChance = 0.5) {
  const trait = TRAITS[traitId];
  const alleles = trait.alleles;

  let expr = expressedId;
  if (!expr) expr = weightedRandomAllele(trait).id;
  const expressed = getAllele(traitId, expr);

  // 열성으로만 발현되는 형질(주근깨/오드아이)을 골랐다면 동형접합이어야 발현됨
  if (expressed.recessiveTrait) return [expr, expr];

  // 두 번째 대립유전자: 발현 유전자보다 열성(같거나 더 큰 dominance)인 것 중 하나
  let second = expr;
  const moreRecessive = alleles.filter((a) => a.dominance > expressed.dominance);
  if (moreRecessive.length && Math.random() < carrierChance) {
    second = randPick(moreRecessive).id;
  }
  return Math.random() < 0.5 ? [expr, second] : [second, expr];
}

// 1세대(플레이어/후보) 유전자형 생성.
// chosen: 사용자가 고른 표현형 { traitId: alleleId }. 지정 안 된 형질은 무작위.
export function makeGenotype(chosen = {}, carrierChance = 0.5) {
  const genotype = {};
  for (const traitId of TRAIT_ORDER) {
    genotype[traitId] = makeLocus(traitId, chosen[traitId], carrierChance);
  }
  return genotype;
}

// 무작위 대립유전자: 우성일수록 흔하게, 희귀 표시는 드물게
function weightedRandomAllele(trait) {
  const weights = trait.alleles.map((a) => {
    if (a.rare) return 0.4;
    if (a.recessiveTrait) return 0.6;
    return Math.max(1, 4 - a.dominance);
  });
  const total = weights.reduce((s, w) => s + w, 0);
  let r = Math.random() * total;
  for (let i = 0; i < trait.alleles.length; i++) {
    r -= weights[i];
    if (r <= 0) return trait.alleles[i];
  }
  return trait.alleles[0];
}

// 두 부모 사이에서 특정 자식 표현형이 나올 확률(설명/재미용) — 형질좌별 4칸 펀넷 사각형
export function punnett(traitId, momGenotype, dadGenotype) {
  const mom = momGenotype[traitId];
  const dad = dadGenotype[traitId];
  const outcomes = {};
  for (const m of mom) {
    for (const d of dad) {
      const alM = getAllele(traitId, m);
      const alD = getAllele(traitId, d);
      const expr = alM.dominance <= alD.dominance ? alM : alD;
      outcomes[expr.id] = (outcomes[expr.id] || 0) + 25; // 4칸 중 1칸 = 25%
    }
  }
  return outcomes; // { alleleId: percent }
}
