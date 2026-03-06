// ═══ 로또 6/45 당첨 이력 모듈 ═══

import { ballColor } from "./utils.js";

function formatDate(d) {
  if (!d) return "";
  // "2024-01-06" → "2024.01.06"
  return d.replace(/-/g, ".");
}

export async function renderLottoHistory() {
  const container = document.getElementById("lotto-history");
  if (!container) return;
  container.innerHTML = '<div class="loading-text">당첨 이력 불러오는 중...</div>';

  const result = await window.api.getHistory(50);
  container.innerHTML = "";

  if (result.error) {
    container.innerHTML = `<div class="loading-text">${result.error}</div>`;
    return;
  }

  const table = document.createElement("table");
  table.className = "lotto-history-table";

  const thead = document.createElement("thead");
  thead.innerHTML = `<tr>
    <th>회차</th>
    <th>추첨일</th>
    <th>당첨번호</th>
    <th>보너스</th>
  </tr>`;
  table.appendChild(thead);

  const tbody = document.createElement("tbody");
  for (const rec of result.records) {
    const tr = document.createElement("tr");

    const tdRound = document.createElement("td");
    tdRound.className = "history-round";
    tdRound.textContent = `${rec.round}회`;

    const tdDate = document.createElement("td");
    tdDate.className = "history-date";
    tdDate.textContent = formatDate(rec.date);

    const tdNum = document.createElement("td");
    tdNum.className = "history-numbers";
    rec.numbers.forEach(n => {
      const ball = document.createElement("span");
      ball.className = `history-ball ${ballColor(n)}`;
      ball.textContent = n;
      tdNum.appendChild(ball);
    });

    const tdBonus = document.createElement("td");
    const bonusBall = document.createElement("span");
    bonusBall.className = `history-ball ${ballColor(rec.bonus)} bonus`;
    bonusBall.textContent = rec.bonus;
    tdBonus.appendChild(bonusBall);

    tr.appendChild(tdRound);
    tr.appendChild(tdDate);
    tr.appendChild(tdNum);
    tr.appendChild(tdBonus);
    tbody.appendChild(tr);
  }

  table.appendChild(tbody);
  container.appendChild(table);
}
