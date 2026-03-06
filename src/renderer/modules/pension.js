// ═══ 연금복권720+ 렌더러 모듈 ═══

import { state } from "./state.js";
import { showToast, fmt } from "./utils.js";

// ─── 유틸: 숫자 박스 생성 ───

const POS_LABELS = ["조", "1번째", "2번째", "3번째", "4번째", "5번째", "6번째"];

function formatDate(d) {
  if (!d) return "";
  const s = d.replace(/-/g, "");
  if (s.length === 8) return `${s.slice(0, 4)}.${s.slice(4, 6)}.${s.slice(6, 8)}`;
  return d;
}

export function updatePensionSidebarInfo() {
  const el = document.getElementById("pension-sidebar-info");
  if (el && state.pensionSummary) {
    const p = state.pensionSummary;
    el.innerHTML = `<b>연금복권</b> ${fmt(p.total)}회차<br>${formatDate(p.dateRange.from)} ~ ${formatDate(p.dateRange.to)}`;
  }
}

function createDigitBox(digit, pos, sizeClass = "", delay = 0) {
  const el = document.createElement("span");
  const posClass = pos === 0 ? "group" : `pos-${pos}`;
  el.className = `pension-digit ${posClass} ${sizeClass}`.trim();

  if (delay > 0) {
    el.classList.add("digit-animate");
    el.style.animationDelay = `${delay}ms`;
  }

  el.textContent = pos === 0 ? `${digit}조` : digit;
  return el;
}

function createNumberDisplay(group, digits, sizeClass = "", baseDelay = 0) {
  const wrap = document.createElement("div");
  wrap.className = "pension-rec-digits";

  wrap.appendChild(createDigitBox(group, 0, sizeClass, baseDelay));

  const sep = document.createElement("span");
  sep.className = "pension-group-sep";
  sep.textContent = "|";
  wrap.appendChild(sep);

  digits.forEach((d, i) => {
    wrap.appendChild(createDigitBox(d, i + 1, sizeClass, baseDelay + (i + 1) * 50));
  });

  return wrap;
}

// ─── TOP5 티켓 ───

export async function generatePensionTop5() {
  const btn = document.getElementById("btn-pension-top5");
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span>분석 중...';

  const result = await window.api.pensionGetTop5();
  const container = document.getElementById("pension-ticket");
  container.innerHTML = "";

  if (result.error) {
    showToast(result.error, "error");
    btn.disabled = false;
    btn.textContent = "5게임 추천받기";
    return;
  }

  const games = result.games;
  const now = new Date();
  const dateStr = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, "0")}.${String(now.getDate()).padStart(2, "0")}`;

  const header = document.createElement("div");
  header.className = "pension-ticket-header";
  header.innerHTML = `
    <span class="pension-ticket-header-title">연금복권720+ 추천번호</span>
    <span class="pension-ticket-header-sub">${dateStr} 생성</span>
  `;

  const gamesWrap = document.createElement("div");
  gamesWrap.className = "pension-ticket-games";

  games.forEach((g, idx) => {
    const row = document.createElement("div");
    row.className = "pension-ticket-game";

    const label = document.createElement("div");
    label.className = "pension-ticket-game-label";
    label.textContent = String.fromCharCode(65 + idx);

    const digits = createNumberDisplay(g.group, g.digits, "ticket-size", idx * 80);

    const strategy = document.createElement("div");
    strategy.className = "pension-ticket-game-strategy";
    strategy.textContent = g.name;

    row.appendChild(label);
    row.appendChild(digits);
    row.appendChild(strategy);
    gamesWrap.appendChild(row);
  });

  const footer = document.createElement("div");
  footer.className = "pension-ticket-footer";
  footer.innerHTML = `
    <span>성능순 상위 5개 알고리즘</span>
    <span class="pension-ticket-footer-bold">연금복권720+</span>
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

// ─── 전략별 추천 카드 ───

