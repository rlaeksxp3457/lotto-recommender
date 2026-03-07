// ═══ 로또 6/45 당첨 이력 모듈 ═══

import { ballColor } from "./utils.js";

function formatDate(d) {
  if (!d) return "";
  // "2024-01-06" → "2024.01.06"
  return d.replace(/-/g, ".");
}

function formatAmount(amount) {
  if (!amount || amount === 0) return "0원";
  if (amount >= 100000000) {
    const eok = Math.floor(amount / 100000000);
    const man = Math.floor((amount % 100000000) / 10000);
    return man > 0 ? `${eok.toLocaleString()}억 ${man.toLocaleString()}만원` : `${eok.toLocaleString()}억원`;
  }
  if (amount >= 10000) {
    return `${Math.floor(amount / 10000).toLocaleString()}만원`;
  }
  return `${amount.toLocaleString()}원`;
}

function createPrizeDetail(prizeInfo) {
  const div = document.createElement("div");
  div.className = "history-prize-detail";

  if (!prizeInfo) {
    div.innerHTML = '<div class="prize-no-data">상세 정보 없음</div>';
    return div;
  }

  const rankLabels = ["1등", "2등", "3등", "4등", "5등"];

  let rows = "";
  for (const p of prizeInfo.prizes) {
    rows += `<tr>
      <td class="prize-rank">${rankLabels[p.rank - 1]}</td>
      <td class="prize-amount">${formatAmount(p.amount)}</td>
      <td class="prize-winners">${p.winners.toLocaleString()}명</td>
      <td class="prize-total-amount">${formatAmount(p.totalAmount)}</td>
    </tr>`;
  }

  // 1등 당첨 유형
  const wt = prizeInfo.winTypes || {};
  const winTypeText = [
    wt.auto ? `자동 ${wt.auto}` : "",
    wt.semiAuto ? `반자동 ${wt.semiAuto}` : "",
    wt.manual ? `수동 ${wt.manual}` : "",
  ].filter(Boolean).join(" / ");

  div.innerHTML = `
    <div class="prize-summary-row">
      <span>총 판매금액 <strong>${formatAmount(prizeInfo.totalSales)}</strong></span>
      <span>총 당첨자 <strong>${(prizeInfo.totalWinners || 0).toLocaleString()}명</strong></span>
    </div>
    ${winTypeText ? `<div class="prize-win-types">1등 당첨 유형: ${winTypeText}</div>` : ""}
    <table class="prize-table">
      <thead><tr><th>등수</th><th>1인당 당첨금</th><th>당첨자 수</th><th>총 당첨금</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  `;
  return div;
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
    tr.className = "history-row";

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

    // 상세 패널 행 (접힘)
    const detailTr = document.createElement("tr");
    detailTr.className = "history-detail-row";
    const detailTd = document.createElement("td");
    detailTd.colSpan = 4;
    detailTd.appendChild(createPrizeDetail(rec.prizeInfo));
    detailTr.appendChild(detailTd);
    tbody.appendChild(detailTr);

    // 클릭 토글
    tr.addEventListener("click", () => {
      const isOpen = detailTr.classList.contains("open");
      // 다른 열린 것 닫기
      tbody.querySelectorAll(".history-detail-row.open").forEach(r => r.classList.remove("open"));
      tbody.querySelectorAll(".history-row.active").forEach(r => r.classList.remove("active"));
      if (!isOpen) {
        detailTr.classList.add("open");
        tr.classList.add("active");
      }
    });
  }

  table.appendChild(tbody);
  container.appendChild(table);
}
