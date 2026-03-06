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

// ─── 로또 내 번호 탭 ───

export async function initMyLotto() {
  await loadAndRenderMyNumbers("lotto");

  // 저장 폼
  document.getElementById("my-lotto-save-btn").addEventListener("click", async () => {
    const round = parseInt(document.getElementById("my-lotto-round").value);
    if (!round || round < 1) {
      showToast("회차를 입력해주세요.", "error");
      return;
    }

    const inputs = document.querySelectorAll(".my-lotto-num-input");
    const numbers = [];
    for (const inp of inputs) {
      const n = parseInt(inp.value);
      if (!n || n < 1 || n > 45) {
        showToast("1~45 사이의 번호를 입력해주세요.", "error");
        return;
      }
      if (numbers.includes(n)) {
        showToast("중복된 번호가 있습니다.", "error");
        return;
      }
      numbers.push(n);
    }

    numbers.sort((a, b) => a - b);
    const result = await window.api.myNumbersSave({ type: "lotto", round, numbers });
    if (result.error) {
      showToast(result.error, "error");
      return;
    }

    showToast("번호가 저장되었습니다.", "success");

    // 폼 초기화
    document.getElementById("my-lotto-round").value = "";
    inputs.forEach(inp => (inp.value = ""));

    await loadAndRenderMyNumbers("lotto");
  });
}

// ─── 연금복권 내 번호 탭 ───

export async function initMyPension() {
  await loadAndRenderMyNumbers("pension");

  document.getElementById("my-pension-save-btn").addEventListener("click", async () => {
    const round = parseInt(document.getElementById("my-pension-round").value);
    if (!round || round < 1) {
      showToast("회차를 입력해주세요.", "error");
      return;
    }

    const group = parseInt(document.getElementById("my-pension-group").value);
    if (!group || group < 1 || group > 5) {
      showToast("조(1~5)를 입력해주세요.", "error");
      return;
    }

    const inputs = document.querySelectorAll(".my-pension-digit-input");
    const digits = [];
    for (const inp of inputs) {
      const d = parseInt(inp.value);
      if (isNaN(d) || d < 0 || d > 9) {
        showToast("0~9 사이의 숫자를 입력해주세요.", "error");
        return;
      }
      digits.push(d);
    }

    const result = await window.api.myNumbersSave({ type: "pension", round, group, digits });
    if (result.error) {
      showToast(result.error, "error");
      return;
    }

    showToast("번호가 저장되었습니다.", "success");

    // 폼 초기화
    document.getElementById("my-pension-round").value = "";
    document.getElementById("my-pension-group").value = "";
    inputs.forEach(inp => (inp.value = ""));

    await loadAndRenderMyNumbers("pension");
  });
}

// ─── 데이터 로드 & 렌더 ───

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
