// ── 역대 동행복권 당첨번호 빈도 기본값 (1회~1157회 기준) ──
const FREQ_DEFAULT = {
  1: 152,
  2: 161,
  3: 155,
  4: 148,
  5: 163,
  6: 156,
  7: 162,
  8: 149,
  9: 168,
  10: 143,
  11: 158,
  12: 144,
  13: 157,
  14: 165,
  15: 150,
  16: 146,
  17: 159,
  18: 162,
  19: 147,
  20: 153,
  21: 164,
  22: 151,
  23: 143,
  24: 161,
  25: 158,
  26: 146,
  27: 164,
  28: 153,
  29: 150,
  30: 145,
  31: 160,
  32: 165,
  33: 152,
  34: 146,
  35: 159,
  36: 167,
  37: 148,
  38: 157,
  39: 150,
  40: 161,
  41: 145,
  42: 154,
  43: 162,
  44: 147,
  45: 156,
};
const FREQ_DEFAULT_LAST_DRW = 1157;

const CACHE_KEY = "lotto_freq_v1";
const CACHE_DRW_KEY = "lotto_last_drw_v1";

function loadFreq() {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    return cached ? JSON.parse(cached) : Object.assign({}, FREQ_DEFAULT);
  } catch {
    return Object.assign({}, FREQ_DEFAULT);
  }
}

function loadLastDrw() {
  try {
    const v = localStorage.getItem(CACHE_DRW_KEY);
    return v ? parseInt(v) : FREQ_DEFAULT_LAST_DRW;
  } catch {
    return FREQ_DEFAULT_LAST_DRW;
  }
}

let FREQ = loadFreq();
let lastDrw = loadLastDrw();
let drawMode = "random";

function freqSorted() {
  return Object.keys(FREQ)
    .map((k) => ({ n: +k, count: FREQ[k] }))
    .sort((a, b) => b.count - a.count);
}

// ── 기존 코드 ──
const fixedNumbers = new Set();

function ballClass(n) {
  if (n <= 10) return "c1";
  if (n <= 20) return "c11";
  if (n <= 30) return "c21";
  if (n <= 40) return "c31";
  return "c41";
}

const grid = document.getElementById("numberGrid");
for (let n = 1; n <= 45; n++) {
  const btn = document.createElement("button");
  btn.className = `num-btn ${ballClass(n)}`;
  btn.textContent = n;
  btn.dataset.n = n;
  btn.onclick = () => toggleFixed(n, btn);
  grid.appendChild(btn);
}

function switchTab(tab) {
  ["fixed", "popular"].forEach((t) => {
    document
      .getElementById(`tab-${t}`)
      .classList.toggle("active", t === tab);
  });
  document.getElementById("fixed-panel").style.display =
    tab === "fixed" ? "block" : "none";
  document.getElementById("popular-panel").style.display =
    tab === "popular" ? "block" : "none";
  if (tab !== "fixed") resetFixed();
}

function updateFixedUI() {
  document.getElementById("fixedCount").textContent = fixedNumbers.size;
}

function resetFixed() {
  fixedNumbers.clear();
  document.querySelectorAll(".num-btn.fixed-selected").forEach((b) => {
    b.classList.remove("fixed-selected");
  });
  updateFixedUI();
}

