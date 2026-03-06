import { ballColor, showToast } from "./utils.js";
import { state } from "./state.js";

export async function generateTop5() {
  const btn = document.getElementById("btn-top5");
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span>분석 중...';

  const result = await window.api.getTop5();
  const container = document.getElementById("top5-ticket");
  container.innerHTML = "";

  if (result.error) {
    showToast(result.error, "error");
    btn.disabled = false;
    btn.textContent = "5게임 추천받기";
    return;
  }

  const games = result.games;
  const now = new Date();
  const dateStr = `${now.getFullYear()}.${String(now.getMonth()+1).padStart(2,"0")}.${String(now.getDate()).padStart(2,"0")}`;

  const header = document.createElement("div");
  header.className = "ticket-header";
  header.innerHTML = `
    <span class="ticket-header-title">LOTTO 6/45 추천번호</span>
    <span class="ticket-header-sub">${dateStr} 생성</span>
  `;

  const gamesWrap = document.createElement("div");
  gamesWrap.className = "ticket-games";

  games.forEach((g, idx) => {
    const row = document.createElement("div");
    row.className = "ticket-game";

    const label = document.createElement("div");
    label.className = "ticket-game-label";
    label.textContent = String.fromCharCode(65 + idx);

    const balls = document.createElement("div");
    balls.className = "ticket-game-balls";
    g.numbers.forEach((n, i) => {
      const ball = document.createElement("span");
      ball.className = `ticket-ball ${ballColor(n)} ball-animate`;
      ball.textContent = n;
      ball.style.animationDelay = `${idx * 80 + i * 60}ms`;
      balls.appendChild(ball);
    });

    const strategy = document.createElement("div");
    strategy.className = "ticket-game-strategy";
    strategy.textContent = g.name;

    // 개별 저장 버튼
    const saveBtn = document.createElement("button");
    saveBtn.className = "ticket-save-btn";
    saveBtn.title = "내 번호에 저장";
    saveBtn.innerHTML = '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/></svg>';
    saveBtn.addEventListener("click", async () => {
      const round = (state.summary?.lastRound || 0) + 1;
      saveBtn.disabled = true;
      saveBtn.innerHTML = '<span class="spinner"></span>';
      const res = await window.api.myNumbersSave({
        type: "lotto", round, numbers: [...g.numbers],
      });
      if (res.error) {
        showToast(res.error, "error");
        saveBtn.disabled = false;
        saveBtn.innerHTML = '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/></svg>';
        return;
      }
      showToast(`${String.fromCharCode(65 + idx)}게임이 내 번호에 저장되었습니다.`, "success");
      saveBtn.innerHTML = "✓";
      saveBtn.classList.add("saved");
    });

    row.appendChild(label);
    row.appendChild(balls);
    row.appendChild(strategy);
    row.appendChild(saveBtn);
    gamesWrap.appendChild(row);
  });

  const footer = document.createElement("div");
  footer.className = "ticket-footer";
  const totalSum = games.reduce((a, g) => a + g.sum, 0);
  const avgSum = Math.round(totalSum / games.length);
  footer.innerHTML = `
    <span>5게임 평균 합계: <span class="ticket-footer-bold">${avgSum}</span></span>
    <span>성능순 상위 5개 알고리즘</span>
  `;

  // 5게임 일괄 저장 버튼
  const saveAllBtn = document.createElement("button");
  saveAllBtn.className = "ticket-save-all-btn";
  saveAllBtn.innerHTML = '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/></svg> 5게임 모두 저장';
  saveAllBtn.addEventListener("click", async () => {
    const round = (state.summary?.lastRound || 0) + 1;
    saveAllBtn.disabled = true;
    saveAllBtn.innerHTML = '<span class="spinner"></span> 저장 중...';
    let ok = 0;
    for (const g of games) {
      const res = await window.api.myNumbersSave({
        type: "lotto", round, numbers: [...g.numbers],
      });
      if (!res.error) ok++;
    }
    if (ok === games.length) {
      showToast(`5게임이 내 번호에 저장되었습니다.`, "success");
      saveAllBtn.innerHTML = "✓ 저장됨";
      // 개별 버튼도 저장됨 표시
      gamesWrap.querySelectorAll(".ticket-save-btn").forEach(b => {
        b.disabled = true;
        b.innerHTML = "✓";
        b.classList.add("saved");
      });
    } else {
      showToast(`${ok}/${games.length}게임 저장 완료`, ok > 0 ? "success" : "error");
      saveAllBtn.disabled = false;
      saveAllBtn.innerHTML = '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/></svg> 5게임 모두 저장';
    }
  });

  container.appendChild(header);
  container.appendChild(gamesWrap);
  container.appendChild(footer);
  container.appendChild(saveAllBtn);

  btn.disabled = false;
  btn.innerHTML = `
    <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
    다시 추천받기
  `;
}
