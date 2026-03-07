// ═══ 연금복권 고급 분석 모듈 ═══

import { showToast } from "./utils.js";

export function initPensionAdvancedAnalysis() {
  const btn = document.getElementById("btn-pension-advanced-analyze");
  const recentSelect = document.getElementById("pension-advanced-recent-n");
  if (!btn) return;

  btn.addEventListener("click", () => loadPensionAdvanced(parseInt(recentSelect.value) || 20));
}

async function loadPensionAdvanced(recentN = 20) {
  const btn = document.getElementById("btn-pension-advanced-analyze");
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span>분석 중...';

  const result = await window.api.pensionGetAdvancedAnalysis(recentN);
  btn.disabled = false;
  btn.textContent = "분석 실행";

  if (result.error) {
    showToast(result.error, "error");
    return;
  }

  renderAllPensionAnalysis(result.analysis);
}

function renderAllPensionAnalysis(data) {
  renderDigitRepeat(data.digitRepeat);
  renderDigitSum(data.digitSum);
  renderGroupDist(data.groupDist);
  renderOddEven(data.posOddEven);
  renderAdjacentSame(data.adjacentSame);
  renderPensionDropChart(data.dropChart);
  renderPensionFunatsu(data.funatsu);
}

// ── 숫자 반복 분포 ──
function renderDigitRepeat(dist) {
  const el = document.getElementById("pen-digit-repeat");
  const maxCount = Math.max(...dist);
  const labels = ["0개", "1개", "2개", "3개", "4개", "5개", "6개"];
  const colors = ["#95a5a6", "#3498db", "#2ecc71", "#f39c12", "#e74c3c", "#9b59b6", "#e91e63"];

  let barsHtml = "";
  for (let i = 0; i < dist.length; i++) {
    const pct = maxCount > 0 ? (dist[i] / maxCount * 100) : 0;
    barsHtml += `
      <div class="adv-bar-wrap">
        <div class="adv-bar-container">
          <div class="adv-bar" style="height:${pct}%;background:${colors[i]}"></div>
        </div>
        <div class="adv-bar-label">${labels[i]}</div>
        <div class="adv-bar-count">${dist[i]}</div>
      </div>
    `;
  }

  el.innerHTML = `
    <div class="adv-section-desc">6자리 숫자 중 가장 많이 반복된 숫자의 반복 횟수 분포입니다.</div>
    <div class="adv-bar-chart">${barsHtml}</div>
  `;
}

// ── 자릿수 합계 분포 ──
function renderDigitSum(digitSum) {
  const el = document.getElementById("pen-digit-sum");
  const { dist, avg } = digitSum;
  const maxCount = Math.max(...dist.map(d => d.count));

  let barsHtml = "";
  for (const { sum, count } of dist) {
    const pct = maxCount > 0 ? (count / maxCount * 100) : 0;
    const color = sum >= 30 ? "#e74c3c" : sum >= 20 ? "#f39c12" : "#3498db";
    barsHtml += `
      <div class="adv-bar-wrap">
        <div class="adv-bar-container">
          <div class="adv-bar" style="height:${pct}%;background:${color}"></div>
        </div>
        <div class="adv-bar-label">${sum}</div>
        <div class="adv-bar-count">${count}</div>
      </div>
    `;
  }

  el.innerHTML = `
    <div class="adv-section-desc">6자리 숫자의 합계 분포입니다. 평균 합계: <strong>${avg}</strong></div>
    <div class="adv-bar-chart adv-bar-chart-dense">${barsHtml}</div>
  `;
}

// ── 조별 분포 ──
function renderGroupDist(groupDist) {
  const el = document.getElementById("pen-group-dist");
  const maxCount = Math.max(...groupDist.map(g => g.count));
  const colors = ["#e74c3c", "#3498db", "#2ecc71", "#f39c12", "#9b59b6"];

  let barsHtml = "";
  for (const { group, count, pct } of groupDist) {
    const barPct = maxCount > 0 ? (count / maxCount * 100) : 0;
    barsHtml += `
      <div class="adv-bar-wrap adv-bar-wide">
        <div class="adv-bar-container">
          <div class="adv-bar" style="height:${barPct}%;background:${colors[group - 1]}"></div>
        </div>
        <div class="adv-bar-label">${group}조</div>
        <div class="adv-bar-count">${count} (${pct}%)</div>
      </div>
    `;
  }

  el.innerHTML = `
    <div class="adv-section-desc">1조~5조 당첨 횟수 분포입니다.</div>
    <div class="adv-bar-chart">${barsHtml}</div>
  `;
}

// ── 위치별 홀짝 비율 ──
function renderOddEven(posOddEven) {
  const el = document.getElementById("pen-odd-even");

  let html = '<div class="adv-section-desc">각 자릿수 위치별 홀수/짝수 출현 비율입니다.</div>';
  html += '<div class="pen-oddeven-grid">';
  for (const { pos, odd, even, oddPct } of posOddEven) {
    const evenPct = (100 - oddPct).toFixed(1);
    html += `
      <div class="pen-oddeven-item">
        <div class="pen-oddeven-label">${pos}번째</div>
        <div class="pen-oddeven-bar-track">
          <div class="pen-oddeven-bar-odd" style="width:${oddPct}%">${oddPct}%</div>
          <div class="pen-oddeven-bar-even" style="width:${evenPct}%">${evenPct}%</div>
        </div>
        <div class="pen-oddeven-counts">홀 ${odd} / 짝 ${even}</div>
      </div>
    `;
  }
  html += "</div>";

  el.innerHTML = html;
}

