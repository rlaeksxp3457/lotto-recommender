// ═══ 고급 분석 모듈 ═══

import { ballColor, barColor, createBall, showToast } from "./utils.js";

let cachedAnalysis = null;

export async function initAdvancedAnalysis() {
  const btn = document.getElementById("btn-advanced-analyze");
  const recentSelect = document.getElementById("advanced-recent-n");
  if (!btn) return;

  btn.addEventListener("click", () => loadAdvancedAnalysis(parseInt(recentSelect.value) || 20));
}

async function loadAdvancedAnalysis(recentN = 20) {
  const btn = document.getElementById("btn-advanced-analyze");
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span>분석 중...';

  const result = await window.api.getAdvancedAnalysis(recentN);
  btn.disabled = false;
  btn.textContent = "분석 실행";

  if (result.error) {
    showToast(result.error, "error");
    return;
  }

  cachedAnalysis = result.analysis;
  renderAllAnalysis(result.analysis);
}

function renderAllAnalysis(data) {
  renderACAnalysis(data.ac);
  renderEndingAnalysis(data.ending);
  renderConsecutiveAnalysis(data.consecutive);
  renderRangeAnalysis(data.range);
  renderDropChart(data.dropChart);
  renderFunatsuAnalysis(data.funatsu);
}

// ── AC값 분석 ──
function renderACAnalysis(ac) {
  const el = document.getElementById("ac-analysis");
  const maxCount = Math.max(...ac.distribution);

  let barsHtml = "";
  for (let i = 0; i <= 10; i++) {
    const pct = maxCount > 0 ? (ac.distribution[i] / maxCount * 100) : 0;
    const count = ac.distribution[i];
    barsHtml += `
      <div class="adv-bar-wrap">
        <div class="adv-bar-container">
          <div class="adv-bar" style="height:${pct}%;background:${i >= 7 ? 'var(--ball-blue)' : i >= 4 ? 'var(--ball-green)' : 'var(--ball-gray)'}"></div>
        </div>
        <div class="adv-bar-label">${i}</div>
        <div class="adv-bar-count">${count}</div>
      </div>
    `;
  }

  el.innerHTML = `
    <div class="adv-section-desc">
      AC값은 6개 번호 간 차이값의 복잡도를 나타냅니다. (범위: 0~10, 높을수록 복잡)
    </div>
    <div class="adv-stat-row">
      <span class="adv-stat">평균 AC: <strong>${ac.avg}</strong></span>
      <span class="adv-stat">최근 ${ac.recent.length}회 평균: <strong>${(ac.recent.reduce((a, b) => a + b, 0) / ac.recent.length).toFixed(1)}</strong></span>
    </div>
    <div class="adv-bar-chart">${barsHtml}</div>
  `;
}

// ── 끝수 분석 ──
function renderEndingAnalysis(ending) {
  const el = document.getElementById("ending-analysis");
  const maxCount = Math.max(...ending.freq);
  const colors = ["#e74c3c", "#3498db", "#2ecc71", "#f39c12", "#9b59b6",
                  "#1abc9c", "#e67e22", "#34495e", "#e91e63", "#00bcd4"];

  let barsHtml = "";
  for (let i = 0; i <= 9; i++) {
    const pct = maxCount > 0 ? (ending.freq[i] / maxCount * 100) : 0;
    barsHtml += `
      <div class="adv-bar-wrap">
        <div class="adv-bar-container">
          <div class="adv-bar" style="height:${pct}%;background:${colors[i]}"></div>
        </div>
        <div class="adv-bar-label">${i}</div>
        <div class="adv-bar-count">${ending.freq[i]}</div>
      </div>
    `;
  }

  // 최근 끝수
  const recentMax = Math.max(...ending.recentFreq);
  let recentHtml = "";
  for (let i = 0; i <= 9; i++) {
    const pct = recentMax > 0 ? (ending.recentFreq[i] / recentMax * 100) : 0;
    recentHtml += `
      <div class="adv-bar-wrap">
        <div class="adv-bar-container">
          <div class="adv-bar" style="height:${pct}%;background:${colors[i]};opacity:0.7"></div>
        </div>
        <div class="adv-bar-label">${i}</div>
        <div class="adv-bar-count">${ending.recentFreq[i]}</div>
      </div>
    `;
  }

  el.innerHTML = `
    <div class="adv-section-desc">각 번호의 끝자리(0~9) 출현 빈도를 분석합니다.</div>
    <h4 class="adv-sub-title">전체 끝수 분포</h4>
    <div class="adv-bar-chart">${barsHtml}</div>
    <h4 class="adv-sub-title">최근 끝수 분포</h4>
    <div class="adv-bar-chart">${recentHtml}</div>
  `;
}

