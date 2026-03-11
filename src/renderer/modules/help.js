// ═══ 페이지별 도움말 (튜토리얼 스타일) ═══

const HELP_DATA = {
  recommend: {
    title: "번호 추천",
    steps: [
      { title: "BEST 5 추천", desc: "백테스트 성능 상위 5개 알고리즘에서 각 1게임씩 자동 추천합니다. 가장 빠르게 5게임을 받아볼 수 있습니다.", target: "#btn-top5" },
      { title: "알고리즘 선택", desc: "칩을 클릭하여 원하는 알고리즘만 선택/해제할 수 있습니다. 전체 선택/해제 버튼도 있습니다.", target: "#lotto-algo-filter" },
      { title: "추출 수 조절", desc: "+/- 버튼으로 알고리즘별 1~10게임까지 한 번에 추천받을 수 있습니다.", target: "#tab-recommend .count-control" },
      { title: "번호 추천받기", desc: "선택한 알고리즘으로 번호를 추천받습니다. 결과 카드의 ℹ 버튼으로 알고리즘 동작 원리를 애니메이션으로 확인하고, 💾 버튼으로 개별 저장하거나 하단의 전체 저장 버튼을 사용할 수 있습니다. 저장된 번호는 '내 번호' 페이지에서 관리됩니다.", target: "#btn-recommend" },
      { title: "백테스트 성능", desc: "각 알고리즘의 과거 당첨 성능을 표로 확인할 수 있습니다. 적중률이 높은 알고리즘을 참고하여 선택하세요.", target: "#tab-recommend .bt-collapsible" },
    ],
  },
  neverdrawn: {
    title: "미출현 조합",
    steps: [
      { title: "미출현 조합이란?", desc: "전체 8,145,060개 조합 중 역대 한 번도 당첨된 적 없는 6개 번호 조합을 랜덤으로 추출합니다.", target: ".never-drawn-info" },
      { title: "추출 수 조절", desc: "+/- 버튼으로 1~20개까지 한 번에 추출할 수 있습니다.", target: "#tab-neverdrawn .count-control" },
      { title: "조합 추출", desc: "버튼을 누르면 미출현 조합이 카드 형태로 표시됩니다. 미출현 비율은 99.99% 이상으로, 거의 모든 조합이 미출현입니다.", target: "#btn-neverdrawn" },
    ],
  },
  frequency: {
    title: "빈도 분석",
    steps: [
      { title: "출현 빈도 차트", desc: "1~45번 각 번호가 역대 추첨에서 몇 번 출현했는지 막대 차트로 보여줍니다. 막대 위의 숫자가 해당 번호의 총 출현 횟수입니다.", target: "#freq-chart" },
    ],
  },
  insights: {
    title: "핫/콜드 분석",
    steps: [
      { title: "핫 번호", desc: "최근 50회 추첨에서 자주 등장한 번호입니다. 뜨거운 트렌드를 파악할 수 있습니다.", target: "#hot-numbers" },
      { title: "오래된 미출현 번호", desc: "가장 오랫동안 당첨번호에 포함되지 않은 번호입니다. 출현 가능성을 예측하는 데 참고할 수 있습니다.", target: "#overdue-numbers" },
      { title: "합계 통계", desc: "당첨번호 6개의 합계 평균과 범위를 보여줍니다. 대부분의 당첨번호는 일정 합계 범위 안에 있습니다.", target: "#sum-stats" },
      { title: "빈출 쌍 Top 10", desc: "역대 추첨에서 함께 자주 등장한 2개 번호 조합 상위 10개입니다.", target: "#top-pairs" },
    ],
  },
  advanced: {
    title: "고급 분석",
    steps: [
      { title: "분석 설정", desc: "최근 회차 수를 선택하고 '분석 실행' 버튼을 눌러야 결과가 표시됩니다. 회차 수를 변경하면 분석 범위가 달라집니다.", target: "#tab-advanced .adv-controls" },
      { title: "AC값 분석", desc: "당첨번호 간 차이값의 다양성을 측정합니다. AC값이 높을수록 번호가 고르게 분산되어 있습니다.", target: "#ac-analysis" },
      { title: "끝수 / 연번 / 번호대", desc: "번호의 끝자리 분포, 연속 번호(예: 5,6) 출현 빈도, 1~10/11~20 등 구간별 분포를 분석합니다.", target: "#ending-analysis" },
      { title: "낙수표", desc: "각 번호의 출현 여부를 회차별 격자로 시각화합니다. 번호별 출현 패턴을 한눈에 파악할 수 있습니다.", target: "#drop-chart-analysis" },
      { title: "후나츠 사카이", desc: "이전 회차 당첨번호와의 관계를 분석하는 일본 통계 기법입니다.", target: "#funatsu-analysis" },
    ],
  },
  "lotto-history": {
    title: "당첨 이력",
    steps: [
      { title: "최근 당첨번호", desc: "최근 50회 로또 6/45 1등 당첨번호를 회차순으로 표시합니다. 보너스 번호는 + 표시 뒤에 별도로 표시됩니다.", target: "#lotto-history" },
    ],
  },
  "my-lotto": {
    title: "내 번호 관리",
    steps: [
      { title: "번호 입력", desc: "회차를 입력하고 1~45 사이의 번호 6개를 입력하여 저장합니다. '+ 행 추가'로 한 회차에 최대 5세트까지 입력 가능합니다.", target: "#tab-my-lotto .my-numbers-form" },
      { title: "회차 필터", desc: "특정 회차만 필터링하여 볼 수 있습니다.", target: "#my-lotto-filter" },
      { title: "내보내기 / 가져오기", desc: "저장된 번호를 JSON 파일로 백업하거나 복원할 수 있습니다. 추천 페이지에서 저장한 번호도 여기서 관리됩니다.", target: "#tab-my-lotto .my-numbers-io-btns" },
      { title: "당첨 결과 확인", desc: "데이터가 있는 회차의 번호는 자동으로 당첨 여부가 표시됩니다. 저장 후 목록에서 확인하세요.", target: "#my-lotto-list" },
    ],
  },
  "pension-recommend": {
    title: "연금복권 추천",
    steps: [
      { title: "TOP 5 추천", desc: "위치별 빈도 분석 기반 상위 5개 알고리즘에서 각 1게임씩 추천합니다.", target: "#btn-pension-top5" },
      { title: "알고리즘 선택", desc: "칩을 클릭하여 원하는 알고리즘만 선택/해제할 수 있습니다.", target: "#pension-algo-filter" },
      { title: "추출 수 조절", desc: "+/- 버튼으로 알고리즘별 1~10게임까지 추천받을 수 있습니다.", target: "#tab-pension-recommend .count-control" },
      { title: "번호 추천받기", desc: "선택한 알고리즘으로 번호를 추천받습니다. ℹ 버튼으로 알고리즘 상세를 확인하고, 💾로 내 번호에 저장할 수 있습니다.", target: "#btn-pension-rec" },
    ],
  },
  "pension-history": {
    title: "연금복권 당첨 이력",
    steps: [
      { title: "최근 당첨번호", desc: "최근 50회 연금복권720+ 1등 당첨번호를 회차순으로 표시합니다. 각 회차의 당첨 조(1~5조)와 6자리 번호가 함께 표시됩니다.", target: "#pension-history" },
    ],
  },
  "pension-frequency": {
    title: "연금복권 빈도 분석",
    steps: [
      { title: "위치별 빈도", desc: "조 + 6자리 각 위치별로 0~9 숫자의 출현 빈도를 차트로 보여줍니다.", target: "#pension-freq-chart" },
      { title: "조별 분포", desc: "1조~5조 중 어느 조가 가장 많이 당첨되었는지 비교할 수 있습니다.", target: "#pension-group-dist" },
    ],
  },
  "pension-pattern": {
    title: "연금복권 패턴 분석",
    steps: [
      { title: "위치별 핫/콜드", desc: "각 자릿수에서 최근 자주 나오는 숫자와 오래 안 나온 숫자를 확인합니다.", target: "#pension-hot" },
      { title: "인접쌍 빈도", desc: "옆자리끼리 자주 함께 나오는 숫자 조합 상위 10개를 보여줍니다.", target: "#pension-adjacent-pairs" },
      { title: "자릿수 합계", desc: "6자리 숫자의 합계 분포를 분석합니다. 특정 합계 범위에 집중되는 경향을 파악합니다.", target: "#pension-digit-sum" },
    ],
  },
  "pension-advanced": {
    title: "연금복권 고급 분석",
    steps: [
      { title: "분석 설정", desc: "'분석 실행' 버튼을 눌러야 결과가 표시됩니다. 최근 회차 수를 변경하면 분석 범위가 달라집니다.", target: "#tab-pension-advanced .adv-controls" },
      { title: "숫자 반복 / 홀짝", desc: "같은 숫자가 여러 위치에 반복 출현하는 패턴과 각 자릿수별 홀짝 비율을 분석합니다.", target: "#pen-digit-repeat" },
      { title: "낙수표", desc: "각 위치별 숫자 출현을 회차별 격자로 시각화합니다.", target: "#pen-drop-chart" },
      { title: "후나츠 사카이", desc: "이전 회차와의 관계를 분석하는 통계 기법입니다.", target: "#pen-funatsu" },
    ],
  },
  "my-pension": {
    title: "연금복권 내 번호",
    steps: [
      { title: "번호 입력", desc: "회차를 입력하고 조(1~5) + 6자리 숫자를 입력하여 저장합니다. '+ 행 추가'로 최대 5세트까지 입력 가능합니다.", target: "#tab-my-pension .my-numbers-form" },
      { title: "회차 필터", desc: "특정 회차만 필터링하여 볼 수 있습니다.", target: "#my-pension-filter" },
      { title: "내보내기 / 가져오기", desc: "저장된 번호를 JSON 파일로 백업하거나 복원할 수 있습니다.", target: "#tab-my-pension .my-numbers-io-btns" },
      { title: "당첨 결과 확인", desc: "데이터가 있는 회차의 번호는 자동으로 당첨 여부가 표시됩니다.", target: "#my-pension-list" },
    ],
  },
  settings: {
    title: "설정",
    steps: [
      { title: "닫기 동작", desc: "X 버튼 클릭 시 '항상 물어보기', '트레이 최소화', '완전 종료' 중 원하는 동작을 선택할 수 있습니다.", target: "#settings-close-action" },
      { title: "백테스트 게임 수", desc: "게임 수가 클수록 백테스트 결과가 정확하지만 시간이 더 오래 걸립니다. 변경 후 다음 시작 시 적용됩니다.", target: "#settings-backtest-games" },
      { title: "설정 초기화", desc: "'모든 설정 초기화'를 눌러도 저장된 번호 데이터는 유지됩니다.", target: "#settings-clear-all" },
    ],
  },
};

