import { showToast, fmt } from "./utils.js";
import { state } from "./state.js";
import { renderFrequencyChart, renderInsights } from "./charts.js";
import { renderNeverDrawnInfo } from "./neverdrawn.js";
import { renderLottoHistory } from "./history.js";
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

  // 데이터 업데이트 프로그래스 모달
  const dataUpdateModal = document.getElementById("data-update-modal");
  const dataUpdateStatus = document.getElementById("data-update-status");

  function showDataUpdateModal(text) {
    if (dataUpdateStatus) dataUpdateStatus.textContent = text;
    if (dataUpdateModal) dataUpdateModal.classList.remove("hidden");
  }

  function hideDataUpdateModal() {
    if (dataUpdateModal) dataUpdateModal.classList.add("hidden");
  }

  // 업데이트 진행률 수신
  window.api.onUpdateProgress((msg) => {
    if (dataUpdateStatus) dataUpdateStatus.textContent = msg;
  });

  // 연금복권 업데이트 진행률 수신
  window.api.onPensionUpdateProgress((msg) => {
    if (dataUpdateStatus) dataUpdateStatus.textContent = msg;
  });

  // 로또 6/45 온라인 업데이트
  document.getElementById("btn-online-update").addEventListener("click", async () => {
    dropdownWrap.classList.remove("open");
    dropdownMenu.classList.add("hidden");
    updateBtn.classList.add("loading");
    showDataUpdateModal("로또 6/45 업데이트 확인 중...");

    try {
      const result = await window.api.updateData();
      if (result.error) {
        showToast(result.error, "error");
      } else if (result.updated === 0 && result.message === "이미 최신 데이터입니다.") {
        showToast(result.message, "info");
      } else {
        if (result.summary) {
          state.summary = result.summary;
          updateDataInfo();
          renderFrequencyChart();
          renderInsights();
          renderNeverDrawnInfo();
          renderLottoHistory();
        }
        showToast(result.message, "success");
      }
    } catch { showToast("업데이트 실패: 네트워크 오류", "error"); }

    updateBtn.classList.remove("loading");
    hideDataUpdateModal();
    checkUpdateNeeded();
  });

  // 연금복권720+ 온라인 업데이트
  document.getElementById("btn-pension-update").addEventListener("click", async () => {
    dropdownWrap.classList.remove("open");
    dropdownMenu.classList.add("hidden");
    updateBtn.classList.add("loading");
    showDataUpdateModal("연금복권720+ 업데이트 확인 중...");

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
    hideDataUpdateModal();
    checkUpdateNeeded();
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
    renderLottoHistory();
    showToast(result.message, "success");
  });

  // 앱 자동 업데이트 알림
  initAppUpdate();
}

// 가장 최근 추첨일의 YYYYMMDD 문자열 반환. 추첨시각 이전이면 지난주로.
function getLastDrawDate(kst, dayOfWeek, hour, minute) {
  const d = new Date(kst);
  const diff = (d.getDay() - dayOfWeek + 7) % 7;
  d.setDate(d.getDate() - diff);
  d.setHours(hour, minute, 0, 0);
  if (d > kst) d.setDate(d.getDate() - 7);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}${m}${dd}`;
}

export function checkUpdateNeeded() {
  const now = new Date();
  const kst = new Date(now.getTime() + (540 + now.getTimezoneOffset()) * 60000);
  let lottoNeed = false;
  let pensionNeed = false;

  // 로또: 토요일(6) 21:15 이후
  if (state.summary?.dateRange?.to) {
    const lastData = state.summary.dateRange.to.replace(/-/g, "");
    const lastDraw = getLastDrawDate(kst, 6, 21, 15);
    if (lastData < lastDraw) lottoNeed = true;
  }

  // 연금복권: 목요일(4) 19:35 이후
  if (state.pensionSummary?.dateRange?.to) {
    const lastData = state.pensionSummary.dateRange.to.replace(/-/g, "");
    const lastDraw = getLastDrawDate(kst, 4, 19, 35);
    if (lastData < lastDraw) pensionNeed = true;
  }

  const btn = document.getElementById("btn-update");
  const lottoBadge = document.getElementById("lotto-update-badge");
  const pensionBadge = document.getElementById("pension-update-badge");

  if (lottoNeed || pensionNeed) btn.classList.add("needs-update");
  else btn.classList.remove("needs-update");

  if (lottoBadge) lottoBadge.classList.toggle("hidden", !lottoNeed);
  if (pensionBadge) pensionBadge.classList.toggle("hidden", !pensionNeed);
}

function initAppUpdate() {
  const modal = document.getElementById("update-modal");
  if (!modal) return;

  const titleEl = modal.querySelector(".update-modal-title");
  const bodyEl = modal.querySelector(".update-modal-body");
  const actionsEl = modal.querySelector(".update-modal-actions");

  function showModal() { modal.classList.remove("hidden"); }
  function hideModal() { modal.classList.add("hidden"); }

  window.api.onAppUpdate((data) => {
    switch (data.type) {
      case "available":
        titleEl.textContent = "업데이트 알림";
        bodyEl.innerHTML = `<p>새 버전 <b>v${data.version}</b>이 있습니다.</p><p>지금 다운로드하시겠습니까?</p>`;
        actionsEl.innerHTML = `
          <button id="btn-update-download" class="modal-btn tray">다운로드</button>
          <button id="btn-update-later" class="modal-btn-cancel">나중에</button>
        `;
        showModal();
        document.getElementById("btn-update-download").addEventListener("click", () => {
          window.api.downloadUpdate();
          bodyEl.innerHTML = `<p>다운로드 중...</p><div class="update-progress-bar"><div class="update-progress-fill" id="update-fill" style="width:0%"></div></div><p class="update-pct" id="update-pct-label">0%</p>`;
          actionsEl.innerHTML = "";
        });
        document.getElementById("btn-update-later").addEventListener("click", hideModal);
        break;
      case "progress": {
        const fill = document.getElementById("update-fill");
        const pctLabel = document.getElementById("update-pct-label");
        if (fill) fill.style.width = `${data.percent}%`;
        if (pctLabel) pctLabel.textContent = `${data.percent}%`;
        break;
      }
      case "error":
        console.warn("[auto-update]", data.message);
        break;
      case "downloaded":
        titleEl.textContent = "다운로드 완료";
        bodyEl.innerHTML = `<p>업데이트 설치 후 앱이 재시작됩니다.</p>`;
        actionsEl.innerHTML = `
          <button id="btn-update-install" class="modal-btn tray">지금 설치</button>
          <button id="btn-update-dismiss" class="modal-btn-cancel">나중에</button>
        `;
        document.getElementById("btn-update-install").addEventListener("click", () => {
          window.api.installUpdate();
        });
        document.getElementById("btn-update-dismiss").addEventListener("click", hideModal);
        break;
    }
  });
}
