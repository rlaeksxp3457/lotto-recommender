/**
 * 로또 당첨번호 분석 및 추천 엔진 v2
 * - 내장 데이터(data.js) + 업데이트 데이터 합산
 * - 미출현 조합 추출 기능
 */

const EMBEDDED_DATA = require("./data");

// ─── 데이터 변환 ───

function parseRecords(rawData) {
  return rawData.map(r => ({
    round:   r[0],
    date:    r[1],
    numbers: [r[2], r[3], r[4], r[5], r[6], r[7]].sort((a, b) => a - b),
    bonus:   r[8],
  }));
}

function getRecords(extraData = []) {
  const all = [...EMBEDDED_DATA, ...extraData];
  // 중복 회차 제거 (업데이트 시 겹칠 수 있음)
  const seen = new Set();
  const unique = all.filter(r => {
    if (seen.has(r[0])) return false;
    seen.add(r[0]);
    return true;
  });
  unique.sort((a, b) => a[0] - b[0]);
  return parseRecords(unique);
}

// ─── 통계 분석 ───

class LottoStats {
  constructor(records) {
    this.records = records;
    this.total   = records.length;

    this.freq = new Array(46).fill(0);
    for (const r of records)
      for (const n of r.numbers) this.freq[n]++;

    this.recent50  = this._recentFreq(50);
    this.recent100 = this._recentFreq(100);
    this.recent200 = this._recentFreq(200);
    this.lastSeen  = this._lastSeen();
    this.pairFreq  = this._pairFreq();
    this._computeSumStats();
    this.transitionMatrix = this._buildTransitionMatrix();

    // 미출현 조합용: 기존 당첨 조합 Set
    this.drawnSet = new Set();
    for (const r of records) {
      this.drawnSet.add(r.numbers.join(","));
    }
  }

  _recentFreq(n) {
    const slice = this.records.slice(-n);
    const freq  = new Array(46).fill(0);
    for (const r of slice)
      for (const num of r.numbers) freq[num]++;
    return freq;
  }

  _lastSeen() {
    const last = new Array(46).fill(0);
    for (const r of this.records)
      for (const n of r.numbers) last[n] = r.round;
    const curRound = this.records[this.records.length - 1].round;
    return last.map(v => (v === 0 ? curRound : curRound - v));
  }

  _pairFreq() {
    const map = new Map();
    for (const r of this.records) {
      const nums = r.numbers;
      for (let i = 0; i < nums.length; i++)
        for (let j = i + 1; j < nums.length; j++) {
          const key = `${nums[i]},${nums[j]}`;
          map.set(key, (map.get(key) || 0) + 1);
        }
    }
    return map;
  }

  _buildTransitionMatrix() {
    // transition[n][m] = n이 나온 회차 다음에 m이 나온 횟수
    const matrix = Array.from({ length: 46 }, () => new Array(46).fill(0));
    for (let i = 0; i < this.records.length - 1; i++) {
      const curr = this.records[i].numbers;
      const next = this.records[i + 1].numbers;
      for (const n of curr)
        for (const m of next) matrix[n][m]++;
    }
    return matrix;
  }

  _computeSumStats() {
    const sums = this.records.map(r => r.numbers.reduce((a, b) => a + b, 0));
    this.sumMean = sums.reduce((a, b) => a + b, 0) / sums.length;
    const variance = sums.reduce((a, b) => a + (b - this.sumMean) ** 2, 0) / sums.length;
    this.sumStd  = Math.sqrt(variance);
    this.sumRange = [
      Math.round(this.sumMean - 1.5 * this.sumStd),
      Math.round(this.sumMean + 1.5 * this.sumStd),
    ];
  }

  sortedByFreq(freq = this.freq) {
    return [...Array(45).keys()]
      .map(i => i + 1)
      .sort((a, b) => freq[b] - freq[a]);
  }

  hotNumbers(n = 15)    { return this.sortedByFreq().slice(0, n); }
  coldNumbers(n = 15)   { return this.sortedByFreq().slice(-n).reverse(); }

  overdueNumbers(n = 15) {
    return [...Array(45).keys()]
      .map(i => i + 1)
      .sort((a, b) => this.lastSeen[b] - this.lastSeen[a])
      .slice(0, n);
  }

