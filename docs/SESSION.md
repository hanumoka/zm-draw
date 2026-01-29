# zm-draw 세션 상태

> 최종 업데이트: 2026-01-29 (Phase 14A FigJam UI 테마 변환)

---

## 현재 상태

**Phase**: **Phase 14A 진행 중** 🔄 (FigJam UI/UX 변환)
**목표**: FigJam 스타일 실시간 협업 화이트보드
**진행률**: Phase 1-13 완료, Phase 14A 테마 완료 / Phase 14B-D 예정

### 마지막 작업 (2026-01-29)

- **Phase 14A: FigJam 테마 변환** ✅ 완료
  - **A1: CSS 변수 업데이트** ✅
    - FigJam 라이트 테마 기본 적용
    - 퍼플 악센트 컬러 (#9747ff)
    - 새 변수: --zm-bg-hover, --zm-selection, --zm-grid-dot
  - **A2: 도트 그리드 패턴** ✅
    - FigJam 스타일 10% 투명도 검정 도트
    - 줌 레벨에 따른 그리드 밀도 조정
  - **A3: 스티키 노트 10색 팔레트** ✅
    - 공식 FigJam 색상: yellow, orange, red, pink, violet, blue, teal, green, gray, white
  - **Toolbar 스타일 업데이트** ✅
    - 라이트 테마 배경 (#ffffff)
    - 둥근 모서리 (12px)
    - 호버 상태 개선
  - 빌드 성공 (190.61 KB)

### 다음 작업 (Phase 14B-D 예정)

- **Phase 14B: 하단 플로팅 툴바** (예정)
- **Phase 14C: 패널 레이아웃 변환** (예정)
- **Phase 14D: 인터랙션 개선** (예정)

---

### 이전 작업 (2026-01-29)

- **Phase 13: 고급 협업 기능** ✅ 완료
  - **13.2 Section 기능** ✅ 완료
    - `SectionColor` 타입 및 `SECTION_COLORS` 상수 추가
    - `defaultSectionProps` 생성 (canvasStore.ts)
    - Section 렌더링 (DrawCanvas.tsx - Konva.Rect + 타이틀)
    - Section SVG export 지원
    - Toolbar 버튼 추가 (Shift+S 단축키)
  - **13.1 Spotlight 기능** ✅ 완료
    - `spotlightStore.ts` 생성 (발표 상태 관리)
    - `SpotlightUI.tsx` 생성 (발표 버튼, 팔로우 요청 팝업, 팔로우 인디케이터)
    - `UserPresence.isPresenting` 필드 추가
    - `collaborationStore` 확장 (startPresenting, stopPresenting)
    - `useCollaboration` 훅 확장 (spotlight 감지, 뷰포트 동기화)
  - **13.3 Tidy Up 기능** ✅ 완료
    - `utils/tidyUp.ts` 생성 (grid, horizontal, vertical, circle 레이아웃)
    - `detectBestLayout()` 자동 레이아웃 감지
    - Toolbar에 Tidy Up 버튼 + 드롭다운 메뉴 추가
    - 빌드 성공 (188.37 KB)

- **Phase 12: 댓글 기능** ✅ 완료
  - **타입 정의** ✅
    - `Comment` 인터페이스 (id, shapeId, author, content, replies)
    - `CommentThread` 인터페이스 (root + replies)
  - **commentStore.ts** ✅ 생성
    - 댓글 CRUD (추가, 수정, 삭제)
    - 스레드 해결/재개
    - 패널 열기/닫기 상태
  - **CommentPanel.tsx** ✅ 생성
    - 스레드 목록 뷰
    - 스레드 상세 뷰 (답글 포함)
    - 댓글 작성/수정/삭제 UI
    - 해결됨/미해결 필터
  - **Toolbar 통합** ✅
    - 댓글 버튼 추가
    - 미해결 댓글 수 배지
  - **DrawCanvas 통합** ✅
    - 도형에 댓글 표시 아이콘
    - 클릭하여 스레드 열기
  - **빌드** ✅ 성공 (164.28 KB)

- **Phase 11: Yjs 실시간 협업** ✅ 완료
  - Yjs 패키지 설치 ✅
  - collaborationStore.ts ✅
  - useCollaboration.ts 훅 ✅
  - 원격 커서/선택 표시 ✅
  - 연결 상태 UI ✅
  - 서버 설정 가이드 ✅ (`docs/COLLABORATION-SETUP.md`)

### 이전 작업 (2026-01-29)

- **Phase 10: 스탬프 기능** ✅ 완료
  - 스탬프 도형 (8가지 이모지)
  - 툴바 UI + 팝오버 선택기
  - 숫자 1-8 단축키

- **Phase 9: 이미지 기능** ✅ 완료
  - 이미지 도형 (드래그앤드롭, 클립보드)
  - 툴바 버튼 (I 단축키)
  - SVG export 지원

### 개발 서버

- **상태**: 정상 동작
- **포트**: 3200
- **URL**: http://localhost:3200

### Git 상태

- **브랜치**: main
- **원격**: origin/main

---

## Phase 11 협업 아키텍처

```
┌─────────────────────────────────────────────────────────────┐
│                      DrawCanvas                              │
│  ┌─────────────┐     ┌──────────────────┐                   │
│  │   shapes    │ ←→  │ useCollaboration │                   │
│  │ connectors  │     │   (hook)         │                   │
│  └─────────────┘     └────────┬─────────┘                   │
│                                │                            │
│                      ┌────────▼─────────┐                   │
│                      │ collaborationStore│                   │
│                      │   (Zustand)       │                   │
│                      └────────┬─────────┘                   │
│                                │                            │
│           ┌────────────────────┼────────────────────┐       │
│           │                    │                    │       │
│    ┌──────▼──────┐     ┌──────▼──────┐     ┌──────▼──────┐ │
│    │   Y.Doc     │     │  Awareness  │     │  IndexedDB  │ │
│    │  Y.Map      │     │   (cursors) │     │ (offline)   │ │
│    └──────┬──────┘     └──────┬──────┘     └─────────────┘ │
│           │                    │                            │
│           └────────┬───────────┘                            │
│                    │                                        │
│            ┌───────▼───────┐                                │
│            │ WebSocketProvider │ ← y-websocket              │
│            └───────┬───────┘                                │
└────────────────────┼────────────────────────────────────────┘
                     │
                     ▼
            ┌─────────────────┐
            │  Yjs Server     │ (별도 서버 필요)
            │  (y-websocket)  │
            └─────────────────┘
```

### 연결 상태 UI

```
┌───────────────────────────────────────┐
│  ● 2 online  [A] [B]                  │  ← 상단 우측
└───────────────────────────────────────┘
  │     │        │   │
  │     │        │   └─ 원격 사용자 아바타
  │     │        └─ 로컬 사용자 아바타
  │     └─ 연결된 사용자 수
  └─ 연결 상태 (녹색/주황/회색)
```

### 원격 커서 렌더링

- Konva.Layer에 원격 사용자 커서 표시
- 사용자 색상 + 이름 라벨
- 캔버스 좌표로 변환

---

## 구현 완료된 기능 (Phase 13 완료)

| 기능 | 상태 | Figma 대비 |
|------|------|-----------|
| 도형 생성 (Rect, Ellipse, Diamond) | ✅ 완료 | 30% |
| 스티키 노트 | ✅ 완료 | 80% |
| 펜/마커/하이라이터 | ✅ 완료 | 70% |
| 이미지 삽입 | ✅ 완료 | 80% |
| 스탬프/이모지 | ✅ 완료 | 90% |
| **실시간 협업** | ✅ 완료 | 70% |
| **Section** | ✅ 완료 | 70% |
| **Spotlight (발표 모드)** | ✅ 완료 | 80% |
| **Tidy Up (자동 정렬)** | ✅ 완료 | 90% |
| **댓글** | ✅ 완료 | 80% |
| 도형 선택/삭제/이동 | ✅ 완료 | 100% |
| 리사이즈/회전 | ✅ 완료 | 100% |
| 텍스트 편집 | ✅ 완료 | 50% |
| 커넥터/화살표 | ✅ 기본+고급 | 60% |
| 줌/팬 | ✅ 완료 | 100% |
| Undo/Redo | ✅ 완료 | 100% |
| Save/Load (JSON) | ✅ 완료 | 100% |
| Copy/Paste/Duplicate | ✅ 완료 | 100% |
| 화살표 키 이동 | ✅ 완료 | 100% |
| 정렬/분배/그룹핑 | ✅ 완료 | 80% |
| 레이어 관리 | ✅ 완료 | 70% |
| PNG/SVG Export | ✅ 완료 | 80% |
| 미니맵 | ✅ 완료 | 90% |

---

## 기술 결정사항

| 항목 | 현재 | 목표 | 상태 |
|------|------|-----|------|
| 상태 관리 | Zustand | Zustand | ✅ 완료 |
| UI 컴포넌트 | Radix UI | Radix UI | ✅ 완료 |
| 컬러 피커 | react-colorful | react-colorful | ✅ 완료 |
| Canvas 라이브러리 | Konva 10.0.0 | Konva 10.x | ✅ 완료 |
| **실시간 협업** | **Yjs** | **Yjs** | ✅ **완료** |

---

## 개발 환경 확인 명령어

```bash
# 개발 서버 시작
cd C:/Users/amagr/projects/zm-draw && pnpm dev

# 빌드 확인
pnpm build

# 타입 체크
pnpm type-check
```

---

## 참고 문서

- **전체 진행상황**: `docs/PROGRESS.md`
- **FigJam 스타일 로드맵**: `docs/FIGJAM-ROADMAP.md`
- **프로젝트 구조**: `docs/PROJECT.md`

---

*다음 세션 시작 시 이 파일을 먼저 읽으세요.*
