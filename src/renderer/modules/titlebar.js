export function initTitlebar() {
  document.getElementById("btn-minimize").addEventListener("click", () => {
    window.api.windowMinimize();
  });

  document.getElementById("btn-maximize").addEventListener("click", async () => {
    await window.api.windowMaximize();
    updateMaxBtn();
  });

  // 닫기 버튼 → 모달 or 저장된 동작
  document.getElementById("btn-close").addEventListener("click", () => {
    const saved = localStorage.getItem("close-action");
    if (saved === "tray") {
      window.api.windowHide();
    } else if (saved === "quit") {
      window.api.windowClose();
    } else {
      showCloseModal();
    }
  });

  // 모달 버튼들
  document.getElementById("modal-tray").addEventListener("click", () => {
    saveCloseChoice("tray");
    hideCloseModal();
    window.api.windowHide();
  });

  document.getElementById("modal-quit").addEventListener("click", () => {
    saveCloseChoice("quit");
    hideCloseModal();
    window.api.windowClose();
  });

  document.getElementById("modal-cancel").addEventListener("click", hideCloseModal);

  // ESC로 모든 모달 닫기
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      document.querySelectorAll(".modal-overlay:not(.hidden)").forEach(m => m.classList.add("hidden"));
    }
  });

  window.addEventListener("resize", updateMaxBtn);
  updateMaxBtn();
}

function showCloseModal() {
  const modal = document.getElementById("close-modal");
  document.getElementById("modal-remember-check").checked = false;
  modal.classList.remove("hidden");
}

function hideCloseModal() {
  document.getElementById("close-modal").classList.add("hidden");
}

function saveCloseChoice(action) {
  if (document.getElementById("modal-remember-check").checked) {
    localStorage.setItem("close-action", action);
  }
}

async function updateMaxBtn() {
  const isMax = await window.api.windowIsMaximized();
  const btn = document.getElementById("btn-maximize");
  btn.innerHTML = isMax
    ? '<svg viewBox="0 0 12 12" width="12" height="12"><rect x="1.5" y="3" width="7" height="7" stroke="currentColor" fill="none" stroke-width="1.2"/><polyline points="3.5,3 3.5,1.5 10.5,1.5 10.5,8.5 9,8.5" stroke="currentColor" fill="none" stroke-width="1.2"/></svg>'
    : '<svg viewBox="0 0 12 12" width="12" height="12"><rect x="1.5" y="1.5" width="9" height="9" stroke="currentColor" fill="none" stroke-width="1.2"/></svg>';
}
