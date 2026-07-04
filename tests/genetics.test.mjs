import { test } from "node:test";
import assert from "node:assert/strict";
import { TRAITS, TRAIT_ORDER, getAllele } from "../src/traits.js";
import { phenotypeOf, breed, makeLocus, makeGenotype, punnett } from "../src/genetics.js";

test("phenotypeOf: 더 우성인(dominance 낮은) 대립유전자가 발현된다", () => {
  const geno = makeGenotype({}); // 모든 좌위
  // 검정(0)/금발(2) → 검정 발현
  geno.hairColor = ["black", "blonde"];
  const p = phenotypeOf(geno);
  assert.equal(p.hairColor.alleleId, "black");
  assert.equal(p.hairColor.carriesRecessive, true);
  assert.equal(p.hairColor.homozygous, false);
});

test("phenotypeOf: 동형 열성은 열성 형질을 발현한다", () => {
  const geno = makeGenotype({});
  geno.hairStyle = ["straight", "straight"]; // 곱슬(0)의 열성
  const p = phenotypeOf(geno);
  assert.equal(p.hairStyle.alleleId, "straight");
  assert.equal(p.hairStyle.homozygous, true);
  assert.equal(p.hairStyle.carriesRecessive, false);
});

test("breed: 자식의 각 대립유전자는 부모에게서 하나씩 온다", () => {
  const mom = makeGenotype({});
  const dad = makeGenotype({});
  for (let i = 0; i < 200; i++) {
    const child = breed(mom, dad);
    for (const t of TRAIT_ORDER) {
      const [a, b] = child[t];
      assert.ok(mom[t].includes(a), `${t}: 첫 대립유전자는 엄마에게서`);
      assert.ok(dad[t].includes(b), `${t}: 둘째 대립유전자는 아빠에게서`);
    }
  }
});

test("makeLocus: 지정한 표현형이 유지된다", () => {
  for (const t of TRAIT_ORDER) {
    for (const al of TRAITS[t].alleles) {
      const locus = makeLocus(t, al.id, 0.8);
      const p = phenotypeOf({ ...blank(), [t]: locus });
      // 지정한 대립유전자가 열성이면 동형이라 그대로, 우성이면 그대로 발현되어야 함
      const expressed = p[t].alleleId;
      const chosenDom = getAllele(t, al.id).dominance;
      const exprDom = getAllele(t, expressed).dominance;
      assert.ok(exprDom <= chosenDom, `${t}/${al.id}: 발현이 지정보다 더 우성일 수 없음`);
      // 캐리어는 항상 지정보다 열성인 것만 숨김 → 발현은 지정과 동일해야 함
      assert.equal(expressed, al.id, `${t}: ${al.id} 표현형 유지`);
    }
  }
});

test("makeLocus: 열성 전용 형질(주근깨/오드아이)을 고르면 동형접합", () => {
  assert.deepEqual(makeLocus("freckles", "freckles"), ["freckles", "freckles"]);
  assert.deepEqual(makeLocus("oddeye", "odd"), ["odd", "odd"]);
});

test("punnett: 확률 합은 100%", () => {
  const mom = makeGenotype({});
  const dad = makeGenotype({});
  for (const t of TRAIT_ORDER) {
    const dist = punnett(t, mom, dad);
    const total = Object.values(dist).reduce((s, v) => s + v, 0);
    assert.equal(total, 100, `${t} 펀넷 합`);
  }
});

test("두 캐리어 교배 시 열성이 25%로 발현될 수 있다", () => {
  // 곱슬(캐리어) x 곱슬(캐리어) → 생머리 자식 등장 가능
  const mom = { ...blank(), hairStyle: ["curly", "straight"] };
  const dad = { ...blank(), hairStyle: ["curly", "straight"] };
  let straight = 0;
  const N = 4000;
  for (let i = 0; i < N; i++) {
    const child = breed(mom, dad);
    if (phenotypeOf(child).hairStyle.alleleId === "straight") straight++;
  }
  const ratio = straight / N;
  assert.ok(ratio > 0.18 && ratio < 0.32, `열성 발현 비율 ~25% (실측 ${ratio.toFixed(3)})`);
});

// 모든 좌위를 임의로 채운 유전자형(테스트 헬퍼)
function blank() {
  const g = {};
  for (const t of TRAIT_ORDER) {
    const first = TRAITS[t].alleles[0].id;
    g[t] = [first, first];
  }
  return g;
}
