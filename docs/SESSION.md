# zm-draw 세션 상태

> 최종 업데이트: 2026-01-28 (Phase 3.5 완료)

---

## 현재 상태

**Phase**: Phase 3.5 (커넥터 고급) 완료 ✅
**진행률**: MVP 100% / Phase 1 90% / Phase 1.5 100% / Phase 2 95% / Phase 2.5 100% / Phase 3 100% / Phase 2.6 100% / Phase 3.5 100% / Figma 스타일 80%

### 마지막 작업 (2026-01-28)

- **코드 리뷰 및 버그 수정** ✅ NEW
  - `getConnectionPoint`가 `getShapeEdgePoint` 의존성 누락 → 수정
  - 함수 정의 순서 변경 (getShapeEdgePoint를 먼저 정의)

- **Phase 3.5: 커넥터 속성 패널 UI** ✅
  - DrawCanvasHandle에 getConnectors(), updateConnector() 메서드 추가
  - 커넥터 선택 시 속성 패널 표시
  - 라인 스타일 선택 UI (solid/dashed/dotted)
  - 라우팅 타입 선택 UI (straight/orthogonal)
  - 화살촉 선택 UI (none/arrow)
  - Stroke 색상/두께 편집

- **Phase 3.5: 커넥터 고급 기능 Part 1** ✅
  - ConnectionPoint, ArrowType, RoutingType 타입 추가
  - Connector 인터페이스 확장 (fromPoint, toPoint, routing, arrowStart, arrowEnd)
  - 커넥터 모드에서 도형 hover 시 Connection Points 시각화
  - 라인 스타일 지원: solid, dashed, dotted
  - Orthogonal (elbow) 라우팅 구현

- **Phase 2.6: Marquee Selection 구현** ✅
  - 빈 영역 드래그로 선택 박스 생성
  - 박스와 교차하는 도형 자동 선택
  - Shift+드래그로 기존 선택에 추가
  - 파란색 점선 테두리 + 반투명 배경

- **Phase 2.6: 다중 선택 버그 수정** ✅
  - Zustand getter 패턴 제거 (반응성 문제) → selector 패턴으로 변경
  - 이미 선택된 도형 클릭 시 선택 해제되는 버그 수정
  - transformend 핸들러가 모든 선택된 노드를 처리하도록 수정

- **Phase 2.6: 다중 선택 기본 구현** ✅
  - `selectionStore` 다중 선택 API 추가 (selectedIds, toggleSelection, selectMultiple)
  - **Shift+Click** 다중 선택 지원
  - Transformer 다중 노드 지원
  - 선택된 모든 도형 하이라이트
  - 다중 삭제 지원
  - 속성 패널 "N개 선택됨" 표시

- **Phase 3: 속성 패널 고급 완료** ✅
  - react-colorful + @radix-ui/react-popover 설치
  - ColorPicker 컴포넌트 생성
  - Fill 색상 편집 (팝업 + 텍스트 입력)
  - Stroke 색상 편집 (팝업 + 텍스트 입력)
  - Stroke Width 편집 추가
  - **Corner Radius 편집** (rectangle 타입만)
  - packages/core konva 버전 10.0.0으로 통일

- **zm-editor 통합 분석** ✅
  - zm-editor 코드베이스 분석 (Tiptap 기반 Notion 스타일 에디터)
  - 28개 커스텀 노드 구조 파악 (MermaidNode 패턴 분석)
  - zm-draw 통합 가능성 확인: ✅ 완전 호환 (동일 기술 스택)
  - 통합 계획 문서화 → Phase 8로 등록 (zm-draw 완료 후 진행)

- **코드 심층 분석 및 품질 개선** ✅
  - 전체 코드베이스 리뷰 및 이슈 분류 (P0~P3)

- **P0 (심각) 버그 수정** ✅
  - **메모리 누수 수정**: Stage cleanup 시 모든 레이어 `destroyChildren()` 호출
  - **History 초기 상태**: 초기 상태를 history에 저장하여 첫 번째 Undo 정상 동작

- **P1 (성능) 개선** ✅
  - **그리드 성능 최적화**: 수천 개 Circle 노드 → `sceneFunc` 단일 Shape로 변경