export async function generatePensionRecommendations(getCount) {
  const btn = document.getElementById("btn-pension-rec");
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span>분석 중...';

  const count = getCount();
  const result = await window.api.pensionGetRecommendations(count);
  const container = document.getElementById("pension-recommendations");
  container.innerHTML = "";

  if (result.error) {
    showToast(result.error, "error");
    btn.disabled = false;
    btn.textContent = "번호 추천받기";
    return;
  }

  result.recommendations.forEach((rec, idx) => {
    const card = document.createElement("div");
    card.className = "rec-card";

    const setLabel = count > 1 ? ` #${rec.setIndex + 1}` : "";
    const header = document.createElement("div");
    header.className = "rec-card-header";
    header.innerHTML = `
      <h3>${rec.name}${setLabel}</h3>
      <span class="desc">${rec.desc}</span>
    `;

    // 알고리즘 도움말 버튼 (첫 번째 세트에만 표시)
    if (rec.howItWorks && rec.setIndex === 0) {
      const infoBtn = document.createElement("button");
      infoBtn.className = "algo-info-btn";
      infoBtn.innerHTML = "ℹ";
      infoBtn.title = "알고리즘 동작 원리";
      infoBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        const detail = card.querySelector(".algo-detail");
        if (detail) {
          detail.classList.toggle("open");
          infoBtn.classList.toggle("active");
        }
      });
      header.appendChild(infoBtn);
    }

    card.appendChild(header);

    // 알고리즘 설명 패널
    if (rec.howItWorks && rec.setIndex === 0) {
      const detail = document.createElement("div");
      detail.className = "algo-detail";
      rec.howItWorks.forEach((step, i) => {
        const stepEl = document.createElement("div");
        stepEl.className = "algo-step";
        stepEl.innerHTML = `<span class="algo-step-num">${i + 1}</span><span>${step}</span>`;
        detail.appendChild(stepEl);
      });
      card.appendChild(detail);
    }

    const digits = createNumberDisplay(rec.group, rec.digits, "", idx * 30);

    const stats = document.createElement("div");
    stats.className = "rec-stats";
    stats.innerHTML = `
      <span>자릿수 합: <b>${rec.sum}</b></span>
      <span>홀: <b>${rec.odd}</b> 짝: <b>${rec.even}</b></span>
      <span>저(0-4): <b>${rec.low}</b> 고(5-9): <b>${rec.high}</b></span>
    `;

    card.appendChild(digits);
    card.appendChild(stats);
    container.appendChild(card);
  });

  btn.disabled = false;
  btn.textContent = "다시 추천받기";
}

// ─── 빈도 차트 렌더링 ───

export function renderPensionFreqChart() {
  const summary = state.pensionSummary;
  if (!summary) return;

  const container = document.getElementById("pension-freq-chart");
  container.innerHTML = "";

  summary.posFrequency.forEach((posData, pos) => {
    const col = document.createElement("div");
    col.className = "pension-freq-col";

    const title = document.createElement("div");
    title.className = "pension-freq-col-title";
    title.textContent = POS_LABELS[pos];
    col.appendChild(title);

    const maxCount = Math.max(...posData.map(d => d.count));

    posData.forEach(({ digit, count }) => {
      const row = document.createElement("div");
      row.className = "pension-freq-bar-wrap";

      const label = document.createElement("span");
      label.className = "pension-freq-bar-label";
      label.textContent = pos === 0 ? `${digit}조` : digit;

      const track = document.createElement("div");
      track.className = "pension-freq-bar-track";

      const fill = document.createElement("div");
      const colorClass = pos === 0 ? "group" : `pos-${pos}`;
      fill.className = `pension-freq-bar-fill ${colorClass}`;
      fill.style.width = maxCount > 0 ? `${(count / maxCount) * 100}%` : "0%";

      const countEl = document.createElement("span");
      countEl.className = "pension-freq-bar-count";
      countEl.textContent = count;

      track.appendChild(fill);
      row.appendChild(label);
      row.appendChild(track);
      row.appendChild(countEl);
      col.appendChild(row);
    });

    container.appendChild(col);
  });
}

// ─── 통계 렌더링 ───

