// ═══ 로또 추천기 v3 — 렌더러 엔트리 ═══

import { state } from "./modules/state.js";
import { showToast } from "./modules/utils.js";
import { initTabs, setupCounter, onTabChange } from "./modules/tabs.js";
import { initTitlebar } from "./modules/titlebar.js";
import { generateTop5 } from "./modules/top5.js";
import { generateRecommendations, initAlgoFilter } from "./modules/recommend.js";
import { renderNeverDrawnInfo, generateNeverDrawn } from "./modules/neverdrawn.js";
import { renderFrequencyChart, renderInsights } from "./modules/charts.js";
import { renderLottoHistory } from "./modules/history.js";
import { updateDataInfo, initUpdate, checkUpdateNeeded } from "./modules/update.js";
import { initHelp } from "./modules/help.js";
import { initPension, generatePensionTop5, generatePensionRecommendations } from "./modules/pension.js";
import { initMyLotto, initMyPension, refreshMyNumbers } from "./modules/mynumbers.js";
import { initAdvancedAnalysis } from "./modules/advanced.js";
import { initPensionAdvancedAnalysis } from "./modules/pension_advanced.js";
import { initChangelog } from "./modules/changelog.js";
import { initSettings } from "./modules/settings.js";

// ── Electron 기본 드래그앤드롭 방지 (파일 열기 등) ──
document.addEventListener("dragover", (e) => e.preventDefault());
document.addEventListener("drop", (e) => e.preventDefault());

// ── UI 초기화 ──
initTitlebar();
initTabs();
initHelp();
initSettings();

const getRecCount = setupCounter("rec-minus", "rec-plus", "rec-count", 1, 10, 1);
const getNdCount = setupCounter("nd-minus", "nd-plus", "nd-count", 1, 20, 5);
const getPensionRecCount = setupCounter("pension-rec-minus", "pension-rec-plus", "pension-rec-count", 1, 10, 1);

// 알고리즘 필터 (init에서 getSelectedAlgos가 설정됨)
let getLottoSelectedAlgos = null;
let getPensionSelectedAlgos = null;

// 버튼 이벤트
document.getElementById("btn-top5").addEventListener("click", generateTop5);
document.getElementById("btn-recommend").addEventListener("click", () => generateRecommendations(getRecCount, getLottoSelectedAlgos));
document.getElementById("btn-neverdrawn").addEventListener("click", () => generateNeverDrawn(getNdCount));

// 연금복권 버튼 이벤트
document.getElementById("btn-pension-top5").addEventListener("click", generatePensionTop5);
document.getElementById("btn-pension-rec").addEventListener("click", () => generatePensionRecommendations(getPensionRecCount, getPensionSelectedAlgos));

initUpdate();

// ── 후원 모달 ──
(function initDonate() {
  const btn = document.getElementById("btn-donate");
  const modal = document.getElementById("donate-modal");
  const closeBtn = document.getElementById("donate-close-btn");
  const copyBtn = document.getElementById("donate-copy-btn");

  btn.addEventListener("click", () => modal.classList.remove("hidden"));
  closeBtn.addEventListener("click", () => modal.classList.add("hidden"));
  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.classList.add("hidden");
  });
  copyBtn.addEventListener("click", () => {
    navigator.clipboard.writeText("100038949476").then(() => {
      showToast("계좌번호가 복사되었습니다.", "success");
    });
  });
})();

// 탭 전환 시 내 번호 목록 새로고침
onTabChange((tab) => {
  if (tab === "my-lotto") refreshMyNumbers("lotto");
  else if (tab === "my-pension") refreshMyNumbers("pension");
});

// ── 백테스트 프로그래스 모달 ──

const BACKTEST_TIPS = [
  "로또 1등 확률은 8,145,060분의 1입니다",
  "가장 많이 나온 번호는 34번입니다",
  "연금복권 1등 당첨금은 월 700만원 × 20년입니다",
  "로또는 매주 토요일 오후 8시 35분에 추첨합니다",
  "역대 최고 1등 당첨금은 407억원입니다",
  "6개 숫자를 모두 맞출 확률은 약 0.0000123%입니다",
  "연금복권은 매주 목요일 오후 7시 5분에 추첨합니다",
  "로또 번호 합계 평균은 약 135입니다",
];

