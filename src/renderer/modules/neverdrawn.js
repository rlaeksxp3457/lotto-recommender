import { createBall, fmt, showToast } from "./utils.js";
import { state } from "./state.js";

export function renderNeverDrawnInfo() {
  if (!state.summary) return;
  document.getElementById("nd-total").textContent = fmt(state.summary.totalCombinations);
  document.getElementById("nd-drawn").textContent = fmt(state.summary.drawnCount);
  document.getElementById("nd-undrawn").textContent = fmt(state.summary.undrawnCount);
  document.getElementById("total-combos").textContent = fmt(state.summary.totalCombinations);
  const pct = ((state.summary.undrawnCount / state.summary.totalCombinations) * 100).toFixed(4);
  document.getElementById("nd-pct").textContent = `${pct}%`;
}

export async function generateNeverDrawn(getCount) {
  const btn = document.getElementById("btn-neverdrawn");
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span>추출 중...';

  const count = getCount();
  const result = await window.api.getNeverDrawn(count);
  const container = document.getElementById("neverdrawn-results");
  container.innerHTML = "";

  if (result.error) {
    showToast(result.error, "error");
    btn.disabled = false;
    btn.textContent = "미출현 조합 추출";
    return;
  }

  result.combinations.forEach((combo, idx) => {
    const card = document.createElement("div");
    card.className = "rec-card";

    const header = document.createElement("div");
    header.className = "rec-card-header";
    header.innerHTML = `<h3>미출현 조합 #${idx + 1}</h3><span class="desc">역대 당첨번호에 없는 조합</span>`;

    const balls = document.createElement("div");
    balls.className = "rec-balls";
    combo.numbers.forEach((n, i) => {
      balls.appendChild(createBall(n, false, i * 60 + idx * 30));
    });

    const stats = document.createElement("div");
    stats.className = "rec-stats";
    stats.innerHTML = `
      <span>합계: <b>${combo.sum}</b></span>
      <span>홀: <b>${combo.odd}</b> 짝: <b>${combo.even}</b></span>
      <span>저(1-22): <b>${combo.low}</b> 고(23-45): <b>${combo.high}</b></span>
    `;

    card.appendChild(header);
    card.appendChild(balls);
    card.appendChild(stats);
    container.appendChild(card);
  });

  btn.disabled = false;
  btn.textContent = "다시 추출하기";
}
