const CHANGELOG = [
  {
    version: "2.11.2", date: "2025-03-08", changes: [
      "데이터 업데이트 후 당첨 이력 즉시 갱신 안 되는 버그 수정",
    ],
  },
  {
    version: "2.11.1", date: "2025-03-07", changes: [
      "변경 내역 보기 기능 추가 (버전 클릭)",
      "버전/카피라이트 폰트 크기 개선",
    ],
  },
  {
    version: "2.11.0", date: "2025-03-07", changes: [
      "로또/연금복권 TOP5 '복사 + 저장' 버튼 추가",
      "프로그램 업데이트 시 트레이 알림 표시",
      "5분마다 자동 업데이트 체크",
    ],
  },
  {
    version: "2.10.0", date: "2025-03-06", changes: [
      "API 호출 최적화 (임베디드 데이터 번들)",
      "업데이트 필요 시 버튼 애니메이션",
      "데이터 업데이트 프로그래스 모달 추가",
    ],
  },
  {
    version: "2.9.5", date: "2025-03-05", changes: [
      "당첨확인 로컬 데이터 전환",
      "보너스번호 가독성 개선",
    ],
  },
  {
    version: "2.9.4", date: "2025-03-04", changes: [
      "바로가기 아이콘 캐시 문제 수정",
      "튜토리얼 하이라이트 구멍 효과 추가",
    ],
  },
  {
    version: "2.9.2", date: "2025-03-03", changes: [
      "바로가기 아이콘 표시 수정",
      "튜토리얼 하이라이트 개선",
    ],
  },
  {
    version: "2.9.0", date: "2025-03-02", changes: [
      "알고리즘 애니메이션 효과",
      "추천번호 개별/배치 저장 기능",
      "당첨 이력 탭 추가",
      "개발자 후원 기능",
    ],
  },
  {
    version: "2.7.0", date: "2025-02-28", changes: [
      "내 번호 관리 기능 추가",
      "알고리즘 도움말 툴팁",
    ],
  },
  {
    version: "2.6.0", date: "2025-02-27", changes: [
      "자동 업데이트 안정화",
      "연금복권 4개 탭 확장",
    ],
  },
  {
    version: "2.5.0", date: "2025-02-26", changes: [
      "사이드바 탭 분리",
      "연금복권 데이터 업데이트 & 정보 표시",
    ],
  },
  {
    version: "2.4.0", date: "2025-02-25", changes: [
      "연금복권720+ 추천 기능 추가",
    ],
  },
  {
    version: "2.3.0", date: "2025-02-24", changes: [
      "커스텀 앱 아이콘 적용",
      "시스템 트레이 아이콘",
      "인스톨러 브랜딩",
    ],
  },
  {
    version: "2.2.0", date: "2025-02-23", changes: [
      "튜토리얼 시스템 추가",
      "트레이 모드 종료 모달",
      "시스템 트레이 상주",
    ],
  },
  {
    version: "2.1.0", date: "2025-02-22", changes: [
      "코드 리팩토링",
      "커스텀 타이틀바",
      "자동 업데이트 기능",
    ],
  },
  {
    version: "2.0.0", date: "2025-02-21", changes: [
      "로또 추천기 초기 릴리즈",
    ],
  },
];

export function initChangelog() {
  const versionEl = document.getElementById("app-version");
  const modal = document.getElementById("changelog-modal");
  const list = document.getElementById("changelog-list");
  const closeBtn = document.getElementById("changelog-close");
  if (!versionEl || !modal) return;

  const currentVersion = versionEl.textContent.replace("v", "");

  versionEl.title = "변경 내역 보기";
  versionEl.addEventListener("click", () => {
    renderChangelog(list, currentVersion);
    modal.classList.remove("hidden");
  });

  closeBtn.addEventListener("click", () => modal.classList.add("hidden"));
  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.classList.add("hidden");
  });
}

function renderChangelog(container, currentVersion) {
  container.innerHTML = "";
  for (const entry of CHANGELOG) {
    const item = document.createElement("div");
    item.className = "changelog-item";

    const header = document.createElement("div");
    header.className = "changelog-item-header";

    const ver = document.createElement("span");
    ver.className = "changelog-version";
    ver.textContent = `v${entry.version}`;
    header.appendChild(ver);

    if (entry.version === currentVersion) {
      const badge = document.createElement("span");
      badge.className = "changelog-current";
      badge.textContent = "현재";
      header.appendChild(badge);
    }

    const date = document.createElement("span");
    date.className = "changelog-date";
    date.textContent = entry.date;
    header.appendChild(date);

    const changes = document.createElement("ul");
    changes.className = "changelog-changes";
    for (const c of entry.changes) {
      const li = document.createElement("li");
      li.textContent = c;
      changes.appendChild(li);
    }

    item.appendChild(header);
    item.appendChild(changes);
    container.appendChild(item);
  }
}
