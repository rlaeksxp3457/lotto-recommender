import { barColor, createBall, fmt } from "./utils.js";
import { state } from "./state.js";

export function renderFrequencyChart() {
  const container = document.getElementById("freq-chart");
  container.innerHTML = "";
  const maxCount = Math.max(...state.summary.frequency.map(f => f.count));

  state.summary.frequency.forEach(f => {
    const wrap = document.createElement("div");
    wrap.className = "freq-bar-wrap";

    const barContainer = document.createElement("div");
    barContainer.className = "freq-bar-container";

    const bar = document.createElement("div");
    bar.className = "freq-bar";
    bar.style.height = `${(f.count / maxCount) * 100}%`;
    bar.style.background = barColor(f.number);

    const num = document.createElement("div");
    num.className = "freq-num";
    num.style.color = barColor(f.number);
    num.textContent = f.number;

    const count = document.createElement("div");
    count.className = "freq-count";
    count.textContent = f.count;

    barContainer.appendChild(bar);
    wrap.appendChild(barContainer);
    wrap.appendChild(num);
    wrap.appendChild(count);
    container.appendChild(wrap);
  });
}

export function renderInsights() {
  const hotEl = document.getElementById("hot-numbers");
  hotEl.innerHTML = "";
  state.summary.recentHot.forEach(h => {
    const row = document.createElement("div");
    row.className = "card-row";
    row.appendChild(createBall(h.number, true));
    const label = document.createElement("span");
    label.className = "value";
    label.textContent = `최근 50회 중 ${h.count}회 출현`;
    row.appendChild(label);
    hotEl.appendChild(row);
  });

  const overdueEl = document.getElementById("overdue-numbers");
  overdueEl.innerHTML = "";
  state.summary.overdue.forEach(o => {
    const row = document.createElement("div");
    row.className = "card-row";
    row.appendChild(createBall(o.number, true));
    const label = document.createElement("span");
    label.className = "value";
    label.textContent = `${o.gap}회 전 마지막 출현`;
    row.appendChild(label);
    overdueEl.appendChild(row);
  });

  const s = state.summary.sumStats;
  document.getElementById("sum-stats").innerHTML = `
    <div class="stat-line"><span class="stat-label">평균 합계</span><span class="stat-value">${s.mean}</span></div>
    <div class="stat-line"><span class="stat-label">표준편차</span><span class="stat-value">${s.std}</span></div>
    <div class="stat-line"><span class="stat-label">추천 범위</span><span class="stat-value">${s.range[0]} ~ ${s.range[1]}</span></div>
    <div class="stat-line"><span class="stat-label">분석 회차</span><span class="stat-value">${fmt(state.summary.total)}회</span></div>
    <div class="stat-line"><span class="stat-label">기간</span><span class="stat-value">${state.summary.dateRange.from} ~ ${state.summary.dateRange.to}</span></div>
  `;

  const pairEl = document.getElementById("top-pairs");
  pairEl.innerHTML = "";
  state.summary.topPairs.forEach(p => {
    const row = document.createElement("div");
    row.className = "pair-row";
    row.appendChild(createBall(p.pair[0], true));
    const plus = document.createElement("span");
    plus.textContent = "+";
    plus.style.cssText = "color:var(--text-muted);font-size:12px;";
    row.appendChild(plus);
    row.appendChild(createBall(p.pair[1], true));
    const cnt = document.createElement("span");
    cnt.className = "pair-count";
    cnt.textContent = `${p.count}회`;
    row.appendChild(cnt);
    pairEl.appendChild(row);
  });
}