export function renderPensionStats() {
  const summary = state.pensionSummary;
  if (!summary) return;

  // 조 분포
  const groupContainer = document.getElementById("pension-group-dist");
  groupContainer.innerHTML = "";
  const maxGroupCount = Math.max(...summary.groupDist.map(g => g.count));

  summary.groupDist.forEach(({ group, count, pct }) => {
    const row = document.createElement("div");
    row.className = "pension-group-bar";
    row.innerHTML = `
      <span class="pension-group-bar-label">${group}조</span>
      <div class="pension-group-bar-track">
        <div class="pension-group-bar-fill" style="width: ${(count / maxGroupCount) * 100}%">
          ${count}회 (${pct}%)
        </div>
      </div>
    `;
    groupContainer.appendChild(row);
  });

  // 위치별 핫 숫자
  const hotContainer = document.getElementById("pension-hot");
  hotContainer.innerHTML = "";
  summary.hotDigits.forEach((digits, pos) => {
    const row = document.createElement("div");
    row.className = "pension-hot-cold-row";
    const label = document.createElement("span");
    label.className = "pos-label";
    label.textContent = POS_LABELS[pos];
    row.appendChild(label);
    digits.forEach(d => {
      row.appendChild(createDigitBox(d, pos, "small"));
    });
    hotContainer.appendChild(row);
  });

  // 위치별 콜드 숫자
  const coldContainer = document.getElementById("pension-cold");
  coldContainer.innerHTML = "";
  summary.coldDigits.forEach((digits, pos) => {
    const row = document.createElement("div");
    row.className = "pension-hot-cold-row";
    const label = document.createElement("span");
    label.className = "pos-label";
    label.textContent = POS_LABELS[pos];
    row.appendChild(label);
    digits.forEach(d => {
      row.appendChild(createDigitBox(d, pos, "small"));
    });
    coldContainer.appendChild(row);
  });

  // 데이터 정보
  const infoContainer = document.getElementById("pension-data-info");
  const from = summary.dateRange.from;
  const to = summary.dateRange.to;
  const fromStr = `${from.slice(0,4)}.${from.slice(4,6)}.${from.slice(6,8)}`;
  const toStr = `${to.slice(0,4)}.${to.slice(4,6)}.${to.slice(6,8)}`;

  infoContainer.innerHTML = `
    <div class="pension-stat-row"><span>총 회차</span><b>${fmt(summary.total)}회</b></div>
    <div class="pension-stat-row"><span>최신 회차</span><b>${summary.lastRound}회</b></div>
    <div class="pension-stat-row"><span>기간</span><b>${fromStr} ~ ${toStr}</b></div>
    <div class="pension-stat-row"><span>최근 1등</span><b>${summary.lastWinning.group}조 ${summary.lastWinning.digits.join("")}</b></div>
    <div class="pension-stat-row"><span>보너스</span><b>${summary.lastWinning.bonus}</b></div>
  `;
}

// ─── 당첨 이력 테이블 ───

export async function renderPensionHistory() {
  const container = document.getElementById("pension-history");
  if (!container) return;
  container.innerHTML = '<div class="loading-text">당첨 이력 불러오는 중...</div>';

  const result = await window.api.pensionGetHistory(50);
  container.innerHTML = "";

  if (result.error) {
    container.innerHTML = `<div class="loading-text">${result.error}</div>`;
    return;
  }

  const table = document.createElement("table");
  table.className = "pension-history-table";

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
    const numDisplay = createNumberDisplay(rec.group, rec.digits, "history-size");
    tdNum.appendChild(numDisplay);

    const tdBonus = document.createElement("td");
    tdBonus.className = "history-bonus";
    tdBonus.textContent = rec.bonus;

    tr.appendChild(tdRound);
    tr.appendChild(tdDate);
    tr.appendChild(tdNum);
    tr.appendChild(tdBonus);
    tbody.appendChild(tr);
  }

  table.appendChild(tbody);
  container.appendChild(table);
}

// ─── 인접쌍 빈도 Top 10 ───