function toggleFixed(n, btn) {
  if (fixedNumbers.has(n)) {
    fixedNumbers.delete(n);
    btn.classList.remove("fixed-selected");
  } else {
    if (fixedNumbers.size >= 5) {
      alert("고정 번호는 최대 5개까지 선택할 수 있습니다.");
      return;
    }
    fixedNumbers.add(n);
    btn.classList.add("fixed-selected");
  }
  updateFixedUI();
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ── 추첨 알고리즘 ──

function generateRandomSet() {
  const fixed = [...fixedNumbers];
  const pool = [];
  for (let i = 1; i <= 45; i++) {
    if (!fixedNumbers.has(i)) pool.push(i);
  }
  shuffle(pool);
  const picked = pool.slice(0, 6 - fixed.length);
  return [...fixed, ...picked].sort((a, b) => a - b);
}

function weightedPickOne(pool) {
  const total = pool.reduce((s, n) => s + (FREQ[n] || 1), 0);
  let r = Math.random() * total;
  for (const n of pool) {
    r -= FREQ[n] || 1;
    if (r <= 0) return n;
  }
  return pool[pool.length - 1];
}

function generateWeightedSet() {
  const fixed = [...fixedNumbers];
  let pool = [];
  for (let i = 1; i <= 45; i++) {
    if (!fixedNumbers.has(i)) pool.push(i);
  }
  const picked = [];
  for (let i = 0; i < 6 - fixed.length; i++) {
    const chosen = weightedPickOne(pool);
    picked.push(chosen);
    pool = pool.filter((x) => x !== chosen);
  }
  return [...fixed, ...picked].sort((a, b) => a - b);
}

function generateTopPoolSet() {
  const TOP_N = 20;
  const sorted = freqSorted();
  const topNums = new Set(sorted.slice(0, TOP_N).map((x) => x.n));
  const fixed = [...fixedNumbers];
  let pool = [...topNums].filter((n) => !fixedNumbers.has(n));
  if (pool.length < 6 - fixed.length) {
    for (let i = 1; i <= 45; i++) {
      if (!fixedNumbers.has(i) && !topNums.has(i)) pool.push(i);
    }
  }
  shuffle(pool);
  const picked = pool.slice(0, 6 - fixed.length);
  return [...fixed, ...picked].sort((a, b) => a - b);
}

function generateSet() {
  const gen = () => {
    if (drawMode === "weighted") return generateWeightedSet();
    if (drawMode === "toppool") return generateTopPoolSet();
    return generateRandomSet();
  };
  if (!statFilterOn) return gen();
  for (let i = 0; i < 500; i++) {
    const nums = gen();
    if (meetsStatFilter(nums)) return nums;
  }
  return gen();
}

// ── 추첨 방식 선택 ──

function setDrawMode(mode) {
  drawMode = mode;
  document.querySelectorAll("[data-mode]").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.mode === drawMode);
  });
}

// ── 통계 필터 ──

let statFilterOn = false;

function setStatFilter(on) {
  statFilterOn = on;
}

function meetsStatFilter(numbers) {
  const sum = numbers.reduce((a, b) => a + b, 0);
  const oddCount = numbers.filter((n) => n % 2 !== 0).length;
  return sum >= 100 && sum <= 175 && oddCount >= 2 && oddCount <= 4;
}

// ── 동행복권 API 업데이트 ──

