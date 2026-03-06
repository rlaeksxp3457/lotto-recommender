/**
 * 로또 추천 알고리즘 백테스트
 * 과거 데이터로 각 전략의 실제 성능을 측정
 *
 * 방식: 최근 200회차를 테스트 구간으로 설정
 *       각 회차마다 이전 데이터만으로 stats를 구축하고
 *       각 전략으로 100세트씩 생성하여 실제 당첨번호와 비교
 */

const { getRecords, LottoStats, getNeverDrawn } = require("./src/analyzer");

// ─── 전략 함수 (analyzer.js에서 직접 가져올 수 없으므로 복제) ───

const POOL = [...Array(45).keys()].map(i => i + 1);

function weightedSample(pool, weights, k) {
  const result = new Set();
  const totalW = weights.reduce((a, b) => a + b, 0);
  let tries = 0;
  while (result.size < k && tries < 10000) {
    tries++;
    let r = Math.random() * totalW;
    for (let i = 0; i < pool.length; i++) {
      r -= weights[i];
      if (r <= 0) { result.add(pool[i]); break; }
    }
  }
  return [...result];
}

function randomSample(arr, k) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, k).sort((a, b) => a - b);
}

function isValid(nums, stats, strict = true) {
  const total = nums.reduce((a, b) => a + b, 0);
  const [lo, hi] = stats.sumRange;
  if (total < lo || total > hi) return false;
  const odd = nums.filter(n => n % 2 === 1).length;
  if (strict && (odd === 0 || odd === 6)) return false;
  const low = nums.filter(n => n <= 22).length;
  if (strict && (low === 0 || low === 6)) return false;
  const sorted = [...nums].sort((a, b) => a - b);
  let maxConsec = 1, cur = 1;
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] - sorted[i - 1] === 1) { cur++; maxConsec = Math.max(maxConsec, cur); }
    else cur = 1;
  }
  if (strict && maxConsec >= 5) return false;
  return true;
}

function strategyFrequency(stats) {
  const weights = POOL.map(n => stats.freq[n] || 1);
  for (let t = 0; t < 500; t++) {
    const chosen = [...new Set(weightedSample(POOL, weights, 8))].slice(0, 6).sort((a,b)=>a-b);
    if (chosen.length === 6 && isValid(chosen, stats)) return chosen;
  }
  return randomSample(POOL, 6);
}

function strategyHotCold(stats) {
  const hot = stats.recentHot(50, 20);
  const overdue = stats.overdueNumbers(20);
  for (let t = 0; t < 500; t++) {
    const h = randomSample(hot, 3);
    const c = randomSample(overdue, 3);
    const chosen = [...new Set([...h, ...c])].sort((a, b) => a - b);
    if (chosen.length === 6 && isValid(chosen, stats)) return chosen;
  }
  return randomSample(POOL, 6);
}

function strategyOverdue(stats) {
  const overdue = stats.overdueNumbers(20);
  for (let t = 0; t < 500; t++) {
    const chosen = randomSample(overdue, 6);
    if (isValid(chosen, stats)) return chosen;
  }
  return randomSample(POOL, 6);
}

function strategyPairBased(stats) {
  const topPairs = stats.topPairs(30).map(p => p.pair);
  for (let t = 0; t < 500; t++) {
    const seed = topPairs[Math.floor(Math.random() * topPairs.length)];
    const remaining = POOL.filter(n => !seed.includes(n));
    const remWeights = remaining.map(n => stats.freq[n] || 1);
    const extras = weightedSample(remaining, remWeights, 6);
    const chosen = [...new Set([...seed, ...extras])].slice(0, 6).sort((a, b) => a - b);
    if (chosen.length === 6 && isValid(chosen, stats)) return chosen;
  }
  return randomSample(POOL, 6);
}

function strategyStatistical(stats) {
  const odds = POOL.filter(n => n % 2 === 1);
  const evens = POOL.filter(n => n % 2 === 0);
  const oddW = odds.map(n => stats.freq[n] || 1);
  const eveW = evens.map(n => stats.freq[n] || 1);
  for (let t = 0; t < 500; t++) {
    const chosenOdd = weightedSample(odds, oddW, 3);
    const chosenEven = weightedSample(evens, eveW, 3);
    const chosen = [...new Set([...chosenOdd, ...chosenEven])].sort((a, b) => a - b);
    if (chosen.length === 6) {
      const low = chosen.filter(n => n <= 22).length;
      if (low >= 1 && low <= 5 && isValid(chosen, stats, false)) return chosen;
    }
  }
  return randomSample(POOL, 6);
}

