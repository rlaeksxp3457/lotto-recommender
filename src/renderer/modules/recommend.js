import { createBall, showToast } from "./utils.js";

function createAlgoDetail(howItWorks) {
  const detail = document.createElement("div");
  detail.className = "algo-detail";
  howItWorks.forEach((step, i) => {
    const stepEl = document.createElement("div");
    stepEl.className = "algo-step";
    stepEl.innerHTML = `<span class="algo-step-num">${i + 1}</span><span>${step}</span>`;
    detail.appendChild(stepEl);
  });
  return detail;
}

export async function generateRecommendations(getCount) {
  const btn = document.getElementById("btn-recommend");
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span>분석 중...';

  const count = getCount();
  const result = await window.api.getRecommendations(count);
  const container = document.getElementById("recommendations");
  container.innerHTML = "";

  if (result.error) {
    showToast(result.error, "error");
    btn.disabled = false;
    btn.textContent = "번호 추천받기";
    return;
  }

  result.recommendations.forEach((rec, idx) => {
    const card = document.createElement("div");
    card.className = "rec-card";

    const setLabel = count > 1 ? ` #${rec.setIndex + 1}` : "";
    const header = document.createElement("div");
    header.className = "rec-card-header";
    header.innerHTML = `
      <h3>${rec.name}${setLabel}</h3>
      <span class="desc">${rec.desc}</span>
    `;

    // 알고리즘 도움말 버튼 (첫 번째 세트에만 표시)
    if (rec.howItWorks && rec.setIndex === 0) {
      const infoBtn = document.createElement("button");
      infoBtn.className = "algo-info-btn";
      infoBtn.innerHTML = "ℹ";
      infoBtn.title = "알고리즘 동작 원리";
      infoBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        const detail = card.querySelector(".algo-detail");
        if (detail) {
          detail.classList.toggle("open");
          infoBtn.classList.toggle("active");
        }
      });
      header.appendChild(infoBtn);
    }

    card.appendChild(header);

    // 알고리즘 설명 패널
    if (rec.howItWorks && rec.setIndex === 0) {
      card.appendChild(createAlgoDetail(rec.howItWorks));
    }

    const balls = document.createElement("div");
    balls.className = "rec-balls";
    rec.numbers.forEach((n, i) => {
      balls.appendChild(createBall(n, false, i * 60 + idx * 30));
    });

    const stats = document.createElement("div");
    stats.className = "rec-stats";
    stats.innerHTML = `
      <span>합계: <b>${rec.sum}</b></span>
      <span>홀: <b>${rec.odd}</b> 짝: <b>${rec.even}</b></span>
      <span>저(1-22): <b>${rec.low}</b> 고(23-45): <b>${rec.high}</b></span>
    `;

    card.appendChild(balls);
    card.appendChild(stats);
    container.appendChild(card);
  });

  btn.disabled = false;
  btn.textContent = "다시 추천받기";
}