  recentHot(window = 50, n = 15) {
    const freq = this._recentFreq(window);
    return this.sortedByFreq(freq).slice(0, n);
  }

  topPairs(n = 30) {
    return [...this.pairFreq.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, n)
      .map(([key, cnt]) => ({ pair: key.split(",").map(Number), count: cnt }));
  }

  getSummary() {
    const sorted = this.sortedByFreq();
    const maxFreq = this.freq[sorted[0]];

    return {
      total: this.total,
      lastRound: this.records[this.records.length - 1].round,
      dateRange: {
        from: this.records[0].date,
        to:   this.records[this.records.length - 1].date,
      },
      frequency: Array.from({ length: 45 }, (_, i) => ({
        number: i + 1,
        count:  this.freq[i + 1],
        pct:    +(this.freq[i + 1] / maxFreq * 100).toFixed(1),
      })),
      sumStats: {
        mean:  +this.sumMean.toFixed(1),
        std:   +this.sumStd.toFixed(1),
        range: this.sumRange,
      },
      recentHot: this.recentHot(50, 10).map(n => ({
        number: n,
        count:  this.recent50[n],
      })),
      overdue: this.overdueNumbers(10).map(n => ({
        number: n,
        gap:    this.lastSeen[n],
      })),
      topPairs: this.topPairs(10),
      totalCombinations: 8145060,
      drawnCount: this.drawnSet.size,
      undrawnCount: 8145060 - this.drawnSet.size,
    };
  }
}

// ─── 유틸리티 ───

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

// ─── 6가지 추천 전략 ───

function strategyFrequency(stats) {
  const weights = POOL.map(n => stats.freq[n] || 1);
  for (let t = 0; t < 2000; t++) {
    const chosen = [...new Set(weightedSample(POOL, weights, 8))].slice(0, 6).sort((a,b)=>a-b);
    if (chosen.length === 6 && isValid(chosen, stats)) return chosen;
  }
  return randomSample(POOL, 6);
}

function strategyHotCold(stats) {
  const hot    = stats.recentHot(50, 20);
  const overdue = stats.overdueNumbers(20);
  for (let t = 0; t < 2000; t++) {
    const h = randomSample(hot,  3);
    const c = randomSample(overdue, 3);
    const chosen = [...new Set([...h, ...c])].sort((a, b) => a - b);
    if (chosen.length === 6 && isValid(chosen, stats)) return chosen;
  }
  return randomSample(POOL, 6);
}

function strategyOverdue(stats) {
  const overdue = stats.overdueNumbers(20);
  for (let t = 0; t < 2000; t++) {
    const chosen = randomSample(overdue, 6);
    if (isValid(chosen, stats)) return chosen;
  }
  return randomSample(POOL, 6);
}

