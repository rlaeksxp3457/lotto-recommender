// ═══ 내 번호 관리 모듈 ═══

import { state } from "./state.js";
import { showToast, ballColor } from "./utils.js";

// ─── 유틸 ───

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

    let saved = 0;
    for (const numbers of allNumbers) {
      const result = await window.api.myNumbersSave({ type: "lotto", round, numbers });
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

    let saved = 0;
    for (const entry of allEntries) {
      const result = await window.api.myNumbersSave({
        type: "pension", round, group: entry.group, digits: entry.digits,
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

async function loadAndRenderMyNumbers(type) {
  const result = await window.api.myNumbersLoad();
  if (result.error) {
    showToast(result.error, "error");
    return;
  }

  state.myNumbers = result.numbers;
  const filtered = result.numbers.filter(n => n.type === type);
  const containerId = type === "lotto" ? "my-lotto-list" : "my-pension-list";
  renderMyNumbersList(filtered, containerId, type);
}

function renderMyNumbersList(items, containerId, type) {
  const container = document.getElementById(containerId);
  container.innerHTML = "";

  if (items.length === 0) {
    container.innerHTML = '<div class="my-numbers-empty">저장된 번호가 없습니다.</div>';
    return;
  }

  // 최신순 정렬
  const sorted = [...items].sort((a, b) => parseInt(b.id) - parseInt(a.id));

  sorted.forEach(item => {
    const card = document.createElement("div");
    card.className = "my-number-card";

    // 헤더
    const header = document.createElement("div");
    header.className = "my-number-card-header";
    header.innerHTML = `
      <span class="my-number-round">${item.round}회</span>
      <span class="my-number-date">${item.createdAt}</span>
    `;

    // 번호 표시
    const numbersWrap = document.createElement("div");
    numbersWrap.className = "my-number-balls";

    if (type === "lotto") {
      item.numbers.forEach(n => numbersWrap.appendChild(createLottoBall(n)));
    } else {
      numbersWrap.appendChild(createPensionDigit(item.group, 0));
      const sep = document.createElement("span");
      sep.className = "pension-group-sep";
      sep.textContent = "|";
      numbersWrap.appendChild(sep);
      item.digits.forEach((d, i) => numbersWrap.appendChild(createPensionDigit(d, i + 1)));
    }

    // 액션 버튼
    const actions = document.createElement("div");
    actions.className = "my-number-actions";

    // 당첨 확인 버튼
    const checkBtn = document.createElement("button");
    checkBtn.className = "my-number-check-btn";
    checkBtn.textContent = "당첨 확인";
    checkBtn.addEventListener("click", async () => {
      checkBtn.disabled = true;
      checkBtn.innerHTML = '<span class="spinner"></span>';

      const api = type === "lotto" ? window.api.myNumbersCheckLotto : window.api.myNumbersCheckPension;
      const res = await api(item.id);

      if (res.error) {
        showToast(res.error, "error");
        checkBtn.disabled = false;
        checkBtn.textContent = "당첨 확인";
        return;
      }

      showToast(`${item.round}회 결과: ${res.result.label}`, res.result.rank > 0 ? "success" : "info");
      await loadAndRenderMyNumbers(type);
    });

    // 삭제 버튼
    const delBtn = document.createElement("button");
    delBtn.className = "my-number-del-btn";
    delBtn.innerHTML = "✕";
    delBtn.title = "삭제";
    delBtn.addEventListener("click", async () => {
      const res = await window.api.myNumbersDelete(item.id);
      if (res.error) {
        showToast(res.error, "error");
        return;
      }
      showToast("삭제되었습니다.", "info");
      await loadAndRenderMyNumbers(type);
    });

    actions.appendChild(checkBtn);
    actions.appendChild(delBtn);

    card.appendChild(header);
    card.appendChild(numbersWrap);

    // 결과 표시
    if (item.result && item.result.rank !== undefined) {
      const resultEl = document.createElement("div");
      resultEl.className = `my-number-result ${rankClass(item.result.rank)}`;

      if (type === "lotto") {
        resultEl.innerHTML = `
          <span class="result-rank">${item.result.label}</span>
          <span class="result-detail">${item.result.matchCount}개 일치${item.result.bonus ? " + 보너스" : ""}</span>
          <div class="result-win-numbers">
            당첨번호: ${item.result.winNumbers.map(n => `<span class="mini-ball ${ballColor(n)}">${n}</span>`).join("")}
            <span class="mini-ball bonus">${item.result.bonusNo}</span>
          </div>
        `;
      } else {
        const winDisplay = `${item.result.winGroup}조 ${item.result.winDigits.join("")}`;
        resultEl.innerHTML = `
          <span class="result-rank">${item.result.label}</span>
          <span class="result-detail">${item.result.matchDigits}자리 일치${item.result.groupMatch ? " (조 일치)" : ""}</span>
          <div class="result-win-numbers">당첨번호: ${winDisplay}</div>
        `;
      }
      card.appendChild(resultEl);
    }

    card.appendChild(actions);
    container.appendChild(card);
  });
}
