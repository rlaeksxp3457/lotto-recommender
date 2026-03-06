// ═══ 알고리즘 동작 원리 애니메이션 모듈 ═══

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
    textEl.textContent = step.text;

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