- **P2 (버그) 수정** ✅
  - **TextEditor rotation**: 회전된 도형에서 텍스트 편집 시 CSS transform 적용
  - **Diamond 비율**: `RegularPolygon` → `Konva.Line`으로 변경, width≠height 지원
  - **Undo/Redo selection**: `setSelectedId(null)` → `clearSelection()` 변경
  - **Shapes 패널 연결**: 도형 버튼 클릭 시 해당 도구로 전환 (onClick 연결)

- **P3 (코드 품질) 개선** ✅
  - **중복 코드 정리**: `generateId`, `defaultShapeProps`를 canvasStore에서 import
  - **단축키 추가**: V(선택), R(사각형), O(타원), Ctrl+S(저장), Ctrl+O(불러오기)
  - **단축키 버그 수정**: switch문 case 'v' 중복 정의 문제 해결

### 이전 작업 (2026-01-25)

- **Phase 2.5: 속성 패널 편집 + 컨텍스트 메뉴** ✅ 완료
  - `DrawCanvasHandle` 인터페이스 추가 (forwardRef + useImperativeHandle)
  - `updateShape`, `deleteSelected`, `duplicateSelected`, `copySelected` 메서드 노출
  - `onViewportChange` 콜백 추가 (줌/팬 시 실시간 업데이트)
  - Position (X, Y), Size (W, H), Rotation 편집 가능
  - **선택 컨텍스트 메뉴** 구현 (Copy, Duplicate, Delete 버튼)
  - 줌/팬 시 컨텍스트 메뉴가 도형 따라가도록 수정

- **문서 정비** ✅
  - 4개 문서 불일치 사항 수정 (SESSION, PROGRESS, PROJECT, CLAUDE.md)

- **Figma/FigJam 상세 분석 완료** ✅
  - UI3 인터페이스 구조 문서화
  - FigJam 도구/기능 목록 정리
  - 속성 패널 구조 분석
  - 구현 로드맵 재정립

- **Phase 2: UI 레이아웃 95% 완료** ✅
  - **점선 그리드** 구현 (Figma 스타일) ✅ NEW
  - **Shapes 패널** 구현 (카테고리별 도형) ✅ NEW
    - 접을 수 있는 섹션 (Connectors, Basic, Flowchart, Libraries)
    - 검색 입력창 (UI)
    - 도형 아이콘 그리드
  - Figma 스타일 툴바 (아이콘 기반, 그룹화) ✅
  - 무한 캔버스 (동적 그리드, 무제한 패닝/줌) ✅
  - 패널 리사이즈 기능 ✅
  - 테마 전환 버그 수정 ✅

- **Phase 1.5: 커넥터 기초 수정 완료** ✅
  - `getShapeEdgePoint()` 함수 구현 (Rectangle, Ellipse, Diamond)
  - 화살촉이 도형 외곽에 표시되도록 수정
  - 커넥터 클릭 선택 기능 추가
  - 커넥터 Delete 키 삭제 기능 추가

- **Phase 1: 기초 리팩토링 90% 완료** ✅
- **Dark Mode + Right Panel** ✅
- **Phase 0.9: Konva 업그레이드** ✅

### 개발 서버

- **상태**: 정상 동작
- **포트**: 3200
- **URL**: http://localhost:3200

### Git 상태

- **브랜치**: main
- **원격**: origin/main
- **마지막 커밋**: `7570926 fix: Fix getConnectionPoint dependency on getShapeEdgePoint`

---

## 커넥터 문제점 (해결됨 ✅)

### Phase 1.5에서 해결된 문제

```
이전:
┌─────────────┐      ┌─────────────┐
│   도형 A    │      │   도형 B    │
│      ●──────────────────>●      │  ← 화살촉이 도형 내부에!
└─────────────┘      └─────────────┘

현재 (수정됨):
┌─────────────┐      ┌─────────────┐
│   도형 A    │──────>│   도형 B    │  ← 화살촉이 도형 외곽에 ✅
└─────────────┘      └─────────────┘
```

| 문제 | 원인 | 상태 |
|------|------|------|
| 화살촉 가려짐 | 중심→중심 연결 | ✅ 해결 |
| 선택 불가 | 클릭 이벤트 없음 | ✅ 해결 |
| 삭제 불가 | Delete 처리 없음 | ✅ 해결 |
| 라우팅 없음 | 직선만 지원 | ⏳ Phase 3.5 |

