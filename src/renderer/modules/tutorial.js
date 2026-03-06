export const tutorial = {
  steps: [
    {
      title: "로또 추천기에 오신 것을 환영합니다!",
      desc: "1213회차 이상의 역대 당첨번호를 분석하여 7가지 전략으로 번호를 추천합니다. 주요 기능을 안내해 드릴게요.",
      target: null,
    },
    {
      title: "BEST 5 추천",
      desc: "백테스트 성능 상위 5개 전략에서 각 1게임씩, 총 5게임을 로또 용지 형태로 추천합니다.",
      target: "#btn-top5",
    },
    {
      title: "전략별 번호 추천",
      desc: "7가지 통계 전략(빈도, 핫/콜드, 오래된 번호, 쌍 기반, 홀짝 균형, 앙상블, 마르코프 체인)으로 번호를 추천합니다.",
      target: "#nav-recommend",
    },
    {
      title: "미출현 조합",
      desc: "전체 8,145,060개 조합 중 역대 당첨된 적 없는 조합을 추출합니다.",
      target: "#nav-neverdrawn",
    },
    {
      title: "빈도 분석",
      desc: "1~45번 각 번호의 전체 출현 빈도를 막대 차트로 시각화합니다.",
      target: "#nav-frequency",
    },
    {
      title: "핫/콜드 분석",
      desc: "최근 트렌드, 오래된 미출현 번호, 합계 통계, 빈출 쌍 정보를 한눈에 확인합니다.",
      target: "#nav-insights",
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
    this.overlay = document.getElementById("tutorial-overlay");
    this.highlight = document.getElementById("tutorial-highlight");
    this.tooltip = document.getElementById("tutorial-tooltip");
    this.overlay.classList.remove("hidden");
    this.render(false);
  },

  positionTooltip(step, animate) {
    const tt = this.tooltip;

    // 이전 transform / transition 초기화
    tt.style.transition = animate ? "left 0.35s ease, top 0.35s ease" : "none";
    tt.style.transform = "";

    if (!step.target) {
      // 화면 중앙 배치 (px 계산)
      const ttW = tt.offsetWidth || 360;
      const ttH = tt.offsetHeight || 200;
      tt.style.left = `${(window.innerWidth - ttW) / 2}px`;
      tt.style.top = `${(window.innerHeight - ttH) / 2}px`;
      this.highlight.style.display = "none";
      return;
    }

    const targetEl = document.querySelector(step.target);
    if (!targetEl) { this.highlight.style.display = "none"; return; }

    const rect = targetEl.getBoundingClientRect();
    const pad = 6;

    // 하이라이트 위치
    this.highlight.style.display = "block";
    if (animate) {
      this.highlight.style.transition = "all 0.35s cubic-bezier(0.4,0,0.2,1)";
    } else {
      this.highlight.style.transition = "none";
    }
    this.highlight.style.left = `${rect.left - pad}px`;
    this.highlight.style.top = `${rect.top - pad}px`;
    this.highlight.style.width = `${rect.width + pad * 2}px`;
    this.highlight.style.height = `${rect.height + pad * 2}px`;

    // 툴팁 배치: 타겟 우측, 공간 부족 시 좌측, 그래도 안 되면 하단
    const ttW = tt.offsetWidth || 360;
    const ttH = tt.offsetHeight || 200;
    const gap = 16;
    let x, y;

    // 우측
    if (rect.right + gap + ttW < window.innerWidth - 20) {
      x = rect.right + gap;
      y = Math.max(20, Math.min(rect.top, window.innerHeight - ttH - 20));
    }
    // 좌측
    else if (rect.left - gap - ttW > 20) {
      x = rect.left - gap - ttW;
      y = Math.max(20, Math.min(rect.top, window.innerHeight - ttH - 20));
    }
    // 하단
    else {
      x = Math.max(20, (window.innerWidth - ttW) / 2);
      y = rect.bottom + gap;
      if (y + ttH > window.innerHeight - 20) {
        y = rect.top - gap - ttH;
      }
    }

    tt.style.left = `${x}px`;
    tt.style.top = `${y}px`;
  },

  render(animate = true) {
    const step = this.steps[this.currentStep];

    // 스텝 인디케이터
    const stepsEl = document.getElementById("tutorial-steps");
    stepsEl.innerHTML = "";
    for (let i = 0; i < this.steps.length; i++) {
      const dot = document.createElement("div");
      dot.className = `tutorial-dot${i === this.currentStep ? " active" : ""}${i < this.currentStep ? " done" : ""}`;
      stepsEl.appendChild(dot);
    }

    // 스텝 카운터
    document.getElementById("tutorial-counter").textContent =
      `${this.currentStep + 1} / ${this.steps.length}`;

    // 내용
    document.getElementById("tutorial-title").textContent = step.title;
    document.getElementById("tutorial-desc").textContent = step.desc;

    // 버튼 상태
    const prevBtn = document.getElementById("tutorial-prev");
    const nextBtn = document.getElementById("tutorial-next");
    prevBtn.style.display = this.currentStep === 0 ? "none" : "";
    nextBtn.textContent = this.currentStep === this.steps.length - 1 ? "시작하기" : "다음";

    // 먼저 내용 렌더 후 위치 계산 (offsetWidth 필요)
    this.positionTooltip(step, animate);

    // 페이드인 (첫 등장 or 내용 변경 시)
    if (!animate) {
      this.tooltip.classList.remove("tutorial-fade");
      void this.tooltip.offsetHeight;
      this.tooltip.classList.add("tutorial-fade");
    }
  },

  next() {
    this.currentStep++;
    if (this.currentStep >= this.steps.length) {
      this.close();
      return;
    }
    this.render(true);
  },

  prev() {
    if (this.currentStep <= 0) return;
    this.currentStep--;
    this.render(true);
  },

  close() {
    this.overlay.classList.add("hidden");
    this.highlight.style.display = "none";
    localStorage.setItem("tutorial-done", "1");
  },
};

export function initTutorial() {
  document.getElementById("tutorial-next").addEventListener("click", () => tutorial.next());
  document.getElementById("tutorial-prev").addEventListener("click", () => tutorial.prev());
  document.getElementById("tutorial-skip").addEventListener("click", () => tutorial.close());
  document.getElementById("btn-tutorial").addEventListener("click", () => tutorial.start());
}