// ── 연번 분석 ──
function renderConsecutiveAnalysis(consec) {
  const el = document.getElementById("consec-analysis");
  const maxCount = Math.max(...consec.distribution);
  const labels = ["0쌍", "1쌍", "2쌍", "3쌍", "4쌍", "5쌍"];
  const colors = ["#95a5a6", "#3498db", "#2ecc71", "#f39c12", "#e74c3c", "#9b59b6"];

  let barsHtml = "";
  for (let i = 0; i < consec.distribution.length; i++) {
    const pct = maxCount > 0 ? (consec.distribution[i] / maxCount * 100) : 0;
    barsHtml += `
      <div class="adv-bar-wrap">
        <div class="adv-bar-container">
          <div class="adv-bar" style="height:${pct}%;background:${colors[i]}"></div>
        </div>
        <div class="adv-bar-label">${labels[i]}</div>
        <div class="adv-bar-count">${consec.distribution[i]}</div>
      </div>
    `;
  }

  // 최근 연번 추세
  let recentHtml = '<div class="adv-recent-consec">';
  for (const item of consec.recent) {
    recentHtml += `<span class="adv-consec-tag ${item.pairs > 0 ? 'has-consec' : ''}">${item.round}회: ${item.pairs}쌍</span>`;
  }
  recentHtml += "</div>";

  el.innerHTML = `
    <div class="adv-section-desc">연속된 번호(예: 5,6 또는 23,24) 쌍의 출현 분포를 분석합니다.</div>
    <h4 class="adv-sub-title">연번 쌍 분포</h4>
    <div class="adv-bar-chart">${barsHtml}</div>
    <h4 class="adv-sub-title">최근 연번 추세</h4>
    ${recentHtml}
  `;
}

// ── 번호대 분석 ──
function renderRangeAnalysis(range) {
  const el = document.getElementById("range-analysis");
  const maxFreq = Math.max(...range.freq);
  const colors = ["var(--ball-yellow)", "var(--ball-blue)", "var(--ball-red)", "var(--ball-gray)", "var(--ball-green)"];

  let barsHtml = "";
  for (let i = 0; i < range.labels.length; i++) {
    const pct = maxFreq > 0 ? (range.freq[i] / maxFreq * 100) : 0;
    barsHtml += `
      <div class="adv-bar-wrap adv-bar-wide">
        <div class="adv-bar-container">
          <div class="adv-bar" style="height:${pct}%;background:${colors[i]}"></div>
        </div>
        <div class="adv-bar-label">${range.labels[i]}</div>
        <div class="adv-bar-count">${range.freq[i]}</div>
      </div>
    `;
  }

  // 번호대별 개수 분포 테이블
  let tableHtml = '<table class="adv-range-table"><thead><tr><th>번호대</th>';
  for (let c = 0; c <= 6; c++) tableHtml += `<th>${c}개</th>`;
  tableHtml += "</tr></thead><tbody>";
  for (let i = 0; i < range.labels.length; i++) {
    tableHtml += `<tr><td style="font-weight:700">${range.labels[i]}</td>`;
    for (let c = 0; c <= 6; c++) {
      const val = range.distribution[i][c];
      tableHtml += `<td class="${val > 0 ? 'has-value' : ''}">${val}</td>`;
    }
    tableHtml += "</tr>";
  }
  tableHtml += "</tbody></table>";

  el.innerHTML = `
    <div class="adv-section-desc">번호를 구간별로 나누어 출현 빈도를 분석합니다.</div>
    <h4 class="adv-sub-title">번호대별 총 출현 횟수</h4>
    <div class="adv-bar-chart">${barsHtml}</div>
    <h4 class="adv-sub-title">회차별 번호대 개수 분포</h4>
    ${tableHtml}
  `;
}

