export const tutorial = {
  steps: [
    {
      title: "로또 추천기에 오신 것을 환영합니다!",
      desc: "1213회차 이상의 역대 당첨번호를 분석하여 7가지 전략으로 번호를 추천합니다. 주요 기능을 안내해 드릴게요.",
      target: null,
    },
    {
      title: "번호 추천",
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
    this.render();
  },

  render() {
    const step = this.steps[this.currentStep];

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
        this.highlight.style.left = `${rect.left - pad}px`;
        this.highlight.style.top = `${rect.top - pad}px`;
        this.highlight.style.width = `${rect.width + pad * 2}px`;
        this.highlight.style.height = `${rect.height + pad * 2}px`;

        const tooltipX = rect.right + 20;
        const tooltipY = Math.max(20, rect.top - 20);
        this.tooltip.style.left = `${Math.min(tooltipX, window.innerWidth - 400)}px`;
        this.tooltip.style.top = `${tooltipY}px`;
      }
    } else {
      this.highlight.style.display = "none";
      this.tooltip.style.left = "50%";
      this.tooltip.style.top = "50%";
      this.tooltip.style.transform = "translate(-50%, -50%)";
    }

    if (step.target) {
      this.tooltip.style.transform = "none";
    }

    this.tooltip.style.animation = "none";
    this.tooltip.offsetHeight;
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

export function initTutorial() {
  document.getElementById("tutorial-next").addEventListener("click", () => tutorial.next());
  document.getElementById("tutorial-skip").addEventListener("click", () => tutorial.close());
  document.getElementById("btn-tutorial").addEventListener("click", () => tutorial.start());
}
