# CLAUDE.md - zm-draw 프로젝트 가이드

> **Claude Code를 위한 zm-draw 프로젝트 지침서**
> 최종 업데이트: 2026-01-24

---

## 세션 시작 프로토콜

> **CRITICAL**: 새 세션 시작 시 반드시 아래 파일들을 순서대로 읽어야 합니다.

### 자동 읽기 파일 (필수) - 순서 중요!

1. **docs/SESSION.md** - 현재 세션 상황 (가장 중요)
2. **docs/PROGRESS.md** - 전체 진행상황
3. **docs/PROJECT.md** - 프로젝트 아키텍처

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

### 현재 상태 (2026-01-24)

- **Phase**: MVP 완료 → Figma 스타일 리팩토링 준비
- **구현 완료**: 도형, 커넥터, 텍스트, Undo/Redo, Save/Load
- **다음 Phase**: Phase 1 (기초 리팩토링 - Zustand, 컴포넌트 분리)

### 기술 스택

| 분류 | 기술 | 비고 |
|------|------|------|
| **코어** | Konva.js (vanilla) | react-konva는 React 19 미지원 |
| **프레임워크** | React 19, Next.js 15 | App Router |
| **언어** | TypeScript 5.7+ | strict mode |
| **빌드** | tsup, Turbo | ESM only |

---

## 모노레포 구조

```
zm-draw/
├── CLAUDE.md                   # 이 파일 (Claude 진입점)
├── docs/                       # 문서 (Claude 필독)
│   ├── SESSION.md             # 세션 상태 ⭐ 가장 중요
│   ├── PROGRESS.md            # 진행상황 (7 Phase 로드맵)
│   ├── PROJECT.md             # 아키텍처
│   └── FIGMA-STYLE-ROADMAP.md # Figma 스타일 상세 계획
│
├── packages/
│   ├── core/                   # @zm-draw/core (타입)
│   └── react/                  # @zm-draw/react (컴포넌트)
│       └── src/components/
│           └── DrawCanvas.tsx  # 메인 컴포넌트 (~990 lines)
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
| Canvas 라이브러리 | Konva.js (vanilla) | react-konva React 19 미지원 |
| 도형+텍스트 | Konva.Group | 함께 드래그/회전/리사이즈 |
| Transformer | 별도 레이어 | destroyChildren() 충돌 방지 |

---

## 참고 자료

- **Konva.js**: https://konvajs.org/docs/
- **Next.js 15**: https://nextjs.org/docs

---

*마지막 업데이트: 2026-01-24*