// ── 낙수표 ──
function renderDropChart(dropChart) {
  const el = document.getElementById("drop-chart-analysis");

  // 그리드: 행=번호(1~45), 열=회차(최근N)
  let html = '<div class="adv-section-desc">최근 회차별 번호 출현을 시각화합니다. ● 당첨번호, ○ 보너스번호</div>';
  html += '<div class="adv-drop-chart-wrap"><table class="adv-drop-table"><thead><tr><th class="adv-drop-num-col">번호</th>';
  for (const r of dropChart) {
    html += `<th class="adv-drop-round-col">${r.round}</th>`;
  }
  html += "</tr></thead><tbody>";

  for (let num = 1; num <= 45; num++) {
    html += `<tr><td class="adv-drop-num-cell"><span class="lotto-ball ${ballColor(num)} lotto-ball-xs">${num}</span></td>`;
    for (const r of dropChart) {
      const isWin = r.numbers.includes(num);
      const isBonus = r.bonus === num;
      let cellClass = "";
      let content = "";
      if (isWin) { cellClass = "adv-drop-hit"; content = "●"; }
      else if (isBonus) { cellClass = "adv-drop-bonus"; content = "○"; }
      html += `<td class="adv-drop-cell ${cellClass}">${content}</td>`;
    }
    html += "</tr>";
  }

  html += "</tbody></table></div>";
  el.innerHTML = html;
}

// ── 후나츠 사카이 분석 ──
function renderFunatsuAnalysis(funatsu) {
  const el = document.getElementById("funatsu-analysis");

  // 상위 15개 (ratio가 높은 순 = 평균 주기 대비 오래 미출현)
  const top15 = funatsu.slice(0, 15);

  let html = `
    <div class="adv-section-desc">
      각 번호의 출현 주기(평균 간격)와 현재 미출현 간격을 비교합니다.
      비율이 1.0 이상이면 평균보다 오래 미출현 → 출현 가능성 상승.
    </div>
    <table class="adv-funatsu-table">
      <thead><tr>
        <th>번호</th><th>평균 간격</th><th>현재 미출현</th><th>비율</th>
        <th>최소 간격</th><th>최대 간격</th><th>총 출현</th>
      </tr></thead>
      <tbody>
  `;

  for (const item of top15) {
    const ratioClass = item.ratio >= 1.5 ? "ratio-high" : item.ratio >= 1.0 ? "ratio-mid" : "ratio-low";
    html += `
      <tr>
        <td><span class="lotto-ball ${ballColor(item.num)} lotto-ball-xs">${item.num}</span></td>
        <td>${item.avgGap}</td>
        <td><strong>${item.currentGap}</strong></td>
        <td class="${ratioClass}">${item.ratio}x</td>
        <td>${item.minGap}</td>
        <td>${item.maxGap}</td>
        <td>${item.totalAppearances}</td>
      </tr>
    `;
  }

  html += "</tbody></table>";

  // 하단에 전체 45개 번호의 비율 시각화 (가로 바 차트)
  html += '<h4 class="adv-sub-title">전체 번호 주기 비율</h4><div class="adv-funatsu-bars">';
  const sortedByNum = [...funatsu].sort((a, b) => a.num - b.num);
  const maxRatio = Math.max(...funatsu.map(f => f.ratio));

  for (const item of sortedByNum) {
    const pct = maxRatio > 0 ? Math.min(item.ratio / maxRatio * 100, 100) : 0;
    const ratioColor = item.ratio >= 1.5 ? "#e74c3c" : item.ratio >= 1.0 ? "#f39c12" : "#3498db";
    html += `
      <div class="adv-funatsu-bar-row">
        <span class="lotto-ball ${ballColor(item.num)} lotto-ball-xs">${item.num}</span>
        <div class="adv-funatsu-bar-track">
          <div class="adv-funatsu-bar-fill" style="width:${pct}%;background:${ratioColor}"></div>
        </div>
        <span class="adv-funatsu-ratio">${item.ratio}x</span>
      </div>
    `;
  }
  html += "</div>";

  el.innerHTML = html;
}
