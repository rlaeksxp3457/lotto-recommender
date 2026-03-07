// ═══ 내 번호 관리 모듈 ═══

import { state } from "./state.js";
import { showToast, ballColor, showConfirm } from "./utils.js";

// ─── 유틸 ───

function formatAmount(amount) {
  if (!amount || amount === 0) return "0원";
  if (amount >= 100000000) {
    const eok = Math.floor(amount / 100000000);
    const man = Math.floor((amount % 100000000) / 10000);
    return man > 0 ? `${eok.toLocaleString()}억 ${man.toLocaleString()}만원` : `${eok.toLocaleString()}억원`;
  }
  if (amount >= 10000) return `${Math.floor(amount / 10000).toLocaleString()}만원`;
  return `${amount.toLocaleString()}원`;
}

function buildPrizeInfoHtml(prizeInfo, myRank) {
  if (!prizeInfo) return "";
  const rankLabels = ["1등", "2등", "3등", "4등", "5등"];
  let rows = "";
  for (const p of prizeInfo.prizes) {
    const highlight = (myRank > 0 && myRank === p.rank) ? ' class="my-rank"' : "";
    rows += `<tr${highlight}>
      <td>${rankLabels[p.rank - 1]}</td>
      <td>${formatAmount(p.amount)}</td>
      <td>${p.winners.toLocaleString()}명</td>
      <td>${formatAmount(p.totalAmount)}</td>
    </tr>`;
  }

  const wt = prizeInfo.winTypes || {};
  const winTypeText = [
    wt.auto ? `자동 ${wt.auto}` : "",
    wt.semiAuto ? `반자동 ${wt.semiAuto}` : "",
    wt.manual ? `수동 ${wt.manual}` : "",
  ].filter(Boolean).join(" / ");

  return `
    <div class="result-prize-info">
      <div class="prize-summary-row">
        <span>총 판매금액 <strong>${formatAmount(prizeInfo.totalSales)}</strong></span>
        <span>총 당첨자 <strong>${(prizeInfo.totalWinners || 0).toLocaleString()}명</strong></span>
      </div>
      ${winTypeText ? `<div class="prize-win-types">1등 당첨 유형: ${winTypeText}</div>` : ""}
      <table class="prize-table">
        <thead><tr><th>등수</th><th>1인당 당첨금</th><th>당첨자 수</th><th>총 당첨금</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

function createLottoBall(n) {
  const el = document.createElement("span");
  el.className = `lotto-ball ${ballColor(n)}`;
  el.textContent = n;
  return el;
}

function createPensionDigit(digit, pos) {
  const el = document.createElement("span");
  el.className = pos === 0 ? "pension-digit group" : `pension-digit pos-${pos}`;
  el.textContent = pos === 0 ? `${digit}조` : digit;
  return el;
}

function rankClass(rank) {
  if (rank === 1) return "rank-1st";
  if (rank === 2) return "rank-2nd";
  if (rank === 3) return "rank-3rd";
  if (rank >= 4 && rank <= 7) return "rank-minor";
  return "rank-miss";
}

// ─── 배치 행 관리 (로또) ───

const MAX_ROWS = 5;

function createLottoRow(idx) {
  const row = document.createElement("div");
  row.className = "my-batch-row";
  row.dataset.rowIdx = idx;

  const label = document.createElement("span");
  label.className = "my-batch-row-label";
  label.textContent = String.fromCharCode(65 + idx);

  const inputs = document.createElement("div");
  inputs.className = "my-numbers-inputs";
  for (let i = 0; i < 6; i++) {
    const inp = document.createElement("input");
    inp.type = "number";
    inp.className = "my-lotto-num-input";
    inp.min = "1";
    inp.max = "45";
    inp.placeholder = String(i + 1);
    inputs.appendChild(inp);
  }

  const delBtn = document.createElement("button");
  delBtn.className = "my-batch-row-del";
  delBtn.textContent = "✕";
  delBtn.title = "행 삭제";

  row.appendChild(label);
  row.appendChild(inputs);
  row.appendChild(delBtn);
  return row;
}

function createPensionRow(idx) {
  const row = document.createElement("div");
  row.className = "my-batch-row";
  row.dataset.rowIdx = idx;

  const label = document.createElement("span");
  label.className = "my-batch-row-label";
  label.textContent = String.fromCharCode(65 + idx);

  // 조 입력
  const groupInp = document.createElement("input");
  groupInp.type = "number";
  groupInp.className = "my-numbers-input pension-group-input";
  groupInp.min = "1";
  groupInp.max = "5";
  groupInp.placeholder = "조";
  groupInp.style.width = "48px";

  const inputs = document.createElement("div");
  inputs.className = "my-numbers-inputs";
  for (let i = 0; i < 6; i++) {
    const inp = document.createElement("input");
    inp.type = "number";
    inp.className = "my-pension-digit-input";
    inp.min = "0";
    inp.max = "9";
    inp.placeholder = "0";
    inputs.appendChild(inp);
  }

  const delBtn = document.createElement("button");
  delBtn.className = "my-batch-row-del";
  delBtn.textContent = "✕";
  delBtn.title = "행 삭제";

  row.appendChild(label);
  row.appendChild(groupInp);
  row.appendChild(inputs);
  row.appendChild(delBtn);
  return row;
}

function updateRowLabels(container) {
  const rows = container.querySelectorAll(".my-batch-row");
  rows.forEach((row, i) => {
    row.dataset.rowIdx = i;
    row.querySelector(".my-batch-row-label").textContent = String.fromCharCode(65 + i);
    const delBtn = row.querySelector(".my-batch-row-del");
    delBtn.disabled = rows.length <= 1;
  });
}

// ─── 로또 내 번호 탭 ───

export async function initMyLotto() {
  initFilter("lotto");
  const rowsContainer = document.getElementById("my-lotto-rows");
  const addBtn = document.getElementById("my-lotto-add-row");
  const countLabel = document.getElementById("my-lotto-row-count");

  // 초기 1행
  rowsContainer.innerHTML = "";
  rowsContainer.appendChild(createLottoRow(0));
  countLabel.textContent = "1/5";

  function updateCount() {
    const cnt = rowsContainer.querySelectorAll(".my-batch-row").length;
    countLabel.textContent = `${cnt}/${MAX_ROWS}`;
    addBtn.disabled = cnt >= MAX_ROWS;
    updateRowLabels(rowsContainer);
  }

  addBtn.addEventListener("click", () => {
    const cnt = rowsContainer.querySelectorAll(".my-batch-row").length;
    if (cnt >= MAX_ROWS) return;
    rowsContainer.appendChild(createLottoRow(cnt));
    updateCount();
  });

  rowsContainer.addEventListener("click", (e) => {
    const delBtn = e.target.closest(".my-batch-row-del");
    if (!delBtn) return;
    const rows = rowsContainer.querySelectorAll(".my-batch-row");
    if (rows.length <= 1) return;
    delBtn.closest(".my-batch-row").remove();
    updateCount();
  });

  updateCount();
  await loadAndRenderMyNumbers("lotto");

  // 저장
  document.getElementById("my-lotto-save-btn").addEventListener("click", async () => {
    const round = parseInt(document.getElementById("my-lotto-round").value);
    if (!round || round < 1) {
      showToast("회차를 입력해주세요.", "error");
      return;
    }

    const rows = rowsContainer.querySelectorAll(".my-batch-row");
    const allNumbers = [];

    for (const row of rows) {
      const inputs = row.querySelectorAll(".my-lotto-num-input");
      const numbers = [];
      for (const inp of inputs) {
        const n = parseInt(inp.value);
        if (!n || n < 1 || n > 45) {
          showToast(`${row.querySelector(".my-batch-row-label").textContent}행: 1~45 사이의 번호를 입력해주세요.`, "error");
          return;
        }
        if (numbers.includes(n)) {
          showToast(`${row.querySelector(".my-batch-row-label").textContent}행: 중복된 번호가 있습니다.`, "error");
          return;
        }
        numbers.push(n);
      }
      numbers.sort((a, b) => a - b);
      allNumbers.push(numbers);
    }

    const batchId = "batch_" + Date.now();
    let saved = 0;
    for (const numbers of allNumbers) {
      const result = await window.api.myNumbersSave({ type: "lotto", round, numbers, batchId });
      if (result.error) {
        showToast(result.error, "error");
      } else {
        saved++;
      }
    }

    if (saved > 0) {
      showToast(`${saved}개 번호가 저장되었습니다.`, "success");
      // 폼 초기화
      document.getElementById("my-lotto-round").value = "";
      rowsContainer.innerHTML = "";
      rowsContainer.appendChild(createLottoRow(0));
      updateCount();
      await loadAndRenderMyNumbers("lotto");
    }
  });
}

// ─── 연금복권 내 번호 탭 ───

export async function initMyPension() {
  initFilter("pension");
  const rowsContainer = document.getElementById("my-pension-rows");
  const addBtn = document.getElementById("my-pension-add-row");
  const countLabel = document.getElementById("my-pension-row-count");

  // 초기 1행
  rowsContainer.innerHTML = "";
  rowsContainer.appendChild(createPensionRow(0));
  countLabel.textContent = "1/5";

  function updateCount() {
    const cnt = rowsContainer.querySelectorAll(".my-batch-row").length;
    countLabel.textContent = `${cnt}/${MAX_ROWS}`;
    addBtn.disabled = cnt >= MAX_ROWS;
    updateRowLabels(rowsContainer);
  }

  addBtn.addEventListener("click", () => {
    const cnt = rowsContainer.querySelectorAll(".my-batch-row").length;
    if (cnt >= MAX_ROWS) return;
    rowsContainer.appendChild(createPensionRow(cnt));
    updateCount();
  });

  rowsContainer.addEventListener("click", (e) => {
    const delBtn = e.target.closest(".my-batch-row-del");
    if (!delBtn) return;
    const rows = rowsContainer.querySelectorAll(".my-batch-row");
    if (rows.length <= 1) return;
    delBtn.closest(".my-batch-row").remove();
    updateCount();
  });

  updateCount();
  await loadAndRenderMyNumbers("pension");

  // 저장
  document.getElementById("my-pension-save-btn").addEventListener("click", async () => {
    const round = parseInt(document.getElementById("my-pension-round").value);
    if (!round || round < 1) {
      showToast("회차를 입력해주세요.", "error");
      return;
    }

    const rows = rowsContainer.querySelectorAll(".my-batch-row");
    const allEntries = [];

    for (const row of rows) {
      const groupInp = row.querySelector(".pension-group-input");
      const group = parseInt(groupInp.value);
      if (!group || group < 1 || group > 5) {
        showToast(`${row.querySelector(".my-batch-row-label").textContent}행: 조(1~5)를 입력해주세요.`, "error");
        return;
      }

      const digitInputs = row.querySelectorAll(".my-pension-digit-input");
      const digits = [];
      for (const inp of digitInputs) {
        const d = parseInt(inp.value);
        if (isNaN(d) || d < 0 || d > 9) {
          showToast(`${row.querySelector(".my-batch-row-label").textContent}행: 0~9 사이의 숫자를 입력해주세요.`, "error");
          return;
        }
        digits.push(d);
      }
      allEntries.push({ group, digits });
    }

    const batchId = "batch_" + Date.now();
    let saved = 0;
    for (const entry of allEntries) {
      const result = await window.api.myNumbersSave({
        type: "pension", round, group: entry.group, digits: entry.digits, batchId,
      });
      if (result.error) {
        showToast(result.error, "error");
      } else {
        saved++;
      }
    }

    if (saved > 0) {
      showToast(`${saved}개 번호가 저장되었습니다.`, "success");
      // 폼 초기화
      document.getElementById("my-pension-round").value = "";
      rowsContainer.innerHTML = "";
      rowsContainer.appendChild(createPensionRow(0));
      updateCount();
      await loadAndRenderMyNumbers("pension");
    }
  });
}

// ─── 데이터 로드 & 렌더 ───

export async function refreshMyNumbers(type) {
  await loadAndRenderMyNumbers(type);
}

// 필터 + 내보내기/가져오기 이벤트 등록
export function initFilter(type) {
  const prefix = type === "lotto" ? "my-lotto" : "my-pension";
  document.getElementById(`${prefix}-filter`).addEventListener("change", () => loadAndRenderMyNumbers(type));

  document.getElementById(`${prefix}-export-btn`).addEventListener("click", async () => {
    const result = await window.api.myNumbersExport();
    if (result.canceled) return;
    if (result.error) { showToast(result.error, "error"); return; }
    showToast(`${result.count}개 번호를 내보냈습니다.`, "success");
  });

  document.getElementById(`${prefix}-import-btn`).addEventListener("click", async () => {
    const result = await window.api.myNumbersImport();
    if (result.canceled) return;
    if (result.error) { showToast(result.error, "error"); return; }
    showToast(`${result.imported}개 번호를 가져왔습니다.${result.skipped > 0 ? ` (중복 ${result.skipped}개 건너뜀)` : ""}`, "success");
    await loadAndRenderMyNumbers("lotto");
    await loadAndRenderMyNumbers("pension");
  });
}

async function loadAndRenderMyNumbers(type) {
  const result = await window.api.myNumbersLoad();
  if (result.error) { showToast(result.error, "error"); return; }

  state.myNumbers = result.numbers;
  const allOfType = result.numbers.filter(n => n.type === type);

  // 필터 드롭다운 갱신
  const filterId = type === "lotto" ? "my-lotto-filter" : "my-pension-filter";
  const filterEl = document.getElementById(filterId);
  const prev = filterEl.value;
  const rounds = [...new Set(allOfType.map(n => n.round))].sort((a, b) => b - a);
  filterEl.innerHTML = '<option value="all">전체 회차</option>';
  for (const r of rounds) {
    const opt = document.createElement("option");
    opt.value = r;
    opt.textContent = `${r}회`;
    filterEl.appendChild(opt);
  }
  if (rounds.includes(parseInt(prev))) filterEl.value = prev;

  // 필터 적용
  const sel = filterEl.value;
  const displayed = sel === "all" ? allOfType : allOfType.filter(n => n.round === parseInt(sel));

  const containerId = type === "lotto" ? "my-lotto-list" : "my-pension-list";
  renderTicketList(displayed, containerId, type);
}

// 드래그 상태 (dragover에서 dataTransfer 읽기 불가하므로 모듈 레벨 변수 사용)
let dragState = null;

function groupByBatch(items) {
  const batchMap = {};
  const legacyByRound = {};

  for (const item of items) {
    if (item.batchId) {
      if (!batchMap[item.batchId]) batchMap[item.batchId] = [];
      batchMap[item.batchId].push(item);
    } else {
      if (!legacyByRound[item.round]) legacyByRound[item.round] = [];
      legacyByRound[item.round].push(item);
    }
  }

  const result = [];

  // batchId가 있는 엔트리
  for (const [batchId, entries] of Object.entries(batchMap)) {
    result.push({
      round: entries[0].round,
      batchId,
      entries: entries.sort((a, b) => parseInt(a.id) - parseInt(b.id)),
    });
  }

  // 레거시 (batchId 없음): round별 5개씩 분리 (기존 batchId와 충돌 방지)
  for (const [round, entries] of Object.entries(legacyByRound)) {
    const sorted = entries.sort((a, b) => parseInt(a.id) - parseInt(b.id));
    let idx = 0;
    for (let i = 0; i < sorted.length; i += 5) {
      let legacyId = `legacy_${round}_${idx}`;
      while (batchMap[legacyId]) { idx++; legacyId = `legacy_${round}_${idx}`; }
      result.push({
        round: parseInt(round),
        batchId: legacyId,
        entries: sorted.slice(i, i + 5),
      });
      idx++;
    }
  }

  // 회차 내림차순, 같은 회차면 첫 엔트리 ID 기준
  result.sort((a, b) => {
    if (b.round !== a.round) return b.round - a.round;
    return parseInt(b.entries[0].id) - parseInt(a.entries[0].id);
  });
  return result;
}

function renderTicketList(items, containerId, type) {
  const container = document.getElementById(containerId);
  container.innerHTML = "";

  if (items.length === 0) {
    container.innerHTML = '<div class="my-numbers-empty">저장된 번호가 없습니다.</div>';
    return;
  }

  const groups = groupByBatch(items);
  const isPension = type === "pension";

  for (const group of groups) {
    const ticket = document.createElement("div");
    ticket.className = "my-ticket";
    ticket.dataset.batchId = group.batchId;
    ticket.dataset.round = group.round;

    // ── 티켓 드롭 존 (행 또는 용지를 받을 수 있음) ──
    function canDrop() {
      if (!dragState) return false;
      if (String(dragState.round) !== String(group.round)) return false;
      if (dragState.batchId === group.batchId) return false;
      return group.entries.length + dragState.entryCount <= 5;
    }
    function isDifferentBatch() {
      return dragState && dragState.batchId !== group.batchId;
    }
    ticket.addEventListener("dragenter", (e) => {
      if (isDifferentBatch()) {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        if (canDrop()) ticket.classList.add("drop-target");
      }
    });
    ticket.addEventListener("dragover", (e) => {
      if (isDifferentBatch()) {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        if (canDrop()) ticket.classList.add("drop-target");
      }
    });
    ticket.addEventListener("dragleave", (e) => {
      if (!ticket.contains(e.relatedTarget)) ticket.classList.remove("drop-target");
    });
    ticket.addEventListener("drop", async (e) => {
      e.preventDefault();
      e.stopPropagation();
      ticket.classList.remove("drop-target");
      if (!canDrop()) {
        if (dragState) {
          if (String(dragState.round) !== String(group.round)) {
            showToast("같은 회차의 용지끼리만 합칠 수 있습니다.", "error");
          } else if (group.entries.length + dragState.entryCount > 5) {
            showToast("한 용지에 최대 5개까지만 가능합니다.", "error");
          }
        }
        return;
      }
      // 드래그 항목 + 대상 용지의 기존 항목 모두 같은 batchId로 통합
      const allIds = [...dragState.entryIds, ...group.entries.map(e => e.id)];
      const targetBatchId = group.batchId.startsWith("legacy_") ? "batch_" + Date.now() : group.batchId;
      const res = await window.api.myNumbersUpdateBatch({ entryIds: allIds, newBatchId: targetBatchId });
      if (res.error) { showToast(res.error, "error"); return; }
      showToast("용지가 합쳐졌습니다.", "success");
      dragState = null;
      await loadAndRenderMyNumbers(type);
    });

    // ── 헤더 ──
    const header = document.createElement("div");
    header.className = `my-ticket-header${isPension ? " pension" : ""}`;
    const dateStr = group.entries[0].createdAt || "";
    header.innerHTML = `<span class="my-ticket-round">${group.round}회</span><span class="my-ticket-date">${dateStr}</span>`;
    ticket.appendChild(header);

    // ── 당첨번호 행 ──
    const checkedEntry = group.entries.find(e => e.result && e.result.rank !== undefined);
    if (checkedEntry) {
      const winRow = document.createElement("div");
      winRow.className = "my-ticket-win-row";
      const winLabel = document.createElement("span");
      winLabel.className = "my-ticket-win-label";
      winLabel.textContent = "당첨번호";
      winRow.appendChild(winLabel);
      const winBalls = document.createElement("div");
      winBalls.className = "my-ticket-win-balls";

      if (type === "lotto" && checkedEntry.result.winNumbers) {
        checkedEntry.result.winNumbers.forEach(n => winBalls.appendChild(createLottoBall(n)));
        if (checkedEntry.result.bonusNo) {
          const plus = document.createElement("span");
          plus.className = "bonus-plus";
          plus.textContent = "+";
          winBalls.appendChild(plus);
          const bonusBall = createLottoBall(checkedEntry.result.bonusNo);
          bonusBall.classList.add("bonus-ball");
          winBalls.appendChild(bonusBall);
        }
      } else if (type === "pension" && checkedEntry.result.winDigits) {
        const tag = document.createElement("span");
        tag.className = "pension-group-tag";
        tag.textContent = `${checkedEntry.result.winGroup}조`;
        winBalls.appendChild(tag);
        checkedEntry.result.winDigits.forEach((d, i) => {
          const digit = document.createElement("span");
          digit.className = `pension-digit pos-${i + 1}`;
          digit.textContent = d;
          winBalls.appendChild(digit);
        });
      }
      winRow.appendChild(winBalls);
      ticket.appendChild(winRow);
    }

    // ── 게임 행 ──
    const gamesWrap = document.createElement("div");
    gamesWrap.className = "my-ticket-games";

    group.entries.forEach((item, idx) => {
      const row = document.createElement("div");
      row.className = "my-ticket-game";
      row.draggable = true;
      row.dataset.entryId = item.id;

      // 행 드래그 시작
      row.addEventListener("dragstart", (e) => {
        e.stopPropagation();
        dragState = {
          batchId: group.batchId,
          round: group.round,
          entryIds: [item.id],
          entryCount: 1,
          isRow: true,
        };
        e.dataTransfer.setData("text/plain", "row");
        e.dataTransfer.effectAllowed = "move";
        row.classList.add("dragging-row");
      });
      row.addEventListener("dragend", () => {
        row.classList.remove("dragging-row");
        dragState = null;
        container.querySelectorAll(".drop-target").forEach(el => el.classList.remove("drop-target"));
      });

      const label = document.createElement("div");
      label.className = "my-ticket-label";
      label.textContent = String.fromCharCode(65 + idx);

      const balls = document.createElement("div");
      balls.className = "my-ticket-balls";

      const hasResult = item.result && item.result.rank !== undefined;

      if (type === "lotto") {
        const winSet = hasResult ? new Set(item.result.winNumbers) : null;
        const is2nd = hasResult && item.result.rank === 2;
        const bonusNo = hasResult ? item.result.bonusNo : null;
        item.numbers.forEach(n => {
          const ball = createLottoBall(n);
          if (hasResult) {
            if (winSet.has(n)) { /* 일치 */ }
            else if (is2nd && n === bonusNo) ball.classList.add("ball-bonus-hit");
            else ball.classList.add("ball-miss");
          }
          balls.appendChild(ball);
        });
      } else {
        const tag = document.createElement("span");
        const groupMatch = hasResult ? item.result.groupMatch : false;
        tag.className = `pension-group-tag${hasResult && !groupMatch ? " tag-miss" : ""}`;
        tag.textContent = `${item.group}조`;
        balls.appendChild(tag);
        item.digits.forEach((d, i) => {
          const digit = document.createElement("span");
          const digitMatch = hasResult && item.result.winDigits ? item.result.winDigits[i] === d : false;
          digit.className = `pension-digit pos-${i + 1}${hasResult && !digitMatch ? " digit-miss" : ""}`;
          digit.textContent = d;
          balls.appendChild(digit);
        });
      }

      // 결과 배지
      const badgeWrap = document.createElement("div");
      badgeWrap.className = "my-ticket-badge-wrap";
      const badge = document.createElement("span");
      if (hasResult) {
        badge.className = `my-ticket-badge ${rankClass(item.result.rank)}`;
        badge.textContent = item.result.label;
        const detail = document.createElement("span");
        detail.className = "my-ticket-match-detail";
        if (type === "lotto") {
          detail.textContent = `${item.result.matchCount}개 일치${item.result.bonus ? " +보너스" : ""}`;
        } else {
          detail.textContent = `${item.result.matchDigits}자리 일치`;
        }
        badgeWrap.appendChild(badge);
        badgeWrap.appendChild(detail);
      } else {
        badge.className = "my-ticket-badge unchecked";
        badge.textContent = "미확인";
        badgeWrap.appendChild(badge);
      }

      // 행 삭제 버튼
      const rowDel = document.createElement("button");
      rowDel.className = "my-ticket-row-del";
      rowDel.textContent = "✕";
      rowDel.title = "이 행 삭제";
      rowDel.addEventListener("click", async (e) => {
        e.stopPropagation();
        if (!await showConfirm(`${String.fromCharCode(65 + idx)}행을 삭제하시겠습니까?`)) return;
        await window.api.myNumbersDelete(item.id);
        showToast("삭제되었습니다.", "info");
        await loadAndRenderMyNumbers(type);
      });

      row.appendChild(label);
      row.appendChild(balls);
      row.appendChild(badgeWrap);
      row.appendChild(rowDel);
      gamesWrap.appendChild(row);
    });
    ticket.appendChild(gamesWrap);

    // ── 푸터 ──
    const footer = document.createElement("div");
    footer.className = "my-ticket-footer";

    const allChecked = group.entries.every(e => e.result && e.result.rank !== undefined);
    const prizeLabel = document.createElement("span");
    prizeLabel.className = "my-ticket-prize";
    if (allChecked) {
      const total = calcTicketPrize(group.entries);
      prizeLabel.textContent = total > 0 ? `당첨금: ${formatAmount(total)}` : "미당첨";
      if (total > 0) prizeLabel.classList.add("has-prize");
    }

    const actions = document.createElement("div");
    actions.className = "my-ticket-actions";

    const anyUnchecked = group.entries.some(e => !e.result || e.result.rank === undefined);
    if (anyUnchecked) {
      const checkBtn = document.createElement("button");
      checkBtn.className = `my-ticket-check-btn${isPension ? " pension" : ""}`;
      checkBtn.textContent = "당첨 확인";
      checkBtn.addEventListener("click", () => batchCheck(group.entries, type, checkBtn));
      actions.appendChild(checkBtn);
    }

    const delBtn = document.createElement("button");
    delBtn.className = "my-ticket-del-btn";
    delBtn.textContent = "용지 삭제";
    delBtn.addEventListener("click", async () => {
      if (!await showConfirm(`${group.round}회 용지 전체(${group.entries.length}행)를 삭제하시겠습니까?`)) return;
      batchDelete(group.entries, type);
    });
    actions.appendChild(delBtn);

    footer.appendChild(prizeLabel);
    footer.appendChild(actions);
    ticket.appendChild(footer);

    container.appendChild(ticket);
  }
}

function calcTicketPrize(entries) {
  let total = 0;
  for (const e of entries) {
    if (e.result && e.result.rank > 0 && e.result.prizeInfo) {
      const p = e.result.prizeInfo.prizes.find(p => p.rank === e.result.rank);
      if (p) total += p.amount;
    }
  }
  return total;
}

async function batchCheck(entries, type, btn) {
  btn.disabled = true;
  btn.textContent = "확인 중...";
  const api = type === "lotto" ? window.api.myNumbersCheckLotto : window.api.myNumbersCheckPension;

  for (const entry of entries) {
    if (entry.result && entry.result.rank !== undefined) continue;
    const res = await api(entry.id);
    if (res.error) {
      showToast(res.error, "error");
      btn.disabled = false;
      btn.textContent = "당첨 확인";
      return;
    }
  }

  showToast(`${entries[0].round}회 당첨 결과를 확인했습니다.`, "info");
  await loadAndRenderMyNumbers(type);
}

async function batchDelete(entries, type) {
  for (const entry of entries) {
    await window.api.myNumbersDelete(entry.id);
  }
  showToast("삭제되었습니다.", "info");
  await loadAndRenderMyNumbers(type);
}