// ── 인접자리 동일숫자 분포 ──
function renderAdjacentSame(dist) {
  const el = document.getElementById("pen-adjacent-same");
  const maxCount = Math.max(...dist);
  const labels = ["0쌍", "1쌍", "2쌍", "3쌍", "4쌍", "5쌍"];
  const colors = ["#95a5a6", "#3498db", "#2ecc71", "#f39c12", "#e74c3c", "#9b59b6"];

  let barsHtml = "";
  for (let i = 0; i < dist.length; i++) {
    const pct = maxCount > 0 ? (dist[i] / maxCount * 100) : 0;
    barsHtml += `
      <div class="adv-bar-wrap">
        <div class="adv-bar-container">
          <div class="adv-bar" style="height:${pct}%;background:${colors[i]}"></div>
        </div>
        <div class="adv-bar-label">${labels[i]}</div>
        <div class="adv-bar-count">${dist[i]}</div>
      </div>
    `;
  }

  el.innerHTML = `
    <div class="adv-section-desc">인접한 두 자리에 같은 숫자가 나오는 쌍 수의 분포입니다.</div>
    <div class="adv-bar-chart">${barsHtml}</div>
  `;
}

// ── 낙수표 ──
function renderPensionDropChart(dropChart) {
  const el = document.getElementById("pen-drop-chart");

  let html = '<div class="adv-section-desc">최근 회차별 각 위치의 숫자 출현을 시각화합니다.</div>';
  html += '<div class="adv-drop-chart-wrap"><table class="adv-drop-table"><thead><tr><th class="adv-drop-num-col">위치</th><th class="adv-drop-num-col">숫자</th>';
  for (const r of dropChart) {
    html += `<th class="adv-drop-round-col">${r.round}</th>`;
  }
  html += "</tr></thead><tbody>";

  // 각 위치(1~6)별, 숫자(0~9)별 그리드
  for (let pos = 0; pos < 6; pos++) {
    for (let digit = 0; digit <= 9; digit++) {
      html += `<tr${digit === 0 ? ' class="pen-drop-pos-start"' : ""}>`;
      if (digit === 0) {
        html += `<td class="adv-drop-num-cell" rowspan="10"><strong>${pos + 1}번째</strong></td>`;
      }
      html += `<td class="adv-drop-num-cell pen-drop-digit">${digit}</td>`;
      for (const r of dropChart) {
        const isHit = r.digits[pos] === digit;
        const cellClass = isHit ? "adv-drop-hit" : "";
        const content = isHit ? "●" : "";
        html += `<td class="adv-drop-cell ${cellClass}">${content}</td>`;
      }
      html += "</tr>";
    }
  }

  html += "</tbody></table></div>";
  el.innerHTML = html;
}

// ── 후나츠 사카이 분석 ──
function renderPensionFunatsu(funatsu) {
  const el = document.getElementById("pen-funatsu");

  const top15 = funatsu.slice(0, 15);

  let html = `
    <div class="adv-section-desc">
      각 위치의 각 숫자별 출현 주기(평균 간격)와 현재 미출현 간격을 비교합니다.
      비율이 1.0 이상이면 평균보다 오래 미출현 → 출현 가능성 상승.
    </div>
    <table class="adv-funatsu-table">
      <thead><tr>
        <th>위치</th><th>숫자</th><th>평균 간격</th><th>현재 미출현</th><th>비율</th><th>총 출현</th>
      </tr></thead>
      <tbody>
  `;

  for (const item of top15) {
    const ratioClass = item.ratio >= 1.5 ? "ratio-high" : item.ratio >= 1.0 ? "ratio-mid" : "ratio-low";
    html += `
      <tr>
        <td><strong>${item.pos}번째</strong></td>
        <td><strong>${item.digit}</strong></td>
        <td>${item.avgGap}</td>
        <td><strong>${item.currentGap}</strong></td>
        <td class="${ratioClass}">${item.ratio}x</td>
        <td>${item.total}</td>
      </tr>
    `;
  }

  html += "</tbody></table>";

  // 위치별 비율 시각화
  html += '<h4 class="adv-sub-title">전체 위치별 숫자 주기 비율</h4><div class="adv-funatsu-bars">';
  const sortedByPos = [...funatsu].sort((a, b) => a.pos - b.pos || a.digit - b.digit);
  const maxRatio = Math.max(...funatsu.map(f => f.ratio));

  for (const item of sortedByPos) {
    const pct = maxRatio > 0 ? Math.min(item.ratio / maxRatio * 100, 100) : 0;
    const ratioColor = item.ratio >= 1.5 ? "#e74c3c" : item.ratio >= 1.0 ? "#f39c12" : "#3498db";
    html += `
      <div class="adv-funatsu-bar-row">
        <span class="pen-funatsu-label">${item.pos}-${item.digit}</span>
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