// ── 상태 ──
let currentTabId = null;
let currentStep = 0;
let overlay = null;
let highlight = null;
let tooltip = null;

function getActiveTabId() {
  const active = document.querySelector(".tab-content.active");
  return active ? active.id.replace("tab-", "") : "recommend";
}

// ── 도움말 시작 ──
function startHelp(tabId) {
  const data = HELP_DATA[tabId];
  if (!data) return;
  currentTabId = tabId;
  currentStep = 0;
  overlay.classList.remove("hidden");
  renderStep(false);
}

// ── 타겟이 뷰포트에 보이는지 확인하고, 필요할 때만 최소한으로 스크롤 ──
function ensureVisible(targetEl) {
  const content = document.querySelector(".content");
  if (!content) return;
  const cRect = content.getBoundingClientRect();
  const tRect = targetEl.getBoundingClientRect();
  const margin = 60; // 여유 공간

  if (tRect.top < cRect.top + margin) {
    // 위로 벗어남 → 위로 스크롤
    content.scrollTop += tRect.top - cRect.top - margin;
  } else if (tRect.bottom > cRect.bottom - margin) {
    // 아래로 벗어남 → 아래로 스크롤
    content.scrollTop += tRect.bottom - cRect.bottom + margin;
  }
}

// ── 툴팁 위치 계산 ──
function positionTooltip(step, animate) {
  // 스텝 표시 전 사전 동작 (예: 접기 열기)
  if (step.beforeShow) step.beforeShow();

  const tt = tooltip;
  tt.style.transition = animate ? "left 0.35s ease, top 0.35s ease" : "none";
  tt.style.transform = "";

  if (!step.target) {
    overlay.classList.add("no-target");
    const ttW = tt.offsetWidth || 360;
    const ttH = tt.offsetHeight || 200;
    tt.style.left = `${(window.innerWidth - ttW) / 2}px`;
    tt.style.top = `${(window.innerHeight - ttH) / 2}px`;
    highlight.style.display = "none";
    return;
  }

  overlay.classList.remove("no-target");
  const targetEl = document.querySelector(step.target);
  if (!targetEl) {
    highlight.style.display = "none";
    const ttW = tt.offsetWidth || 360;
    const ttH = tt.offsetHeight || 200;
    tt.style.left = `${(window.innerWidth - ttW) / 2}px`;
    tt.style.top = `${(window.innerHeight - ttH) / 2}px`;
    return;
  }

  // 뷰포트 밖이면 최소한으로 스크롤 (즉시, 부드럽지 않게)
  ensureVisible(targetEl);

  // 스크롤 후 위치 재계산
  requestAnimationFrame(() => {
    const rect = targetEl.getBoundingClientRect();
    const pad = 6;
    const hlH = rect.height + pad * 2;

    // 하이라이트
    highlight.style.display = "block";
    highlight.style.transition = animate ? "all 0.35s cubic-bezier(0.4,0,0.2,1)" : "none";
    highlight.style.left = `${rect.left - pad}px`;
    highlight.style.top = `${rect.top - pad}px`;
    highlight.style.width = `${rect.width + pad * 2}px`;
    highlight.style.height = `${hlH}px`;

    // 툴팁 위치: 우측 → 좌측 → 상단 중앙 순 시도
    const ttW = tt.offsetWidth || 360;
    const ttH = tt.offsetHeight || 200;
    const gap = 16;
    const hlBottom = rect.top - pad + hlH;
    let x, y;

    // 큰 영역: 툴팁을 하이라이트 내부 상단 중앙에 오버레이
    const isLarge = hlH > window.innerHeight * 0.5;

    if (isLarge) {
      x = rect.left + (rect.width - ttW) / 2;
      y = rect.top + gap;
    } else if (rect.right + gap + ttW < window.innerWidth - 20) {
      x = rect.right + gap;
      y = Math.max(20, Math.min(rect.top, window.innerHeight - ttH - 20));
    } else if (rect.left - gap - ttW > 20) {
      x = rect.left - gap - ttW;
      y = Math.max(20, Math.min(rect.top, window.innerHeight - ttH - 20));
    } else {
      x = Math.max(20, (window.innerWidth - ttW) / 2);
      y = hlBottom + gap;
      if (y + ttH > window.innerHeight - 20) {
        y = rect.top - gap - ttH;
      }
    }

    // 화면 밖 방지 클램핑
    x = Math.max(20, Math.min(x, window.innerWidth - ttW - 20));
    y = Math.max(20, Math.min(y, window.innerHeight - ttH - 20));

    tt.style.left = `${x}px`;
    tt.style.top = `${y}px`;
  });
}

