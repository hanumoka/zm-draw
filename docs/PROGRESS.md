# zm-draw 진행상황

> 최종 업데이트: 2026-01-25 (문서 재검토 완료)

---

## 전체 진행률

**목표**: Figma 스타일 다이어그램 에디터
**현재 Phase**: MVP 완료 → Phase 0.9 (즉시 조치) → Phase 1 (기초 리팩토링)
**완료율**: MVP 100% / Figma 스타일 0%

---

## Phase 0: 프로젝트 설정 ✅ 완료

- [x] 모노레포 구조 (pnpm + turbo)
- [x] packages/core, packages/react
- [x] apps/demo (Next.js 15)
- [x] Git 초기화 및 GitHub 연동

---

## Phase 0.5: MVP 기능 ✅ 완료

### 캔버스 기본
- [x] Konva Stage 초기화
- [x] 배경/그리드 레이어
- [x] 줌 (마우스 휠)
- [x] 팬 (Space + 드래그)

### 도형
- [x] Rectangle, Ellipse, Diamond
- [x] 선택, 삭제, 드래그 이동
- [x] 리사이즈/회전 (Transformer)

### 텍스트
- [x] 도형 내 텍스트 (더블클릭 편집)

### 커넥터
- [x] 도형 간 화살표 연결

### 편집 기능
- [x] Undo/Redo (Ctrl+Z / Ctrl+Shift+Z)
- [x] Save/Load (JSON export/import)

---

## Phase 0.9: 즉시 조치 ✅ 완료

> **목표**: Phase 1 시작 전 기반 정리

### 0.9.1 의존성 업그레이드 ✅

- [x] Konva 업그레이드: ^9.3.0 → ^10.0.0 (실제 설치: 10.2.0)
- [x] 빌드 및 타입 체크 통과
- [x] 개발 서버 정상 동작 확인

### 0.9.2 문서 정확성 ✅

- [x] react-konva/Next.js 15 이슈 정확 기재
- [x] @dnd-kit React 19 호환성 이슈 문서화
- [x] 로드맵 우선순위 재조정

---

## Phase 1: 기초 리팩토링 ⏳ 예정

> **목표**: 단일 컴포넌트(990줄) → 모듈화, 상태 관리 개선

### 1.1 Zustand 상태 관리

- [ ] zustand 패키지 설치
- [ ] canvasStore 생성 (shapes, connectors, selection)
- [ ] uiStore 생성 (tool, panels, viewport)
- [ ] historyStore 생성 (undo/redo)
- [ ] useState → Zustand 마이그레이션

### 1.2 컴포넌트 분리

- [ ] Canvas.tsx (Konva Stage 래퍼)
- [ ] ShapeRenderer.tsx (도형 렌더링)
- [ ] ConnectorRenderer.tsx (연결선)
- [ ] Toolbar.tsx (도구 버튼)
- [ ] TextEditor.tsx (텍스트 편집 오버레이)

### 1.3 커스텀 훅

- [ ] useKeyboard.ts (키보드 단축키)
- [ ] useSelection.ts (선택 관리)
- [ ] useHistory.ts (Undo/Redo)
- [ ] useClipboard.ts (Copy/Paste) ← **추가**

### 1.4 타입 확장

- [ ] Shape 타입에 locked, visible, name 추가
- [ ] ToolType에 frame, line, polygon 추가

### 1.5 누락 기능 추가 ← **새 섹션**

- [ ] Copy (Ctrl+C) - **앱 내부 전용** ✅ 결정됨
- [ ] Paste (Ctrl+V) - **앱 내부 전용** ✅ 결정됨
- [ ] Duplicate (Ctrl+D)
- [ ] 화살표 키 이동 (1px, Shift+화살표 10px)

### 1.6 성능 최적화 ← **새 섹션**

- [ ] 드래그 레이어 분리 (dragstart → dragLayer, dragend → mainLayer)
- [ ] Stage 레벨 이벤트 위임 검토

---

## Phase 2: UI 레이아웃 ⏳ 예정

> **목표**: Figma UI3 스타일 3열 레이아웃