---

## 다음 작업: Phase 4 (레이어 패널)

### 목표: 레이어 관리 기능

```
┌─────────────────────────────┐
│ Layers                  [+] │
├─────────────────────────────┤
│ 👁 🔒 ▢ Rectangle 1        │
│ 👁 🔒 ◯ Ellipse 1          │
│ 👁 🔒 ◇ Diamond 1          │
│ 👁 🔒 → Connector 1        │
└─────────────────────────────┘
```

### 구현 항목
- [ ] 레이어 패널 컴포넌트
- [ ] 레이어 순서 변경 (드래그)
- [ ] 레이어 이름 편집
- [ ] 가시성 토글 (👁)
- [ ] 잠금 토글 (🔒)
- [ ] 레이어 선택 동기화

---

## 미래 계획: zm-editor 통합

> **Phase 8** (zm-draw 완료 후 진행)

### 개요

zm-draw를 zm-editor (Tiptap 기반 Notion 스타일 에디터)에 통합 예정

### 호환성 분석 결과

| 항목 | zm-draw | zm-editor | 호환 |
|------|---------|-----------|------|
| React | 19 | 19 | ✅ |
| TypeScript | 5.7+ | 5.7+ | ✅ |
| 모듈 | ESM | ESM | ✅ |

### 통합 방식

- **패턴**: Tiptap 커스텀 노드 (MermaidNode 참조)
- **Slash 명령**: `/draw` → 다이어그램 블록 삽입
- **저장 형식**: JSON (shapes + connectors)
- **예상 코드량**: 400~500줄

### 상세 계획

→ `docs/PROGRESS.md` Phase 8 섹션 참조

### Phase 2 체크리스트

- [x] Radix UI 도입 ✅
- [x] LeftPanel → Shapes 패널 ✅
- [x] 3열 레이아웃 구조 ✅
- [x] Tooltip 컴포넌트 ✅
- [x] BottomToolbar (플로팅 툴바로 이동) ✅
- [x] 패널 리사이즈 기능 ✅
- [x] Figma 스타일 툴바 (아이콘 기반) ✅
- [x] 무한 캔버스 ✅
- [x] **점선 그리드** (Figma 스타일) ✅ NEW
- [x] **Shapes 패널** (카테고리별 도형) ✅ NEW
- [ ] EditorLayout 컴포넌트 분리 (선택적)

### Phase 3.5 체크리스트 (완료 ✅)

- [x] ConnectionPoint, ArrowType, RoutingType 타입 ✅
- [x] Connection Points 시각화 (hover) ✅
- [x] 라인 스타일 지원 (solid/dashed/dotted) ✅
- [x] Orthogonal 라우팅 ✅
- [x] 커넥터 속성 패널 UI ✅
- [x] 라우팅 타입 선택 UI ✅
- [x] 화살촉 종류 선택 UI ✅

### Phase 2.6 체크리스트 (완료 ✅)

- [x] selectionStore 다중 선택 API ✅
- [x] Shift+Click 다중 선택 ✅
- [x] Transformer 다중 노드 지원 ✅
- [x] 다중 삭제 ✅
- [x] 속성 패널 "N개 선택됨" ✅
- [x] 버그 수정 (Zustand getter, toggleSelection, transformend) ✅
- [x] Marquee (드래그 박스) 선택 ✅

### Phase 2.5 체크리스트 (완료)

- [x] Position 편집 (X, Y) - 속성 패널 ✅
- [x] Size 편집 (W, H) - 속성 패널 ✅
- [x] Rotation 편집 - 속성 패널 ✅
- [x] 선택 컨텍스트 메뉴 (도형 위 미니 툴바) ✅

### Phase 1.5 완료 내용 (참고)

```typescript
// 구현된 코드
const fromCenter = getShapeCenter(fromShape);
const toCenter = getShapeCenter(toShape);
const from = getShapeEdgePoint(fromShape, toCenter);  // 도형 외곽
const to = getShapeEdgePoint(toShape, fromCenter);    // 도형 외곽
```

---

## Phase 1: 기초 리팩토링 상태

