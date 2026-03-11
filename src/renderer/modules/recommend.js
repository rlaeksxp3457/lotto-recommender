import { createBall, ballColor, showToast } from "./utils.js";
import { state } from "./state.js";
import { createAnimatedAlgoDetail } from "./algo_anim.js";

// ─── 알고리즘 필터 ───

export async function initAlgoFilter(type) {
  const isLotto = type === "lotto";
  const prefix = isLotto ? "lotto" : "pension";
  const chipsEl = document.getElementById(`${prefix}-algo-chips`);
  const filterEl = document.getElementById(`${prefix}-algo-filter`);

  const res = isLotto ? await window.api.getAlgoNames() : await window.api.pensionGetAlgoNames();
  const algos = isLotto ? res.lotto : res.pension;
  if (!algos) return;

  const selected = new Set(algos.map(a => a.index));
  chipsEl.innerHTML = "";

  algos.forEach(algo => {
    const chip = document.createElement("button");
    chip.className = "algo-chip active";
    chip.textContent = algo.name;
    chip.dataset.index = algo.index;
    chip.title = algo.desc;
    chip.addEventListener("click", () => {
      chip.classList.toggle("active");
      if (chip.classList.contains("active")) selected.add(algo.index);
      else selected.delete(algo.index);
    });
    chipsEl.appendChild(chip);
  });

  filterEl.querySelectorAll(".algo-filter-toggle").forEach(btn => {
    btn.addEventListener("click", () => {
      const action = btn.dataset.action;
      chipsEl.querySelectorAll(".algo-chip").forEach(c => {
        if (action === "all") { c.classList.add("active"); selected.add(parseInt(c.dataset.index)); }
        else { c.classList.remove("active"); selected.delete(parseInt(c.dataset.index)); }
      });
    });
  });

  return () => selected.size === algos.length ? null : [...selected];
}

// ─── 백테스트 요약 테이블 ───

// generation 카운터 - stale 핸들러 무효화용
let btGenLotto = 0;
let btGenPension = 0;

function getBtGen(type) { return type === "lotto" ? btGenLotto : btGenPension; }
function incBtGen(type) { return type === "lotto" ? ++btGenLotto : ++btGenPension; }

function renderBacktestSummary(container, type, usedAlgoNames, onComplete) {
  const data = type === "lotto" ? state.lottoBacktest : state.pensionBacktest;
  const gen = incBtGen(type);

  const wrap = document.createElement("div");
  wrap.className = "backtest-summary";

  if (!data) {
    wrap.innerHTML = '<div class="backtest-loading"><span class="spinner"></span> 알고리즘 성능 분석 중...</div>';
    container.appendChild(wrap);
    const handler = (d) => {
      if (gen !== getBtGen(type)) return; // stale
      if (d.type === type && d.results) {
        if (type === "lotto") state.lottoBacktest = d.results;
        else state.pensionBacktest = d.results;
        const filtered = usedAlgoNames ? d.results.filter(r => usedAlgoNames.has(r.name)) : d.results;
        renderBacktestInto(wrap, filtered, type, usedAlgoNames);
        if (onComplete) onComplete();
      }
    };
    window.api.onBacktestDone(handler);
    return;
  }

  const filtered = usedAlgoNames ? data.filter(r => usedAlgoNames.has(r.name)) : data;
  renderBacktestInto(wrap, filtered, type, usedAlgoNames);
  container.appendChild(wrap);
  if (onComplete) onComplete();
}

function renderBacktestInto(wrap, data, type, usedAlgoNames) {
  const isLotto = type === "lotto";
  const rateLabel = isLotto ? "3개+ 확률" : "1자리+ 확률";
  const rateKey = isLotto ? "over3Rate" : "over1Rate";
  const gc = localStorage.getItem("backtest-games") || "100";

  // 요약 라인 (상위 3개)
  const summaryLine = data.slice(0, 3).map((r, i) =>
    `${i + 1}위: ${r.name} (${r.vsTheory}%)`
  ).join("  |  ");

  wrap.innerHTML = `<div class="bt-collapsible">
    <div class="bt-collapsible-header">
      <span class="bt-collapsible-title">백테스트 결과 (${gc}게임)</span>
      <span class="bt-summary-line">${summaryLine}</span>
    </div>
    <div class="bt-collapsible-body">
      ${buildBacktestTableHTML(data, rateLabel, rateKey)}
    </div>
  </div>`;

}

function buildBacktestTableHTML(data, rateLabel, rateKey) {
  const isLotto = rateKey === "over3Rate";
  let matchHeaders = "";
  if (isLotto) {
    matchHeaders = `<th class="bt-match-col">3개</th><th class="bt-match-col">4개</th><th class="bt-match-col">5개</th><th class="bt-match-col">6개</th>`;
  } else {
    matchHeaders = `<th class="bt-match-col">1자리</th><th class="bt-match-col">2자리</th><th class="bt-match-col">3자리</th><th class="bt-match-col">4+</th>`;
  }
  let html = `<table class="backtest-table"><thead><tr>
    <th>#</th><th>알고리즘</th>${matchHeaders}<th>평균</th><th>${rateLabel}</th><th>이론 대비</th>
  </tr></thead><tbody>`;
  data.forEach((r, i) => {
    const rankClass = i < 3 ? ` backtest-rank-${i + 1}` : "";
    const vsClass = r.vsTheory.startsWith("+") ? "backtest-vs-positive" : "backtest-vs-negative";
    const mc = r.matchCounts || [];
    let matchCells = "";
    if (isLotto) {
      matchCells = [3,4,5,6].map(k => `<td class="bt-match-col">${mc[k] ? `<span class="bt-match-hit">${mc[k]}</span>` : `<span class="bt-match-zero">-</span>`}</td>`).join("");
    } else {
      const vals = [mc[1]||0, mc[2]||0, mc[3]||0, (mc[4]||0)+(mc[5]||0)+(mc[6]||0)];
      matchCells = vals.map(v => `<td class="bt-match-col">${v ? `<span class="bt-match-hit">${v}</span>` : `<span class="bt-match-zero">-</span>`}</td>`).join("");
    }
    html += `<tr>
      <td class="backtest-rank${rankClass}">${i + 1}</td>
      <td class="backtest-name">${r.name}</td>
      ${matchCells}
      <td>${r.avgMatches.toFixed(2)}</td>
      <td>${r[rateKey].toFixed(2)}%</td>
      <td class="${vsClass}">${r.vsTheory}%</td>
    </tr>`;
  });
  html += `</tbody></table>`;
  return html;
}

