# CLAUDE.md - zm-draw 프로젝트 가이드

> **Claude Code를 위한 zm-draw 프로젝트 지침서**

---

## 세션 시작 프로토콜

> **CRITICAL**: 새 세션 시작 시 반드시 아래 파일들을 순서대로 읽어야 합니다.

### 자동 읽기 파일 (필수)

1. **docs/SESSION.md** - 현재 세션 상황 (가장 중요)
2. **docs/PROGRESS.md** - 프로젝트 진행상황
3. **docs/PROJECT.md** - 프로젝트 개요 및 구조

### 세션 복원 시 확인사항

```bash
# 1. 개발 서버 상태 확인
curl -s -o /dev/null -w "%{http_code}" http://localhost:3200

# 2. Git 상태 확인
cd C:/Users/amagr/projects/zm-draw && git status

# 3. 빌드 상태 확인 (필요시)
cd C:/Users/amagr/projects/zm-draw && pnpm build
```

---

## 프로젝트 개요

**zm-draw**는 개발자를 위한 Figma 라이크 다이어그램 에디터 라이브러리입니다.

- **위치**: `C:/Users/amagr/projects/zm-draw/`
- **라이센스**: MIT
- **데모 서버**: http://localhost:3200

### 핵심 기능

| 기능 | 설명 |
|------|------|
| **ERD 다이어그램** | 테이블, 컬럼, 관계선 (Crow's Foot) |
| **플로우차트** | 도형 7종 + 커넥터 라벨 |
| **기본 도형** | 사각형, 원, 다이아몬드 등 6종 |
| **텍스트** | 제목, 본문, 라벨 3종 |

### 기술 스택

| 분류 | 기술 |
|------|------|
| **코어** | Konva.js (Canvas 2D) |
| **프레임워크** | React 19, Next.js 15 |
| **언어** | TypeScript 5.7+ |
| **빌드** | tsup, Turbo |
| **패키지 관리** | pnpm workspaces |

---

## 모노레포 구조

```
zm-draw/
├── docs/                       # 프로젝트 문서 (Claude 필독)
│   ├── PROGRESS.md            # 진행상황
│   ├── SESSION.md             # 세션 상황
│   └── PROJECT.md             # 프로젝트 관리
│
├── packages/
│   ├── core/                   # @zm-draw/core
│   │   └── src/
│   │       ├── shapes/        # 도형 정의
│   │       ├── connectors/    # 연결선
│   │       └── canvas/        # 캔버스 관리
│   │
│   └── react/                  # @zm-draw/react
│       └── src/
│           ├── components/    # React 컴포넌트
│           └── hooks/         # Custom hooks
│
├── apps/
│   └── demo/                   # Next.js 데모 앱
│
├── package.json               # 루트 워크스페이스
├── turbo.json                 # Turbo 설정
├── pnpm-workspace.yaml        # pnpm 워크스페이스
└── CLAUDE.md                  # 이 파일
```

---

## 개발 명령어

```bash
# 개발 서버 시작 (루트에서)
pnpm dev

# 빌드
pnpm build

# 타입 체크
pnpm type-check

# 클린
pnpm clean
```

---

## 주요 파일 위치

### 핵심 코드 (예정)

| 파일 | 설명 |
|------|------|
| `packages/core/src/shapes/index.ts` | 도형 타입 정의 |
| `packages/core/src/shapes/erd/` | ERD 도형 (Table, Column) |
| `packages/core/src/shapes/flowchart/` | 플로우차트 도형 |
| `packages/core/src/connectors/` | 연결선 (직선, 곡선) |
| `packages/react/src/components/DrawCanvas.tsx` | 메인 캔버스 컴포넌트 |
| `packages/react/src/components/Toolbar.tsx` | 도구 모음 |

### 데모 앱

| 파일 | 설명 |
|------|------|
| `apps/demo/src/app/page.tsx` | 데모 페이지 |
| `apps/demo/src/app/globals.css` | 스타일 |

---

## 코딩 규칙

### TypeScript

- `'use client'` 지시문: React 컴포넌트 파일 상단에 필수
- 타입 명시: 함수 파라미터와 반환값에 타입 지정
- any 사용 자제

### 컴포넌트 네이밍

- 컴포넌트: PascalCase (`DrawCanvas.tsx`)
- 훅: camelCase with `use` prefix (`useCanvas.ts`)
- 유틸: camelCase (`calculatePosition.ts`)

### CSS 클래스 네이밍

- 접두사: `zm-draw-` (예: `zm-draw-canvas`, `zm-draw-toolbar`)
- BEM 스타일 권장

---

## Git 워크플로우

### 커밋 메시지 형식

```
<type>(<scope>): <subject>

<body>

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
```

**Type**:
- `feat`: 새로운 기능
- `fix`: 버그 수정
- `docs`: 문서 수정
- `refactor`: 리팩토링
- `style`: 코드 스타일
- `test`: 테스트
- `chore`: 빌드, 설정

---

## 문서 업데이트 규칙

### 작업 완료 시

1. **docs/SESSION.md** 업데이트
   - 마지막 작업 내용
   - 현재 프로젝트 상태
   - 다음 작업 예정

2. **docs/PROGRESS.md** 업데이트
   - 완료된 작업 체크
   - 새로운 작업 항목 추가

---

## 참고 자료

- **Konva.js 문서**: https://konvajs.org/docs/
- **react-konva**: https://konvajs.org/docs/react/
- **zm-editor 참조**: `C:/Users/amagr/projects/zm-editor/`

---

*마지막 업데이트: 2026-01-24*