| 작업 | 상태 |
|------|------|
| Zustand stores 생성 | ✅ 6개 완료 |
| toolStore 마이그레이션 | ✅ |
| selectionStore 마이그레이션 | ✅ |
| viewportStore 마이그레이션 | ✅ |
| Toolbar 컴포넌트 분리 | ✅ |
| TextEditor 컴포넌트 분리 | ✅ |
| useKeyboard 훅 통합 | ✅ |
| 타입 확장 | ✅ |
| Copy/Paste/Duplicate | ✅ |
| 화살표 키 이동 | ✅ |
| shapes/connectors 마이그레이션 | ⏳ 선택적 |
| 드래그 레이어 분리 | ⏳ |

---

## Figma/Excalidraw/Draw.io 비교 (커넥터)

| 기능 | FigJam | Excalidraw | Draw.io | **zm-draw** |
|------|--------|------------|---------|-------------|
| 커넥터 선택 | ✅ | ✅ | ✅ | ✅ (v1.5) |
| 화살촉 위치 | 도형 외곽 | 도형 외곽 | 커스텀 | ✅ 도형 외곽 (v1.5) |
| 라우팅 | Bent/Curved/Straight | Simple/Elbow | Waypoint | **Straight만** |
| Connection Points | 4방향 스냅 | 4방향 | 완전 커스텀 | ❌ |
| 화살촉 종류 | 5가지 | 다양 | UML포함 | **1가지** |

---

## 커넥터 고도화 로드맵

### Phase 1.5: 기초 수정 (긴급)
- 화살촉 도형 외곽 위치
- 커넥터 선택/삭제

### Phase 3.5: 고급 기능
- Connection Points (4방향)
- Orthogonal (Elbow) 라우팅
- 화살촉 종류, 라인 스타일

### Phase 5.5: 프로 기능
- A* 경로 찾기
- Curved 커넥터
- 웨이포인트, 레이블

---

## 구현 완료된 기능 (MVP)

| 기능 | 상태 | Figma 대비 |
|------|------|-----------|
| 도형 생성 (Rect, Ellipse, Diamond) | ✅ 완료 | 30% |
| 도형 선택/삭제/이동 | ✅ 완료 | 100% |
| 리사이즈/회전 | ✅ 완료 | 100% |
| 텍스트 편집 (도형 내) | ✅ 완료 | 30% |
| 커넥터/화살표 | ✅ 기본 수정됨 | 40% |
| 줌/팬 | ✅ 완료 | 100% |
| Undo/Redo | ✅ 완료 | 100% |
| Save/Load (JSON) | ✅ 완료 | 100% |
| Copy/Paste/Duplicate | ✅ 완료 | 100% |
| 화살표 키 이동 | ✅ 완료 | 100% |

---

## 기술 결정사항

| 항목 | 현재 | 목표 | 상태 |
|------|------|-----|------|
| 상태 관리 | Zustand | Zustand | ✅ 완료 |
| UI 컴포넌트 | Radix UI | Radix UI | ✅ 완료 |
| 컬러 피커 | react-colorful | react-colorful | ✅ 완료 |
| Canvas 라이브러리 | Konva 10.0.0 | Konva 10.x | ✅ 완료 |
| Copy/Paste | 앱 내부 전용 | 앱 내부 전용 | ✅ 완료 |

---

## 해결된 이슈 기록

| 이슈 | 원인 | 해결책 |
|------|------|--------|
| react-konva + Next.js 15 | canvas 모듈 resolve 실패 | vanilla Konva 사용 |
| Transformer 충돌 | destroyChildren() | 별도 레이어 |
| 리사이즈 시 작아짐 | node.width() bbox | s.width * scale |
| Ctrl+Shift+Z 미동작 | 대소문자 | toLowerCase() |
| Zustand getter 반응성 | getter는 반응성 없음 | selector 패턴 사용 |
| 선택 도형 클릭 해제 | toggleSelection 로직 | 일반 클릭은 항상 선택 유지 |
| 다중 선택 리사이즈 | 첫 노드만 업데이트 | 모든 nodes() 순회 |

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
- **Figma 스타일 로드맵**: `docs/FIGMA-STYLE-ROADMAP.md`
- **프로젝트 구조**: `docs/PROJECT.md`

---

*다음 세션 시작 시 이 파일을 먼저 읽으세요.*
