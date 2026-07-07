// game.js — 게임 상태 머신과 UI
import { TRAITS, TRAIT_ORDER, CUSTOMIZABLE, getAllele, dominantAllele } from "./traits.js";
import { phenotypeOf, makeGenotype, makeLocus, breed } from "./genetics.js";
import { renderCharacter } from "./art.js";
import {
  randomPersonality, personalityInfo, hobbyInfo,
  compatibility, heartsFor,
} from "./personality.js";
import { randomName, randomNames } from "./names.js";

const screen = document.getElementById("screen");
const genBadge = document.getElementById("genBadge");
const SAVE_KEY = "gene-game-save-v1";

let state = null;

// ---------- 캐릭터 유틸 ----------
function buildCharacter({ name, gender, genotype, personality, hobbies }) {
  const p = personality ? { personality, hobbies } : randomPersonality();
  return {
    name,
    gender,
    genotype,
    phenotype: phenotypeOf(genotype),
    personality: p.personality,
    hobbies: p.hobbies,
  };
}

function randomCharacter(gender, exclude = []) {
  return buildCharacter({
    name: randomName(exclude),
    gender,
    genotype: makeGenotype({}),
  });
}

function oppositeGender(g) {
  return g === "female" ? "male" : "female";
}

// ---------- 상태 저장/복원 ----------
function save() {
  const slim = {
    generation: state.generation,
    player: {
      name: state.player.name,
      gender: state.player.gender,
      genotype: state.player.genotype,
      personality: state.player.personality,
      hobbies: state.player.hobbies,
    },
    log: state.log,
  };
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(slim)); } catch (e) {}
}
function load() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    s.player = buildCharacter(s.player);
    return s;
  } catch (e) { return null; }
}
function resetSave() {
  try { localStorage.removeItem(SAVE_KEY); } catch (e) {}
}

function updateGenBadge() {
  genBadge.textContent = `${state ? state.generation : 1}세대`;
}

// ---------- 렌더 헬퍼 ----------
function portraitHTML(char, opts = {}) {
  const size = opts.size || 150;
  return `<div class="char-portrait">${renderCharacter(char.phenotype, {
    gender: char.gender, size, expression: opts.expression || "smile",
    alive: true,
    hearts: opts.hearts != null ? opts.hearts : size >= 150,
  })}</div>`;
}

function tagsHTML(char) {
  const p = personalityInfo(char.personality);
  const hobbies = char.hobbies.map((h) => {
    const info = hobbyInfo(h);
    return `<span class="tag hobby">${info.emoji} ${info.label}</span>`;
  }).join("");
  return `<div class="char-tags">
    <span class="tag">${p.emoji} ${p.label}</span>${hobbies}
  </div>`;
}

function charCardHTML(char, opts = {}) {
  const cls = ["char-card"];
  if (opts.selectable) cls.push("selectable");
  if (opts.selected) cls.push("selected");
  return `<div class="${cls.join(" ")}" ${opts.dataId != null ? `data-id="${opts.dataId}"` : ""}>
    ${portraitHTML(char, { size: opts.size || 130 })}
    <div class="char-name">${opts.badge ? opts.badge + " " : ""}${char.name}</div>
    ${tagsHTML(char)}
  </div>`;
}

// ==================================================
//  화면 1: 타이틀
// ==================================================
function showTitle() {
  const demo = ["female", "male", "female"].map((g) => randomCharacter(g));
  const saved = load();
  screen.innerHTML = `
    <div class="card title-hero fadein">
      <div class="title-portraits">
        ${demo.map((c) => renderCharacter(c.phenotype, { gender: c.gender, size: 120 })).join("")}
      </div>
      <p class="big">두근두근 유전 소개팅</p>
      <p style="color:var(--ink-soft); max-width:420px;">
        내 캐릭터로 3:3 소개팅에 나가 짝을 만나고, 결혼해서 아이를 낳으세요.
        아이의 얼굴은 <b>멘델의 우열 법칙</b>으로 부모를 닮습니다.
        가끔 <b>희귀 형질</b>(오드아이·분홍머리·주근깨)이 깜짝 등장해요!
      </p>
      <div class="row">
        <button class="btn" id="startBtn">✨ 새로 시작</button>
        ${saved ? `<button class="btn secondary" id="continueBtn">이어하기 (${saved.generation}세대)</button>` : ""}
      </div>
    </div>`;
  document.getElementById("startBtn").onclick = () => { resetSave(); showCustomize(); };
  if (saved) {
    document.getElementById("continueBtn").onclick = () => {
      state = saved;
      updateGenBadge();
      showDate();
    };
  }
}

