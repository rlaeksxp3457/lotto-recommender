// ═══ 알고리즘 동작 원리 애니메이션 모듈 ═══

// ─── 용어 사전 (클릭 툴팁) ───

const GLOSSARY = {
  "가중 확률": "많이 출현한 번호에 더 높은 선택 확률을 부여하는 방식입니다.",
  "가중치": "각 항목의 중요도를 숫자로 표현한 값입니다. 가중치가 높을수록 선택될 확률이 높아집니다.",
  "AC값": "6개 번호 쌍의 차이값 중 고유한 개수에서 5를 뺀 값(0~10)으로, 번호 조합의 다양성을 측정합니다.",
  "산술 복잡도": "AC값이라고도 하며, 번호가 얼마나 고르게 퍼져 있는지 수치화한 것입니다.",
  "마르코프 체인": "이번 회차 번호를 기반으로 다음 회차 번호를 확률적으로 예측하는 통계 기법입니다.",
  "마르코프": "직전 회차의 번호를 참고하여 다음 회차를 예측하는 확률 모델입니다.",
  "전이 확률": "한 번호가 나온 다음 회차에 특정 번호가 출현할 확률입니다. 예: 7 다음에 23이 나올 확률 12%",
  "후나츠 사카이": "각 번호의 평균 출현 주기 대비 현재 미출현 기간의 비율로 다음 출현을 예측하는 방법입니다.",
  "핫(Hot)": "최근 자주 출현한 '뜨거운' 번호를 뜻합니다. 출현 빈도가 높은 번호입니다.",
  "콜드(Cold)": "최근 출현하지 않은 '차가운' 번호를 뜻합니다. 오래 쉬다가 나올 가능성이 있는 번호입니다.",
  "인접쌍": "연속된 두 위치에서 함께 출현한 숫자 쌍의 패턴입니다.",
  "연속번호": "번호가 1 차이로 연달아 나오는 것입니다. 예: 7-8, 22-23 같은 쌍을 말합니다.",
  "연번": "연속번호의 줄임말로, 1 차이로 붙어 있는 번호 쌍입니다. 예: 12-13",
  "끝수": "번호의 일의 자리 숫자입니다. 예: 23의 끝수는 3, 40의 끝수는 0입니다.",
  "홀짝": "홀수(1,3,5...)와 짝수(2,4,6...)의 비율입니다. 보통 홀3:짝3이 가장 균형 잡힌 조합입니다.",
  "유효성": "생성된 번호 조합이 합계, 홀짝 비율, 번호대 분포 등의 조건을 만족하는지 확인하는 과정입니다.",
  "출현 빈도": "특정 번호가 역대 또는 최근 일정 기간 동안 당첨된 횟수입니다.",
  "미출현": "특정 번호가 최근 당첨되지 않고 빠져 있는 상태를 말합니다.",
};

