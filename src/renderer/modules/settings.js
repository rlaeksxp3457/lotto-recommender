// ═══ 설정 모듈 ═══

import { showToast, showConfirm } from "./utils.js";

export function initSettings() {
  // ── 닫기 동작 라디오 ──
  const saved = localStorage.getItem("close-action") || "";
  const radios = document.querySelectorAll('#settings-close-action input[name="close-action"]');
  radios.forEach(r => {
    r.checked = r.value === saved;
    r.addEventListener("change", () => {
      if (r.checked) {
        if (r.value === "") {
          localStorage.removeItem("close-action");
        } else {
          localStorage.setItem("close-action", r.value);
        }
        showToast("닫기 동작이 변경되었습니다.", "success");
      }
    });
  });

  // ── 개발자 도구 토글 ──
  const devToggle = document.getElementById("settings-devtools");
  devToggle.addEventListener("change", () => {
    window.api.toggleDevTools();
  });

  // ── 백테스트 게임 수 설정 ──
  const btSelect = document.getElementById("settings-backtest-games");
  const savedBt = localStorage.getItem("backtest-games") || "100";
  btSelect.value = savedBt;
  btSelect.addEventListener("change", () => {
    localStorage.setItem("backtest-games", btSelect.value);
    showToast("백테스트 설정이 변경되었습니다. 다음 시작 시 적용됩니다.", "success");
  });

  // ── 모든 설정 초기화 ──
  document.getElementById("settings-clear-all").addEventListener("click", async () => {
    if (await showConfirm("모든 설정을 초기화하시겠습니까?\n(저장된 번호 데이터는 유지됩니다)")) {
      localStorage.clear();
      showToast("설정이 초기화되었습니다. 새로고침합니다.", "success");
      setTimeout(() => location.reload(), 500);
    }
  });
}