### 2.1 레이아웃 구조

```
┌────────────────────────────────────────────┐
│  Navigation Bar                            │
├──────────┬─────────────────┬───────────────┤
│  Left    │                 │  Right Panel  │
│  Panel   │     Canvas      │  (속성)       │
│ (레이어)  │                 │               │
├──────────┴─────────────────┴───────────────┤
│  Bottom Toolbar                            │
└────────────────────────────────────────────┘
```

### 2.2 체크리스트

- [ ] EditorLayout 컴포넌트 (3열 grid)
- [ ] LeftPanel 껍데기 (빈 패널)
- [ ] RightPanel 껍데기 (빈 패널)
- [ ] BottomToolbar (도구 버튼 이동)
- [ ] 패널 리사이즈 기능
- [ ] 패널 접기/펼치기 (Shift+\)
- [ ] Dark Mode 기본 지원 ✅ 결정됨 (UI3 핵심)

---

## Phase 2.5: 다중 선택 기본 ⏳ 예정 ← **새 Phase (앞으로 이동)**

> **목표**: 속성 패널 구현 전에 다중 선택 기반 마련

### 2.5.1 다중 선택 구현

- [ ] selectedIds: string[] (단일 → 다중)
- [ ] Shift+Click 다중 선택
- [ ] 드래그 박스 선택 (Marquee selection)
- [ ] 선택된 도형들 그룹 이동/삭제

### 2.5.2 UI 연동

- [ ] 속성 패널 "N개 선택됨" 표시 준비
- [ ] Transformer 다중 노드 지원

---

## Phase 3: 속성 패널 ⏳ 예정

> **목표**: 선택된 도형 속성 실시간 편집

### 3.1 Design 탭 섹션

- [ ] Position 섹션 (X, Y 입력)
- [ ] Size 섹션 (Width, Height 입력)
- [ ] Rotation 섹션 (각도 입력)
- [ ] Corner Radius 섹션 (모서리 둥글기)
- [ ] Fill 섹션 (Color Picker)
- [ ] Stroke 섹션 (색상, 두께)

### 3.2 UI 컴포넌트

- [ ] NumberInput (숫자 입력 + 드래그)
- [ ] ColorPicker (react-colorful)
- [ ] Section (접을 수 있는 섹션)

---

## Phase 4: 레이어 패널 ⏳ 예정

> **목표**: 레이어 트리 뷰 및 관리

### 4.1 레이어 기능

- [ ] LayersTree 컴포넌트 (트리 구조)
- [ ] 레이어 클릭 → 선택
- [ ] 레이어 이름 변경 (더블클릭)
- [ ] 레이어 순서 변경 (아래 대안 참조)
- [ ] 레이어 잠금 아이콘 (🔒)
- [ ] 레이어 숨김 아이콘 (👁️)
- [ ] 레이어 검색/필터

### 4.2 드래그 앤 드롭 구현 방식 ✅ 결정됨

> **결정**: HTML5 Drag API 사용 (2026-01-25)

| 구현 방식 | 설명 |
|----------|------|
| **HTML5 Drag API** | 네이티브 `draggable="true"` + `ondragover`/`ondrop` |

**선택 이유:**
- React 19 호환성 문제 없음
- 외부 의존성 없음
- 브라우저 네이티브 지원

---

## Phase 5: 추가 도형 ⏳ 예정

> **목표**: Figma 수준 도형 지원

### 5.1 기본 도형

- [ ] Line 도형 (직선)
- [ ] Polygon 도형 (다각형)
- [ ] Star 도형 (별)
- [ ] 독립 Text 도형 (도형 없는 텍스트)

### 5.2 Frame (컨테이너)

- [ ] Frame 도형 (자식 포함 컨테이너)
- [ ] Frame 중첩
- [ ] Clip content 옵션

---

## Phase 6: 정렬/분배 및 그룹핑 ⏳ 예정

> **목표**: 생산성 향상 기능
> **참고**: 다중 선택 기본 기능은 Phase 2.5로 이동됨

