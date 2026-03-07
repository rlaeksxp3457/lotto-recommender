/**
 * 연금복권720+ 분석 및 추천 엔진
 * - 위치별(조 + 6자리) 독립 빈도 분석
 * - 7가지 추천 전략
 */

const EMBEDDED_DATA = require("./pension_data");

// ─── 데이터 변환 ───

function parseRecords(rawData) {
  return rawData.map(r => ({
    round:  r[0],
    date:   r[1],
    group:  r[2],                              // 조 (1~5)
    digits: [r[3], r[4], r[5], r[6], r[7], r[8]], // 6자리 각 0~9
    bonus:  r[9],                              // 보너스 6자리 문자열
  }));
}

function getRecords(extraData = []) {
  const all = [...EMBEDDED_DATA, ...extraData];
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

class PensionStats {
  constructor(records) {
    this.records = records;
    this.total = records.length;

    // 위치별 빈도: posFreq[pos][digit]
    // pos 0 = 조(1~5), pos 1~6 = 각 자리(0~9)
    this.posFreq = Array.from({ length: 7 }, () => new Array(10).fill(0));
    for (const r of records) {
      this.posFreq[0][r.group]++;
      for (let i = 0; i < 6; i++) {
        this.posFreq[i + 1][r.digits[i]]++;
      }
    }

    this.recent50 = this._recentFreq(50);
    this.recent100 = this._recentFreq(100);
    this.lastSeen = this._lastSeen();
    this.adjacentPairFreq = this._adjacentPairFreq();
    this.transitionMatrix = this._buildTransitionMatrix();
  }

  _recentFreq(n) {
    const slice = this.records.slice(-n);
    const freq = Array.from({ length: 7 }, () => new Array(10).fill(0));
    for (const r of slice) {
      freq[0][r.group]++;
      for (let i = 0; i < 6; i++) {
        freq[i + 1][r.digits[i]]++;
      }
    }
    return freq;
  }

  _lastSeen() {
    // lastSeen[pos][digit] = 몇 회차 전에 마지막 출현
    const last = Array.from({ length: 7 }, () => new Array(10).fill(0));
    for (const r of this.records) {
      last[0][r.group] = r.round;
      for (let i = 0; i < 6; i++) {
        last[i + 1][r.digits[i]] = r.round;
      }
    }
    const curRound = this.records[this.records.length - 1].round;
    return last.map(pos => pos.map(v => (v === 0 ? curRound : curRound - v)));
  }

  _adjacentPairFreq() {
    // 인접 위치(1-2, 2-3, ... 5-6) 숫자쌍 빈도
    const freq = Array.from({ length: 5 }, () => {
      const map = new Map();
      return map;
    });
    for (const r of this.records) {
      for (let i = 0; i < 5; i++) {
        const key = `${r.digits[i]},${r.digits[i + 1]}`;
        const map = freq[i];
        map.set(key, (map.get(key) || 0) + 1);
      }
    }
    return freq;
  }

  _buildTransitionMatrix() {
    // 위치별 전이 행렬: transition[pos][prevDigit][nextDigit]
    const matrix = Array.from({ length: 7 }, () =>
      Array.from({ length: 10 }, () => new Array(10).fill(0))
    );
    for (let i = 0; i < this.records.length - 1; i++) {
      const curr = this.records[i];
      const next = this.records[i + 1];
      matrix[0][curr.group][next.group]++;
      for (let p = 0; p < 6; p++) {
        matrix[p + 1][curr.digits[p]][next.digits[p]]++;
      }
    }
    return matrix;
  }

  // 위치별 핫 숫자 (최근 50회 기준)
  hotDigits(pos, n = 5) {
    const freq = this.recent50[pos];
    const max = pos === 0 ? 5 : 10;
    return [...Array(max).keys()]
      .map(d => (pos === 0 ? d + 1 : d))
      .sort((a, b) => freq[b] - freq[a])
      .slice(0, n);
  }

  // 위치별 콜드 숫자 (가장 오래된)
  coldDigits(pos, n = 5) {
    const ls = this.lastSeen[pos];
    const max = pos === 0 ? 5 : 10;
    return [...Array(max).keys()]
      .map(d => (pos === 0 ? d + 1 : d))
      .sort((a, b) => ls[b] - ls[a])
      .slice(0, n);
  }

  // 인접쌍 빈도 상위 N개 (전체 위치쌍 통합)
  getAdjacentPairTop(n = 10) {
    const POS_LABELS = ["1번째", "2번째", "3번째", "4번째", "5번째", "6번째"];
    const all = [];
    for (let i = 0; i < 5; i++) {
      const map = this.adjacentPairFreq[i];
      for (const [key, count] of map.entries()) {
        const [d1, d2] = key.split(",").map(Number);
        all.push({
          pos1: i, pos2: i + 1,
          label: `${POS_LABELS[i]}-${POS_LABELS[i + 1]}`,
          d1, d2, count,
        });
      }
    }
    all.sort((a, b) => b.count - a.count);
    return all.slice(0, n);
  }

  // 자릿수 합계 분포 (6자리 합: 0~54)
  getDigitSumDist() {
    const dist = new Array(55).fill(0);
    for (const r of this.records) {
      const sum = r.digits.reduce((a, b) => a + b, 0);
      dist[sum]++;
    }
    // 빈 구간 제거하고 의미있는 범위만 반환
    let minSum = dist.findIndex(v => v > 0);
    let maxSum = 54;
    while (maxSum > 0 && dist[maxSum] === 0) maxSum--;
    if (minSum < 0) minSum = 0;

    const result = [];
    for (let s = minSum; s <= maxSum; s++) {
      result.push({ sum: s, count: dist[s] });
    }
    return result;
  }

  getSummary() {
    const lastRec = this.records[this.records.length - 1];
    return {
      total: this.total,
      lastRound: lastRec.round,
      dateRange: {
        from: this.records[0].date,
        to: lastRec.date,
      },
      // 위치별 빈도 (UI 차트용)
      posFrequency: this.posFreq.map((freq, pos) => {
        const max = pos === 0 ? 5 : 10;
        const start = pos === 0 ? 1 : 0;
        const maxFreq = Math.max(...freq.slice(start, start + max));
        return Array.from({ length: max }, (_, i) => {
          const d = start + i;
          return {
            digit: d,
            count: freq[d],
            pct: maxFreq > 0 ? +(freq[d] / maxFreq * 100).toFixed(1) : 0,
          };
        });
      }),
      // 조 분포
      groupDist: Array.from({ length: 5 }, (_, i) => ({
        group: i + 1,
        count: this.posFreq[0][i + 1],
        pct: +((this.posFreq[0][i + 1] / this.total) * 100).toFixed(1),
      })),
      // 위치별 핫/콜드
      hotDigits: Array.from({ length: 7 }, (_, pos) => this.hotDigits(pos, 3)),
      coldDigits: Array.from({ length: 7 }, (_, pos) => this.coldDigits(pos, 3)),
      // 최근 당첨번호
      lastWinning: {
        round: lastRec.round,
        group: lastRec.group,
        digits: lastRec.digits,
        bonus: lastRec.bonus,
      },
      // 인접쌍 빈도 Top 10
      adjacentPairTop: this.getAdjacentPairTop(10),
      // 자릿수 합계 분포
      digitSumDist: this.getDigitSumDist(),
    };
  }
}

// ─── 유틸리티 ───

function weightedPick(candidates, weights) {
  const total = weights.reduce((a, b) => a + b, 0);
  if (total === 0) return candidates[Math.floor(Math.random() * candidates.length)];
  let r = Math.random() * total;
  for (let i = 0; i < candidates.length; i++) {
    r -= weights[i];
    if (r <= 0) return candidates[i];
  }
  return candidates[candidates.length - 1];
}

function randomPick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateGroup(stats, method) {
  const groups = [1, 2, 3, 4, 5];
  if (method === "freq") {
    const weights = groups.map(g => stats.posFreq[0][g] || 1);
    return weightedPick(groups, weights);
  }
  if (method === "recent") {
    const weights = groups.map(g => stats.recent50[0][g] || 1);
    return weightedPick(groups, weights);
  }
  return randomPick(groups);
}

function generateDigit(stats, pos, method) {
  const digits = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  if (method === "freq") {
    const weights = digits.map(d => stats.posFreq[pos][d] || 1);
    return weightedPick(digits, weights);
  }
  if (method === "recent") {
    const weights = digits.map(d => stats.recent50[pos][d] || 1);
    return weightedPick(digits, weights);
  }
  if (method === "hot") {
    return randomPick(stats.hotDigits(pos, 5));
  }
  if (method === "cold") {
    return randomPick(stats.coldDigits(pos, 5));
  }
  return randomPick(digits);
}

// ─── 검증 ───

function isValid(group, digits) {
  // 모든 자리 같은 숫자 배제
  if (digits.every(d => d === digits[0])) return false;
  // 3자리 이상 연속 숫자 배제 (1-2-3, 3-2-1 등)
  for (let i = 0; i < digits.length - 2; i++) {
    const d1 = digits[i], d2 = digits[i + 1], d3 = digits[i + 2];
    if (d2 - d1 === 1 && d3 - d2 === 1) return false; // 오름차순 연속
    if (d1 - d2 === 1 && d2 - d3 === 1) return false; // 내림차순 연속
  }
  return true;
}

// ─── 7가지 추천 전략 ───

/** 전략 1: 위치별 빈도 가중 */
function strategyFrequency(stats) {
  for (let t = 0; t < 500; t++) {
    const group = generateGroup(stats, "freq");
    const digits = Array.from({ length: 6 }, (_, i) => generateDigit(stats, i + 1, "freq"));
    if (isValid(group, digits)) return { group, digits };
  }
  const group = generateGroup(stats, "random");
  return { group, digits: Array.from({ length: 6 }, () => Math.floor(Math.random() * 10)) };
}

/** 전략 2: 핫/콜드 균형 */
function strategyHotCold(stats) {
  for (let t = 0; t < 500; t++) {
    const group = generateGroup(stats, "freq");
    const digits = Array.from({ length: 6 }, (_, i) => {
      // 홀수 위치는 핫, 짝수 위치는 콜드 (또는 랜덤 혼합)
      return Math.random() < 0.5
        ? generateDigit(stats, i + 1, "hot")
        : generateDigit(stats, i + 1, "cold");
    });
    if (isValid(group, digits)) return { group, digits };
  }
  return { group: randomPick([1,2,3,4,5]), digits: Array.from({ length: 6 }, () => Math.floor(Math.random() * 10)) };
}

/** 전략 3: 최근 트렌드 */
function strategyRecent(stats) {
  for (let t = 0; t < 500; t++) {
    const group = generateGroup(stats, "recent");
    const digits = Array.from({ length: 6 }, (_, i) => generateDigit(stats, i + 1, "recent"));
    if (isValid(group, digits)) return { group, digits };
  }
  return { group: randomPick([1,2,3,4,5]), digits: Array.from({ length: 6 }, () => Math.floor(Math.random() * 10)) };
}

/** 전략 4: 연속 회피 (빈도 가중 + 연속 체크 강화) */
function strategyConsecutiveAvoid(stats) {
  for (let t = 0; t < 1000; t++) {
    const group = generateGroup(stats, "freq");
    const digits = Array.from({ length: 6 }, (_, i) => generateDigit(stats, i + 1, "freq"));
    // 강화된 연속 체크: 인접 2자리도 연속이면 배제
    let hasConsec = false;
    for (let i = 0; i < 5; i++) {
      if (Math.abs(digits[i] - digits[i + 1]) <= 1 && digits[i] === digits[i + 1]) {
        hasConsec = true; break;
      }
    }
    if (!hasConsec && isValid(group, digits)) return { group, digits };
  }
  return strategyFrequency(stats);
}

/** 전략 5: 인접쌍 패턴 */
function strategyAdjacentPattern(stats) {
  for (let t = 0; t < 500; t++) {
    const group = generateGroup(stats, "freq");
    const digits = new Array(6);

    // 첫 번째 자리: 빈도 기반
    digits[0] = generateDigit(stats, 1, "freq");

    // 나머지: 인접쌍 빈도 기반으로 다음 자리 선택
    for (let i = 1; i < 6; i++) {
      const pairMap = stats.adjacentPairFreq[i - 1];
      const candidates = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
      const weights = candidates.map(d => {
        const key = `${digits[i - 1]},${d}`;
        return (pairMap.get(key) || 0) + 1; // +1 스무딩
      });
      digits[i] = weightedPick(candidates, weights);
    }

    if (isValid(group, digits)) return { group, digits };
  }
  return strategyFrequency(stats);
}

/** 전략 6: 마르코프 체인 */
function strategyMarkov(stats) {
  const lastRec = stats.records[stats.records.length - 1];

  for (let t = 0; t < 500; t++) {
    // 조: 전이 확률 기반
    const groupWeights = [0, ...Array.from({ length: 5 }, (_, i) => {
      return stats.transitionMatrix[0][lastRec.group][i + 1] + 1;
    })];
    const group = weightedPick([1, 2, 3, 4, 5], groupWeights.slice(1));

    // 각 자리: 전이 확률 기반
    const digits = Array.from({ length: 6 }, (_, i) => {
      const prevDigit = lastRec.digits[i];
      const weights = Array.from({ length: 10 }, (_, d) => {
        return stats.transitionMatrix[i + 1][prevDigit][d] + 1;
      });
      return weightedPick([0, 1, 2, 3, 4, 5, 6, 7, 8, 9], weights);
    });

    if (isValid(group, digits)) return { group, digits };
  }
  return strategyFrequency(stats);
}

/** 전략 7: 균형 분포 (홀짝 + 고저) */
function strategyBalanced(stats) {
  for (let t = 0; t < 500; t++) {
    const group = generateGroup(stats, "freq");
    const digits = Array.from({ length: 6 }, (_, i) => generateDigit(stats, i + 1, "freq"));

    // 홀짝 균형: 2~4개 홀수
    const oddCount = digits.filter(d => d % 2 === 1).length;
    if (oddCount < 2 || oddCount > 4) continue;

    // 고저 균형: 2~4개 저수(0~4)
    const lowCount = digits.filter(d => d <= 4).length;
    if (lowCount < 2 || lowCount > 4) continue;

    if (isValid(group, digits)) return { group, digits };
  }
  return strategyFrequency(stats);
}

/** 전략 8: 후나츠 사카이 — 위치별 출현 주기 비율 기반 */
function strategyFunatsu(stats) {
  // 각 위치에서 ratio가 높은(오래 미출현) 숫자를 후보로 가중 선택
  for (let t = 0; t < 500; t++) {
    const group = generateGroup(stats, "freq");
    const digits = Array.from({ length: 6 }, (_, i) => {
      const pos = i + 1;
      const candidates = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
      const weights = candidates.map(d => {
        const gap = stats.lastSeen[pos][d];
        const freq = stats.posFreq[pos][d] || 1;
        const avgGap = stats.total / freq;
        const ratio = avgGap > 0 ? gap / avgGap : 0;
        return Math.max(ratio, 0.1);
      });
      return weightedPick(candidates, weights);
    });
    if (isValid(group, digits)) return { group, digits };
  }
  return strategyFrequency(stats);
}

/** 전략 9: 합계 균형 + 홀짝 — 합계 범위 + 홀짝 조건 */
function strategySumBalance(stats) {
  // 자릿수 합계가 역대 평균 ± 5 범위 내 + 홀짝 균형
  const sums = stats.records.map(r => r.digits.reduce((a, b) => a + b, 0));
  const avgSum = sums.reduce((a, b) => a + b, 0) / sums.length;
  const lo = Math.floor(avgSum - 5);
  const hi = Math.ceil(avgSum + 5);

  for (let t = 0; t < 1000; t++) {
    const group = generateGroup(stats, "freq");
    const digits = Array.from({ length: 6 }, (_, i) => generateDigit(stats, i + 1, "freq"));
    const sum = digits.reduce((a, b) => a + b, 0);
    if (sum < lo || sum > hi) continue;
    const oddCount = digits.filter(d => d % 2 === 1).length;
    if (oddCount < 2 || oddCount > 4) continue;
    if (isValid(group, digits)) return { group, digits };
  }
  return strategyFrequency(stats);
}

/** 전략 10: 반복 회피 + 인접쌍 — 숫자 반복 최소 + 인접쌍 패턴 */
function strategyNoRepeatAdjacent(stats) {
  for (let t = 0; t < 500; t++) {
    const group = generateGroup(stats, "freq");
    const digits = new Array(6);

    // 첫 자리: 빈도 기반
    digits[0] = generateDigit(stats, 1, "freq");

    // 나머지: 인접쌍 빈도 + 이전 자리와 다른 숫자 우선
    for (let i = 1; i < 6; i++) {
      const pairMap = stats.adjacentPairFreq[i - 1];
      const candidates = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
      const weights = candidates.map(d => {
        const key = `${digits[i - 1]},${d}`;
        let w = (pairMap.get(key) || 0) + 1;
        if (d === digits[i - 1]) w *= 0.3; // 반복 패널티
        return w;
      });
      digits[i] = weightedPick(candidates, weights);
    }

    // 반복 숫자 최대 2개까지만
    const freq = new Array(10).fill(0);
    for (const d of digits) freq[d]++;
    if (Math.max(...freq) > 2) continue;

    if (isValid(group, digits)) return { group, digits };
  }
  return strategyFrequency(stats);
}

// ─── 추천 결과 생성 ───

const STRATEGIES = [
  { name: "위치별 빈도 가중",   desc: "각 위치에서 출현 빈도 기반 가중 랜덤",   fn: strategyFrequency,
    howItWorks: [
      { text: "조(1~5)와 6자리 각 위치별 숫자(0~9) 출현 빈도를 집계합니다.", visual: "slots" },
      { text: "빈도가 높은 숫자일수록 해당 위치에서 선택될 확률을 높게 설정합니다.", visual: "bars" },
      { text: "각 위치에서 가중 확률로 숫자를 선택하고 연속 패턴 유효성을 검증합니다.", visual: "pick" },
    ] },
  { name: "핫/콜드 균형",      desc: "각 위치의 핫·콜드 숫자 혼합 선택",       fn: strategyHotCold,
    howItWorks: [
      { text: "각 위치에서 최근 많이 출현한 핫(Hot) 숫자 5개를 선별합니다.", visual: "hotcold" },
      { text: "각 위치에서 가장 적게 출현한 콜드(Cold) 숫자 5개를 선별합니다.", visual: "mix" },
      { text: "각 자리마다 50% 확률로 핫 또는 콜드 숫자를 선택하여 균형을 맞춥니다.", visual: "pick" },
    ] },
  { name: "최근 트렌드",       desc: "최근 50회 데이터 기반 가중 선택",        fn: strategyRecent,
    howItWorks: [
      { text: "최근 50회 당첨번호만 별도로 분리하여 위치별 빈도를 계산합니다.", visual: "trend" },
      { text: "전체 이력 대신 최근 트렌드에 집중하여 가중치를 부여합니다.", visual: "weight" },
      { text: "최근 데이터 기반 가중 확률로 각 위치의 숫자를 선택합니다.", visual: "pick" },
    ] },
  { name: "연속 회피",         desc: "인접 자릿수 연속 패턴 배제",            fn: strategyConsecutiveAvoid,
    howItWorks: [
      { text: "빈도 가중 방식으로 각 위치의 숫자를 우선 생성합니다.", visual: "bars" },
      { text: "인접한 두 자리에 같은 숫자가 반복되는 패턴을 감지합니다.", visual: "filter" },
      { text: "연속 패턴이 발견되면 폐기하고 조건을 만족할 때까지 재생성합니다.", visual: "pick" },
    ] },
  { name: "인접쌍 패턴",       desc: "인접 위치 동시출현 빈도 기반 확장",      fn: strategyAdjacentPattern,
    howItWorks: [
      { text: "인접한 두 위치의 숫자 쌍(예: 1번째-2번째) 동시출현 빈도를 분석합니다.", visual: "pair" },
      { text: "첫 번째 자리는 빈도 가중으로 선택하고, 이후 자리는 직전 자리와의 쌍 빈도를 가중치로 사용합니다.", visual: "chain" },
      { text: "체인처럼 1→2→3→...→6번째 자리를 순차적으로 연결하며 생성합니다.", visual: "pick" },
    ] },
  { name: "마르코프 체인",     desc: "직전 회차 전이 확률 기반 예측",          fn: strategyMarkov,
    howItWorks: [
      { text: "직전 회차의 조 및 6자리 숫자를 기준 상태로 설정합니다.", visual: "chain" },
      { text: "각 위치에서 이전 숫자→다음 숫자 전이 확률 행렬을 조회합니다.", visual: "score" },
      { text: "전이 확률 기반 가중치로 다음 회차의 각 자릿수를 예측 선택합니다.", visual: "pick" },
    ] },
  { name: "균형 분포",         desc: "홀짝 균형 + 고저(0-4/5-9) 분포 유지",   fn: strategyBalanced,
    howItWorks: [
      { text: "빈도 가중 방식으로 각 위치의 숫자를 생성합니다.", visual: "bars" },
      { text: "6자리 중 홀수 개수가 2~4개인지 검증합니다.", visual: "balance" },
      { text: "저수(0~4) 개수가 2~4개인지 추가 검증하여 균형 잡힌 번호를 확정합니다.", visual: "pick" },
    ] },
  { name: "후나츠 사카이",     desc: "출현 주기 비율 기반 미출현 숫자 우선",   fn: strategyFunatsu,
    howItWorks: [
      { text: "각 위치별 숫자의 평균 출현 간격과 현재 미출현 간격을 계산합니다.", visual: "gapRatio" },
      { text: "미출현 비율이 높은 숫자에 더 높은 가중치를 부여합니다.", visual: "score" },
      { text: "가중 확률로 각 위치의 숫자를 선택하고 유효성을 검증합니다.", visual: "pick" },
    ] },
  { name: "합계 균형 + 홀짝",  desc: "자릿수 합계 범위 + 홀짝 균형 조건",     fn: strategySumBalance,
    howItWorks: [
      { text: "역대 자릿수 합계 평균을 기준으로 ±5 범위를 설정합니다.", visual: "sumRange" },
      { text: "빈도 가중으로 생성한 번호의 합계가 범위 내인지 검증합니다.", visual: "filter" },
      { text: "홀수 개수 2~4개 조건을 추가 검증하여 균형 잡힌 번호를 확정합니다.", visual: "pick" },
    ] },
  { name: "반복 회피 + 인접쌍", desc: "숫자 반복 최소화 + 인접쌍 패턴 활용",    fn: strategyNoRepeatAdjacent,
    howItWorks: [
      { text: "첫 번째 자리는 빈도 가중으로 선택합니다.", visual: "noRepeat" },
      { text: "이후 자리는 인접쌍 빈도를 활용하되, 같은 숫자 반복에 패널티를 줍니다.", visual: "chain" },
      { text: "최대 반복 2개 이하 조건과 유효성을 검증하여 확정합니다.", visual: "pick" },
    ] },
];

function getPensionRecommendations(stats, count = 1) {
  const results = [];
  for (const { name, desc, fn, howItWorks } of STRATEGIES) {
    for (let i = 0; i < count; i++) {
      const { group, digits } = fn(stats);
      const oddCount = digits.filter(d => d % 2 === 1).length;
      const lowCount = digits.filter(d => d <= 4).length;
      const digitSum = digits.reduce((a, b) => a + b, 0);
      results.push({
        name, desc, howItWorks, group, digits,
        sum: digitSum,
        odd: oddCount, even: 6 - oddCount,
        low: lowCount, high: 6 - lowCount,
        setIndex: i,
      });
    }
  }
  return results;
}

// ─── TOP 5 추천 ───
// 성능순(500trial): 빈도가중 > 연속회피 > 균형분포 > 마르코프 > 후나츠
const TOP5_INDICES = [0, 3, 6, 5, 7];

function getPensionTop5(stats) {
  const results = [];
  for (const idx of TOP5_INDICES) {
    const { name, desc, fn } = STRATEGIES[idx];
    const { group, digits } = fn(stats);
    const oddCount = digits.filter(d => d % 2 === 1).length;
    const lowCount = digits.filter(d => d <= 4).length;
    const digitSum = digits.reduce((a, b) => a + b, 0);
    results.push({
      game: results.length + 1,
      name, desc, group, digits,
      sum: digitSum,
      odd: oddCount, even: 6 - oddCount,
      low: lowCount, high: 6 - lowCount,
    });
  }
  return results;
}

// ─── 최근 기록 조회 ───

function getRecentRecords(records, n = 50) {
  return records.slice(-n).reverse().map(r => ({
    round: r.round,
    date: r.date,
    group: r.group,
    digits: r.digits,
    bonus: r.bonus,
  }));
}

// ─── 고급 분석 ───

PensionStats.prototype.getAdvancedAnalysis = function (recentN = 20) {
  // ── 위치별 끝수 패턴 (자릿수 반복 빈도) ──
  const digitRepeatDist = new Array(7).fill(0); // 0~6개 동일 숫자
  for (const r of this.records) {
    const freq = new Array(10).fill(0);
    for (const d of r.digits) freq[d]++;
    const maxRepeat = Math.max(...freq);
    digitRepeatDist[Math.min(maxRepeat, 6)]++;
  }

  // ── 자릿수 합계 분포 ──
  const digitSumDist = this.getDigitSumDist();
  const sums = this.records.map(r => r.digits.reduce((a, b) => a + b, 0));
  const sumAvg = +(sums.reduce((a, b) => a + b, 0) / sums.length).toFixed(1);

  // ── 조별 분포 ──
  const groupDist = Array.from({ length: 5 }, (_, i) => ({
    group: i + 1,
    count: this.posFreq[0][i + 1],
    pct: +((this.posFreq[0][i + 1] / this.total) * 100).toFixed(1),
  }));

  // ── 위치별 홀짝 비율 ──
  const posOddEven = Array.from({ length: 6 }, (_, pos) => {
    let odd = 0, even = 0;
    for (const r of this.records) {
      if (r.digits[pos] % 2 === 1) odd++; else even++;
    }
    return { pos: pos + 1, odd, even, oddPct: +((odd / this.total) * 100).toFixed(1) };
  });

  // ── 낙수표 (최근 N회) ──
  const dropChart = this.records.slice(-recentN).map(r => ({
    round: r.round, date: r.date, group: r.group, digits: r.digits, bonus: r.bonus,
  }));

  // ── 후나츠 사카이 (위치별 숫자 출현 주기) ──
  const funatsu = [];
  for (let pos = 1; pos <= 6; pos++) {
    for (let digit = 0; digit <= 9; digit++) {
      const appearances = [];
      for (const r of this.records)
        if (r.digits[pos - 1] === digit) appearances.push(r.round);
      const gaps = [];
      for (let i = 1; i < appearances.length; i++) gaps.push(appearances[i] - appearances[i - 1]);
      const avgGap = gaps.length > 0 ? +(gaps.reduce((a, b) => a + b, 0) / gaps.length).toFixed(1) : 0;
      const currentGap = this.lastSeen[pos][digit];
      const ratio = avgGap > 0 ? +(currentGap / avgGap).toFixed(2) : 0;
      funatsu.push({ pos, digit, avgGap, currentGap, ratio, total: appearances.length });
    }
  }
  funatsu.sort((a, b) => b.ratio - a.ratio);

  // ── 인접자리 연속 패턴 분포 ──
  const adjacentSameDist = new Array(6).fill(0); // 인접 동일숫자 0~5쌍
  for (const r of this.records) {
    let same = 0;
    for (let i = 0; i < 5; i++) if (r.digits[i] === r.digits[i + 1]) same++;
    adjacentSameDist[Math.min(same, 5)]++;
  }

  return {
    digitRepeat: digitRepeatDist,
    digitSum: { dist: digitSumDist, avg: sumAvg },
    groupDist,
    posOddEven,
    dropChart,
    funatsu,
    adjacentSame: adjacentSameDist,
  };
};

// ─── 백테스트 ───

const TEST_WINDOW = 100;
const SETS_PER_DRAW = 20;

function runPensionBacktest(onProgress) {
  const records = getRecords();
  const total = records.length;
  const testStart = Math.max(0, total - TEST_WINDOW);
  const testCount = total - testStart;

  // 이론적 확률: 각 위치 독립 1/10 → 6자리 위치별 일치 기대값 = 6 * 0.1 = 0.6
  const theoAvgMatch = 0.6;
  // 1자리 이상 일치 이론 확률: 1 - (0.9)^6 ≈ 0.4686
  const theoOver1 = 1 - Math.pow(0.9, 6);

  const results = STRATEGIES.map(s => ({
    name: s.name,
    posMatchCounts: 0,   // 총 위치 일치 수
    over1Count: 0,       // 1자리 이상 일치 세트 수
    totalSets: 0,
  }));

  for (let i = testStart; i < total; i++) {
    const trainingRecords = records.slice(0, i);
    if (trainingRecords.length < 30) continue;
    const testStats = new PensionStats(trainingRecords);
    const actual = records[i];

    for (let s = 0; s < STRATEGIES.length; s++) {
      for (let j = 0; j < SETS_PER_DRAW; j++) {
        const { group, digits } = STRATEGIES[s].fn(testStats);
        // 위치별 일치 수 (조 제외, 6자리만)
        let posMatches = 0;
        for (let p = 0; p < 6; p++) {
          if (digits[p] === actual.digits[p]) posMatches++;
        }
        results[s].posMatchCounts += posMatches;
        if (posMatches >= 1) results[s].over1Count++;
        results[s].totalSets++;
      }
    }

    if (onProgress) {
      const pct = Math.round(((i - testStart + 1) / testCount) * 100);
      onProgress(pct);
    }
  }

  return results.map(r => {
    const total = r.totalSets;
    if (total === 0) return { name: r.name, avgMatches: 0, over1Rate: 0, vsTheory: "0" };
    const avg = r.posMatchCounts / total;
    const over1Rate = r.over1Count / total;
    const vs = theoOver1 > 0 ? ((over1Rate / theoOver1 - 1) * 100).toFixed(1) : "0";
    return {
      name: r.name,
      avgMatches: parseFloat(avg.toFixed(4)),
      over1Rate: parseFloat((over1Rate * 100).toFixed(4)),
      vsTheory: (over1Rate >= theoOver1 ? "+" : "") + vs,
    };
  }).sort((a, b) => b.over1Rate - a.over1Rate);
}

module.exports = {
  getRecords,
  PensionStats,
  getPensionRecommendations,
  getPensionTop5,
  getRecentRecords,
  EMBEDDED_DATA,
  runPensionBacktest,
};
