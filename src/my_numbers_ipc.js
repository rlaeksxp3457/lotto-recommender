const fs = require("fs");
const path = require("path");
const { app } = require("electron");

const DATA_PATH = path.join(app.getPath("userData"), "my_numbers.json");

function loadMyNumbers() {
  try {
    if (fs.existsSync(DATA_PATH)) {
      return JSON.parse(fs.readFileSync(DATA_PATH, "utf-8"));
    }
  } catch { /* ignore */ }
  return [];
}

function saveMyNumbers(data) {
  fs.mkdirSync(path.dirname(DATA_PATH), { recursive: true });
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), "utf-8");
}

// ─── 로또 당첨 확인 ───

function checkLottoResult(myNumbers, winNumbers, bonusNumber) {
  const matchCount = myNumbers.filter(n => winNumbers.includes(n)).length;
  const hasBonus = myNumbers.includes(bonusNumber);

  if (matchCount === 6) return { rank: 1, label: "1등", matchCount };
  if (matchCount === 5 && hasBonus) return { rank: 2, label: "2등", matchCount, bonus: true };
  if (matchCount === 5) return { rank: 3, label: "3등", matchCount };
  if (matchCount === 4) return { rank: 4, label: "4등", matchCount };
  if (matchCount === 3) return { rank: 5, label: "5등", matchCount };
  return { rank: 0, label: "미당첨", matchCount };
}

// ─── 연금복권 당첨 확인 ───

function checkPensionResult(myGroup, myDigits, winGroup, winDigits) {
  // 1등: 조 + 6자리 모두 일치
  if (myGroup === winGroup) {
    const allMatch = myDigits.every((d, i) => d === winDigits[i]);
    if (allMatch) return { rank: 1, label: "1등", matchDigits: 6, groupMatch: true };
  }

  // 2등~7등: 앞자리부터 일치 개수 (조 무관)
  let matchFromFront = 0;
  for (let i = 0; i < 6; i++) {
    if (myDigits[i] === winDigits[i]) matchFromFront++;
    else break;
  }

  // 2등: 6자리 일치 (조 불일치)
  if (matchFromFront === 6) return { rank: 2, label: "2등", matchDigits: 6, groupMatch: false };
  if (matchFromFront >= 5) return { rank: 3, label: "3등", matchDigits: 5 };
  if (matchFromFront >= 4) return { rank: 4, label: "4등", matchDigits: 4 };
  if (matchFromFront >= 3) return { rank: 5, label: "5등", matchDigits: 3 };
  if (matchFromFront >= 2) return { rank: 6, label: "6등", matchDigits: 2 };
  if (matchFromFront >= 1) return { rank: 7, label: "7등", matchDigits: 1 };

  return { rank: 0, label: "미당첨", matchDigits: 0 };
}

function setupMyNumbersIpc(ipcMain) {
  // 내 번호 목록 조회
  ipcMain.handle("my-numbers-load", async () => {
    try {
      return { numbers: loadMyNumbers() };
    } catch (e) {
      return { error: `내 번호 로드 실패: ${e.message}` };
    }
  });

  // 내 번호 저장
  ipcMain.handle("my-numbers-save", async (_event, ticket) => {
    try {
      const data = loadMyNumbers();
      const entry = {
        id: String(Date.now()) + String(Math.floor(Math.random() * 1000)).padStart(3, "0"),
        type: ticket.type,
        round: ticket.round,
        createdAt: new Date().toISOString().split("T")[0],
        result: null,
      };

      if (ticket.type === "lotto") {
        entry.numbers = ticket.numbers;
      } else {
        entry.group = ticket.group;
        entry.digits = ticket.digits;
      }

      data.push(entry);
      saveMyNumbers(data);
      return { success: true, entry };
    } catch (e) {
      return { error: `저장 실패: ${e.message}` };
    }
  });

  // 내 번호 삭제
  ipcMain.handle("my-numbers-delete", async (_event, id) => {
    try {
      let data = loadMyNumbers();
      data = data.filter(d => d.id !== id);
      saveMyNumbers(data);
      return { success: true };
    } catch (e) {
      return { error: `삭제 실패: ${e.message}` };
    }
  });

  // 로또 당첨 확인
  ipcMain.handle("my-numbers-check-lotto", async (_event, id) => {
    try {
      const data = loadMyNumbers();
      const entry = data.find(d => d.id === id);
      if (!entry) return { error: "해당 번호를 찾을 수 없습니다." };
      if (entry.type !== "lotto") return { error: "로또 번호가 아닙니다." };

      // API 호출로 해당 회차 당첨번호 조회
      const url = `https://www.dhlottery.co.kr/common.do?method=getLottoNumber&drwNo=${entry.round}`;
      const resp = await fetch(url, { signal: AbortSignal.timeout(10000) });
      const json = await resp.json();

      if (json.returnValue !== "success") {
        return { error: `${entry.round}회차 추첨 결과가 아직 없습니다.` };
      }

      const winNumbers = [
        json.drwtNo1, json.drwtNo2, json.drwtNo3,
        json.drwtNo4, json.drwtNo5, json.drwtNo6,
      ].sort((a, b) => a - b);
      const bonusNo = json.bnusNo;

      const result = checkLottoResult(entry.numbers, winNumbers, bonusNo);
      result.winNumbers = winNumbers;
      result.bonusNo = bonusNo;
      result.drawDate = json.drwNoDate;

      // 결과 저장
      entry.result = result;
      saveMyNumbers(data);

      return { success: true, result };
    } catch (e) {
      if (e.name === "TimeoutError") return { error: "서버 응답 시간 초과" };
      return { error: `당첨 확인 실패: ${e.message}` };
    }
  });

  // 연금복권 당첨 확인
  ipcMain.handle("my-numbers-check-pension", async (_event, id) => {
    try {
      const data = loadMyNumbers();
      const entry = data.find(d => d.id === id);
      if (!entry) return { error: "해당 번호를 찾을 수 없습니다." };
      if (entry.type !== "pension") return { error: "연금복권 번호가 아닙니다." };

      const url = `https://www.dhlottery.co.kr/pt720/selectPstPt720Info.do?srchPsltEpsd=${entry.round}`;
      const resp = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
          "Referer": "https://www.dhlottery.co.kr/pt720/result",
        },
        signal: AbortSignal.timeout(10000),
      });
      const json = await resp.json();

      if (!json.data || !json.data.result || json.data.result.length === 0) {
        return { error: `${entry.round}회차 추첨 결과가 아직 없습니다.` };
      }

      // 1등 당첨번호 찾기
      const firstPrize = json.data.result.find(r => r.wnSqNo === 1);
      if (!firstPrize) {
        return { error: `${entry.round}회차 1등 당첨번호를 찾을 수 없습니다.` };
      }

      const winGroup = parseInt(firstPrize.wnBndNo);
      const winDigits = firstPrize.wnRnkVl.padStart(6, "0").split("").map(Number);

      const result = checkPensionResult(entry.group, entry.digits, winGroup, winDigits);
      result.winGroup = winGroup;
      result.winDigits = winDigits;
      result.drawDate = firstPrize.psltRflYmd;

      // 결과 저장
      entry.result = result;
      saveMyNumbers(data);

      return { success: true, result };
    } catch (e) {
      if (e.name === "TimeoutError") return { error: "서버 응답 시간 초과" };
      return { error: `당첨 확인 실패: ${e.message}` };
    }
  });
}

module.exports = { setupMyNumbersIpc };
