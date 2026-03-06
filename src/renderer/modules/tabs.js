export function initTabs() {
  document.querySelectorAll(".nav-item[data-tab]").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".nav-item[data-tab]").forEach(b => b.classList.remove("active"));
      document.querySelectorAll(".tab-content").forEach(s => s.classList.remove("active"));
      btn.classList.add("active");
      document.getElementById(`tab-${btn.dataset.tab}`).classList.add("active");
    });
  });
}

export function setupCounter(minusId, plusId, valueId, min, max, defaultVal) {
  const el = document.getElementById(valueId);
  let val = defaultVal;
  el.textContent = val;

  document.getElementById(minusId).addEventListener("click", () => {
    if (val > min) { val--; el.textContent = val; }
  });
  document.getElementById(plusId).addEventListener("click", () => {
    if (val < max) { val++; el.textContent = val; }
  });

  return () => parseInt(el.textContent);
}