function strategyMultiWindow(stats) {
  const weights = POOL.map(n =>
    stats.freq[n] * 1 + stats.recent200[n] * 2 + stats.recent100[n] * 3 + stats.recent50[n] * 4
  );
  for (let t = 0; t < 500; t++) {
    const raw = weightedSample(POOL, weights, 10);
    const chosen = [...new Set(raw)].slice(0, 6).sort((a, b) => a - b);
    if (chosen.length === 6 && isValid(chosen, stats)) return chosen;
  }
  return randomSample(POOL, 6);
}

function strategyPureRandom(_stats) {
  return randomSample(POOL, 6);
}

// ─── 매치 계산 ───

function countMatches(picked, actual) {
  const set = new Set(actual);
  return picked.filter(n => set.has(n)).length;
}

// ─── 백테스트 실행 ───

const STRATEGIES = [
  { name: "전략1 빈도 가중 랜덤",     fn: strategyFrequency    },
  { name: "전략2 핫/콜드 균형",       fn: strategyHotCold      },
  { name: "전략3 오래된 번호 우선",   fn: strategyOverdue      },
  { name: "전략4 빈출 쌍 기반",       fn: strategyPairBased    },
  { name: "전략5 통계적 홀짝 균형",   fn: strategyStatistical  },
  { name: "전략6 다중 윈도우 앙상블",  fn: strategyMultiWindow  },
  { name: "대조군  완전 랜덤",         fn: strategyPureRandom   },
];

const TEST_WINDOW  = 200;   // 최근 200회를 테스트
const SETS_PER_DRAW = 100;  // 회차당 100세트 생성

console.log("=".repeat(70));
console.log("  로또 추천 알고리즘 백테스트");
console.log("=".repeat(70));
console.log(`  테스트 구간: 최근 ${TEST_WINDOW}회차`);
console.log(`  회차당 생성: ${SETS_PER_DRAW}세트`);
console.log(`  총 시뮬레이션: ${TEST_WINDOW * SETS_PER_DRAW}세트/전략\n`);

const records = getRecords();
const totalRecords = records.length;
const testStart = totalRecords - TEST_WINDOW;

// 각 전략별 결과 저장
const results = STRATEGIES.map(() => ({
  matchCounts: [0, 0, 0, 0, 0, 0, 0],  // 0~6개 일치 횟수
  totalSets: 0,
}));

const startTime = Date.now();

for (let i = testStart; i < totalRecords; i++) {
  // 이 회차 이전 데이터만으로 stats 구축
  const trainingRecords = records.slice(0, i);
  const stats = new LottoStats(trainingRecords);
  const actual = records[i].numbers;

  if (i % 50 === 0) {
    const pct = ((i - testStart) / TEST_WINDOW * 100).toFixed(0);
    process.stdout.write(`  진행: ${pct}%  (${records[i].round}회차)\r`);
  }

  for (let s = 0; s < STRATEGIES.length; s++) {
    for (let j = 0; j < SETS_PER_DRAW; j++) {
      const picked = STRATEGIES[s].fn(stats);
      const matches = countMatches(picked, actual);
      results[s].matchCounts[matches]++;
      results[s].totalSets++;
    }
  }
}

const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
console.log(`  진행: 100% 완료 (${elapsed}초 소요)       \n`);

// ─── 당첨 등수 기준 ───
// 1등: 6개 일치
// 2등: 5개 + 보너스 (보너스 검증은 생략 → 5개 일치에 포함)
// 3등: 5개 일치
// 4등: 4개 일치
// 5등: 3개 일치

// ─── 이론적 확률 (완전 랜덤 기준) ───
// C(6,k) * C(39, 6-k) / C(45, 6)
function theoreticalProb(k) {
  function C(n, r) {
    if (r > n || r < 0) return 0;
    let res = 1;
    for (let i = 0; i < r; i++) res = res * (n - i) / (i + 1);
    return res;
  }
  return C(6, k) * C(39, 6 - k) / C(45, 6);
}

// ─── 결과 출력 ───