export function renderPensionAdjacentPairs() {
  const summary = state.pensionSummary;
  if (!summary || !summary.adjacentPairTop) return;

  const container = document.getElementById("pension-adjacent-pairs");
  if (!container) return;
  container.innerHTML = "";

  const pairs = summary.adjacentPairTop;
  const maxCount = pairs.length > 0 ? pairs[0].count : 1;

  pairs.forEach(({ label, d1, d2, count }, idx) => {
    const row = document.createElement("div");
    row.className = "pension-pair-bar-wrap";

    const labelEl = document.createElement("span");
    labelEl.className = "pension-pair-label";
    labelEl.innerHTML = `<span class="pair-pos">${label}</span> <b>${d1}</b>-<b>${d2}</b>`;

    const track = document.createElement("div");
    track.className = "pension-pair-bar-track";

    const fill = document.createElement("div");
    fill.className = "pension-pair-bar-fill";
    fill.style.width = `${(count / maxCount) * 100}%`;
    fill.style.animationDelay = `${idx * 50}ms`;

    const countEl = document.createElement("span");
    countEl.className = "pension-pair-bar-count";
    countEl.textContent = `${count}회`;

    track.appendChild(fill);
    row.appendChild(labelEl);
    row.appendChild(track);
    row.appendChild(countEl);
    container.appendChild(row);
  });
}

// ─── 자릿수 합계 분포 ───

export function renderPensionDigitSumDist() {
  const summary = state.pensionSummary;
  if (!summary || !summary.digitSumDist) return;

  const container = document.getElementById("pension-digit-sum");
  if (!container) return;
  container.innerHTML = "";

  const dist = summary.digitSumDist;
  const maxCount = Math.max(...dist.map(d => d.count));
  const totalRecords = dist.reduce((a, d) => a + d.count, 0);

  // 평균 합계 계산
  const avgSum = dist.reduce((acc, d) => acc + d.sum * d.count, 0) / totalRecords;

  const infoEl = document.createElement("div");
  infoEl.className = "pension-sum-info";
  infoEl.innerHTML = `평균 합계: <b>${avgSum.toFixed(1)}</b> | 범위: <b>${dist[0].sum}</b> ~ <b>${dist[dist.length - 1].sum}</b>`;
  container.appendChild(infoEl);

  const chartWrap = document.createElement("div");
  chartWrap.className = "pension-sum-chart";

  dist.forEach(({ sum, count }) => {
    const col = document.createElement("div");
    col.className = "pension-sum-col";

    const bar = document.createElement("div");
    bar.className = "pension-sum-bar";
    const pct = maxCount > 0 ? (count / maxCount) * 100 : 0;
    bar.style.height = `${pct}%`;

    // 평균에 가까운 구간 강조
    if (Math.abs(sum - avgSum) <= 3) {
      bar.classList.add("highlight");
    }

    const label = document.createElement("span");
    label.className = "pension-sum-label";
    label.textContent = sum;

    const countEl = document.createElement("span");
    countEl.className = "pension-sum-count";
    countEl.textContent = count > 0 ? count : "";

    col.appendChild(countEl);
    col.appendChild(bar);
    col.appendChild(label);
    chartWrap.appendChild(col);
  });

  container.appendChild(chartWrap);
}

// ─── 초기화 ───

export async function initPension(getRecCount) {
  const result = await window.api.pensionInitData();
  if (result.error) {
    showToast(result.error, "error");
    return;
  }

  state.pensionSummary = result.summary;

  // 사이드바 데이터 정보 업데이트
  updatePensionSidebarInfo();

  // 버튼 활성화
  document.getElementById("btn-pension-top5").disabled = false;
  document.getElementById("btn-pension-rec").disabled = false;

  // 차트 & 통계 렌더
  renderPensionFreqChart();
  renderPensionStats();
  renderPensionAdjacentPairs();
  renderPensionDigitSumDist();

  // 당첨 이력 렌더
  await renderPensionHistory();

  // 초기 추천 생성
  await generatePensionTop5();
  await generatePensionRecommendations(getRecCount);
}
