# zm-draw 프로젝트 문서

> 최종 업데이트: 2026-01-24

---

## 프로젝트 개요

**zm-draw**는 개발자를 위한 Figma 라이크 다이어그램 에디터 라이브러리입니다.

### 목표

- MIT 라이센스로 npm 배포
- React 18+ / Next.js 13+ 호환
- ERD, 플로우차트 다이어그램 지원
- 확장 가능한 도형 시스템
- 실시간 협업 지원 (Phase 2)

### 기술 스택

| 분류 | 기술 |
|------|------|
| **코어** | Konva.js |
| **프레임워크** | React 19, Next.js 15 |
| **언어** | TypeScript 5.7+ |
| **빌드** | tsup, Turbo |
| **패키지 관리** | pnpm workspaces |

---

## 기능 요구사항

### MVP 기능

| 기능 | 설명 | 우선순위 |
|------|------|----------|
| **기본 캔버스** | 줌, 팬, 그리드 | 필수 |
| **기본 도형** | 사각형, 원, 다이아몬드 | 필수 |
| **도형 조작** | 선택, 이동, 리사이즈, 회전 | 필수 |
| **연결선** | 직선, 화살표 | 필수 |
| **텍스트** | 제목, 본문, 라벨 | 필수 |

### ERD 기능

| 기능 | 설명 | 우선순위 |
|------|------|----------|
| **테이블 도형** | 컬럼, PK/FK, 데이터 타입 | 필수 |
| **관계선** | Crow's Foot (1:1, 1:N, N:M) | 필수 |
| **자동 레이아웃** | 테이블 자동 배치 | 권장 |

### 플로우차트 기능

| 기능 | 설명 | 우선순위 |
|------|------|----------|
| **도형 7종** | Process, Decision, Terminal 등 | 필수 |
| **커넥터 라벨** | Yes/No 등 조건 텍스트 | 필수 |
| **자동 정렬** | 스냅, 정렬 가이드 | 권장 |

---

## 프로젝트 구조

```
zm-draw/
├── packages/
│   ├── core/                   # @zm-draw/core
│   │   ├── src/
│   │   │   ├── shapes/        # 도형 정의
│   │   │   │   ├── types.ts
│   │   │   │   ├── basic/     # 기본 도형
│   │   │   │   ├── erd/       # ERD 도형
│   │   │   │   └── flowchart/ # 플로우차트 도형
│   │   │   ├── connectors/    # 연결선
│   │   │   ├── canvas/        # 캔버스 관리
│   │   │   └── utils/         # 유틸리티
│   │   └── package.json
│   │
│   └── react/                  # @zm-draw/react
│       ├── src/
│       │   ├── components/    # React 컴포넌트
│       │   │   ├── DrawCanvas.tsx
│       │   │   ├── Toolbar.tsx
│       │   │   └── shapes/    # 도형 컴포넌트
│       │   ├── hooks/
│       │   └── context/
│       └── package.json
│
├── apps/
│   └── demo/                   # Next.js 데모
│
├── docs/                       # 문서
├── package.json
├── turbo.json
└── pnpm-workspace.yaml
```

---

## 패키지 설명

### @zm-draw/core

프레임워크 독립적인 코어 패키지.

**내보내기:**
- 도형 타입 정의 (ShapeConfig, ErdTableConfig 등)
- 커넥터 타입 정의 (ConnectorConfig, ErdConnectorConfig 등)
- 유틸리티 함수 (generateId, clamp 등)

### @zm-draw/react

React 컴포넌트와 훅을 제공하는 패키지.

**내보내기:**
- `DrawCanvas` - 메인 캔버스 컴포넌트
- `Toolbar` - 도구 모음 (예정)
- `useCanvas` - 캔버스 훅 (예정)
- `useSelection` - 선택 훅 (예정)

---

## 개발 명령어

```bash
# 의존성 설치
pnpm install

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

## 참고 자료

### 공식 문서

- **Konva.js**: https://konvajs.org/docs/
- **react-konva**: https://konvajs.org/docs/react/
- **Next.js**: https://nextjs.org/docs

### 참조 프로젝트

- **zm-editor**: `C:/Users/amagr/projects/zm-editor/`
- **zm-v3 DevDraw 아키텍처**: `C:/Users/amagr/projects/zm-v3/zm-claude-docs/핵심문서/05-기능/02-DevDraw-아키텍처.md`

---

## 배포 계획

### npm 패키지

| 패키지 | 상태 | npm 이름 |
|--------|------|----------|
| core | 개발 중 | @zm-draw/core |
| react | 개발 중 | @zm-draw/react |

### 배포 전 체크리스트

- [ ] README.md 작성
- [ ] CHANGELOG.md 작성
- [ ] API 문서 작성
- [ ] 사용 예제 추가
- [ ] 테스트 작성
- [ ] npm 계정 설정

---

*마지막 업데이트: 2026-01-24*
