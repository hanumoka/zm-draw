# CLAUDE.md - zm-draw 프로젝트 가이드

> **Claude Code를 위한 zm-draw 프로젝트 지침서**
> 최종 업데이트: 2026-02-08 (서브에이전트 아키텍처 추가)

---

## 세션 시작 프로토콜

> **CRITICAL**: 새 세션 시작 시 반드시 아래 파일들을 순서대로 읽어야 합니다.

### 자동 읽기 파일 (필수) - 순서 중요!

1. **docs/SESSION.md** - 현재 세션 상황 (가장 중요)
2. **docs/PROGRESS.md** - 전체 진행상황
3. **docs/PROJECT.md** - 프로젝트 아키텍처
4. **docs/AGENT-ARCHITECTURE.md** - 서브에이전트 아키텍처 (필수)
5. **docs/FIGMA-FEATURES.md** - Figma 기능 분석 결과 (누적)

### 세션 복원 시 자동 확인 명령어

```bash
# 1. Git 상태 확인
cd C:/Users/amagr/projects/zm-draw && git status

# 2. 빌드 상태 확인
pnpm build

# 3. 개발 서버 상태 (선택)
curl -s -o /dev/null -w "%{http_code}" http://localhost:3200
```

### 세션 복원 보고 형식

```
## 세션 복원 완료 (zm-draw)

**Phase**: [현재 Phase]
**진행률**: [XX%]
**마지막 작업**: [작업 내용]

**Git 상태**: [브랜치, 변경사항]

**다음 작업**:
1. [다음 작업 1]
2. [다음 작업 2]

---
다음 작업을 진행할까요?
```

---

## 프로젝트 개요

**zm-draw**는 React 19 호환 Figma 라이크 다이어그램 에디터 라이브러리입니다.

- **위치**: `C:/Users/amagr/projects/zm-draw/`
- **라이센스**: MIT
- **데모 서버**: http://localhost:3200
- **GitHub**: origin/main

### 현재 상태 (2026-02-08)

- **Phase**: FigJam UI 레이아웃 개편 완료, Figma 기능 모사 진행 중
- **구현 완료**: 도형, 커넥터, 텍스트, Undo/Redo, Save/Load, Zustand, Copy/Paste, Figma UI, 스티키노트, 펜, 테이블, 마인드맵, 실시간 협업, 접근성
- **작업 방식**: 서브에이전트 오케스트레이터 패턴 (docs/AGENT-ARCHITECTURE.md 참조)

### 기술 스택

| 분류 | 기술 | 비고 |
|------|------|------|
| **코어** | Konva.js ^10.0.0 (vanilla) | 2026-01-25 업그레이드 완료 |
| **프레임워크** | React 19, Next.js 15 | App Router |
| **언어** | TypeScript 5.7+ | strict mode |
| **빌드** | tsup, Turbo | ESM only |

> **Note**: react-konva v19가 React 19를 지원하나, Next.js 15 App Router에서 canvas 모듈 이슈로 vanilla Konva 유지

---

## 모노레포 구조

```
zm-draw/
├── CLAUDE.md                   # 이 파일 (Claude 진입점)
├── docs/                       # 문서 (Claude 필독)
│   ├── SESSION.md             # 세션 상태 ⭐ 가장 중요
│   ├── PROGRESS.md            # 진행상황 로드맵
│   ├── PROJECT.md             # 아키텍처
│   ├── AGENT-ARCHITECTURE.md  # 서브에이전트 아키텍처 ⭐ 필수
│   ├── FIGMA-FEATURES.md      # Figma 기능 분석 누적 ⭐ 필수
│   └── FIGMA-STYLE-ROADMAP.md # Figma 스타일 상세 계획
│
├── scripts/
│   └── extract-gif-frames.py  # GIF 프레임 추출 (Python+Pillow)
│
├── packages/
│   ├── core/                   # @zm-draw/core (타입, 상수, 유틸)
│   ├── react/                  # @zm-draw/react (컴포넌트, 훅, 스토어)
│   └── collaboration/          # @zm-draw/collaboration (Yjs 실시간)
│
├── apps/
│   └── demo/                   # Next.js 15 데모 (port 3200)
│
├── package.json
├── turbo.json
└── pnpm-workspace.yaml
```

---

## 주요 파일 위치

| 파일 | 설명 |
|------|------|
| `packages/react/src/components/DrawCanvas.tsx` | 메인 캔버스 컴포넌트 |
| `packages/react/src/types.ts` | Shape, Connector 타입 |
| `apps/demo/src/app/page.tsx` | 데모 페이지 |

