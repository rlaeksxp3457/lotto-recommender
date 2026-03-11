// ═══ 연금복권720+ 렌더러 모듈 ═══

import { state } from "./state.js";
import { showToast, fmt } from "./utils.js";
import { createAnimatedAlgoDetail } from "./algo_anim.js";
import { renderBacktestSummary, getBacktestRankBadge, updateCardBadges } from "./recommend.js";

// ─── 유틸: 숫자 박스 생성 ───

const POS_LABELS = ["조", "1번째", "2번째", "3번째", "4번째", "5번째", "6번째"];

function formatDate(d) {
  if (!d) return "";
  const s = d.replace(/-/g, "");
  if (s.length === 8) return `${s.slice(0, 4)}.${s.slice(4, 6)}.${s.slice(6, 8)}`;
  return d;
}

export function updatePensionSidebarInfo() {
  const el = document.getElementById("pension-sidebar-info");
  if (el && state.pensionSummary) {
    const p = state.pensionSummary;
    el.innerHTML = `<b>연금복권</b> ${fmt(p.total)}회차<br>${formatDate(p.dateRange.from)} ~ ${formatDate(p.dateRange.to)}`;
  }
}

function createDigitBox(digit, pos, sizeClass = "", delay = 0) {
  const el = document.createElement("span");
  const posClass = pos === 0 ? "group" : `pos-${pos}`;
  el.className = `pension-digit ${posClass} ${sizeClass}`.trim();

  if (delay > 0) {
    el.classList.add("digit-animate");
    el.style.animationDelay = `${delay}ms`;
  }

  el.textContent = pos === 0 ? `${digit}조` : digit;
  return el;
}

function createNumberDisplay(group, digits, sizeClass = "", baseDelay = 0) {
  const wrap = document.createElement("div");
  wrap.className = "pension-rec-digits";

  wrap.appendChild(createDigitBox(group, 0, sizeClass, baseDelay));

  const sep = document.createElement("span");
  sep.className = "pension-group-sep";
  sep.textContent = "|";
  wrap.appendChild(sep);

  digits.forEach((d, i) => {
    wrap.appendChild(createDigitBox(d, i + 1, sizeClass, baseDelay + (i + 1) * 50));
  });

  return wrap;
}

// ─── TOP5 티켓 ───

