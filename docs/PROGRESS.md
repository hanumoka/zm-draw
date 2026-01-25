# zm-draw 진행상황

> 최종 업데이트: 2026-01-25 (커넥터 분석 및 고도화 계획 추가)

---

## 전체 진행률

**목표**: Figma 스타일 다이어그램 에디터
**현재 Phase**: Phase 1.5 (커넥터 수정) ✅ 완료 → Phase 2 예정
**완료율**: MVP 100% / Phase 1 90% / Phase 1.5 100% / Figma 스타일 10%

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
- [x] 도형 간 화살표 연결 (기본)
- [ ] ⚠️ 화살촉 가려짐 문제 → Phase 1.5에서 수정

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

## Phase 1: 기초 리팩토링 ✅ 90% 완료

> **목표**: 단일 컴포넌트(990줄) → 모듈화, 상태 관리 개선

### 1.1 Zustand 상태 관리 ✅

- [x] zustand 패키지 설치
- [x] 6개 store 생성 (canvas, selection, tool, history, viewport, clipboard)
- [x] toolStore 마이그레이션 (tool, connectingFrom, editingId)
- [x] selectionStore 마이그레이션 (selectedId)
- [x] viewportStore 마이그레이션 (scale, isPanning)
- [ ] shapes/connectors 마이그레이션 (props 연동 필요, 선택적)

### 1.2 컴포넌트 분리 ✅

- [x] Toolbar.tsx (169줄) - 도구 버튼
- [x] TextEditor.tsx (60줄) - 텍스트 편집 오버레이
- [ ] ShapeRenderer.tsx (도형 렌더링) - 선택적
- [ ] ConnectorRenderer.tsx (연결선) - 선택적

### 1.3 커스텀 훅 ✅

- [x] useKeyboard.ts (키보드 단축키) - 통합 완료

### 1.4 타입 확장 ✅

- [x] Shape 타입에 locked, visible, name, opacity, cornerRadius 추가
- [x] Connector 타입에 lineStyle, label 추가
- [x] ExtendedShapeType (line, polygon, frame)
- [x] ViewportState, HistoryEntry 인터페이스 추가

### 1.5 누락 기능 추가 ✅

- [x] Copy (Ctrl+C)
- [x] Paste (Ctrl+V)
- [x] Duplicate (Ctrl+D)
- [x] 화살표 키 이동 (1px, Shift+화살표 10px)

### 1.6 성능 최적화 ⏳

- [ ] 드래그 레이어 분리 (dragstart → dragLayer, dragend → mainLayer)

---

## Phase 1.5: 커넥터 기초 수정 ✅ 완료

> **목표**: 화살촉 가려짐 해결 + 커넥터 선택 가능
> **완료일**: 2026-01-25

### 1.5.1 문제 분석 ✅

**발견된 문제:**
1. 화살촉이 도형 중심에 위치 → 도형 내부에 가려짐
2. 커넥터 레이어가 도형 레이어 아래 → 완전히 가려짐
3. 커넥터 선택 불가 (클릭 이벤트 없음)
4. 단순 직선만 지원 (라우팅 없음)

### 1.5.2 구현 완료 ✅

| 작업 | 설명 | 상태 |
|------|------|------|
| 화살촉 위치 수정 | `getShapeEdgePoint()` 구현 | ✅ 완료 |
| 커넥터 선택 | 클릭 이벤트, 선택 하이라이트 | ✅ 완료 |
| 커넥터 삭제 | Delete 키 처리 | ✅ 완료 |
| selectionStore 확장 | selectionType 추가 | ✅ 완료 |

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

- [x] Dark Mode 기본 지원 ✅ 완료
- [x] RightPanel 껍데기 (속성 패널) ✅ 완료
- [x] 헤더바 + 다크모드/패널 토글 ✅ 완료
- [ ] EditorLayout 컴포넌트 (3열 grid)
- [ ] LeftPanel 껍데기 (빈 패널)
- [ ] BottomToolbar (도구 버튼 이동)
- [ ] 패널 리사이즈 기능
- [ ] 패널 접기/펼치기 (Shift+\)

---

## Phase 2.5: 다중 선택 기본 ⏳ 예정

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

## Phase 3.5: 커넥터 고급 기능 ⏳ 신규

> **목표**: Figma/Excalidraw 수준 커넥터
> **참고**: Excalidraw A* 알고리즘, Draw.io 웨이포인트 시스템

### 3.5.1 Connection Points

- [ ] 도형 4방향 (T/R/B/L) 연결점 표시
- [ ] 연결점 스냅 (hover 시 하이라이트)
- [ ] 커스텀 연결점 위치

### 3.5.2 라우팅 옵션

- [ ] Straight (직선) - 현재
- [ ] Orthogonal (Elbow) - 직각 경로
- [ ] 라우팅 선택 UI

### 3.5.3 스타일링

- [ ] 화살촉 종류: None, Arrow, Triangle, Diamond, Circle
- [ ] 라인 스타일: Solid, Dashed, Dotted
- [ ] 속성 패널 연동 (커넥터 색상/두께/스타일)

---

## Phase 4: 레이어 패널 ⏳ 예정

> **목표**: 레이어 트리 뷰 및 관리

### 4.1 레이어 기능

- [ ] LayersTree 컴포넌트 (트리 구조)
- [ ] 레이어 클릭 → 선택
- [ ] 레이어 이름 변경 (더블클릭)
- [ ] 레이어 순서 변경 (HTML5 Drag API)
- [ ] 레이어 잠금/숨김 아이콘

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

