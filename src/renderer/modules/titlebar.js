export function initTitlebar() {
  document.getElementById("btn-minimize").addEventListener("click", () => {
    window.api.windowMinimize();
  });

  document.getElementById("btn-maximize").addEventListener("click", async () => {
    await window.api.windowMaximize();
    updateMaxBtn();
  });

  document.getElementById("btn-close").addEventListener("click", () => {
    window.api.windowClose();
  });

  window.addEventListener("resize", updateMaxBtn);
  updateMaxBtn();
}

async function updateMaxBtn() {
  const isMax = await window.api.windowIsMaximized();
  const btn = document.getElementById("btn-maximize");
  btn.innerHTML = isMax
    ? '<svg viewBox="0 0 12 12" width="12" height="12"><rect x="1.5" y="3" width="7" height="7" stroke="currentColor" fill="none" stroke-width="1.2"/><polyline points="3.5,3 3.5,1.5 10.5,1.5 10.5,8.5 9,8.5" stroke="currentColor" fill="none" stroke-width="1.2"/></svg>'
    : '<svg viewBox="0 0 12 12" width="12" height="12"><rect x="1.5" y="1.5" width="9" height="9" stroke="currentColor" fill="none" stroke-width="1.2"/></svg>';
}