// ==================================================
//  화면 2: 커스터마이징 (1세대 캐릭터 만들기)
// ==================================================
function showCustomize() {
  const chosen = {};
  for (const t of CUSTOMIZABLE) chosen[t] = dominantAllele(t).id;
  let gender = "female";
  let name = randomName();
  const genotype = makeGenotype(chosen); // 한 번만 생성, 좌위별 갱신

  // 부위 탭: 성별 + 커스터마이징 형질
  const GENDER_OPTS = [
    { id: "female", label: "여자", icon: "👧" },
    { id: "male", label: "남자", icon: "👦" },
  ];
  const SHAPE_ICON = {
    round: "◯", oval: "◇", curly: "🌀", straight: "▌", almond: "◗",
  };
  const categories = [
    { id: "gender", label: "성별" },
    ...CUSTOMIZABLE.map((t) => ({ id: t, label: TRAITS[t].label })),
  ];
  let tab = categories[0].id;

  // 활성 탭의 옵션 목록과 현재 선택값
  function optionsOf(catId) {
    if (catId === "gender") return GENDER_OPTS.map((o) => ({ id: o.id, label: o.label, icon: o.icon }));
    return TRAITS[catId].alleles.map((a) => ({ id: a.id, label: a.label, color: a.color, icon: SHAPE_ICON[a.id] }));
  }
  function currentValue(catId) {
    return catId === "gender" ? gender : chosen[catId];
  }
  function setValue(catId, id) {
    if (catId === "gender") { gender = id; return; }
    chosen[catId] = id;
    genotype[catId] = makeLocus(catId, id);
  }
  // 화살표: 현재 탭 옵션을 앞/뒤로 순환
  function cycle(dir) {
    const opts = optionsOf(tab);
    const idx = opts.findIndex((o) => o.id === currentValue(tab));
    const next = (idx + dir + opts.length) % opts.length;
    setValue(tab, opts[next].id);
    render();
  }

  function preview() {
    return renderCharacter(phenotypeOf(genotype), { gender, size: 210, hearts: true });
  }

  function render() {
    const tabsHTML = categories.map((c) =>
      `<button class="maker-tab ${tab === c.id ? "active" : ""}" data-tab="${c.id}">${c.label}</button>`
    ).join("");

    const cur = currentValue(tab);
    const tilesHTML = optionsOf(tab).map((o) => {
      const swatch = o.color
        ? `<span class="opt-swatch" style="background:${o.color}"></span>`
        : `<span class="opt-swatch">${o.icon || "·"}</span>`;
      return `<button class="opt-tile ${o.id === cur ? "active" : ""}" data-opt="${o.id}">
        ${swatch}<span>${o.label}</span>
      </button>`;
    }).join("");

    const catLabel = categories.find((c) => c.id === tab).label;

    screen.innerHTML = `
      <div class="card maker-card fadein">
        <div class="maker-titlebar">✨ 나만의 캐릭터 만들기</div>
        <div class="maker-body">
          <div class="maker-stage">
            <div class="stage-caption">＜ ${catLabel} ＞ 를 바꿔보세요</div>
            <button class="stage-arrow left" id="arrowL" aria-label="이전">‹</button>
            <div class="stage-char" id="previewBox">${preview()}</div>
            <div class="maker-platform"></div>
            <button class="stage-arrow right" id="arrowR" aria-label="다음">›</button>
          </div>
          <div class="maker-panel">
            <div class="maker-tabs">${tabsHTML}</div>
            <div class="maker-options">${tilesHTML}</div>
          </div>
        </div>
        <div class="maker-footer">
          <input class="name-input" id="nameInput" value="${name}" maxlength="6" placeholder="이름" />
          <button class="btn secondary" id="randomBtn">🎲 랜덤</button>
          <button class="btn" id="doneBtn">결정! 💗</button>
        </div>
      </div>`;

    screen.querySelectorAll("[data-tab]").forEach((b) => {
      b.onclick = () => { tab = b.dataset.tab; render(); };
    });
    screen.querySelectorAll("[data-opt]").forEach((b) => {
      b.onclick = () => { setValue(tab, b.dataset.opt); render(); };
    });
    document.getElementById("arrowL").onclick = () => cycle(-1);
    document.getElementById("arrowR").onclick = () => cycle(1);
    document.getElementById("nameInput").oninput = (e) => { name = e.target.value; };
    document.getElementById("randomBtn").onclick = () => {
      for (const t of CUSTOMIZABLE) {
        const alleles = TRAITS[t].alleles;
        chosen[t] = alleles[Math.floor(Math.random() * alleles.length)].id;
        genotype[t] = makeLocus(t, chosen[t]);
      }
      gender = Math.random() < 0.5 ? "female" : "male";
      name = randomName();
      render();
    };
    document.getElementById("doneBtn").onclick = () => {
      const finalName = (name || "").trim() || randomName();
      state = {
        generation: 1,
        player: buildCharacter({ name: finalName, gender, genotype }),
        log: [],
      };
      save();
      updateGenBadge();
      showDate();
    };
  }
  render();
}