function initBacktestModal() {
  const modal = document.getElementById("backtest-modal");
  const lottoBar = document.getElementById("bt-lotto-bar");
  const pensionBar = document.getElementById("bt-pension-bar");
  const lottoPct = document.getElementById("bt-lotto-pct");
  const pensionPct = document.getElementById("bt-pension-pct");
  const tipEl = document.getElementById("backtest-tip");

  let doneCount = 0;
  let tipInterval = null;

  function showModal() {
    doneCount = 0;
    lottoBar.style.width = "0%";
    pensionBar.style.width = "0%";
    lottoPct.textContent = "0%";
    pensionPct.textContent = "0%";
    modal.classList.remove("hidden");

    // 팁 순환
    let tipIdx = Math.floor(Math.random() * BACKTEST_TIPS.length);
    tipEl.textContent = BACKTEST_TIPS[tipIdx];
    tipInterval = setInterval(() => {
      tipIdx = (tipIdx + 1) % BACKTEST_TIPS.length;
      tipEl.style.opacity = "0";
      setTimeout(() => {
        tipEl.textContent = BACKTEST_TIPS[tipIdx];
        tipEl.style.opacity = "1";
      }, 300);
    }, 3000);
  }

  function hideModal() {
    if (tipInterval) { clearInterval(tipInterval); tipInterval = null; }
    modal.classList.add("hidden");
  }

  window.api.onBacktestProgress((data) => {
    if (data.type === "lotto") {
      lottoBar.style.width = data.pct + "%";
      lottoPct.textContent = data.pct + "%";
    } else if (data.type === "pension") {
      pensionBar.style.width = data.pct + "%";
      pensionPct.textContent = data.pct + "%";
    }
  });

  window.api.onBacktestDone((data) => {
    if (data.type === "lotto") {
      lottoBar.style.width = "100%";
      lottoPct.textContent = "100%";
      state.lottoBacktest = data.results;
    } else if (data.type === "pension") {
      pensionBar.style.width = "100%";
      pensionPct.textContent = "100%";
      state.pensionBacktest = data.results;
    }
    doneCount++;
    if (doneCount >= 2) {
      setTimeout(hideModal, 600);
    }
  });

  return { showModal };
}

// ── 데이터 로드 & 초기 렌더 ──

async function init() {
  const result = await window.api.initData();
  if (result.error) { showToast(result.error, "error"); return; }

  state.summary = result.summary;
  updateDataInfo();
  document.getElementById("btn-recommend").disabled = false;
  document.getElementById("btn-neverdrawn").disabled = false;
  document.getElementById("btn-top5").disabled = false;

  renderFrequencyChart();
  renderInsights();
  renderNeverDrawnInfo();
  await renderLottoHistory();
  await generateTop5();

  // 알고리즘 필터 초기화
  getLottoSelectedAlgos = await initAlgoFilter("lotto");
  await generateRecommendations(getRecCount, getLottoSelectedAlgos);

  // 연금복권 초기화
  getPensionSelectedAlgos = await initAlgoFilter("pension");
  await initPension(getPensionRecCount, getPensionSelectedAlgos);

  // 내 번호 초기화
  await initMyLotto();
  await initMyPension();

  // 고급 분석 초기화
  initAdvancedAnalysis();
  initPensionAdvancedAnalysis();

  // 업데이트 필요 여부 체크 (버튼 반짝임)
  checkUpdateNeeded();

  // 백테스트 시작 (Worker 병렬 실행)
  const btModal = initBacktestModal();
  btModal.showModal();
  const backtestGames = parseInt(localStorage.getItem("backtest-games") || "100");
  window.api.startBacktest(backtestGames);

}

// ── 앱 버전 표시 ──

async function showVersion() {
  try {
    const ver = await window.api.getAppVersion();
    const el = document.getElementById("app-version");
    if (el) el.textContent = `v${ver}`;
  } catch { /* ignore */ }
  initChangelog();
}

showVersion();
init();

// ── 상단 이동 플로팅 버튼 ──
{
  const btn = document.getElementById("scroll-top-btn");
  const content = document.querySelector(".content");
  if (btn && content) {
    content.addEventListener("scroll", () => {
      btn.classList.toggle("visible", content.scrollTop > 300);
    });
    btn.addEventListener("click", () => {
      content.scrollTo({ top: 0, behavior: "smooth" });
    });
  }
}