function updateCardBadges(container, type) {
  container.querySelectorAll(".bt-badge-wrap").forEach(wrap => {
    const name = wrap.dataset.algoName;
    const html = getBacktestRankBadge(name, type);
    if (html) {
      wrap.innerHTML = html;
      wrap.classList.add("bt-badge-fadein");
    }
  });
}

export { renderBacktestSummary, getBacktestRankBadge, updateCardBadges };

// ─── 추천 생성 ───

export async function generateRecommendations(getCount, getSelectedAlgos) {
  const btn = document.getElementById("btn-recommend");
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span>분석 중...';

  const count = getCount();
  const selectedAlgos = getSelectedAlgos ? getSelectedAlgos() : null;
  const result = await window.api.getRecommendations(count, selectedAlgos);
  const container = document.getElementById("recommendations");
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

  // 사용된 알고리즘 이름 수집 (백테스트 테이블 필터용)
  const usedAlgoNames = new Set(result.recommendations.map(r => r.name));

  // 백테스트 재실행 (초기 로드 시 app.js가 시작하므로 중복 방지)
  if (state.lottoBacktest !== null) {
    state.lottoBacktest = null;
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

    // 헤더 (다크블루 - 내번호 ticket-header 스타일)
    const header = document.createElement("div");
    header.className = "ticket-header";

    const titleRow = document.createElement("div");
    titleRow.className = "ticket-header-title-row";
    titleRow.innerHTML = `<span class="bt-badge-wrap" data-algo-name="${algoName}">${getBacktestRankBadge(algoName, "lotto")}</span><span class="ticket-header-title">${algoName}</span>`;

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
      label.className = "ticket-game-label";
      label.textContent = String.fromCharCode(65 + idx);

      const ballsWrap = document.createElement("div");
      ballsWrap.className = "ticket-game-balls";
      rec.numbers.forEach((n, i) => {
        const ball = document.createElement("span");
        ball.className = `ticket-ball ${ballColor(n)} ball-animate`;
        ball.textContent = n;
        ball.style.animationDelay = `${cardIdx * 60 + idx * 40 + i * 25}ms`;
        ballsWrap.appendChild(ball);
      });

      const stats = document.createElement("div");
      stats.className = "ticket-game-stats";
      stats.innerHTML = `<span class="tgs-sum">합${rec.sum}</span><span class="tgs-ratio">${rec.odd}:${rec.even}</span>`;

      const saveBtn = document.createElement("button");
      saveBtn.className = "ticket-save-btn";
      saveBtn.title = "내 번호에 저장";
      saveBtn.innerHTML = svgSave;
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
          saveBtn.innerHTML = svgSave;
          return;
        }
        showToast(`${String.fromCharCode(65 + idx)}게임이 내 번호에 저장되었습니다.`, "success");
        saveBtn.innerHTML = "\u2713";
        saveBtn.classList.add("saved");
      });

      row.appendChild(label);
      row.appendChild(ballsWrap);
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
        const round = (state.summary?.lastRound || 0) + 1;
        const batchId = "batch_" + Date.now();
        saveAllBtn.disabled = true;
        saveAllBtn.innerHTML = '<span class="spinner"></span> 저장 중...';
        let ok = 0;
        for (const rec of recs) {
          const res = await window.api.myNumbersSave({
            type: "lotto", round, numbers: [...rec.numbers], batchId,
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
        const round = (state.summary?.lastRound || 0) + 1;
        const batchId = "batch_" + Date.now();
        copyAndSaveBtn.disabled = true;
        copyAndSaveBtn.innerHTML = '<span class="spinner"></span> 처리 중...';
        const lines = recs.map((rec, i) =>
          `${String.fromCharCode(65 + i)}: ${rec.numbers.join(", ")}`
        );
        const text = `\u{1F3B0} ${algoName} 추천번호 (${round}회)\n${lines.join("\n")}`;
        await navigator.clipboard.writeText(text);
        let ok = 0;
        for (const rec of recs) {
          const res = await window.api.myNumbersSave({
            type: "lotto", round, numbers: [...rec.numbers], batchId,
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
  renderBacktestSummary(container, "lotto", usedAlgoNames, () => {
    updateCardBadges(container, "lotto");
  });

  btn.disabled = false;
  btn.textContent = "다시 추천받기";
}

function getBacktestRankBadge(algoName, type) {
  const data = type === "lotto" ? state.lottoBacktest : state.pensionBacktest;
  if (!data) return "";
  const result = data.find(b => b.name === algoName);
  if (!result) return "";
  const rank = data.indexOf(result) + 1;
  const cls = rank <= 3 ? ` bt-badge-${rank}` : "";
  return `<span class="bt-rank-badge${cls}">#${rank}</span>`;
}