// ── 스텝 렌더링 ──
function renderStep(animate) {
  const data = HELP_DATA[currentTabId];
  const step = data.steps[currentStep];

  // 스텝 인디케이터 (점)
  const stepsEl = document.getElementById("help-steps");
  stepsEl.innerHTML = "";
  for (let i = 0; i < data.steps.length; i++) {
    const dot = document.createElement("div");
    dot.className = `help-dot${i === currentStep ? " active" : ""}${i < currentStep ? " done" : ""}`;
    stepsEl.appendChild(dot);
  }

  // 카운터
  document.getElementById("help-counter").textContent = `${currentStep + 1} / ${data.steps.length}`;

  // 내용
  document.getElementById("help-title").textContent = step.title;
  document.getElementById("help-desc").textContent = step.desc;

  // 버튼 상태
  document.getElementById("help-prev").style.display = currentStep === 0 ? "none" : "";
  document.getElementById("help-next").textContent = currentStep === data.steps.length - 1 ? "완료" : "다음";

  // 위치
  positionTooltip(step, animate);

  // 페이드인
  if (!animate) {
    tooltip.classList.remove("help-fade");
    void tooltip.offsetHeight;
    tooltip.classList.add("help-fade");
  }
}

function nextStep() {
  const data = HELP_DATA[currentTabId];
  currentStep++;
  if (currentStep >= data.steps.length) {
    closeHelp();
    return;
  }
  renderStep(true);
}