async function fetchDraw(drwNo) {
  const target = `https://www.dhlottery.co.kr/common.do?method=getLottoNumber&drwNo=${drwNo}`;
  const encoded = encodeURIComponent(target);

  // corsproxy.io 시도
  try {
    const res = await fetch(`https://corsproxy.io/?url=${encoded}`, {
      signal: AbortSignal.timeout(8000),
    });
    if (res.ok) return res.json();
  } catch {}

  // 폴백: allorigins.win
  const res = await fetch(`https://api.allorigins.win/get?url=${encoded}`, {
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error("네트워크 오류");
  const data = await res.json();
  return JSON.parse(data.contents);
}

async function triggerUpdate() {
  const btn = document.getElementById("updateBtn");
  const statusEl = document.getElementById("freqStatus");
  btn.disabled = true;
  statusEl.className = "freq-status";
  statusEl.textContent = "업데이트 중...";

  const updatedFreq = Object.assign({}, FREQ);
  let drwNo = lastDrw + 1;
  let fetchedCount = 0;

  try {
    while (true) {
      statusEl.textContent = `${drwNo}회차 확인 중...`;
      const d = await fetchDraw(drwNo);
      if (d.returnValue !== "success") break;
      [
        d.drwtNo1,
        d.drwtNo2,
        d.drwtNo3,
        d.drwtNo4,
        d.drwtNo5,
        d.drwtNo6,
      ].forEach((n) => {
        updatedFreq[n] = (updatedFreq[n] || 0) + 1;
      });
      drwNo++;
      fetchedCount++;
    }

    if (fetchedCount > 0) {
      FREQ = updatedFreq;
      lastDrw = drwNo - 1;
      localStorage.setItem(CACHE_KEY, JSON.stringify(FREQ));
      localStorage.setItem(CACHE_DRW_KEY, String(lastDrw));
      renderFreqChart();
      statusEl.className = "freq-status success";
      statusEl.textContent = `${fetchedCount}회차 업데이트 완료 (최신: ${lastDrw}회)`;
    } else {
      statusEl.className = "freq-status success";
      statusEl.textContent = `이미 최신 데이터입니다 (${lastDrw}회차 기준)`;
    }
  } catch (e) {
    statusEl.className = "freq-status error";
    statusEl.textContent = "업데이트 실패: 네트워크를 확인해주세요.";
  } finally {
    btn.disabled = false;
  }
}

// ── 빈도 차트 렌더링 ──

function renderFreqChart() {
  const el = document.getElementById("freqChart");
  el.innerHTML = "";
  const sorted = freqSorted();
  const top15 = sorted.slice(0, 20);
  const maxCount = top15[0].count;

  top15.forEach(({ n, count }) => {
    const row = document.createElement("div");
    row.className = "freq-row";

    const ball = document.createElement("div");
    ball.className = `freq-ball ${ballClass(n)}`;
    ball.innerHTML = `<div class="ball-shine"></div>${n}`;

    const barWrap = document.createElement("div");
    barWrap.className = "freq-bar-wrap";

    const bar = document.createElement("div");
    bar.className = `freq-bar ${ballClass(n)}`;
    bar.style.width = `${(count / maxCount) * 100}%`;

    const countEl = document.createElement("div");
    countEl.className = "freq-count";
    countEl.textContent = `${count}회`;

    barWrap.appendChild(bar);
    row.appendChild(ball);
    row.appendChild(barWrap);
    row.appendChild(countEl);
    el.appendChild(row);
  });

  const note = document.createElement("p");
  note.style.cssText = "font-size:12px;color:#bbb;margin-top:10px;";
  note.textContent = `기준 회차: ${lastDrw}회 (보너스 번호 제외)`;
  el.appendChild(note);
}

// ── 번호 생성 ──

function generate() {
  const setCount = parseInt(document.getElementById("setSelect").value);
  const cardEl = document.getElementById("resultCard");
  cardEl.innerHTML = "";

  const card = document.createElement("div");
  card.className = "card result-card";

  const header = document.createElement("div");
  header.className = "section";
  const modeLabel =
    drawMode === "weighted"
      ? "인기번호 가중치"
      : drawMode === "toppool"
        ? "상위 20개 풀"
        : "";
  header.innerHTML = `<p class="result-card-title">생성 결과${
    modeLabel ? `<span class="mode-badge">${modeLabel}</span>` : ""
  }</p>`;
  card.appendChild(header);

  for (let s = 1; s <= setCount; s++) {
    const numbers = generateSet();
    const setEl = document.createElement("div");
    setEl.className = "result-set";
    setEl.style.animationDelay = `${(s - 1) * 0.07}s`;

    const label = document.createElement("div");
    label.className = "set-label";
    label.textContent = `세트 ${s}`;
    setEl.appendChild(label);

    const balls = document.createElement("div");
    balls.className = "balls";

    numbers.forEach((n) => {
      const ball = document.createElement("div");
      ball.className = `ball ${ballClass(n)}${fixedNumbers.has(n) ? " is-fixed" : ""}`;
      ball.innerHTML = `<div class="ball-shine"></div>${n}`;
      balls.appendChild(ball);
    });

    setEl.appendChild(balls);
    card.appendChild(setEl);
  }

  cardEl.appendChild(card);
}

// 초기 차트 렌더링
renderFreqChart();