function applyGlossary(text) {
  const terms = Object.keys(GLOSSARY).sort((a, b) => b.length - a.length);
  const pattern = terms.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
  if (!pattern) return text;
  const regex = new RegExp(`(${pattern})`, "g");
  const seen = new Set();
  return text.replace(regex, (match) => {
    if (seen.has(match)) return match;
    seen.add(match);
    const tip = GLOSSARY[match].replace(/"/g, "&quot;");
    return `<span class="term-tip" data-tip="${tip}">${match}</span>`;
  });
}

// ─── SVG 비주얼 생성기 ───

const VISUALS = {
  // 막대 차트 올라감
  bars(container) {
    const heights = [40, 70, 55, 90, 30, 75, 60, 85];
    const colors = ["#5865f2", "#57a6ff", "#5865f2", "#ed4245", "#57a6ff", "#ed4245", "#5865f2", "#57a6ff"];
    heights.forEach((h, i) => {
      const bar = document.createElement("div");
      bar.className = "av-bar";
      bar.style.cssText = `--h:${h}%;--c:${colors[i]};--d:${i * 80}ms`;
      container.appendChild(bar);
    });
  },

  // 원 크기 차등
  weight(container) {
    const sizes = [18, 28, 14, 32, 22, 26];
    const labels = ["3", "12", "7", "45", "21", "33"];
    sizes.forEach((s, i) => {
      const dot = document.createElement("div");
      dot.className = "av-dot";
      dot.style.cssText = `--s:${s}px;--d:${i * 100}ms`;
      dot.textContent = labels[i];
      container.appendChild(dot);
    });
  },

  // 공 6개 뽑기
  pick(container) {
    const nums = [7, 14, 23, 31, 38, 42];
    const cls = ["c-yellow", "c-blue", "c-red", "c-gray", "c-gray", "c-green"];
    nums.forEach((n, i) => {
      const ball = document.createElement("div");
      ball.className = `av-ball ${cls[i]}`;
      ball.style.cssText = `--d:${i * 120}ms`;
      ball.textContent = n;
      container.appendChild(ball);
    });
  },

  // 핫(빨강)/콜드(파랑) 분류
  hotcold(container) {
    const wrap = document.createElement("div");
    wrap.className = "av-hotcold";
    const hotSide = document.createElement("div");
    hotSide.className = "av-hc-group hot";
    hotSide.innerHTML = '<span class="av-hc-label">HOT</span>';
    [12, 33, 7].forEach((n, i) => {
      const d = document.createElement("span");
      d.className = "av-hc-item hot";
      d.style.cssText = `--d:${i * 100}ms`;
      d.textContent = n;
      hotSide.appendChild(d);
    });
    const coldSide = document.createElement("div");
    coldSide.className = "av-hc-group cold";
    coldSide.innerHTML = '<span class="av-hc-label">COLD</span>';
    [41, 2, 19].forEach((n, i) => {
      const d = document.createElement("span");
      d.className = "av-hc-item cold";
      d.style.cssText = `--d:${(i + 3) * 100}ms`;
      d.textContent = n;
      coldSide.appendChild(d);
    });
    wrap.appendChild(hotSide);
    wrap.appendChild(coldSide);
    container.appendChild(wrap);
  },

  // 두 그룹 합치기
  merge(container) {
    const wrap = document.createElement("div");
    wrap.className = "av-merge";
    const left = document.createElement("div");
    left.className = "av-merge-group left";
    [5, 18, 27].forEach(n => {
      const s = document.createElement("span");
      s.className = "av-merge-item";
      s.textContent = n;
      left.appendChild(s);
    });
    const arrow = document.createElement("div");
    arrow.className = "av-merge-arrow";
    arrow.textContent = "\u2192";
    const right = document.createElement("div");
    right.className = "av-merge-group right";
    [33, 40, 44].forEach(n => {
      const s = document.createElement("span");
      s.className = "av-merge-item";
      s.textContent = n;
      right.appendChild(s);
    });
    wrap.appendChild(left);
    wrap.appendChild(arrow);
    wrap.appendChild(right);
    container.appendChild(wrap);
  },

  // 시계/타이머
  clock(container) {
    const wrap = document.createElement("div");
    wrap.className = "av-clock";
    wrap.innerHTML = `
      <svg viewBox="0 0 40 40" width="40" height="40">
        <circle cx="20" cy="20" r="17" fill="none" stroke="var(--border)" stroke-width="2"/>
        <line class="av-clock-hand" x1="20" y1="20" x2="20" y2="7" stroke="var(--accent)" stroke-width="2" stroke-linecap="round"/>
      </svg>
    `;
    const nums = document.createElement("div");
    nums.className = "av-clock-nums";
    ["15\ud68c", "32\ud68c", "8\ud68c"].forEach((t, i) => {
      const s = document.createElement("span");
      s.className = "av-clock-num";
      s.style.cssText = `--d:${i * 200}ms`;
      s.textContent = t;
      nums.appendChild(s);
    });
    container.appendChild(wrap);
    container.appendChild(nums);
  },

  // 정렬
  sort(container) {
    const vals = [38, 12, 45, 3, 27, 19];
    const wrap = document.createElement("div");
    wrap.className = "av-sort";
    vals.forEach((v, i) => {
      const s = document.createElement("span");
      s.className = "av-sort-item";
      s.style.cssText = `--d:${i * 120}ms;--order:${i}`;
      s.textContent = v;
      wrap.appendChild(s);
    });
    container.appendChild(wrap);
  },

  // 쌍 연결
  pair(container) {
    const wrap = document.createElement("div");
    wrap.className = "av-pair";
    const pairs = [[5, 23], [12, 38], [19, 44]];
    pairs.forEach(([a, b], i) => {
      const g = document.createElement("div");
      g.className = "av-pair-group";
      g.style.cssText = `--d:${i * 200}ms`;
      const s1 = document.createElement("span");
      s1.className = "av-pair-item";
      s1.textContent = a;
      const line = document.createElement("span");
      line.className = "av-pair-line";
      const s2 = document.createElement("span");
      s2.className = "av-pair-item";
      s2.textContent = b;
      g.appendChild(s1);
      g.appendChild(line);
      g.appendChild(s2);
      wrap.appendChild(g);
    });
    container.appendChild(wrap);
  },

  // 확장
  expand(container) {
    const wrap = document.createElement("div");
    wrap.className = "av-expand";
    const seed = [5, 23];
    const extra = [12, 31, 38, 44];
    seed.forEach((n, i) => {
      const s = document.createElement("span");
      s.className = "av-expand-seed";
      s.style.cssText = `--d:${i * 80}ms`;
      s.textContent = n;
      wrap.appendChild(s);
    });
    const plus = document.createElement("span");
    plus.className = "av-expand-plus";
    plus.textContent = "+";
    wrap.appendChild(plus);
    extra.forEach((n, i) => {
      const s = document.createElement("span");
      s.className = "av-expand-new";
      s.style.cssText = `--d:${(i + 2) * 120}ms`;
      s.textContent = n;
      wrap.appendChild(s);
    });
    container.appendChild(wrap);
  },

  // 홀짝 분리
  split(container) {
    const wrap = document.createElement("div");
    wrap.className = "av-split";
    const oddSide = document.createElement("div");
    oddSide.className = "av-split-group";
    oddSide.innerHTML = '<span class="av-split-label">\ud640</span>';
    [3, 17, 31].forEach((n, i) => {
      const s = document.createElement("span");
      s.className = "av-split-item odd";
      s.style.cssText = `--d:${i * 100}ms`;
      s.textContent = n;
      oddSide.appendChild(s);
    });
    const evenSide = document.createElement("div");
    evenSide.className = "av-split-group";
    evenSide.innerHTML = '<span class="av-split-label">\uc9dd</span>';
    [12, 28, 44].forEach((n, i) => {
      const s = document.createElement("span");
      s.className = "av-split-item even";
      s.style.cssText = `--d:${(i + 3) * 100}ms`;
      s.textContent = n;
      evenSide.appendChild(s);
    });
    wrap.appendChild(oddSide);
    wrap.appendChild(evenSide);
    container.appendChild(wrap);
  },

  // 저울 균형
  balance(container) {
    const wrap = document.createElement("div");
    wrap.className = "av-balance";
    wrap.innerHTML = `
      <div class="av-balance-beam">
        <div class="av-balance-side left">
          <span>\ud640 3</span>
        </div>
        <div class="av-balance-pivot">\u25b2</div>
        <div class="av-balance-side right">
          <span>\uc9dd 3</span>
        </div>
      </div>
    `;
    container.appendChild(wrap);
  },

  // 레이어 겹치기
  layers(container) {
    const wrap = document.createElement("div");
    wrap.className = "av-layers";
    const labels = ["\uc804\uccb4", "200\ud68c", "100\ud68c", "50\ud68c"];
    const opacities = [0.25, 0.4, 0.6, 0.9];
    labels.forEach((l, i) => {
      const layer = document.createElement("div");
      layer.className = "av-layer";
      layer.style.cssText = `--d:${i * 150}ms;--o:${opacities[i]}`;
      layer.textContent = l;
      wrap.appendChild(layer);
    });
    container.appendChild(wrap);
  },

  // 마르코프 체인
  chain(container) {
    const wrap = document.createElement("div");
    wrap.className = "av-chain";
    const nodes = ["A", "B", "C", "D"];
    nodes.forEach((n, i) => {
      if (i > 0) {
        const arrow = document.createElement("span");
        arrow.className = "av-chain-arrow";
        arrow.style.cssText = `--d:${i * 200}ms`;
        arrow.textContent = "\u2192";
        wrap.appendChild(arrow);
      }
      const node = document.createElement("span");
      node.className = "av-chain-node";
      node.style.cssText = `--d:${i * 200}ms`;
      node.textContent = n;
      wrap.appendChild(node);
    });
    container.appendChild(wrap);
  },

  // 점수 매기기
  score(container) {
    const wrap = document.createElement("div");
    wrap.className = "av-score";
    const items = [
      { num: 7, score: 85 },
      { num: 23, score: 72 },
      { num: 38, score: 91 },
      { num: 14, score: 68 },
    ];
    items.forEach((item, i) => {
      const el = document.createElement("div");
      el.className = "av-score-item";
      el.style.cssText = `--d:${i * 150}ms`;
      el.innerHTML = `<span class="av-score-num">${item.num}</span><span class="av-score-badge">${item.score}</span>`;
      wrap.appendChild(el);
    });
    container.appendChild(wrap);
  },

  // 슬롯 머신
  slots(container) {
    const wrap = document.createElement("div");
    wrap.className = "av-slots";
    for (let i = 0; i < 6; i++) {
      const reel = document.createElement("div");
      reel.className = "av-slot-reel";
      reel.style.cssText = `--d:${i * 100}ms`;
      const inner = document.createElement("div");
      inner.className = "av-slot-inner";
      for (let d = 0; d <= 9; d++) {
        const cell = document.createElement("span");
        cell.textContent = d;
        inner.appendChild(cell);
      }
      reel.appendChild(inner);
      wrap.appendChild(reel);
    }
    container.appendChild(wrap);
  },

  // 랜덤 믹스 (셔플)
  mix(container) {
    const wrap = document.createElement("div");
    wrap.className = "av-mix";
    const nums = [2, 5, 7, 1, 9, 4];
    nums.forEach((n, i) => {
      const card = document.createElement("span");
      card.className = "av-mix-card";
      card.style.cssText = `--d:${i * 100}ms;--r:${(Math.random() - 0.5) * 20}deg`;
      card.textContent = n;
      wrap.appendChild(card);
    });
    container.appendChild(wrap);
  },

  // 트렌드선
  trend(container) {
    const wrap = document.createElement("div");
    wrap.className = "av-trend";
    wrap.innerHTML = `
      <svg viewBox="0 0 120 50" class="av-trend-svg">
        <polyline class="av-trend-line" points="5,40 20,30 35,35 50,20 65,25 80,15 95,10 110,18" fill="none" stroke="var(--accent)" stroke-width="2"/>
        <text x="5" y="48" class="av-trend-label">\uacfc\uac70</text>
        <text x="95" y="48" class="av-trend-label">\ucd5c\uadfc</text>
      </svg>
    `;
    container.appendChild(wrap);
  },

  // 후나츠 사카이 주기 비율 (가로 막대)
  gapRatio(container) {
    const wrap = document.createElement("div");
    wrap.className = "av-gapratio";
    const items = [
      { num: 7, ratio: 1.8 },
      { num: 23, ratio: 1.3 },
      { num: 38, ratio: 0.7 },
      { num: 14, ratio: 2.1 },
      { num: 31, ratio: 0.4 },
    ];
    // 기준선 1.0
    const refLine = document.createElement("div");
    refLine.className = "av-gapratio-ref";
    refLine.innerHTML = '<span class="av-gapratio-ref-label">1.0x</span>';
    wrap.appendChild(refLine);
    items.forEach((item, i) => {
      const row = document.createElement("div");
      row.className = "av-gapratio-row";
      row.style.cssText = `--d:${i * 120}ms`;
      const pct = Math.min(item.ratio / 2.5 * 100, 100);
      const color = item.ratio >= 1.5 ? "#e74c3c" : item.ratio >= 1.0 ? "#f39c12" : "#3498db";
      row.innerHTML = `
        <span class="av-gapratio-num">${item.num}</span>
        <div class="av-gapratio-track">
          <div class="av-gapratio-fill" style="--w:${pct}%;--c:${color}"></div>
        </div>
        <span class="av-gapratio-val">${item.ratio}x</span>
      `;
      wrap.appendChild(row);
    });
    container.appendChild(wrap);
  },

  // AC값 복잡도 시각화
  acValue(container) {
    const wrap = document.createElement("div");
    wrap.className = "av-acvalue";
    // 6개 번호의 C(6,2)=15개 차이값 중 고유 개수 - 5 = AC
    const nums = [5, 12, 19, 28, 33, 41];
    const numRow = document.createElement("div");
    numRow.className = "av-acvalue-nums";
    nums.forEach((n, i) => {
      const s = document.createElement("span");
      s.className = "av-acvalue-num";
      s.style.cssText = `--d:${i * 80}ms`;
      s.textContent = n;
      numRow.appendChild(s);
    });
    wrap.appendChild(numRow);
    // 차이값 셀 (일부만 표시)
    const diffs = new Set();
    for (let i = 0; i < nums.length; i++)
      for (let j = i + 1; j < nums.length; j++)
        diffs.add(Math.abs(nums[i] - nums[j]));
    const ac = diffs.size - 5;
    const diffRow = document.createElement("div");
    diffRow.className = "av-acvalue-diffs";
    let di = 0;
    for (const d of [...diffs].slice(0, 8)) {
      const s = document.createElement("span");
      s.className = "av-acvalue-diff";
      s.style.cssText = `--d:${(di + 6) * 60}ms`;
      s.textContent = d;
      diffRow.appendChild(s);
      di++;
    }
    const more = document.createElement("span");
    more.className = "av-acvalue-diff more";
    more.textContent = `+${diffs.size - 8}`;
    diffRow.appendChild(more);
    wrap.appendChild(diffRow);
    // AC 뱃지
    const badge = document.createElement("div");
    badge.className = "av-acvalue-badge";
    badge.style.cssText = `--d:800ms`;
    badge.innerHTML = `AC = <strong>${ac}</strong>`;
    wrap.appendChild(badge);
    container.appendChild(wrap);
  },

  // 번호대 구간 분포 시각화
  rangeGrid(container) {
    const wrap = document.createElement("div");
    wrap.className = "av-rangegrid";
    const ranges = ["1~9", "10~18", "19~27", "28~36", "37~45"];
    const colors = ["var(--ball-yellow)", "var(--ball-blue)", "var(--ball-red)", "var(--ball-gray)", "var(--ball-green)"];
    const counts = [1, 2, 1, 1, 1]; // 예시 분포
    const nums = [[7], [12, 18], [23], [31], [42]];
    ranges.forEach((label, i) => {
      const col = document.createElement("div");
      col.className = "av-rangegrid-col";
      col.style.cssText = `--d:${i * 100}ms`;
      const header = document.createElement("div");
      header.className = "av-rangegrid-header";
      header.style.background = colors[i];
      header.textContent = label;
      col.appendChild(header);
      nums[i].forEach(n => {
        const ball = document.createElement("div");
        ball.className = "av-rangegrid-ball";
        ball.textContent = n;
        col.appendChild(ball);
      });
      wrap.appendChild(col);
    });
    container.appendChild(wrap);
  },

  // 합계 범위 시각화 (연금복권용)
  sumRange(container) {
    const wrap = document.createElement("div");
    wrap.className = "av-sumrange";
    // 수평 범위 바
    const avg = 27;
    const lo = 22;
    const hi = 32;
    const current = 25;
    wrap.innerHTML = `
      <div class="av-sumrange-track">
        <div class="av-sumrange-zone" style="--lo:${lo/54*100}%;--hi:${hi/54*100}%">
          <span class="av-sumrange-zone-label">평균 ±5</span>
        </div>
        <div class="av-sumrange-avg" style="--pos:${avg/54*100}%">
          <span class="av-sumrange-avg-label">${avg}</span>
        </div>
        <div class="av-sumrange-current" style="--pos:${current/54*100}%">
          <span class="av-sumrange-current-label">${current}</span>
        </div>
      </div>
      <div class="av-sumrange-labels">
        <span>0</span><span>합계</span><span>54</span>
      </div>
    `;
    container.appendChild(wrap);
  },

  // 반복 회피 시각화 (연금복권용)
  noRepeat(container) {
    const wrap = document.createElement("div");
    wrap.className = "av-norepeat";
    const digits = [3, 7, 3, 5, 9, 5];
    digits.forEach((d, i) => {
      const slot = document.createElement("div");
      slot.className = "av-norepeat-slot";
      slot.style.cssText = `--d:${i * 100}ms`;
      slot.textContent = d;
      // 반복 감지
      const isRepeat = (i > 0 && d === digits[i - 1]) || (i < 5 && d === digits[i + 1]);
      if (isRepeat) {
        slot.classList.add("repeat");
        const penalty = document.createElement("span");
        penalty.className = "av-norepeat-penalty";
        penalty.textContent = "×0.3";
        slot.appendChild(penalty);
      }
      wrap.appendChild(slot);
    });
    container.appendChild(wrap);
  },

  // 필터 배제
  filter(container) {
    const wrap = document.createElement("div");
    wrap.className = "av-filter";
    const items = [3, 3, 7, 5, 5, 2];
    items.forEach((n, i) => {
      const s = document.createElement("span");
      // 인접 반복 패턴(3,3 / 5,5)에 X 마크
      const isFiltered = (i === 1 && items[i] === items[i - 1]) || (i === 4 && items[i] === items[i - 1]);
      s.className = `av-filter-item${isFiltered ? " filtered" : ""}`;
      s.style.cssText = `--d:${i * 100}ms`;
      s.textContent = n;
      if (isFiltered) {
        const x = document.createElement("span");
        x.className = "av-filter-x";
        x.textContent = "\u2715";
        s.appendChild(x);
      }
      wrap.appendChild(s);
    });
    container.appendChild(wrap);
  },
};

// ─── 메인 생성 함수 ───

export function createAnimatedAlgoDetail(howItWorks) {
  const detail = document.createElement("div");
  detail.className = "algo-detail";

  howItWorks.forEach((step, i) => {
    const stepEl = document.createElement("div");
    stepEl.className = "algo-step";
    stepEl.style.cssText = `--step-delay:${i * 2}s`;

    const numEl = document.createElement("span");
    numEl.className = "algo-step-num";
    numEl.textContent = i + 1;

    const textEl = document.createElement("span");
    textEl.className = "algo-step-text";
    textEl.innerHTML = applyGlossary(step.text);

    stepEl.appendChild(numEl);
    stepEl.appendChild(textEl);

    // 비주얼 영역
    if (step.visual && VISUALS[step.visual]) {
      const visualWrap = document.createElement("div");
      visualWrap.className = `algo-visual av-${step.visual}`;
      VISUALS[step.visual](visualWrap);
      stepEl.appendChild(visualWrap);
    }

    detail.appendChild(stepEl);
  });

  return detail;
}

// ─── 용어 툴팁 클릭 핸들러 ───

(function initTermTip() {
  let activePopup = null;

  function removePopup() {
    if (activePopup) { activePopup.remove(); activePopup = null; }
  }

  document.addEventListener("click", (e) => {
    const tip = e.target.closest(".term-tip");
    if (!tip) { removePopup(); return; }

    e.stopPropagation();
    removePopup();

    const popup = document.createElement("div");
    popup.className = "term-tip-popup";
    popup.textContent = tip.dataset.tip;
    document.body.appendChild(popup);
    activePopup = popup;

    const rect = tip.getBoundingClientRect();
    const pr = popup.getBoundingClientRect();
    let left = rect.left + rect.width / 2 - pr.width / 2;
    let top = rect.bottom + 6;

    if (left < 8) left = 8;
    if (left + pr.width > window.innerWidth - 8) left = window.innerWidth - pr.width - 8;
    if (top + pr.height > window.innerHeight - 8) top = rect.top - pr.height - 6;

    popup.style.left = `${left}px`;
    popup.style.top = `${top}px`;
    popup.classList.add("visible");
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") removePopup();
  });

  document.addEventListener("scroll", removePopup, true);
})();
