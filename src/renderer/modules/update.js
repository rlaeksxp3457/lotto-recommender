import { showToast, fmt } from "./utils.js";
import { state } from "./state.js";
import { renderFrequencyChart, renderInsights } from "./charts.js";
import { renderNeverDrawnInfo } from "./neverdrawn.js";
import {
  renderPensionFreqChart, renderPensionStats, updatePensionSidebarInfo,
  renderPensionHistory, renderPensionAdjacentPairs, renderPensionDigitSumDist,
} from "./pension.js";

function formatDate(d) {
  if (!d) return "";
  const s = d.replace(/-/g, "");
  if (s.length === 8) return `${s.slice(0, 4)}.${s.slice(4, 6)}.${s.slice(6, 8)}`;
  return d;
}

export function updateDataInfo() {
  const el = document.getElementById("data-info");
  if (state.summary) {
    const s = state.summary;
    el.innerHTML = `<b>로또 6/45</b> ${fmt(s.total)}회차<br>${formatDate(s.dateRange.from)} ~ ${formatDate(s.dateRange.to)}`;
  }
}

export function initUpdate() {
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

  // 연금복권 업데이트 진행률 수신
  window.api.onPensionUpdateProgress((msg) => {
    const progressEl = document.getElementById("update-progress");
    if (progressEl) progressEl.textContent = msg;
  });

  // 진행률 표시 헬퍼
  function showProgress(text) {
    let progressEl = document.getElementById("update-progress");
    if (!progressEl) {
      progressEl = document.createElement("div");
      progressEl.id = "update-progress";
      progressEl.className = "update-progress";
      updateBtn.parentElement.appendChild(progressEl);
    }
    progressEl.textContent = text;
    progressEl.style.display = "block";
    return progressEl;
  }

  // 로또 6/45 온라인 업데이트
  document.getElementById("btn-online-update").addEventListener("click", async () => {
    dropdownWrap.classList.remove("open");
    dropdownMenu.classList.add("hidden");
    updateBtn.classList.add("loading");

    const progressEl = showProgress("로또 6/45 업데이트 확인 중...");

    try {
      const result = await window.api.updateData();
      if (result.error) {
        showToast(result.error, "error");
      } else if (result.updated === 0) {
        showToast(result.message, "info");
      } else {
        state.summary = result.summary;
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

  // 연금복권720+ 온라인 업데이트
  document.getElementById("btn-pension-update").addEventListener("click", async () => {
    dropdownWrap.classList.remove("open");
    dropdownMenu.classList.add("hidden");
    updateBtn.classList.add("loading");

    const progressEl = showProgress("연금복권720+ 업데이트 확인 중...");

    try {
      const result = await window.api.pensionUpdateData();
      if (result.error) {
        showToast(result.error, "error");
      } else if (result.updated === 0) {
        showToast(result.message, "info");
      } else {
        state.pensionSummary = result.summary;
        updatePensionSidebarInfo();
        renderPensionFreqChart();
        renderPensionStats();
        renderPensionAdjacentPairs();
        renderPensionDigitSumDist();
        renderPensionHistory();
        showToast(`연금복권 ${result.message}`, "success");
      }
    } catch { showToast("연금복권 업데이트 실패: 네트워크 오류", "error"); }

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

    state.summary = result.summary;
    updateDataInfo();
    renderFrequencyChart();
    renderInsights();
    renderNeverDrawnInfo();
    showToast(result.message, "success");
  });

  // 앱 자동 업데이트 알림
  initAppUpdate();
}

function initAppUpdate() {
  const banner = document.getElementById("update-banner");
  if (!banner) return;

  window.api.onAppUpdate((data) => {
    switch (data.type) {
      case "available":
        banner.innerHTML = `
          <span>새 버전 v${data.version}이 있습니다!</span>
          <button id="btn-download-update" class="update-banner-btn">다운로드</button>
          <button id="btn-dismiss-update" class="update-banner-dismiss">&times;</button>
        `;
        banner.classList.remove("hidden");
        document.getElementById("btn-download-update").addEventListener("click", () => {
          window.api.downloadUpdate();
          banner.innerHTML = '<span>다운로드 중... <span id="update-percent">0</span>%</span>';
        });
        document.getElementById("btn-dismiss-update").addEventListener("click", () => {
          banner.classList.add("hidden");
        });
        break;
      case "progress": {
        const pctEl = document.getElementById("update-percent");
        if (pctEl) pctEl.textContent = data.percent;
        break;
      }
      case "error":
        console.warn("[auto-update]", data.message);
        break;
      case "downloaded":
        banner.innerHTML = `
          <span>업데이트 다운로드 완료!</span>
          <button id="btn-install-update" class="update-banner-btn">지금 설치</button>
          <button id="btn-later-update" class="update-banner-dismiss">&times;</button>
        `;
        document.getElementById("btn-install-update").addEventListener("click", () => {
          window.api.installUpdate();
        });
        document.getElementById("btn-later-update").addEventListener("click", () => {
          banner.classList.add("hidden");
        });
        break;
    }
  });
}
