// ═══ 로또 추천기 v3 — 렌더러 엔트리 ═══

import { state } from "./modules/state.js";
import { showToast } from "./modules/utils.js";
import { initTabs, setupCounter } from "./modules/tabs.js";
import { initTitlebar } from "./modules/titlebar.js";
import { generateTop5 } from "./modules/top5.js";
import { generateRecommendations } from "./modules/recommend.js";
import { renderNeverDrawnInfo, generateNeverDrawn } from "./modules/neverdrawn.js";
import { renderFrequencyChart, renderInsights } from "./modules/charts.js";
import { updateDataInfo, initUpdate } from "./modules/update.js";
import { tutorial, initTutorial } from "./modules/tutorial.js";
import { initPension, generatePensionTop5, generatePensionRecommendations } from "./modules/pension.js";
import { initMyLotto, initMyPension } from "./modules/mynumbers.js";

// ── UI 초기화 ──
initTitlebar();
initTabs();
initTutorial();

const getRecCount = setupCounter("rec-minus", "rec-plus", "rec-count", 1, 10, 1);
const getNdCount = setupCounter("nd-minus", "nd-plus", "nd-count", 1, 20, 5);
const getPensionRecCount = setupCounter("pension-rec-minus", "pension-rec-plus", "pension-rec-count", 1, 10, 1);

// 버튼 이벤트
document.getElementById("btn-top5").addEventListener("click", generateTop5);
document.getElementById("btn-recommend").addEventListener("click", () => generateRecommendations(getRecCount));
document.getElementById("btn-neverdrawn").addEventListener("click", () => generateNeverDrawn(getNdCount));

// 연금복권 버튼 이벤트
document.getElementById("btn-pension-top5").addEventListener("click", generatePensionTop5);
document.getElementById("btn-pension-rec").addEventListener("click", () => generatePensionRecommendations(getPensionRecCount));

initUpdate();

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
  await generateTop5();
  await generateRecommendations(getRecCount);

  // 연금복권 초기화
  await initPension(getPensionRecCount);

  // 내 번호 초기화
  await initMyLotto();
  await initMyPension();

  // 첫 실행 튜토리얼
  if (!localStorage.getItem("tutorial-done")) {
    setTimeout(() => tutorial.start(), 800);
  }
}

// ── 앱 버전 표시 ──

async function showVersion() {
  try {
    const ver = await window.api.getAppVersion();
    const el = document.getElementById("app-version");
    if (el) el.textContent = `v${ver}`;
  } catch { /* ignore */ }
}

showVersion();
init();
