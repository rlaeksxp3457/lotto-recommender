// ═══ 로또 추천기 v4 — 렌더러 ═══

// ─── 로또볼 유틸 ───

function ballColor(n) {
  if (n <= 10) return "c-yellow";
  if (n <= 20) return "c-blue";
  if (n <= 30) return "c-red";
  if (n <= 40) return "c-gray";
  return "c-green";
}

function barColor(n) {
  if (n <= 10) return "var(--ball-yellow)";
  if (n <= 20) return "var(--ball-blue)";
  if (n <= 30) return "var(--ball-red)";
  if (n <= 40) return "var(--ball-gray)";
  return "var(--ball-green)";
}

function createBall(n, small = false, delay = 0) {
  const el = document.createElement("span");
  el.className = `lotto-ball ${ballColor(n)}${small ? " lotto-ball-sm" : ""} ball-animate`;
  el.textContent = n;
  if (delay) el.style.animationDelay = `${delay}ms`;
  return el;
}

function fmt(n) { return n.toLocaleString(); }

// ─── 토스트 ───

function showToast(msg, type = "info") {
  const el = document.createElement("div");
  el.className = `toast ${type}`;
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3000);
}

// ─── 탭 전환 ───

document.querySelectorAll(".nav-item[data-tab]").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".nav-item[data-tab]").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".tab-content").forEach(s => s.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById(`tab-${btn.dataset.tab}`).classList.add("active");
  });
});

// ─── 갯수 컨트롤 ───

function setupCounter(minusId, plusId, valueId, min, max, defaultVal) {
  const el = document.getElementById(valueId);
  let val = defaultVal;
  el.textContent = val;

  document.getElementById(minusId).addEventListener("click", () => {
    if (val > min) { val--; el.textContent = val; }
  });
  document.getElementById(plusId).addEventListener("click", () => {
    if (val < max) { val++; el.textContent = val; }
  });

  return () => parseInt(el.textContent);
}

const getRecCount = setupCounter("rec-minus", "rec-plus", "rec-count", 1, 10, 1);
const getNdCount  = setupCounter("nd-minus",  "nd-plus",  "nd-count",  1, 20, 5);

// ─── 데이터 ───

let summary = null;

async function init() {
  const result = await window.api.initData();
  if (result.error) { showToast(result.error, "error"); return; }

  summary = result.summary;
  updateDataInfo();
  document.getElementById("btn-recommend").disabled = false;
  document.getElementById("btn-neverdrawn").disabled = false;
  document.getElementById("btn-top5").disabled = false;

  renderFrequencyChart();
  renderInsights();
  renderNeverDrawnInfo();
  await generateTop5();
  await generateRecommendations();

  // 첫 실행 튜토리얼
  if (!localStorage.getItem("tutorial-done")) {
    setTimeout(() => tutorial.start(), 800);
  }
}

function updateDataInfo() {
  document.getElementById("data-info").innerHTML =
    `${fmt(summary.total)}회차 로드<br>${summary.dateRange.from} ~ ${summary.dateRange.to}`;
}

// ─── TOP 5 추천 게임 ───

document.getElementById("btn-top5").addEventListener("click", generateTop5);