function strategyPairBased(stats) {
  const topPairs = stats.topPairs(30).map(p => p.pair);
  for (let t = 0; t < 2000; t++) {
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
  const odds  = POOL.filter(n => n % 2 === 1);
  const evens = POOL.filter(n => n % 2 === 0);
  const oddW  = odds.map(n => stats.freq[n] || 1);
  const eveW  = evens.map(n => stats.freq[n] || 1);
  for (let t = 0; t < 2000; t++) {
    const chosenOdd  = weightedSample(odds,  oddW,  3);
    const chosenEven = weightedSample(evens, eveW,  3);
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
    stats.freq[n]      * 1.0 +
    stats.recent200[n] * 2.0 +
    stats.recent100[n] * 3.0 +
    stats.recent50[n]  * 4.0
  );
  for (let t = 0; t < 2000; t++) {
    const raw    = weightedSample(POOL, weights, 10);
    const chosen = [...new Set(raw)].slice(0, 6).sort((a, b) => a - b);
    if (chosen.length === 6 && isValid(chosen, stats)) return chosen;
  }
  return randomSample(POOL, 6);
}

/** 전략 7: 마르코프 체인 예측 — 직전 회차 기반 전이 확률 */
function strategyMarkov(stats) {
  const lastDraw = stats.records[stats.records.length - 1].numbers;
  // 직전 당첨번호 6개로부터 전이 확률 합산
  const scores = new Array(46).fill(0);
  for (const n of lastDraw) {
    for (let m = 1; m <= 45; m++) {
      scores[m] += stats.transitionMatrix[n][m];
    }
  }
  // 최근 빈도 보정 가중
  const weights = POOL.map(n =>
    scores[n] * 3.0 +
    stats.recent50[n]  * 2.0 +
    stats.recent100[n] * 1.0 +
    (stats.lastSeen[n] > 10 ? stats.lastSeen[n] * 0.5 : 0)
  );
  for (let t = 0; t < 2000; t++) {
    const raw    = weightedSample(POOL, weights, 10);
    const chosen = [...new Set(raw)].slice(0, 6).sort((a, b) => a - b);
    if (chosen.length === 6 && isValid(chosen, stats)) return chosen;
  }
  return randomSample(POOL, 6);
}

/** 전략 8: 후나츠 사카이 — 출현 주기 비율 기반 */
function strategyFunatsu(stats) {
  const gapData = [];
  for (let num = 1; num <= 45; num++) {
    const appearances = [];
    for (const r of stats.records)
      if (r.numbers.includes(num)) appearances.push(r.round);
    const gaps = [];
    for (let i = 1; i < appearances.length; i++) gaps.push(appearances[i] - appearances[i - 1]);
    const avgGap = gaps.length > 0 ? gaps.reduce((a, b) => a + b, 0) / gaps.length : 0;
    const currentGap = stats.lastSeen[num];
    const ratio = avgGap > 0 ? currentGap / avgGap : 0;
    gapData.push({ num, ratio });
  }
  gapData.sort((a, b) => b.ratio - a.ratio);
  // 비율 상위 20개 후보
  const candidates = gapData.slice(0, 20).map(g => g.num);
  const weights = candidates.map((_, i) => 20 - i);
  for (let t = 0; t < 2000; t++) {
    const chosen = [...new Set(weightedSample(candidates, weights, 8))].slice(0, 6).sort((a, b) => a - b);
    if (chosen.length === 6 && isValid(chosen, stats)) return chosen;
  }
  return randomSample(POOL, 6);
}

/** 전략 9: AC값 + 끝수 균형 — AC 7~10 보장 + 끝수 다양성 */
function strategyACEnding(stats) {
  const weights = POOL.map(n =>
    stats.freq[n] * 1.0 + stats.recent50[n] * 3.0
  );
  for (let t = 0; t < 3000; t++) {
    const raw = weightedSample(POOL, weights, 10);
    const chosen = [...new Set(raw)].slice(0, 6).sort((a, b) => a - b);
    if (chosen.length !== 6 || !isValid(chosen, stats)) continue;
    const ac = computeAC(chosen);
    if (ac < 7) continue; // AC 7 이상만 허용
    const endings = new Set(chosen.map(n => n % 10));
    if (endings.size < 4) continue; // 끝수 4종류 이상
    return chosen;
  }
  return randomSample(POOL, 6);
}

/** 전략 10: 번호대 균형 + 연번 — 5구간 분산 + 연번 0~1쌍 */
function strategyRangeConsec(stats) {
  const ranges = [[1, 10], [11, 20], [21, 30], [31, 40], [41, 45]];
  const rangePool = ranges.map(([lo, hi]) => POOL.filter(n => n >= lo && n <= hi));
  for (let t = 0; t < 3000; t++) {
    // 5구간 중 4~5구간에서 최소 1개씩 추출
    const usedRanges = [...Array(5).keys()];
    // 랜덤으로 4~5구간 선택
    const nRanges = Math.random() < 0.5 ? 5 : 4;
    const selected = randomSample(usedRanges, nRanges);
    const picks = [];
    for (const ri of selected) {
      const pool = rangePool[ri];
      const w = pool.map(n => stats.freq[n] + stats.recent50[n] * 2);
      const pick = weightedSample(pool, w, 1);
      picks.push(...pick);
    }
    // 나머지 번호 채우기
    const remaining = POOL.filter(n => !picks.includes(n));
    const rw = remaining.map(n => stats.freq[n] || 1);
    const extras = weightedSample(remaining, rw, 6);
    const chosen = [...new Set([...picks, ...extras])].slice(0, 6).sort((a, b) => a - b);
    if (chosen.length !== 6 || !isValid(chosen, stats)) continue;
    // 연번 쌍 0~1개만 허용
    let consec = 0;
    for (let i = 1; i < chosen.length; i++) if (chosen[i] - chosen[i - 1] === 1) consec++;
    if (consec > 1) continue;
    return chosen;
  }
  return randomSample(POOL, 6);
}

// ─── 추천 결과 생성 ───

const STRATEGIES = [
  { name: "빈도 가중 랜덤",     desc: "많이 나온 번호일수록 높은 확률",   fn: strategyFrequency,
    howItWorks: [
      { text: "전체 당첨 이력에서 1~45 각 번호의 출현 횟수를 집계합니다.", visual: "bars" },
      { text: "출현 빈도가 높은 번호일수록 선택 확률을 높게 부여합니다.", visual: "weight" },
      { text: "가중 확률에 따라 6개 번호를 랜덤 추출하고 합계·홀짝 유효성을 검증합니다.", visual: "pick" },
    ] },
  { name: "핫/콜드 균형",       desc: "최근 핫 3개 + 오래된 3개 조합",     fn: strategyHotCold,
    howItWorks: [
      { text: "최근 50회에서 가장 많이 나온 핫(Hot) 번호 20개를 선별합니다.", visual: "hotcold" },
      { text: "가장 오래 미출현된 콜드(Cold) 번호 20개를 선별합니다.", visual: "merge" },
      { text: "핫 번호 3개 + 콜드 번호 3개를 조합하여 균형 잡힌 6개를 구성합니다.", visual: "pick" },
    ] },
  { name: "오래된 번호 우선",   desc: "오래 안 나온 번호 중심 선택",       fn: strategyOverdue,
    howItWorks: [
      { text: "각 번호가 마지막으로 당첨된 이후 경과 회차를 계산합니다.", visual: "clock" },
      { text: "경과 회차가 긴 상위 20개 번호를 후보로 선정합니다.", visual: "sort" },
      { text: "후보군에서 6개를 랜덤 추출하여 합계·균형 조건을 충족하는지 검증합니다.", visual: "pick" },
    ] },
  { name: "빈출 쌍 기반",       desc: "자주 같이 나온 쌍을 씨드로 확장",   fn: strategyPairBased,
    howItWorks: [
      { text: "역대 당첨번호에서 동시에 출현한 번호 쌍의 빈도를 계산합니다.", visual: "pair" },
      { text: "상위 30개 빈출 쌍 중 하나를 씨드(시작점)로 선택합니다.", visual: "expand" },
      { text: "씨드 2개 번호에 빈도 가중 랜덤으로 4개를 추가하여 6개를 완성합니다.", visual: "pick" },
    ] },
  { name: "통계적 홀짝 균형",   desc: "홀3:짝3 + 저고 균형 유지",         fn: strategyStatistical,
    howItWorks: [
      { text: "1~45를 홀수 그룹과 짝수 그룹으로 분리합니다.", visual: "split" },
      { text: "각 그룹에서 빈도 가중치를 적용해 홀수 3개, 짝수 3개를 추출합니다.", visual: "balance" },
      { text: "저번호(1~22)와 고번호(23~45) 균형을 추가로 검증하여 최종 확정합니다.", visual: "pick" },
    ] },
  { name: "다중 윈도우 앙상블",  desc: "전체+최근 기간별 가중합 분석",      fn: strategyMultiWindow,
    howItWorks: [
      { text: "전체, 최근 200회, 100회, 50회 4개 기간의 출현 빈도를 산출합니다.", visual: "layers" },
      { text: "기간이 짧을수록 높은 가중치를 부여하여 합산 점수를 계산합니다.", visual: "merge" },
      { text: "합산 점수 기반 가중 확률로 6개 번호를 추출하고 유효성을 검증합니다.", visual: "pick" },
    ] },
  { name: "마르코프 체인 예측",  desc: "직전 회차 전이 확률 기반 예측",     fn: strategyMarkov,
    howItWorks: [
      { text: "직전 회차 당첨번호 6개 각각에 대해 전이 확률 행렬을 조회합니다.", visual: "chain" },
      { text: "번호 A 다음에 번호 B가 출현할 확률을 합산하여 각 번호의 점수를 산정합니다.", visual: "score" },
      { text: "전이 점수 + 최근 빈도 보정 가중치로 6개 번호를 추출합니다.", visual: "pick" },
    ] },
  { name: "후나츠 사카이",      desc: "출현 주기 비율 기반 예측",         fn: strategyFunatsu,
    howItWorks: [
      { text: "각 번호의 역대 출현 간격(평균 주기)을 산출합니다.", visual: "gapRatio" },
      { text: "현재 미출현 간격 ÷ 평균 주기 = 비율을 계산하여 순위를 매깁니다.", visual: "score" },
      { text: "비율이 높은 상위 20개 후보에서 6개를 가중 추출합니다.", visual: "pick" },
    ] },
  { name: "AC값 + 끝수 균형",   desc: "AC 7~10 보장 + 끝수 4종 이상",   fn: strategyACEnding,
    howItWorks: [
      { text: "빈도 + 최근 핫 번호에 가중치를 두어 후보를 추출합니다.", visual: "acValue" },
      { text: "AC값이 7~10 범위인지 검증합니다 (산술 복잡도).", visual: "filter" },
      { text: "끝수(일의 자리) 4종류 이상 다양한 조합만 통과시킵니다.", visual: "pick" },
    ] },
  { name: "번호대 + 연번 최적화", desc: "5구간 분산 + 연번 0~1쌍 제한",    fn: strategyRangeConsec,
    howItWorks: [
      { text: "1~45를 5개 구간으로 나눠 4~5구간에서 최소 1개씩 추출합니다.", visual: "rangeGrid" },
      { text: "빈도 가중치로 나머지 번호를 채워 6개를 완성합니다.", visual: "balance" },
      { text: "연속번호 쌍이 0~1개인 조합만 통과시킵니다.", visual: "pick" },
    ] },
];

function getAlgoNames() {
  return STRATEGIES.map((s, i) => ({ index: i, name: s.name, desc: s.desc }));
}

function getRecommendations(stats, count = 1, selectedAlgos = null) {
  const results = [];
  STRATEGIES.forEach(({ name, desc, fn, howItWorks }, idx) => {
    if (selectedAlgos && !selectedAlgos.includes(idx)) return;
    for (let i = 0; i < count; i++) {
      const nums  = fn(stats);
      const total = nums.reduce((a, b) => a + b, 0);
      const odd   = nums.filter(n => n % 2 === 1).length;
      const low   = nums.filter(n => n <= 22).length;
      results.push({ name, desc, howItWorks, numbers: nums, sum: total, odd, even: 6 - odd, low, high: 6 - low, setIndex: i });
    }
  });
  return results;
}

// ─── TOP 5 추천 (1게임 × 상위 5전략) ───
// 백테스트 성능순 (500회×100회차 기준):
// 핫/콜드(0.837) > 빈출쌍(0.834) > 다중윈도우(0.818) > AC끝수(0.811) > 빈도가중(0.807)
const TOP5_INDICES = [1, 3, 5, 8, 0]; // STRATEGIES 배열 인덱스

function getTop5(stats) {
  const results = [];
  for (const idx of TOP5_INDICES) {
    const { name, desc, fn } = STRATEGIES[idx];
    const nums  = fn(stats);
    const total = nums.reduce((a, b) => a + b, 0);
    const odd   = nums.filter(n => n % 2 === 1).length;
    const low   = nums.filter(n => n <= 22).length;
    results.push({
      game: results.length + 1,
      name, desc, numbers: nums,
      sum: total, odd, even: 6 - odd, low, high: 6 - low,
    });
  }
  return results;
}

// ─── 미출현 조합 추출 ───

function getNeverDrawn(stats, count = 5) {
  const results = [];
  let attempts = 0;
  while (results.length < count && attempts < 100000) {
    attempts++;
    const nums = randomSample(POOL, 6);
    const key = nums.join(",");
    if (stats.drawnSet.has(key)) continue;
    if (!isValid(nums, stats)) continue;
    // 중복 체크
    const dupeKey = nums.join(",");
    if (results.some(r => r.numbers.join(",") === dupeKey)) continue;

    const total = nums.reduce((a, b) => a + b, 0);
    const odd   = nums.filter(n => n % 2 === 1).length;
    const low   = nums.filter(n => n <= 22).length;
    results.push({
      numbers: nums,
      sum: total,
      odd,
      even: 6 - odd,
      low,
      high: 6 - low,
    });
  }
  return results;
}

// ─── 최근 기록 조회 ───

function getRecentRecords(records, n = 50) {
  return records.slice(-n).reverse().map(r => ({
    round: r.round,
    date: r.date,
    numbers: r.numbers,
    bonus: r.bonus,
  }));
}

// ─── 고급 분석 ───

/**
 * AC값(Arithmetic Complexity): 6개 번호 간 차이값 중 고유한 값의 수 - 5
 * C(6,2)=15쌍, AC = 고유차이수 - 5, 범위 0~10
 */
function computeAC(numbers) {
  const diffs = new Set();
  for (let i = 0; i < numbers.length; i++)
    for (let j = i + 1; j < numbers.length; j++)
      diffs.add(Math.abs(numbers[i] - numbers[j]));
  return diffs.size - 5;
}

/**
 * LottoStats에 고급 분석 메서드 추가
 */
LottoStats.prototype.getAdvancedAnalysis = function (recentN = 20) {
  // ── AC값 분석 ──
  const acValues = this.records.map(r => computeAC(r.numbers));
  const acDistribution = new Array(11).fill(0); // AC 0~10
  for (const ac of acValues) acDistribution[ac]++;
  const recentAC = acValues.slice(-recentN);
  const acAvg = +(acValues.reduce((a, b) => a + b, 0) / acValues.length).toFixed(2);

  // ── 끝수 분석 ──
  const endingFreq = new Array(10).fill(0);
  for (const r of this.records)
    for (const n of r.numbers) endingFreq[n % 10]++;
  // 최근 끝수
  const recentEndingFreq = new Array(10).fill(0);
  for (const r of this.records.slice(-recentN))
    for (const n of r.numbers) recentEndingFreq[n % 10]++;

  // ── 연번 분석 ──
  // 각 회차에서 연속번호 쌍(consecutive pair) 개수 분포
  const consecDistribution = new Array(6).fill(0); // 0~5쌍
  for (const r of this.records) {
    let pairs = 0;
    const sorted = [...r.numbers].sort((a, b) => a - b);
    for (let i = 1; i < sorted.length; i++)
      if (sorted[i] - sorted[i - 1] === 1) pairs++;
    consecDistribution[Math.min(pairs, 5)]++;
  }
  // 최근 연번 추세
  const recentConsec = this.records.slice(-recentN).map(r => {
    let pairs = 0;
    const sorted = [...r.numbers].sort((a, b) => a - b);
    for (let i = 1; i < sorted.length; i++)
      if (sorted[i] - sorted[i - 1] === 1) pairs++;
    return { round: r.round, pairs };
  });

  // ── 번호대 분석 ──
  // 구간: 1-10, 11-20, 21-30, 31-40, 41-45
  const ranges = [[1, 10], [11, 20], [21, 30], [31, 40], [41, 45]];
  const rangeLabels = ["1~10", "11~20", "21~30", "31~40", "41~45"];
  const rangeFreq = ranges.map(() => 0);
  for (const r of this.records)
    for (const n of r.numbers)
      for (let ri = 0; ri < ranges.length; ri++)
        if (n >= ranges[ri][0] && n <= ranges[ri][1]) { rangeFreq[ri]++; break; }

  // 각 회차별 번호대 분포
  const rangeDistribution = new Array(ranges.length).fill(null).map(() => new Array(7).fill(0)); // [rangeIdx][count] = 빈도
  for (const r of this.records) {
    const cnt = ranges.map(() => 0);
    for (const n of r.numbers)
      for (let ri = 0; ri < ranges.length; ri++)
        if (n >= ranges[ri][0] && n <= ranges[ri][1]) { cnt[ri]++; break; }
    cnt.forEach((c, ri) => rangeDistribution[ri][c]++);
  }

  // ── 낙수표 (최근 N회 번호 출현 그리드) ──
  const dropChart = this.records.slice(-recentN).map(r => ({
    round: r.round,
    date: r.date,
    numbers: r.numbers,
    bonus: r.bonus,
  }));

  // ── 후나츠 사카이 분석 (번호별 출현 주기 패턴) ──
  // 각 번호의 출현 간격(gap)을 추적, 평균 주기와 현재 미출현 비교
  const gapData = [];
  for (let num = 1; num <= 45; num++) {
    const appearances = [];
    for (const r of this.records)
      if (r.numbers.includes(num)) appearances.push(r.round);
    const gaps = [];
    for (let i = 1; i < appearances.length; i++)
      gaps.push(appearances[i] - appearances[i - 1]);
    const avgGap = gaps.length > 0 ? +(gaps.reduce((a, b) => a + b, 0) / gaps.length).toFixed(1) : 0;
    const maxGap = gaps.length > 0 ? Math.max(...gaps) : 0;
    const minGap = gaps.length > 0 ? Math.min(...gaps) : 0;
    const currentGap = this.lastSeen[num];
    const ratio = avgGap > 0 ? +(currentGap / avgGap).toFixed(2) : 0;
    gapData.push({ num, avgGap, maxGap, minGap, currentGap, ratio, totalAppearances: appearances.length });
  }
  // ratio > 1이면 평균보다 오래 미출현 → 출현 예상
  gapData.sort((a, b) => b.ratio - a.ratio);

  return {
    ac: { distribution: acDistribution, avg: acAvg, recent: recentAC },
    ending: { freq: endingFreq, recentFreq: recentEndingFreq },
    consecutive: { distribution: consecDistribution, recent: recentConsec },
    range: { labels: rangeLabels, freq: rangeFreq, distribution: rangeDistribution },
    dropChart,
    funatsu: gapData,
  };
};

// ─── 백테스트 ───

function theoreticalProb(k) {
  function C(n, r) {
    if (r > n || r < 0) return 0;
    let res = 1;
    for (let i = 0; i < r; i++) res = res * (n - i) / (i + 1);
    return res;
  }
  return C(6, k) * C(39, 6 - k) / C(45, 6);
}

function runBacktest(onProgress, gamesCount = 100) {
  const records = getRecords();
  const total = records.length;
  if (total < 51) return [];
  const theoOver3 = [3, 4, 5, 6].reduce((a, k) => a + theoreticalProb(k), 0);

  // 최신 1회차만 테스트 (직전까지를 훈련 데이터로)
  const testIdx = total - 1;
  const trainingRecords = records.slice(0, testIdx);
  const testStats = new LottoStats(trainingRecords);
  const actual = new Set(records[testIdx].numbers);

  const results = STRATEGIES.map(s => ({
    name: s.name,
    matchCounts: [0, 0, 0, 0, 0, 0, 0],
    totalSets: 0,
  }));

  for (let s = 0; s < STRATEGIES.length; s++) {
    for (let j = 0; j < gamesCount; j++) {
      const picked = STRATEGIES[s].fn(testStats);
      const matches = picked.filter(n => actual.has(n)).length;
      results[s].matchCounts[matches]++;
      results[s].totalSets++;

      if (onProgress && j % 10 === 0) {
        const pct = Math.round(((s * gamesCount + j) / (STRATEGIES.length * gamesCount)) * 100);
        onProgress(pct);
      }
    }
  }
  if (onProgress) onProgress(100);

  return results.map(r => {
    const total = r.totalSets;
    if (total === 0) return { name: r.name, avgMatches: 0, over3Rate: 0, vsTheory: "0", matchCounts: [0,0,0,0,0,0,0], totalSets: 0 };
    let avg = 0;
    for (let k = 0; k <= 6; k++) avg += k * r.matchCounts[k] / total;
    const over3 = (r.matchCounts[3] + r.matchCounts[4] + r.matchCounts[5] + r.matchCounts[6]) / total;
    const vs = theoOver3 > 0 ? ((over3 / theoOver3 - 1) * 100).toFixed(1) : "0";
    return {
      name: r.name,
      avgMatches: parseFloat(avg.toFixed(4)),
      over3Rate: parseFloat((over3 * 100).toFixed(4)),
      vsTheory: (over3 >= theoOver3 ? "+" : "") + vs,
      matchCounts: [...r.matchCounts],
      totalSets: r.totalSets,
    };
  }).sort((a, b) => b.over3Rate - a.over3Rate);
}

module.exports = { getRecords, LottoStats, getRecommendations, getTop5, getNeverDrawn, getRecentRecords, EMBEDDED_DATA, runBacktest, getAlgoNames };