---

## 개발 명령어

```bash
# 개발 서버 시작
pnpm dev

# 빌드
pnpm build

# 타입 체크
pnpm type-check

# 클린
pnpm clean
```

---

## 코딩 규칙

### TypeScript
- `'use client'` 지시문: React 컴포넌트 파일 상단에 필수
- 타입 명시: 함수 파라미터와 반환값에 타입 지정
- any 사용 금지

### 컴포넌트 네이밍
- 컴포넌트: PascalCase (`DrawCanvas.tsx`)
- 훅: `use` prefix (`useCanvas.ts`)

### CSS 클래스
- 접두사: `zm-draw-` (예: `zm-draw-canvas`)

---

## Git 워크플로우

### 커밋 메시지

```
<type>(<scope>): <subject>

<body>

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
```

**Type**: feat, fix, docs, refactor, style, test, chore

---

## 문서 업데이트 규칙

### 작업 완료 시 반드시 업데이트

1. **docs/SESSION.md**
   - 마지막 작업 내용
   - 현재 상태
   - 다음 작업

2. **docs/PROGRESS.md**
   - 완료 항목 체크 [x]
   - 새 항목 추가

---

## 핵심 기술 결정사항 (참고)

| 항목 | 결정 | 이유 |
|------|------|------|
| Canvas 라이브러리 | Konva.js (vanilla) | Next.js 15 App Router canvas 모듈 이슈 회피 |
| 도형+텍스트 | Konva.Group | 함께 드래그/회전/리사이즈 |
| Transformer | 별도 레이어 | destroyChildren() 충돌 방지 |
| 상태 관리 (예정) | Zustand | React 19 호환 확인됨 |
| UI 컴포넌트 (예정) | Radix UI | React 19 호환 확인됨 |
| 드래그앤드롭 (예정) | HTML5 Drag API | @dnd-kit React 19 이슈로 대체 |

---

## 서브에이전트 워크플로우

> **CRITICAL**: 모든 작업은 서브에이전트를 통해 수행합니다.
> 상세 아키텍처: `docs/AGENT-ARCHITECTURE.md`

### 에이전트 구성

| # | 에이전트 | 타입 | 역할 |
|---|---------|------|------|
| 1 | **오케스트레이터** | 메인 | 사용자 대화, 전체 관리 |
| 2 | **Figma 기능파악** | general-purpose | Figma 기능 갭 분석, 스크린샷/GIF 요청 생성 |
| 3 | **GIF 프레임 분석** | general-purpose | GIF → 프레임 추출 → 이미지 분석 |
| 4 | **FE 개발** | general-purpose | 코드 수정/구현 |
| 5 | **재검토** | general-purpose | 빌드/타입체크/코드리뷰 |
| 6 | **문서 갱신** | general-purpose (bg) | SESSION.md, PROGRESS.md 자동 갱신 |

### GIF 분석 방법

```bash
# 1. 프레임 추출
python scripts/extract-gif-frames.py <input.gif> --max-frames 20

# 2. 추출된 PNG 프레임을 Read 도구로 이미지 인식
# 3. 프레임별 UI 상태/애니메이션 변화 분석
```

### Figma 기능 분석 결과 저장

- 파일: `docs/FIGMA-FEATURES.md`
- 세션 간 유지, 중복 분석 방지
- 사용자 제공 스크린샷/GIF마다 누적 업데이트

### 작업 순서

1. Figma 기능파악 → 사용자에게 스크린샷/GIF 요청
2. GIF 분석 (GIF 제공 시) ‖ Figma 분석 → 구현 요구사항 정리
3. FE 개발 → 코드 구현
4. 재검토 ‖ 문서 갱신 (병렬)

### 핵심 최적화 규칙 (MUST)

1. **Figma 분석 에이전트는 resume으로 컨텍스트 유지** — 매번 새로 생성 금지, agentId 기록 후 resume 사용
2. **재검토 + 문서 갱신은 FE 개발 완료 후 동시 병렬 실행** — 재검토(foreground) + 문서갱신(background)
3. **FIGMA-FEATURES.md 세션 간 누적** — 새 세션 시작 시 기존 분석 확인, 중복 분석 방지
4. **오케스트레이터 작업 사이클 체크리스트** 준수 → `docs/AGENT-ARCHITECTURE.md` 참조

---

## 참고 자료

- **Konva.js**: https://konvajs.org/docs/
- **Next.js 15**: https://nextjs.org/docs

---

*마지막 업데이트: 2026-02-08*
