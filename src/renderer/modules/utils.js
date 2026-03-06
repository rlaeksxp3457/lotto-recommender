export function ballColor(n) {
  if (n <= 10) return "c-yellow";
  if (n <= 20) return "c-blue";
  if (n <= 30) return "c-red";
  if (n <= 40) return "c-gray";
  return "c-green";
}

export function barColor(n) {
  if (n <= 10) return "var(--ball-yellow)";
  if (n <= 20) return "var(--ball-blue)";
  if (n <= 30) return "var(--ball-red)";
  if (n <= 40) return "var(--ball-gray)";
  return "var(--ball-green)";
}

export function createBall(n, small = false, delay = 0) {
  const el = document.createElement("span");
  el.className = `lotto-ball ${ballColor(n)}${small ? " lotto-ball-sm" : ""} ball-animate`;
  el.textContent = n;
  if (delay) el.style.animationDelay = `${delay}ms`;
  return el;
}

export function fmt(n) { return n.toLocaleString(); }

export function showToast(msg, type = "info") {
  const el = document.createElement("div");
  el.className = `toast ${type}`;
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3000);
}