async function generateTop5() {
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

  // 티켓 헤더
  const header = document.createElement("div");
  header.className = "ticket-header";
  header.innerHTML = `
    <span class="ticket-header-title">LOTTO 6/45 추천번호</span>
    <span class="ticket-header-sub">${dateStr} 생성</span>
  `;

  // 게임 목록
  const gamesWrap = document.createElement("div");
  gamesWrap.className = "ticket-games";

  games.forEach((g, idx) => {
    const row = document.createElement("div");
    row.className = "ticket-game";

    const label = document.createElement("div");
    label.className = "ticket-game-label";
    label.textContent = String.fromCharCode(65 + idx); // A, B, C, D, E

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

  // 티켓 푸터
  const footer = document.createElement("div");
  footer.className = "ticket-footer";
  const totalSum = games.reduce((a, g) => a + g.sum, 0);
  const avgSum = Math.round(totalSum / games.length);
  footer.innerHTML = `
    <span>5게임 평균 합계: <span class="ticket-footer-bold">${avgSum}</span></span>
    <span>성능순 상위 5개 전략</span>
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

// ─── 번호 추천 ───

document.getElementById("btn-recommend").addEventListener("click", generateRecommendations);

async function generateRecommendations() {
  const btn = document.getElementById("btn-recommend");
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span>분석 중...';

  const count = getRecCount();
  const result = await window.api.getRecommendations(count);
  const container = document.getElementById("recommendations");
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

    const balls = document.createElement("div");
    balls.className = "rec-balls";
    rec.numbers.forEach((n, i) => {
      balls.appendChild(createBall(n, false, i * 60 + idx * 30));
    });

    const stats = document.createElement("div");
    stats.className = "rec-stats";
    stats.innerHTML = `
      <span>합계: <b>${rec.sum}</b></span>
      <span>홀: <b>${rec.odd}</b> 짝: <b>${rec.even}</b></span>
      <span>저(1-22): <b>${rec.low}</b> 고(23-45): <b>${rec.high}</b></span>
    `;

    card.appendChild(header);
    card.appendChild(balls);
    card.appendChild(stats);
    container.appendChild(card);
  });

  btn.disabled = false;
  btn.textContent = "다시 추천받기";
}

// ─── 미출현 조합 ───

function renderNeverDrawnInfo() {
  if (!summary) return;
  document.getElementById("nd-total").textContent = fmt(summary.totalCombinations);
  document.getElementById("nd-drawn").textContent = fmt(summary.drawnCount);
  document.getElementById("nd-undrawn").textContent = fmt(summary.undrawnCount);
  document.getElementById("total-combos").textContent = fmt(summary.totalCombinations);
  const pct = ((summary.undrawnCount / summary.totalCombinations) * 100).toFixed(4);
  document.getElementById("nd-pct").textContent = `${pct}%`;
}

document.getElementById("btn-neverdrawn").addEventListener("click", generateNeverDrawn);

async function generateNeverDrawn() {
  const btn = document.getElementById("btn-neverdrawn");
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span>추출 중...';

  const count = getNdCount();
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

// ─── 업데이트 드롭다운 ───

const updateBtn = document.getElementById("btn-update");
const dropdownWrap = document.getElementById("update-dropdown-wrap");
const dropdownMenu = document.getElementById("update-dropdown");

updateBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  dropdownWrap.classList.toggle("open");
  dropdownMenu.classList.toggle("hidden");
});

document.addEventListener("click", () => {
  dropdownWrap.classList.remove("open");
  dropdownMenu.classList.add("hidden");
});

dropdownMenu.addEventListener("click", (e) => e.stopPropagation());

// 업데이트 진행률 수신
window.api.onUpdateProgress((msg) => {
  const progressEl = document.getElementById("update-progress");
  if (progressEl) progressEl.textContent = msg;
});

// 온라인 업데이트
document.getElementById("btn-online-update").addEventListener("click", async () => {
  dropdownWrap.classList.remove("open");
  dropdownMenu.classList.add("hidden");

  updateBtn.classList.add("loading");

  // 진행률 표시 영역 생성
  let progressEl = document.getElementById("update-progress");
  if (!progressEl) {
    progressEl = document.createElement("div");
    progressEl.id = "update-progress";
    progressEl.className = "update-progress";
    updateBtn.parentElement.appendChild(progressEl);
  }
  progressEl.textContent = "업데이트 확인 중...";
  progressEl.style.display = "block";

  try {
    const result = await window.api.updateData();
    if (result.error) {
      showToast(result.error, "error");
    } else if (result.updated === 0) {
      showToast(result.message, "info");
    } else {
      summary = result.summary;
      updateDataInfo();
      renderFrequencyChart();
      renderInsights();
      renderNeverDrawnInfo();
      showToast(result.message, "success");
    }
  } catch { showToast("업데이트 실패: 네트워크 오류", "error"); }

  updateBtn.classList.remove("loading");
  progressEl.style.display = "none";
});

// CSV 업로드
document.getElementById("btn-csv-upload").addEventListener("click", async () => {
  dropdownWrap.classList.remove("open");
  dropdownMenu.classList.add("hidden");

  const result = await window.api.uploadCsv();
  if (result.canceled) return;
  if (result.error) { showToast(result.error, "error"); return; }

  summary = result.summary;
  updateDataInfo();
  renderFrequencyChart();
  renderInsights();
  renderNeverDrawnInfo();
  showToast(result.message, "success");
});

// ─── 빈도 차트 ───

function renderFrequencyChart() {
  const container = document.getElementById("freq-chart");
  container.innerHTML = "";
  const maxCount = Math.max(...summary.frequency.map(f => f.count));

  summary.frequency.forEach(f => {
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

// ─── 인사이트 ───

function renderInsights() {
  const hotEl = document.getElementById("hot-numbers");
  hotEl.innerHTML = "";
  summary.recentHot.forEach(h => {
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
  summary.overdue.forEach(o => {
    const row = document.createElement("div");
    row.className = "card-row";
    row.appendChild(createBall(o.number, true));
    const label = document.createElement("span");
    label.className = "value";
    label.textContent = `${o.gap}회 전 마지막 출현`;
    row.appendChild(label);
    overdueEl.appendChild(row);
  });

  const s = summary.sumStats;
  document.getElementById("sum-stats").innerHTML = `
    <div class="stat-line"><span class="stat-label">평균 합계</span><span class="stat-value">${s.mean}</span></div>
    <div class="stat-line"><span class="stat-label">표준편차</span><span class="stat-value">${s.std}</span></div>
    <div class="stat-line"><span class="stat-label">추천 범위</span><span class="stat-value">${s.range[0]} ~ ${s.range[1]}</span></div>
    <div class="stat-line"><span class="stat-label">분석 회차</span><span class="stat-value">${fmt(summary.total)}회</span></div>
    <div class="stat-line"><span class="stat-label">기간</span><span class="stat-value">${summary.dateRange.from} ~ ${summary.dateRange.to}</span></div>
  `;

  const pairEl = document.getElementById("top-pairs");
  pairEl.innerHTML = "";
  summary.topPairs.forEach(p => {
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

// ═══ 튜토리얼 ═══

const tutorial = {
  steps: [
    {
      title: "로또 추천기에 오신 것을 환영합니다!",
      desc: "1213회차 이상의 역대 당첨번호를 분석하여 7가지 전략으로 번호를 추천합니다. 주요 기능을 안내해 드릴게요.",
      target: null, // 중앙 표시
    },
    {
      title: "번호 추천",
      desc: "7가지 통계 전략(빈도, 핫/콜드, 오래된 번호, 쌍 기반, 홀짝 균형, 앙상블, 마르코프 체인)으로 번호를 추천합니다. 전략별 추출 수도 설정할 수 있어요.",
      target: "#nav-recommend",
    },
    {
      title: "미출현 조합",
      desc: "전체 8,145,060개 조합 중 역대 당첨된 적 없는 조합을 추출합니다. 추출 갯수도 자유롭게 변경할 수 있어요.",
      target: "#nav-neverdrawn",
    },
    {
      title: "빈도 분석",
      desc: "1~45번 각 번호의 전체 출현 빈도를 막대 차트로 시각화합니다.",
      target: "#nav-frequency",
    },
    {
      title: "데이터 업데이트",
      desc: "동행복권에서 최신 당첨번호를 자동으로 가져오거나, CSV 파일을 직접 업로드할 수 있습니다.",
      target: "#btn-update",
    },
  ],

  currentStep: 0,
  overlay: null,
  highlight: null,
  tooltip: null,

  start() {
    this.currentStep = 0;
    this.overlay   = document.getElementById("tutorial-overlay");
    this.highlight = document.getElementById("tutorial-highlight");
    this.tooltip   = document.getElementById("tutorial-tooltip");
    this.overlay.classList.remove("hidden");
    this.render();
  },

  render() {
    const step = this.steps[this.currentStep];

    // 단계 인디케이터
    const stepsEl = document.getElementById("tutorial-steps");
    stepsEl.innerHTML = "";
    for (let i = 0; i < this.steps.length; i++) {
      const dot = document.createElement("div");
      dot.className = `tutorial-dot${i === this.currentStep ? " active" : ""}`;
      stepsEl.appendChild(dot);
    }

    document.getElementById("tutorial-title").textContent = step.title;
    document.getElementById("tutorial-desc").textContent = step.desc;

    const nextBtn = document.getElementById("tutorial-next");
    nextBtn.textContent = this.currentStep === this.steps.length - 1 ? "시작하기" : "다음";

    if (step.target) {
      const targetEl = document.querySelector(step.target);
      if (targetEl) {
        const rect = targetEl.getBoundingClientRect();
        const pad = 6;
        this.highlight.style.display = "block";
        this.highlight.style.left   = `${rect.left - pad}px`;
        this.highlight.style.top    = `${rect.top - pad}px`;
        this.highlight.style.width  = `${rect.width + pad * 2}px`;
        this.highlight.style.height = `${rect.height + pad * 2}px`;

        // 툴팁 위치: 타겟 오른쪽
        const tooltipX = rect.right + 20;
        const tooltipY = Math.max(20, rect.top - 20);
        this.tooltip.style.left = `${Math.min(tooltipX, window.innerWidth - 400)}px`;
        this.tooltip.style.top  = `${tooltipY}px`;
      }
    } else {
      // 중앙
      this.highlight.style.display = "none";
      this.tooltip.style.left = "50%";
      this.tooltip.style.top  = "50%";
      this.tooltip.style.transform = "translate(-50%, -50%)";
    }

    // 타겟이 있으면 transform 리셋
    if (step.target) {
      this.tooltip.style.transform = "none";
    }

    // 애니메이션 리트리거
    this.tooltip.style.animation = "none";
    this.tooltip.offsetHeight; // reflow
    this.tooltip.style.animation = "tooltip-in 0.35s ease";
  },

  next() {
    this.currentStep++;
    if (this.currentStep >= this.steps.length) {
      this.close();
      return;
    }
    this.render();
  },

  close() {
    this.overlay.classList.add("hidden");
    localStorage.setItem("tutorial-done", "1");
  },
};

document.getElementById("tutorial-next").addEventListener("click", () => tutorial.next());
document.getElementById("tutorial-skip").addEventListener("click", () => tutorial.close());
document.getElementById("btn-tutorial").addEventListener("click", () => tutorial.start());

// ─── 앱 버전 표시 ───
async function showVersion() {
  try {
    const ver = await window.api.getAppVersion();
    const el = document.getElementById("app-version");
    if (el) el.textContent = `v${ver}`;
  } catch { /* ignore */ }
}

// ─── 시작 ───
showVersion();
init();