### 6.1 다중 선택 고급 (Phase 2.5 이후)

- [ ] Select All (Ctrl+A)
- [ ] Invert Selection
- [ ] Select Same Type

### 6.2 정렬/분배

- [ ] 정렬 (좌/중앙/우/상/중/하)
- [ ] 균등 분배 (수평/수직)
- [ ] 툴바 정렬 버튼

### 6.3 그룹핑

- [ ] 그룹 만들기 (Ctrl+G)
- [ ] 그룹 해제 (Ctrl+Shift+G)

---

## Phase 7: 고급 기능 ⏳ 예정

> **목표**: 프로덕션 수준 완성

### 7.1 스냅 및 가이드

- [ ] Grid Snap (그리드 스냅)
- [ ] Smart Guides (정렬 가이드라인)
- [ ] 스냅 토글 옵션

### 7.2 편집 기능

- [ ] Copy/Paste (Ctrl+C/V)
- [ ] Duplicate (Ctrl+D)
- [ ] 키보드 화살표 이동 (1px, Shift 10px)

### 7.3 Export

- [ ] PNG Export
- [ ] SVG Export
- [ ] 선택 영역 Export

### 7.4 기타

- [ ] 이미지 도형 (드래그 앤 드롭)
- [ ] 미니맵
- [ ] 줌 프리셋 (Fit, 100%, 200%)

---

## 기술 부채

| 항목 | 설명 | 해결 시점 | 우선순위 |
|------|------|----------|---------|
| ~~**Konva 버전**~~ | ~~^9.3.0 → ^10.0.0 업그레이드 필요~~ | ~~Phase 0.9~~ | ✅ 해결됨 |
| **드래그 레이어 미분리** | 드래그 시 전체 레이어 redraw | Phase 1 | 높음 |
| **Copy/Paste 미구현** | 기본 기능 누락 | Phase 1 | 높음 |
| 단일 컴포넌트 990줄 | 유지보수 어려움 | Phase 1 | 높음 |
| 히스토리 중복 | shapes+connectors 동시 변경 시 | Phase 1 | 중 |
| 이벤트 핸들러 분산 | 각 shape에 개별 핸들러 | Phase 1 | 중 |
| Diamond 비율 | width≠height 시 시각적 이슈 | Phase 5 | 낮음 |
| @dnd-kit 호환성 | React 19 이슈로 대안 필요 | Phase 4 | 중 |

---

## 예상 일정

| Phase | 내용 | 예상 기간 | 비고 |
|-------|------|----------|------|
| Phase 0.9 | 즉시 조치 | 0.5일 | Konva 업그레이드 |
| Phase 1 | 기초 리팩토링 | 4일 | Copy/Paste 등 추가 |
| Phase 2 | UI 레이아웃 | 3일 | |
| Phase 2.5 | 다중 선택 기본 | 2일 | **앞으로 이동** |
| Phase 3 | 속성 패널 | 4일 | |
| Phase 4 | 레이어 패널 | 3일 | dnd-kit 대안 반영 |
| Phase 5 | 추가 도형 | 5일 | |
| Phase 6 | 정렬/그룹핑 | 3일 | 다중선택 제외 |
| Phase 7 | 고급 기능 | 5일 | |
| **총계** | | **약 29.5일 (4주+)** | |

---

## 커밋 히스토리 (최근)

| 날짜 | 커밋 | 설명 |
|------|------|------|
| 2026-01-24 | 9878cd0 | docs: Update all docs with Figma-style roadmap |
| 2026-01-24 | 5d69c0c | docs: Add Figma-style roadmap |
| 2026-01-24 | 3698832 | fix: Fix shape resize |
| 2026-01-24 | 0a33caa | docs: Update documentation |
| 2026-01-24 | 164613f | feat: Add save/load JSON |

---

## 참고 문서

- **상세 로드맵**: `docs/FIGMA-STYLE-ROADMAP.md`
- **세션 상태**: `docs/SESSION.md`
- **프로젝트 구조**: `docs/PROJECT.md`

---

*작업 완료 시 이 파일을 업데이트하세요.*