## Phase 5.5: 커넥터 프로 기능 ⏳ 신규

> **목표**: Draw.io/Excalidraw 수준 고급 커넥터

### 5.5.1 고급 라우팅

- [ ] A* 경로 찾기 (도형 회피 orthogonal 라우팅)
- [ ] Curved 커넥터 (베지어 커브)
- [ ] 웨이포인트 (수동 경로 조정점)

### 5.5.2 추가 기능

- [ ] 커넥터 레이블 (텍스트 추가)
- [ ] 양방향 화살표
- [ ] 커넥터 바인딩 모드 (Floating/Fixed)

---

## Phase 6: 정렬/분배 및 그룹핑 ⏳ 예정

> **목표**: 생산성 향상 기능

### 6.1 다중 선택 고급

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

### 7.2 Export

- [ ] PNG Export
- [ ] SVG Export
- [ ] 선택 영역 Export

### 7.3 기타

- [ ] 이미지 도형 (드래그 앤 드롭)
- [ ] 미니맵
- [ ] 줌 프리셋 (Fit, 100%, 200%)

---

## 기술 부채

| 항목 | 설명 | 해결 시점 | 우선순위 |
|------|------|----------|---------|
| ~~**Konva 버전**~~ | ~~^9.3.0 → ^10.0.0~~ | ~~Phase 0.9~~ | ✅ 해결됨 |
| ~~**Copy/Paste**~~ | ~~기본 기능 누락~~ | ~~Phase 1~~ | ✅ 해결됨 |
| ~~**커넥터 화살촉 가려짐**~~ | ~~중심→중심 연결~~ | ~~Phase 1.5~~ | ✅ 해결됨 |
| ~~**커넥터 선택 불가**~~ | ~~클릭 이벤트 없음~~ | ~~Phase 1.5~~ | ✅ 해결됨 |
| 드래그 레이어 미분리 | 드래그 시 전체 레이어 redraw | Phase 1 | 중 |
| shapes/connectors 마이그레이션 | props 연동 필요 | 선택적 | 낮음 |
| Diamond 비율 | width≠height 시 시각적 이슈 | Phase 5 | 낮음 |

---

## 예상 일정 (수정됨)

| Phase | 내용 | 예상 기간 | 비고 |
|-------|------|----------|------|
| ~~Phase 0.9~~ | ~~즉시 조치~~ | ~~0.5일~~ | ✅ 완료 |
| ~~Phase 1~~ | ~~기초 리팩토링~~ | ~~4일~~ | ✅ 90% 완료 |
| **Phase 1.5** | **커넥터 기초 수정** | **1.25일** | **신규 (긴급)** |
| Phase 2 | UI 레이아웃 | 3일 | |
| Phase 2.5 | 다중 선택 기본 | 2일 | |
| Phase 3 | 속성 패널 | 4일 | |
| **Phase 3.5** | **커넥터 고급** | **3일** | **신규** |
| Phase 4 | 레이어 패널 | 3일 | |
| Phase 5 | 추가 도형 | 5일 | |
| **Phase 5.5** | **커넥터 프로** | **3일** | **신규** |
| Phase 6 | 정렬/그룹핑 | 3일 | |
| Phase 7 | 고급 기능 | 5일 | |
| **총계** | | **약 33일 (5주)** | 커넥터 개선 포함 |

---

## 커밋 히스토리 (최근)

| 날짜 | 커밋 | 설명 |
|------|------|------|
| 2026-01-25 | 4b5c0d9 | fix(phase1.5): Fix connector arrowhead visibility and add selection |
| 2026-01-25 | 516b4c0 | docs: Add connector analysis and Phase 1.5/3.5/5.5 roadmap |
| 2026-01-25 | d83e864 | docs: Update SESSION.md with Zustand migration progress |
| 2026-01-25 | cde21c1 | refactor(phase1): Migrate viewport state to Zustand store |
| 2026-01-25 | 1b42ac1 | refactor(phase1): Migrate selection state to Zustand store |
| 2026-01-25 | 22f03a1 | refactor(phase1): Migrate tool state to Zustand store |
| 2026-01-25 | 8564d03 | feat(phase1): Extend type definitions for future features |
| 2026-01-25 | 7e1a677 | refactor(phase1): Extract TextEditor component |

---

## Figma/Excalidraw/Draw.io 비교 (커넥터)

| 기능 | FigJam | Excalidraw | Draw.io | **zm-draw** |
|------|--------|------------|---------|-------------|
| 커넥터 선택 | ✅ | ✅ | ✅ | ✅ (v1.5) |
| 화살촉 위치 | 도형 외곽 | 도형 외곽 | 커스텀 | ✅ 도형 외곽 (v1.5) |
| 라우팅 | Bent/Curved/Straight | Simple/Elbow | Waypoint | **Straight만** |
| Connection Points | 4방향 스냅 | 4방향 | 완전 커스텀 | ❌ |
| 화살촉 종류 | 5가지 | 다양 | UML포함 | **1가지** |
| 라인 스타일 | Solid/Dashed | Solid/Dashed | 다양 | **Solid만** |
| 커넥터 레이블 | ✅ | ✅ | ✅ | ❌ |

---

## 참고 문서

- **상세 로드맵**: `docs/FIGMA-STYLE-ROADMAP.md`
- **세션 상태**: `docs/SESSION.md`
- **프로젝트 구조**: `docs/PROJECT.md`

---

*작업 완료 시 이 파일을 업데이트하세요.*