export async function generatePensionTop5() {
  const btn = document.getElementById("btn-pension-top5");
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span>분석 중...';

  const result = await window.api.pensionGetTop5();
  const container = document.getElementById("pension-ticket");
  container.innerHTML = "";

  if (result.error) {
    showToast(result.error, "error");
    btn.disabled = false;
    btn.textContent = "5게임 추천받기";
    return;
  }

  const games = result.games;
  const now = new Date();
  const dateStr = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, "0")}.${String(now.getDate()).padStart(2, "0")}`;

  const header = document.createElement("div");
  header.className = "ticket-header pension-color";
  header.innerHTML = `
    <span class="ticket-header-title">연금복권720+ 추천번호</span>
    <span class="ticket-header-sub">${dateStr} 생성</span>
  `;

  const gamesWrap = document.createElement("div");
  gamesWrap.className = "ticket-games";

  games.forEach((g, idx) => {
    const row = document.createElement("div");
    row.className = "ticket-game";

    const label = document.createElement("div");
    label.className = "ticket-game-label pension-label-color";
    label.textContent = String.fromCharCode(65 + idx);

    const digits = createNumberDisplay(g.group, g.digits, "ticket-size", idx * 80);

    const strategy = document.createElement("div");
    strategy.className = "ticket-game-strategy";
    strategy.textContent = g.name;

    // 개별 저장 버튼
    const saveBtn = document.createElement("button");
    saveBtn.className = "ticket-save-btn";
    saveBtn.title = "내 번호에 저장";
    saveBtn.innerHTML = '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/></svg>';
    saveBtn.addEventListener("click", async () => {
      const round = (state.pensionSummary?.lastRound || 0) + 1;
      saveBtn.disabled = true;
      saveBtn.innerHTML = '<span class="spinner"></span>';
      const res = await window.api.myNumbersSave({
        type: "pension", round, group: g.group, digits: [...g.digits],
      });
      if (res.error) {
        showToast(res.error, "error");
        saveBtn.disabled = false;
        saveBtn.innerHTML = '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/></svg>';
        return;
      }
      showToast(`${String.fromCharCode(65 + idx)}게임이 내 번호에 저장되었습니다.`, "success");
      saveBtn.innerHTML = "✓";
      saveBtn.classList.add("saved");
    });

    row.appendChild(label);
    row.appendChild(digits);
    row.appendChild(strategy);
    row.appendChild(saveBtn);
    gamesWrap.appendChild(row);
  });

  const footer = document.createElement("div");
  footer.className = "ticket-footer";
  footer.innerHTML = `
    <span>성능순 상위 5개 알고리즘</span>
    <span class="ticket-footer-bold">연금복권720+</span>
  `;

  // 5게임 일괄 저장 버튼
  const saveAllBtn = document.createElement("button");
  saveAllBtn.className = "ticket-save-all-btn";
  saveAllBtn.innerHTML = '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/></svg> 5게임 모두 저장';

  const markAllSaved = () => {
    gamesWrap.querySelectorAll(".ticket-save-btn").forEach(b => {
      b.disabled = true;
      b.innerHTML = "\u2713";
      b.classList.add("saved");
    });
  };

  saveAllBtn.addEventListener("click", async () => {
    const round = (state.pensionSummary?.lastRound || 0) + 1;
    saveAllBtn.disabled = true;
    saveAllBtn.innerHTML = '<span class="spinner"></span> 저장 중...';
    let ok = 0;
    for (const g of games) {
      const res = await window.api.myNumbersSave({
        type: "pension", round, group: g.group, digits: [...g.digits],
      });
      if (!res.error) ok++;
    }
    if (ok === games.length) {
      showToast(`5게임이 내 번호에 저장되었습니다.`, "success");
      saveAllBtn.innerHTML = "\u2713 저장됨";
      markAllSaved();
    } else {
      showToast(`${ok}/${games.length}게임 저장 완료`, ok > 0 ? "success" : "error");
      saveAllBtn.disabled = false;
      saveAllBtn.innerHTML = '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/></svg> 5게임 모두 저장';
    }
  });

  // 복사 + 저장 버튼
  const copyAndSaveBtn = document.createElement("button");
  copyAndSaveBtn.className = "ticket-save-all-btn";
  copyAndSaveBtn.innerHTML = '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg> 복사 + 저장';
  copyAndSaveBtn.addEventListener("click", async () => {
    const round = (state.pensionSummary?.lastRound || 0) + 1;
    copyAndSaveBtn.disabled = true;
    copyAndSaveBtn.innerHTML = '<span class="spinner"></span> 처리 중...';

    // 클립보드 복사
    const lines = games.map((g, i) =>
      `${String.fromCharCode(65 + i)}: ${g.group}조 ${g.digits.join("")}`
    );
    const text = `\u{1F3B0} 연금복권720+ 추천번호 (${round}회)\n${lines.join("\n")}`;
    await navigator.clipboard.writeText(text);

    // 내 번호 저장
    let ok = 0;
    for (const g of games) {
      const res = await window.api.myNumbersSave({
        type: "pension", round, group: g.group, digits: [...g.digits],
      });
      if (!res.error) ok++;
    }

    if (ok === games.length) {
      showToast("5게임이 복사 및 저장되었습니다.", "success");
      copyAndSaveBtn.innerHTML = "\u2713 복사 및 저장됨";
      saveAllBtn.innerHTML = "\u2713 저장됨";
      saveAllBtn.disabled = true;
      markAllSaved();
    } else {
      showToast(`복사 완료, ${ok}/${games.length}게임 저장`, ok > 0 ? "success" : "error");
      copyAndSaveBtn.disabled = false;
      copyAndSaveBtn.innerHTML = '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg> 복사 + 저장';
    }
  });

  const bottomActions = document.createElement("div");
  bottomActions.className = "ticket-bottom-actions";
  bottomActions.appendChild(saveAllBtn);
  bottomActions.appendChild(copyAndSaveBtn);

  container.appendChild(header);
  container.appendChild(gamesWrap);
  container.appendChild(footer);
  container.appendChild(bottomActions);

  btn.disabled = false;
  btn.innerHTML = `
    <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
    다시 추천받기
  `;
}

// ─── 전략별 추천 카드 ───

export async function generatePensionRecommendations(getCount, getSelectedAlgos) {
  const btn = document.getElementById("btn-pension-rec");
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span>분석 중...';

  const count = getCount();
  const selectedAlgos = getSelectedAlgos ? getSelectedAlgos() : null;
  const result = await window.api.pensionGetRecommendations(count, selectedAlgos);
  const container = document.getElementById("pension-recommendations");
  container.innerHTML = "";

  if (result.error) {
    showToast(result.error, "error");
    btn.disabled = false;
    btn.textContent = "번호 추천받기";
    return;
  }

  if (result.recommendations.length === 0) {
    container.innerHTML = '<div class="my-numbers-empty">알고리즘을 1개 이상 선택해주세요.</div>';
    btn.disabled = false;
    btn.textContent = "다시 추천받기";
    return;
  }

  // 사용된 알고리즘 이름 수집
  const usedAlgoNames = new Set(result.recommendations.map(r => r.name));

  // 백테스트 재실행 (초기 로드 시 app.js가 시작하므로 중복 방지)
  if (state.pensionBacktest !== null) {
    state.pensionBacktest = null;
    const gc = parseInt(localStorage.getItem("backtest-games") || "100");
    window.api.startBacktest(gc);
  }

  // 알고리즘별 그룹핑
  const algoGroups = new Map();
  result.recommendations.forEach(rec => {
    if (!algoGroups.has(rec.name)) algoGroups.set(rec.name, []);
    algoGroups.get(rec.name).push(rec);
  });

  const svgSave = '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/></svg>';
  const svgCopy = '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>';

  let cardIdx = 0;
  for (const [algoName, recs] of algoGroups) {
    const firstRec = recs[0];
    const ticket = document.createElement("div");
    ticket.className = "rec-ticket";
    ticket.style.animationDelay = `${cardIdx * 80}ms`;

    // 헤더 (다크블루 - pension 색상)
    const header = document.createElement("div");
    header.className = "ticket-header pension-color";

    const titleRow = document.createElement("div");
    titleRow.className = "ticket-header-title-row";
    titleRow.innerHTML = `<span class="bt-badge-wrap" data-algo-name="${algoName}">${getBacktestRankBadge(algoName, "pension")}</span><span class="ticket-header-title">${algoName}</span>`;

    // ℹ 버튼
    if (firstRec.howItWorks) {
      const infoBtn = document.createElement("button");
      infoBtn.className = "algo-info-btn ticket-info-btn";
      infoBtn.innerHTML = "\u2139";
      infoBtn.title = "알고리즘 동작 원리";
      infoBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        const detail = ticket.querySelector(".algo-detail");
        if (detail) {
          detail.classList.toggle("open");
          infoBtn.classList.toggle("active");
        }
      });
      titleRow.appendChild(infoBtn);
    }

    header.appendChild(titleRow);
    const descEl = document.createElement("span");
    descEl.className = "ticket-header-sub";
    descEl.textContent = firstRec.desc;
    header.appendChild(descEl);
    ticket.appendChild(header);

    // algo-detail 애니메이션 패널
    if (firstRec.howItWorks) {
      ticket.appendChild(createAnimatedAlgoDetail(firstRec.howItWorks));
    }

    // 게임 행들 (라이트 배경)
    const gamesWrap = document.createElement("div");
    gamesWrap.className = "ticket-games";

    recs.forEach((rec, idx) => {
      const row = document.createElement("div");
      row.className = "ticket-game";

      const label = document.createElement("div");
      label.className = "ticket-game-label pension-label-color";
      label.textContent = String.fromCharCode(65 + idx);

      const digits = createNumberDisplay(rec.group, rec.digits, "ticket-size", cardIdx * 60 + idx * 40);

      const stats = document.createElement("div");
      stats.className = "ticket-game-stats";
      stats.innerHTML = `<span class="tgs-sum">합${rec.sum}</span><span class="tgs-ratio">${rec.odd}:${rec.even}</span>`;

      const saveBtn = document.createElement("button");
      saveBtn.className = "ticket-save-btn";
      saveBtn.title = "내 번호에 저장";
      saveBtn.innerHTML = svgSave;
      saveBtn.addEventListener("click", async () => {
        const round = (state.pensionSummary?.lastRound || 0) + 1;
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<span class="spinner"></span>';
        const res = await window.api.myNumbersSave({
          type: "pension", round, group: rec.group, digits: [...rec.digits],
        });
        if (res.error) {
          showToast(res.error, "error");
          saveBtn.disabled = false;
          saveBtn.innerHTML = svgSave;
          return;
        }
        showToast(`${String.fromCharCode(65 + idx)}게임이 내 번호에 저장되었습니다.`, "success");
        saveBtn.innerHTML = "\u2713";
        saveBtn.classList.add("saved");
      });

      row.appendChild(label);
      row.appendChild(digits);
      row.appendChild(stats);
      row.appendChild(saveBtn);
      gamesWrap.appendChild(row);
    });

    ticket.appendChild(gamesWrap);

    // 푸터 (2게임 이상: 전체 저장 + 복사 버튼)
    if (recs.length > 1) {
      const saveAllBtn = document.createElement("button");
      saveAllBtn.className = "ticket-save-all-btn";
      saveAllBtn.innerHTML = `${svgSave} 전체 저장`;

      const markAllSaved = () => {
        gamesWrap.querySelectorAll(".ticket-save-btn").forEach(b => {
          b.disabled = true;
          b.innerHTML = "\u2713";
          b.classList.add("saved");
        });
      };

      saveAllBtn.addEventListener("click", async () => {
        const round = (state.pensionSummary?.lastRound || 0) + 1;
        const batchId = "batch_" + Date.now();
        saveAllBtn.disabled = true;
        saveAllBtn.innerHTML = '<span class="spinner"></span> 저장 중...';
        let ok = 0;
        for (const rec of recs) {
          const res = await window.api.myNumbersSave({
            type: "pension", round, group: rec.group, digits: [...rec.digits], batchId,
          });
          if (!res.error) ok++;
        }
        if (ok === recs.length) {
          showToast(`${recs.length}게임이 내 번호에 저장되었습니다.`, "success");
          saveAllBtn.innerHTML = "\u2713 저장됨";
          markAllSaved();
        } else {
          showToast(`${ok}/${recs.length}게임 저장 완료`, ok > 0 ? "success" : "error");
          saveAllBtn.disabled = false;
          saveAllBtn.innerHTML = `${svgSave} 전체 저장`;
        }
      });

      const copyAndSaveBtn = document.createElement("button");
      copyAndSaveBtn.className = "ticket-save-all-btn";
      copyAndSaveBtn.innerHTML = `${svgCopy} 복사 + 저장`;
      copyAndSaveBtn.addEventListener("click", async () => {
        const round = (state.pensionSummary?.lastRound || 0) + 1;
        const batchId = "batch_" + Date.now();
        copyAndSaveBtn.disabled = true;
        copyAndSaveBtn.innerHTML = '<span class="spinner"></span> 처리 중...';
        const lines = recs.map((rec, i) =>
          `${String.fromCharCode(65 + i)}: ${rec.group}조 ${rec.digits.join("")}`
        );
        const text = `\u{1F3B0} ${algoName} 추천번호 (${round}회)\n${lines.join("\n")}`;
        await navigator.clipboard.writeText(text);
        let ok = 0;
        for (const rec of recs) {
          const res = await window.api.myNumbersSave({
            type: "pension", round, group: rec.group, digits: [...rec.digits], batchId,
          });
          if (!res.error) ok++;
        }
        if (ok === recs.length) {
          showToast(`${recs.length}게임이 복사 및 저장되었습니다.`, "success");
          copyAndSaveBtn.innerHTML = "\u2713 복사 및 저장됨";
          saveAllBtn.innerHTML = "\u2713 저장됨";
          saveAllBtn.disabled = true;
          markAllSaved();
        } else {
          showToast(`복사 완료, ${ok}/${recs.length}게임 저장`, ok > 0 ? "success" : "error");
          copyAndSaveBtn.disabled = false;
          copyAndSaveBtn.innerHTML = `${svgCopy} 복사 + 저장`;
        }
      });

      const bottomActions = document.createElement("div");
      bottomActions.className = "ticket-bottom-actions";
      bottomActions.appendChild(saveAllBtn);
      bottomActions.appendChild(copyAndSaveBtn);
      ticket.appendChild(bottomActions);
    }

    container.appendChild(ticket);
    cardIdx++;
  }

  // 백테스트 결과 (카드 아래, 접이식)
  renderBacktestSummary(container, "pension", usedAlgoNames, () => {
    updateCardBadges(container, "pension");
  });

  btn.disabled = false;
  btn.textContent = "다시 추천받기";
}

// ─── 빈도 차트 렌더링 ───

export function renderPensionFreqChart() {
  const summary = state.pensionSummary;
  if (!summary) return;

  const container = document.getElementById("pension-freq-chart");
  container.innerHTML = "";

  summary.posFrequency.forEach((posData, pos) => {
    const col = document.createElement("div");
    col.className = "pension-freq-col";

    const title = document.createElement("div");
    title.className = "pension-freq-col-title";
    title.textContent = POS_LABELS[pos];
    col.appendChild(title);

    const maxCount = Math.max(...posData.map(d => d.count));

    posData.forEach(({ digit, count }) => {
      const row = document.createElement("div");
      row.className = "pension-freq-bar-wrap";

      const label = document.createElement("span");
      label.className = "pension-freq-bar-label";
      label.textContent = pos === 0 ? `${digit}조` : digit;

      const track = document.createElement("div");
      track.className = "pension-freq-bar-track";

      const fill = document.createElement("div");
      const colorClass = pos === 0 ? "group" : `pos-${pos}`;
      fill.className = `pension-freq-bar-fill ${colorClass}`;
      fill.style.width = maxCount > 0 ? `${(count / maxCount) * 100}%` : "0%";

      const countEl = document.createElement("span");
      countEl.className = "pension-freq-bar-count";
      countEl.textContent = count;

      track.appendChild(fill);
      row.appendChild(label);
      row.appendChild(track);
      row.appendChild(countEl);
      col.appendChild(row);
    });

    container.appendChild(col);
  });
}

// ─── 통계 렌더링 ───

export function renderPensionStats() {
  const summary = state.pensionSummary;
  if (!summary) return;

  // 조 분포
  const groupContainer = document.getElementById("pension-group-dist");
  groupContainer.innerHTML = "";
  const maxGroupCount = Math.max(...summary.groupDist.map(g => g.count));

  summary.groupDist.forEach(({ group, count, pct }) => {
    const row = document.createElement("div");
    row.className = "pension-group-bar";
    row.innerHTML = `
      <span class="pension-group-bar-label">${group}조</span>
      <div class="pension-group-bar-track">
        <div class="pension-group-bar-fill" style="width: ${(count / maxGroupCount) * 100}%">
          ${count}회 (${pct}%)
        </div>
      </div>
    `;
    groupContainer.appendChild(row);
  });

  // 위치별 핫 숫자
  const hotContainer = document.getElementById("pension-hot");
  hotContainer.innerHTML = "";
  summary.hotDigits.forEach((digits, pos) => {
    const row = document.createElement("div");
    row.className = "pension-hot-cold-row";
    const label = document.createElement("span");
    label.className = "pos-label";
    label.textContent = POS_LABELS[pos];
    row.appendChild(label);
    digits.forEach(d => {
      row.appendChild(createDigitBox(d, pos, "small"));
    });
    hotContainer.appendChild(row);
  });

  // 위치별 콜드 숫자
  const coldContainer = document.getElementById("pension-cold");
  coldContainer.innerHTML = "";
  summary.coldDigits.forEach((digits, pos) => {
    const row = document.createElement("div");
    row.className = "pension-hot-cold-row";
    const label = document.createElement("span");
    label.className = "pos-label";
    label.textContent = POS_LABELS[pos];
    row.appendChild(label);
    digits.forEach(d => {
      row.appendChild(createDigitBox(d, pos, "small"));
    });
    coldContainer.appendChild(row);
  });

  // 데이터 정보
  const infoContainer = document.getElementById("pension-data-info");
  const from = summary.dateRange.from;
  const to = summary.dateRange.to;
  const fromStr = `${from.slice(0,4)}.${from.slice(4,6)}.${from.slice(6,8)}`;
  const toStr = `${to.slice(0,4)}.${to.slice(4,6)}.${to.slice(6,8)}`;

  infoContainer.innerHTML = `
    <div class="pension-stat-row"><span>총 회차</span><b>${fmt(summary.total)}회</b></div>
    <div class="pension-stat-row"><span>최신 회차</span><b>${summary.lastRound}회</b></div>
    <div class="pension-stat-row"><span>기간</span><b>${fromStr} ~ ${toStr}</b></div>
    <div class="pension-stat-row"><span>최근 1등</span><b>${summary.lastWinning.group}조 ${summary.lastWinning.digits.join("")}</b></div>
    <div class="pension-stat-row"><span>보너스</span><b>${summary.lastWinning.bonus}</b></div>
  `;
}

// ─── 당첨 이력 테이블 ───

export async function renderPensionHistory() {
  const container = document.getElementById("pension-history");
  if (!container) return;
  container.innerHTML = '<div class="loading-text">당첨 이력 불러오는 중...</div>';

  const result = await window.api.pensionGetHistory(50);
  container.innerHTML = "";

  if (result.error) {
    container.innerHTML = `<div class="loading-text">${result.error}</div>`;
    return;
  }

  const table = document.createElement("table");
  table.className = "pension-history-table";

  const thead = document.createElement("thead");
  thead.innerHTML = `<tr>
    <th>회차</th>
    <th>추첨일</th>
    <th>당첨번호</th>
    <th>보너스</th>
  </tr>`;
  table.appendChild(thead);

  const tbody = document.createElement("tbody");
  for (const rec of result.records) {
    const tr = document.createElement("tr");

    const tdRound = document.createElement("td");
    tdRound.className = "history-round";
    tdRound.textContent = `${rec.round}회`;

    const tdDate = document.createElement("td");
    tdDate.className = "history-date";
    tdDate.textContent = formatDate(rec.date);

    const tdNum = document.createElement("td");
    tdNum.className = "history-numbers";
    const numDisplay = createNumberDisplay(rec.group, rec.digits, "history-size");
    tdNum.appendChild(numDisplay);

    const tdBonus = document.createElement("td");
    tdBonus.className = "history-bonus";
    tdBonus.textContent = rec.bonus;

    tr.appendChild(tdRound);
    tr.appendChild(tdDate);
    tr.appendChild(tdNum);
    tr.appendChild(tdBonus);
    tbody.appendChild(tr);
  }

  table.appendChild(tbody);
  container.appendChild(table);
}

// ─── 인접쌍 빈도 Top 10 ───

export function renderPensionAdjacentPairs() {
  const summary = state.pensionSummary;
  if (!summary || !summary.adjacentPairTop) return;

  const container = document.getElementById("pension-adjacent-pairs");
  if (!container) return;
  container.innerHTML = "";

  const pairs = summary.adjacentPairTop;
  const maxCount = pairs.length > 0 ? pairs[0].count : 1;

  pairs.forEach(({ label, d1, d2, count }, idx) => {
    const row = document.createElement("div");
    row.className = "pension-pair-bar-wrap";

    const labelEl = document.createElement("span");
    labelEl.className = "pension-pair-label";
    labelEl.innerHTML = `<span class="pair-pos">${label}</span> <b>${d1}</b>-<b>${d2}</b>`;

    const track = document.createElement("div");
    track.className = "pension-pair-bar-track";

    const fill = document.createElement("div");
    fill.className = "pension-pair-bar-fill";
    fill.style.width = `${(count / maxCount) * 100}%`;
    fill.style.animationDelay = `${idx * 50}ms`;

    const countEl = document.createElement("span");
    countEl.className = "pension-pair-bar-count";
    countEl.textContent = `${count}회`;

    track.appendChild(fill);
    row.appendChild(labelEl);
    row.appendChild(track);
    row.appendChild(countEl);
    container.appendChild(row);
  });
}

// ─── 자릿수 합계 분포 ───

export function renderPensionDigitSumDist() {
  const summary = state.pensionSummary;
  if (!summary || !summary.digitSumDist) return;

  const container = document.getElementById("pension-digit-sum");
  if (!container) return;
  container.innerHTML = "";

  const dist = summary.digitSumDist;
  const maxCount = Math.max(...dist.map(d => d.count));
  const totalRecords = dist.reduce((a, d) => a + d.count, 0);

  // 평균 합계 계산
  const avgSum = dist.reduce((acc, d) => acc + d.sum * d.count, 0) / totalRecords;

  const infoEl = document.createElement("div");
  infoEl.className = "pension-sum-info";
  infoEl.innerHTML = `평균 합계: <b>${avgSum.toFixed(1)}</b> | 범위: <b>${dist[0].sum}</b> ~ <b>${dist[dist.length - 1].sum}</b>`;
  container.appendChild(infoEl);

  const chartWrap = document.createElement("div");
  chartWrap.className = "pension-sum-chart";

  dist.forEach(({ sum, count }) => {
    const col = document.createElement("div");
    col.className = "pension-sum-col";

    const bar = document.createElement("div");
    bar.className = "pension-sum-bar";
    const pct = maxCount > 0 ? (count / maxCount) * 100 : 0;
    bar.style.height = `${pct}%`;

    // 평균에 가까운 구간 강조
    if (Math.abs(sum - avgSum) <= 3) {
      bar.classList.add("highlight");
    }

    const label = document.createElement("span");
    label.className = "pension-sum-label";
    label.textContent = sum;

    const countEl = document.createElement("span");
    countEl.className = "pension-sum-count";
    countEl.textContent = count > 0 ? count : "";

    col.appendChild(countEl);
    col.appendChild(bar);
    col.appendChild(label);
    chartWrap.appendChild(col);
  });

  container.appendChild(chartWrap);
}

// ─── 초기화 ───

export async function initPension(getRecCount, getSelectedAlgos) {
  const result = await window.api.pensionInitData();
  if (result.error) {
    showToast(result.error, "error");
    return;
  }

  state.pensionSummary = result.summary;

  // 사이드바 데이터 정보 업데이트
  updatePensionSidebarInfo();

  // 버튼 활성화
  document.getElementById("btn-pension-top5").disabled = false;
  document.getElementById("btn-pension-rec").disabled = false;

  // 차트 & 통계 렌더
  renderPensionFreqChart();
  renderPensionStats();
  renderPensionAdjacentPairs();
  renderPensionDigitSumDist();

  // 당첨 이력 렌더
  await renderPensionHistory();

  // 초기 추천 생성
  await generatePensionTop5();
  await generatePensionRecommendations(getRecCount, getSelectedAlgos);
}
