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

// ─── 추천 결과 생성 ───

const STRATEGIES = [
  { name: "빈도 가중 랜덤",     desc: "많이 나온 번호일수록 높은 확률",   fn: strategyFrequency,
    howItWorks: ["전체 당첨 이력에서 1~45 각 번호의 출현 횟수를 집계합니다.", "출현 빈도가 높은 번호일수록 선택 확률을 높게 부여합니다.", "가중 확률에 따라 6개 번호를 랜덤 추출하고 합계·홀짝 유효성을 검증합니다."] },
  { name: "핫/콜드 균형",       desc: "최근 핫 3개 + 오래된 3개 조합",     fn: strategyHotCold,
    howItWorks: ["최근 50회에서 가장 많이 나온 핫(Hot) 번호 20개를 선별합니다.", "가장 오래 미출현된 콜드(Cold) 번호 20개를 선별합니다.", "핫 번호 3개 + 콜드 번호 3개를 조합하여 균형 잡힌 6개를 구성합니다."] },
  { name: "오래된 번호 우선",   desc: "오래 안 나온 번호 중심 선택",       fn: strategyOverdue,
    howItWorks: ["각 번호가 마지막으로 당첨된 이후 경과 회차를 계산합니다.", "경과 회차가 긴 상위 20개 번호를 후보로 선정합니다.", "후보군에서 6개를 랜덤 추출하여 합계·균형 조건을 충족하는지 검증합니다."] },
  { name: "빈출 쌍 기반",       desc: "자주 같이 나온 쌍을 씨드로 확장",   fn: strategyPairBased,
    howItWorks: ["역대 당첨번호에서 동시에 출현한 번호 쌍의 빈도를 계산합니다.", "상위 30개 빈출 쌍 중 하나를 씨드(시작점)로 선택합니다.", "씨드 2개 번호에 빈도 가중 랜덤으로 4개를 추가하여 6개를 완성합니다."] },
  { name: "통계적 홀짝 균형",   desc: "홀3:짝3 + 저고 균형 유지",         fn: strategyStatistical,
    howItWorks: ["1~45를 홀수 그룹과 짝수 그룹으로 분리합니다.", "각 그룹에서 빈도 가중치를 적용해 홀수 3개, 짝수 3개를 추출합니다.", "저번호(1~22)와 고번호(23~45) 균형을 추가로 검증하여 최종 확정합니다."] },
  { name: "다중 윈도우 앙상블",  desc: "전체+최근 기간별 가중합 분석",      fn: strategyMultiWindow,
    howItWorks: ["전체, 최근 200회, 100회, 50회 4개 기간의 출현 빈도를 산출합니다.", "기간이 짧을수록 높은 가중치를 부여하여 합산 점수를 계산합니다.", "합산 점수 기반 가중 확률로 6개 번호를 추출하고 유효성을 검증합니다."] },
  { name: "마르코프 체인 예측",  desc: "직전 회차 전이 확률 기반 예측",     fn: strategyMarkov,
    howItWorks: ["직전 회차 당첨번호 6개 각각에 대해 전이 확률 행렬을 조회합니다.", "번호 A 다음에 번호 B가 출현할 확률을 합산하여 각 번호의 점수를 산정합니다.", "전이 점수 + 최근 빈도 보정 가중치로 6개 번호를 추출합니다."] },
];

function getRecommendations(stats, count = 1) {
  const results = [];
  for (const { name, desc, fn, howItWorks } of STRATEGIES) {
    for (let i = 0; i < count; i++) {
      const nums  = fn(stats);
      const total = nums.reduce((a, b) => a + b, 0);
      const odd   = nums.filter(n => n % 2 === 1).length;
      const low   = nums.filter(n => n <= 22).length;
      results.push({ name, desc, howItWorks, numbers: nums, sum: total, odd, even: 6 - odd, low, high: 6 - low, setIndex: i });
    }
  }
  return results;
}

// ─── TOP 5 추천 (1게임 × 상위 5전략) ───
// 백테스트 성능순: 오래된번호(+13.9%) > 마르코프(전이확률) > 다중윈도우(앙상블)
//                  > 핫콜드(균형) > 빈출쌍(공출현)
const TOP5_INDICES = [2, 6, 5, 1, 3]; // STRATEGIES 배열 인덱스

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

module.exports = { getRecords, LottoStats, getRecommendations, getTop5, getNeverDrawn, EMBEDDED_DATA };