// ==================================================
//  화면 3: 3:3 소개팅
// ==================================================
function showDate() {
  updateGenBadge();
  const player = state.player;
  const oppo = oppositeGender(player.gender);

  // 후보 3명(상대팀) + 동료 2명(우리팀, 연출용)
  const usedNames = [player.name];
  const candidates = [];
  for (let i = 0; i < 3; i++) {
    const c = randomCharacter(oppo, usedNames);
    usedNames.push(c.name);
    candidates.push(c);
  }
  const companions = [];
  for (let i = 0; i < 2; i++) {
    const c = randomCharacter(player.gender, usedNames);
    usedNames.push(c.name);
    companions.push(c);
  }

  let selected = null;
  const rejected = new Set();

  function render() {
    const candCards = candidates.map((c, i) => {
      if (rejected.has(i)) {
        return `<div class="char-card" style="opacity:.45">
          ${portraitHTML(c, { size: 110, expression: "neutral" })}
          <div class="char-name">${c.name}</div>
          <span class="tag">인연 아님 💔</span>
        </div>`;
      }
      return charCardHTML(c, { selectable: true, selected: selected === i, dataId: i, size: 130 });
    }).join("");

    screen.innerHTML = `
      <div class="card fadein">
        <h2>${state.generation}세대 · 3:3 소개팅 💞</h2>
        <p style="color:var(--ink-soft)">마음에 드는 상대를 골라 고백해 보세요. 성격·취미 궁합이 좋을수록 잘 맞아요.</p>
        <div style="margin:10px 0 6px; font-weight:700; color:var(--pink-deep)">우리 팀</div>
        <div class="candidates">
          ${charCardHTML(player, { badge: "⭐나", size: 120 })}
          ${companions.map((c) => `<div style="opacity:.85">${charCardHTML(c, { size: 100 })}</div>`).join("")}
        </div>
        <div style="margin:16px 0 6px; font-weight:700; color:#3f6bb5">상대 팀 (한 명을 선택)</div>
        <div class="candidates">${candCards}</div>
        <div class="row" style="margin-top:18px">
          <button class="btn" id="confessBtn" ${selected == null ? "disabled" : ""}>💘 고백하기</button>
        </div>
      </div>`;

    screen.querySelectorAll(".char-card.selectable").forEach((card) => {
      card.onclick = () => {
        selected = Number(card.dataset.id);
        render();
      };
    });
    document.getElementById("confessBtn").onclick = () => {
      const cand = candidates[selected];
      const result = compatibility(player, cand);
      const ok = result.score >= 55;
      if (ok) {
        showMatch(cand, result, true);
      } else {
        showMatch(cand, result, false, () => {
          rejected.add(selected);
          selected = null;
          if (rejected.size >= candidates.length) {
            // 모두 실패 → 새 모임
            showDate();
          } else {
            render();
          }
        });
      }
    };
  }
  render();
}

// ==================================================
//  화면 4: 매칭 결과
// ==================================================
function showMatch(partner, result, success, onRetry) {
  const player = state.player;
  const sharedTxt = result.shared.length
    ? `공통 취미 ${result.shared.map((h) => hobbyInfo(h).label).join("·")} 덕분에 대화가 잘 통했어요!`
    : "취향은 좀 달랐지만…";

  if (success) {
    screen.innerHTML = `
      <div class="card center fadein">
        <h2>💖 매칭 성공!</h2>
        <div class="match-stage">
          ${portraitHTML(player, { size: 150, expression: "blush" })}
          <div class="big-heart">💗</div>
          ${portraitHTML(partner, { size: 150, expression: "blush" })}
        </div>
        <div class="hearts">${heartsFor(result.score)}</div>
        <p><b>${player.name}</b> ♡ <b>${partner.name}</b> · 궁합 ${result.score}점</p>
        <p style="color:var(--ink-soft)">${sharedTxt} 두 사람은 결혼했어요 💍</p>
        <button class="btn" id="babyBtn">👶 아이 만나러 가기</button>
      </div>`;
    document.getElementById("babyBtn").onclick = () => showBaby(partner);
  } else {
    screen.innerHTML = `
      <div class="card center fadein">
        <h2>😢 이번엔 인연이 아니었어요</h2>
        <div class="match-stage">
          ${portraitHTML(player, { size: 130, expression: "neutral" })}
          <div style="font-size:2.4rem">💔</div>
          ${portraitHTML(partner, { size: 130, expression: "neutral" })}
        </div>
        <div class="hearts">${heartsFor(result.score)}</div>
        <p>궁합 ${result.score}점 · 조금 아쉬웠어요.</p>
        <button class="btn" id="retryBtn">다시 골라보기</button>
      </div>`;
    document.getElementById("retryBtn").onclick = onRetry;
  }
}