function prevStep() {
  if (currentStep <= 0) return;
  currentStep--;
  renderStep(true);
}

function closeHelp() {
  overlay.classList.add("hidden");
  highlight.style.display = "none";
}

// ── 초기화 ──
export function initHelp() {
  // 오버레이 HTML 생성
  const overlayHTML = `
    <div id="help-overlay" class="help-overlay hidden">
      <div id="help-highlight" class="help-highlight"></div>
      <div id="help-tooltip" class="help-tooltip help-fade">
        <div class="help-top-row">
          <div class="help-step-indicator" id="help-steps"></div>
          <span class="help-counter" id="help-counter"></span>
        </div>
        <h3 id="help-title"></h3>
        <p id="help-desc"></p>
        <div class="help-actions">
          <button id="help-skip" class="help-btn-skip">닫기</button>
          <div class="help-nav">
            <button id="help-prev" class="help-btn-prev">이전</button>
            <button id="help-next" class="help-btn-next">다음</button>
          </div>
        </div>
      </div>
    </div>`;
  document.body.insertAdjacentHTML("beforeend", overlayHTML);

  overlay = document.getElementById("help-overlay");
  highlight = document.getElementById("help-highlight");
  tooltip = document.getElementById("help-tooltip");

  // 이벤트
  document.getElementById("help-next").addEventListener("click", () => nextStep());
  document.getElementById("help-prev").addEventListener("click", () => prevStep());
  document.getElementById("help-skip").addEventListener("click", () => closeHelp());
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !overlay.classList.contains("hidden")) closeHelp();
  });

  // 각 탭 헤더에 ? 버튼 삽입
  const helpBtnSVG = `<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/></svg>`;

  Object.keys(HELP_DATA).forEach((tabId) => {
    const section = document.getElementById(`tab-${tabId}`);
    if (!section) return;

    const btn = document.createElement("button");
    btn.className = "help-page-btn";
    btn.title = "도움말";
    btn.innerHTML = helpBtnSVG;
    btn.addEventListener("click", () => startHelp(tabId));

    // recommend / pension-recommend → top header 영역에 절대 위치
    const topHeader = section.querySelector(".top5-header") || section.querySelector(".pension-top-header");
    if (topHeader) {
      topHeader.appendChild(btn);
      return;
    }

    // 나머지 → content-header에 절대 위치로 추가
    const header = section.querySelector(".content-header");
    if (header) {
      header.appendChild(btn);
    }
  });

  // 사이드바 도움말 버튼 → 현재 탭 도움말
  const tutorialBtn = document.getElementById("btn-tutorial");
  if (tutorialBtn) {
    tutorialBtn.addEventListener("click", () => startHelp(getActiveTabId()));
  }
}