console.log("─".repeat(70));
console.log("  [일치 번호 개수별 확률 비교]");
console.log("─".repeat(70));

const header = "  전략".padEnd(30) +
  "0개".padStart(8) + "1개".padStart(8) + "2개".padStart(8) +
  "3개(5등)".padStart(10) + "4개(4등)".padStart(10) +
  "5개(3등)".padStart(10) + "6개(1등)".padStart(10);
console.log(header);
console.log("  " + "─".repeat(68));

// 이론값
const theoRow = "  이론적 확률".padEnd(30) +
  [0,1,2,3,4,5,6].map(k => (theoreticalProb(k) * 100).toFixed(2).padStart(k >= 3 ? 9 : 7) + "%").join("");
console.log(theoRow);
console.log("  " + "─".repeat(68));

for (let s = 0; s < STRATEGIES.length; s++) {
  const r = results[s];
  const total = r.totalSets;
  let row = `  ${STRATEGIES[s].name}`.padEnd(30);
  for (let k = 0; k <= 6; k++) {
    const pct = (r.matchCounts[k] / total * 100).toFixed(2);
    row += pct.padStart(k >= 3 ? 9 : 7) + "%";
  }
  console.log(row);
}

// ─── 3개 이상 일치 비율 요약 ───

console.log("\n" + "─".repeat(70));
console.log("  [3개 이상 일치 확률 요약 — 5등 이상 당첨]");
console.log("─".repeat(70));

const theoOver3 = [3,4,5,6].reduce((a, k) => a + theoreticalProb(k), 0);
console.log(`  이론적 확률:  ${(theoOver3 * 100).toFixed(4)}%  (1/${Math.round(1/theoOver3)})`);
console.log("  " + "─".repeat(68));

const summaryRows = [];
for (let s = 0; s < STRATEGIES.length; s++) {
  const r = results[s];
  const total = r.totalSets;
  const over3 = r.matchCounts[3] + r.matchCounts[4] + r.matchCounts[5] + r.matchCounts[6];
  const pct = over3 / total;
  const ratio = pct > 0 ? Math.round(1 / pct) : Infinity;
  const vsTheo = ((pct / theoOver3 - 1) * 100).toFixed(1);
  const sign = pct >= theoOver3 ? "+" : "";
  summaryRows.push({ name: STRATEGIES[s].name, pct, ratio, vsTheo: sign + vsTheo, over3 });
}

summaryRows.sort((a, b) => b.pct - a.pct);
for (const r of summaryRows) {
  console.log(`  ${r.name.padEnd(28)} ${(r.pct * 100).toFixed(4)}%  (1/${r.ratio})  이론 대비: ${r.vsTheo}%`);
}

// ─── 평균 일치 개수 ───

console.log("\n" + "─".repeat(70));
console.log("  [평균 일치 번호 개수]");
console.log("─".repeat(70));

const theoAvg = [0,1,2,3,4,5,6].reduce((a, k) => a + k * theoreticalProb(k), 0);
console.log(`  이론적 평균:  ${theoAvg.toFixed(4)}개`);
console.log("  " + "─".repeat(68));

const avgRows = [];
for (let s = 0; s < STRATEGIES.length; s++) {
  const r = results[s];
  const total = r.totalSets;
  let avg = 0;
  for (let k = 0; k <= 6; k++) avg += k * r.matchCounts[k] / total;
  const vs = ((avg / theoAvg - 1) * 100).toFixed(2);
  const sign = avg >= theoAvg ? "+" : "";
  avgRows.push({ name: STRATEGIES[s].name, avg, vs: sign + vs });
}

avgRows.sort((a, b) => b.avg - a.avg);
for (const r of avgRows) {
  console.log(`  ${r.name.padEnd(28)} ${r.avg.toFixed(4)}개    이론 대비: ${r.vs}%`);
}

console.log("\n" + "=".repeat(70));
console.log("  결론");
console.log("=".repeat(70));
console.log("  로또는 매 추첨이 독립 사건이므로 과거 통계가 미래를 예측할 수 없습니다.");
console.log("  그러나 통계적 필터링(합계 범위, 홀짝 균형 등)은 '극단적으로 비현실적인'");
console.log("  조합을 걸러내어 체감 효율을 약간 높일 수 있습니다.");
console.log("=".repeat(70));