// ==================================================
//  화면 5: 출산 (유전!)
// ==================================================
function inheritBadge(childPheno, traitId) {
  const entry = childPheno[traitId];
  const allele = getAllele(traitId, entry.alleleId);
  const dom = `<span class="badge-inherit badge-dom">우성</span>`;
  const carry = `<span class="badge-inherit badge-carry">캐리어</span>`;
  const rareBadge = allele.rare ? ' <span class="badge-inherit badge-rare">희귀</span>' : "";

  // 최우성(dominance 0) 대립유전자가 발현된 경우
  if (allele.dominance === 0) {
    return entry.carriesRecessive ? `${dom} ${carry}` : dom;
  }
  // 그보다 열성인 대립유전자가 발현됨
  //  - 동형접합이면 순수 열성 발현(부모가 모두 캐리어였다는 신호)
  //  - 이형접합이면 더 열성인 짝을 누르고 발현 + 캐리어
  if (entry.homozygous) {
    return `<span class="badge-inherit badge-rec">열성 발현</span>${rareBadge}`;
  }
  return `${dom} ${carry}${rareBadge}`;
}

function showBaby(partner) {
  const player = state.player;
  const childGenotype = breed(player.genotype, partner.genotype);
  const childGender = Math.random() < 0.5 ? "female" : "male";
  const childName = randomName([player.name, partner.name]);
  const child = buildCharacter({ name: childName, gender: childGender, genotype: childGenotype });

  // 희귀/열성 등장 감지
  const surprises = [];
  if (child.phenotype.oddeye.alleleId === "odd") surprises.push("오드아이 👁️");
  if (child.phenotype.hairColor.alleleId === "pink") surprises.push("분홍 머리 🌸");
  if (child.phenotype.freckles.alleleId === "freckles") surprises.push("주근깨 ✨");

  const rows = TRAIT_ORDER.map((tid) => {
    const trait = TRAITS[tid];
    return `<tr>
      <th>${trait.label}</th>
      <td>${player.phenotype[tid].label}</td>
      <td>${partner.phenotype[tid].label}</td>
      <td><b>${child.phenotype[tid].label}</b></td>
      <td>${inheritBadge(child.phenotype, tid)}</td>
    </tr>`;
  }).join("");

  screen.innerHTML = `
    <div class="card fadein">
      <h2>👶 아이가 태어났어요!</h2>
      <div class="baby-reveal">
        ${portraitHTML(child, { size: 200, expression: "happy" })}
        <div class="char-name" style="font-size:1.3rem">${child.name} (${childGender === "female" ? "딸" : "아들"})</div>
        ${surprises.length ? `<div class="tag" style="background:#efe3ff;color:#7a4ecb">✨ 희귀 형질 등장: ${surprises.join(", ")}</div>` : ""}
      </div>
      <div class="trait-table-wrap">
        <table class="trait-table">
          <thead><tr><th>형질</th><th>${player.name}</th><th>${partner.name}</th><th>아이</th><th>유전</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
      <div class="row" style="margin-top:18px">
        <button class="btn" id="nextGenBtn">${child.name}(으)로 다음 세대 시작 →</button>
        <button class="btn secondary" id="homeBtn">타이틀로</button>
      </div>
    </div>`;

  document.getElementById("nextGenBtn").onclick = () => {
    state.log.push({ gen: state.generation, parents: [player.name, partner.name], child: child.name });
    state.generation += 1;
    // 아이가 성장해 새 주인공이 된다. 성격은 새로 부여.
    state.player = buildCharacter({
      name: child.name, gender: child.gender, genotype: child.genotype,
    });
    save();
    updateGenBadge();
    showDate();
  };
  document.getElementById("homeBtn").onclick = () => showTitle();
}

// ---------- 부팅 ----------
showTitle();
updateGenBadge();
