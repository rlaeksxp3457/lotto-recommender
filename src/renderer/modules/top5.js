import { ballColor, showToast } from "./utils.js";

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

    row.appendChild(label);
    row.appendChild(balls);
    row.appendChild(strategy);
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

  container.appendChild(header);
  container.appendChild(gamesWrap);
  container.appendChild(footer);

  btn.disabled = false;
  btn.innerHTML = `
    <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
    다시 추천받기
  `;
}
