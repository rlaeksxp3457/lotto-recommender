import { createBall, showToast } from "./utils.js";
import { state } from "./state.js";
import { createAnimatedAlgoDetail } from "./algo_anim.js";

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

    // 알고리즘 설명 패널 (애니메이션)
    if (rec.howItWorks && rec.setIndex === 0) {
      card.appendChild(createAnimatedAlgoDetail(rec.howItWorks));
    }

    const balls = document.createElement("div");
    balls.className = "rec-balls";
    rec.numbers.forEach((n, i) => {
      balls.appendChild(createBall(n, false, i * 60 + idx * 30));
    });

    const statsRow = document.createElement("div");
    statsRow.className = "rec-stats";
    statsRow.innerHTML = `
      <span>합계: <b>${rec.sum}</b></span>
      <span>홀: <b>${rec.odd}</b> 짝: <b>${rec.even}</b></span>
      <span>저(1-22): <b>${rec.low}</b> 고(23-45): <b>${rec.high}</b></span>
    `;

    // 저장 버튼
    const saveBtn = document.createElement("button");
    saveBtn.className = "rec-save-btn";
    saveBtn.innerHTML = '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/></svg> 저장';
    saveBtn.addEventListener("click", async () => {
      const round = (state.summary?.lastRound || 0) + 1;
      saveBtn.disabled = true;
      saveBtn.innerHTML = '<span class="spinner"></span>';
      const res = await window.api.myNumbersSave({
        type: "lotto", round, numbers: [...rec.numbers],
      });
      if (res.error) {
        showToast(res.error, "error");
        saveBtn.disabled = false;
        saveBtn.innerHTML = '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/></svg> 저장';
        return;
      }
      showToast(`${round}회 번호가 내 번호에 저장되었습니다.`, "success");
      saveBtn.innerHTML = "✓ 저장됨";
    });

    card.appendChild(balls);
    card.appendChild(statsRow);
    card.appendChild(saveBtn);
    container.appendChild(card);
  });

  btn.disabled = false;
  btn.textContent = "다시 추천받기";
}
