/**
 * 연금복권720+ 과거 데이터 수집 스크립트
 * API: GET /pt720/selectPstPt720Info.do?srchPsltEpsd={round}
 * - 한 번 호출에 최근 6회차 데이터 반환
 * - wnSqNo=1: 1등 (wnBndNo=조, wnRnkVl=6자리번호)
 * - wnSqNo=21: 보너스 (wnRnkVl=6자리번호)
 */

const fs = require("fs");
const path = require("path");

const API_BASE = "https://www.dhlottery.co.kr/pt720/selectPstPt720Info.do";
const OUTPUT = path.join(__dirname, "..", "src", "pension_data.js");

async function fetchBatch(round) {
  const url = `${API_BASE}?srchPsltEpsd=${round}`;
  const resp = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      "Referer": "https://www.dhlottery.co.kr/pt720/result",
    },
    signal: AbortSignal.timeout(15000),
  });
  const json = await resp.json();
  if (!json.data || !json.data.result) return [];
  return json.data.result;
}

function parseResults(results) {
  // Group by psltEpsd (round)
  const roundMap = new Map();

  for (const r of results) {
    const round = r.psltEpsd;
    if (!roundMap.has(round)) {
      roundMap.set(round, { round, date: r.psltRflYmd });
    }
    const entry = roundMap.get(round);

    if (r.wnSqNo === 1) {
      // 1등: 조 + 6자리
      entry.group = parseInt(r.wnBndNo);
      entry.number = r.wnRnkVl.padStart(6, "0");
    } else if (r.wnSqNo === 21) {
      // 보너스
      entry.bonus = r.wnRnkVl.padStart(6, "0");
    }
  }

  const records = [];
  for (const [, entry] of roundMap) {
    if (entry.group != null && entry.number && entry.bonus) {
      const digits = entry.number.split("").map(Number);
      records.push([
        entry.round,
        entry.date,
        entry.group,
        ...digits,
        entry.bonus,
      ]);
    }
  }
  return records;
}

async function main() {
  console.log("=== 연금복권720+ 데이터 수집 시작 ===\n");

  const allRecords = new Map();
  let round = 305; // 최신 회차부터 시작

  // 최신 회차부터 역순으로 내려가며 수집
  while (round > 0) {
    process.stdout.write(`  회차 ${round} 주변 데이터 수집 중...`);
    try {
      const results = await fetchBatch(round);
      if (results.length === 0) {
        console.log(" 데이터 없음, 종료");
        break;
      }

      const parsed = parseResults(results);
      let newCount = 0;
      for (const rec of parsed) {
        if (!allRecords.has(rec[0])) {
          allRecords.set(rec[0], rec);
          newCount++;
        }
      }
      console.log(` ${parsed.length}건 파싱, ${newCount}건 신규 (총 ${allRecords.size}건)`);

      // 수집된 데이터 중 가장 오래된 회차 확인
      const minRound = Math.min(...parsed.map(r => r[0]));
      if (minRound <= 1) break;

      // 다음 배치: 수집된 최소 회차 - 1
      round = minRound - 1;

      // API 부담 방지
      await new Promise(r => setTimeout(r, 300));
    } catch (e) {
      console.log(` 에러: ${e.message}`);
      if (round <= 1) break;
      round -= 6;
      await new Promise(r => setTimeout(r, 1000));
    }
  }

  // 회차순 정렬
  const sorted = [...allRecords.values()].sort((a, b) => a[0] - b[0]);

  console.log(`\n  총 ${sorted.length}회차 수집 완료`);
  console.log(`  범위: ${sorted[0][0]}회 ~ ${sorted[sorted.length - 1][0]}회`);

  // pension_data.js 생성
  const lines = sorted.map(r => `  ${JSON.stringify(r)}`).join(",\n");
  const content = `/**\n * 연금복권720+ 내장 데이터\n * ${sorted.length}회차 (${sorted[0][0]}회 ~ ${sorted[sorted.length - 1][0]}회)\n * 형식: [회차, 날짜, 조, d1, d2, d3, d4, d5, d6, 보너스6자리]\n */\nmodule.exports = [\n${lines}\n];\n`;

  fs.writeFileSync(OUTPUT, content, "utf-8");
  console.log(`\n  ${OUTPUT} 생성 완료 (${(content.length / 1024).toFixed(1)}KB)`);
  console.log("\n=== 수집 완료 ===");
}

main().catch(console.error);
