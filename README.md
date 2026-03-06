# Lotto Recommender

> Statistical analysis and number recommendation engine for Korean Lotto 6/45

A desktop application built with Electron that analyzes 1,200+ rounds of Korean Lotto 6/45 historical data and recommends numbers using 7 different statistical strategies.

## Features

- **7 Statistical Strategies** - Frequency-weighted, Hot/Cold balance, Overdue priority, Pair-based, Statistical odd/even, Multi-window ensemble, Markov chain prediction
- **BEST 5 Recommendations** - Top 5 strategies ranked by backtest performance, displayed in lottery ticket format
- **Never-Drawn Combinations** - Extract combinations from 8,145,060 total possibilities that have never appeared
- **Frequency Analysis** - Visual bar chart for all 45 numbers
- **Hot/Cold Analysis** - Recent trend insights, overdue numbers, sum statistics, top pairs
- **Auto Data Update** - Fetch latest results from the Korean Lottery API
- **CSV Import** - Upload custom data via CSV files
- **In-App Updates** - Automatic update notification when new versions are released
- **Discord-style UI** - Dark theme with custom titlebar

## Strategies

| # | Strategy | Description |
|---|----------|-------------|
| 1 | Frequency Weighted | Higher probability for frequently drawn numbers |
| 2 | Hot/Cold Balance | 3 recent hot + 3 overdue cold numbers |
| 3 | Overdue Priority | Focus on numbers with longest absence |
| 4 | Pair-Based | Seed from frequently co-occurring pairs |
| 5 | Statistical Odd/Even | Maintain 3:3 odd/even + low/high balance |
| 6 | Multi-Window Ensemble | Weighted combination of multiple time windows |
| 7 | Markov Chain | Transition probability from previous draw |

## Installation

Download the latest installer from [Releases](https://github.com/rlaeksxp3457/lotto-recommender/releases).

### Development

```bash
git clone https://github.com/rlaeksxp3457/lotto-recommender.git
cd lotto-recommender
npm install
npm start
```

### Build

```bash
npm run build        # NSIS installer + portable
npm run build:dir    # Portable only
```

## Tech Stack

- **Electron** v35 - Cross-platform desktop framework
- **electron-builder** - Packaging and distribution
- **electron-updater** - In-app auto-update via GitHub Releases
- **Pure JavaScript** - No frontend framework dependencies

## Project Structure

```
lotto-recommender/
├── main.js                    # Electron main process
├── preload.js                 # IPC bridge (contextIsolation)
├── src/
│   ├── ipc.js                 # IPC handlers (data, recommendations)
│   ├── analyzer.js            # Statistical analysis engine
│   ├── data.js                # Embedded historical data (1,200+ rounds)
│   └── renderer/
│       ├── index.html         # UI layout
│       ├── style.css          # Discord-style theme
│       ├── app.js             # Renderer entry point
│       └── modules/           # Modular renderer code
│           ├── state.js       # Shared state
│           ├── utils.js       # Ball colors, toast, formatting
│           ├── tabs.js        # Tab switching, counters
│           ├── titlebar.js    # Custom window controls
│           ├── top5.js        # BEST 5 recommendations
│           ├── recommend.js   # Strategy recommendations
│           ├── neverdrawn.js  # Never-drawn combinations
│           ├── charts.js      # Frequency chart & insights
│           ├── update.js      # Data update & app update
│           └── tutorial.js    # First-run tutorial
├── scripts/
│   └── afterPack.js           # Build optimization (locale cleanup)
└── package.json
```

## License

MIT

---

# 로또 추천기

> 한국 로또 6/45 통계 분석 및 번호 추천 엔진

1,200회차 이상의 역대 로또 당첨번호를 분석하여 7가지 통계 전략으로 번호를 추천하는 데스크톱 앱입니다.

## 주요 기능

- **7가지 통계 전략** - 빈도 가중, 핫/콜드 균형, 오래된 번호 우선, 빈출 쌍 기반, 통계적 홀짝 균형, 다중 윈도우 앙상블, 마르코프 체인 예측
- **BEST 5 추천** - 백테스트 성능 상위 5개 전략의 추천 번호를 로또 용지 형태로 표시
- **미출현 조합** - 전체 8,145,060개 조합 중 역대 당첨된 적 없는 조합 추출
- **빈도 분석** - 1~45번 전체 출현 빈도 막대 차트
- **핫/콜드 분석** - 최근 트렌드, 오래된 번호, 합계 통계, 빈출 쌍 Top 10
- **자동 데이터 업데이트** - 동행복권 API에서 최신 당첨번호 자동 수신
- **CSV 가져오기** - CSV 파일로 데이터 직접 업로드
- **인앱 업데이트** - 새 버전 출시 시 프로그램 내에서 자동 업데이트 알림
- **Discord 스타일 UI** - 다크 테마, 커스텀 타이틀바

## 전략 목록

| # | 전략 | 설명 |
|---|------|------|
| 1 | 빈도 가중 랜덤 | 많이 나온 번호일수록 높은 확률 |
| 2 | 핫/콜드 균형 | 최근 핫 3개 + 오래된 3개 조합 |
| 3 | 오래된 번호 우선 | 오래 안 나온 번호 중심 선택 |
| 4 | 빈출 쌍 기반 | 자주 같이 나온 쌍을 씨드로 확장 |
| 5 | 통계적 홀짝 균형 | 홀3:짝3 + 저고 균형 유지 |
| 6 | 다중 윈도우 앙상블 | 전체+최근 기간별 가중합 분석 |
| 7 | 마르코프 체인 예측 | 직전 회차 전이 확률 기반 예측 |

## 설치

[Releases](https://github.com/rlaeksxp3457/lotto-recommender/releases) 페이지에서 최신 설치 파일을 다운로드하세요.

### 개발 환경

```bash
git clone https://github.com/rlaeksxp3457/lotto-recommender.git
cd lotto-recommender
npm install
npm start
```

### 빌드

```bash
npm run build        # NSIS 설치 파일 + 포터블
npm run build:dir    # 포터블만
```

## 기술 스택

- **Electron** v35 - 크로스 플랫폼 데스크톱 프레임워크
- **electron-builder** - 패키징 및 배포
- **electron-updater** - GitHub Releases 기반 인앱 자동 업데이트
- **순수 JavaScript** - 프론트엔드 프레임워크 없음

## 면책 조항

이 앱은 통계 분석 도구이며, 당첨을 보장하지 않습니다. 로또는 완전한 무작위 추첨이므로, 참고용으로만 사용하시기 바랍니다.
