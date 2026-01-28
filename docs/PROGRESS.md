# zm-draw 진행상황

> 최종 업데이트: 2026-01-28 (방향 전환: FigJam 스타일 협업 화이트보드)

---

## 전체 진행률

**목표**: ~~Figma 스타일 다이어그램 에디터~~ → **FigJam 스타일 실시간 협업 화이트보드**
**현재 Phase**: Phase 7 완료 ✅ → Phase 8 준비 중
**완료율**: 다이어그램 에디터 100% / 협업 화이트보드 0%

### 방향 전환 (2026-01-28)

기존 다이어그램 에디터에서 FigJam 스타일 협업 화이트보드로 목표 변경:
- 스티키 노트, 펜 도구 추가
- Yjs 기반 실시간 협업
- 투표, 타이머, 스탬프 등 협업 기능

**상세 로드맵**: `docs/FIGJAM-ROADMAP.md` 참조

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
- [x] 도구 단축키 V(선택), R(사각형), O(타원) ✅ 2026-01-28
- [x] 파일 단축키 Ctrl+S(저장), Ctrl+O(불러오기) ✅ 2026-01-28

### 1.6 성능 최적화 ⏳

- [x] 그리드 sceneFunc 최적화 (수천 Circle → 단일 Shape) ✅ 2026-01-28
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

## Phase 2: UI 레이아웃 ✅ 95% 완료

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

- [x] Dark Mode 기본 지원 ✅
- [x] RightPanel 껍데기 (속성 패널) ✅
- [x] 헤더바 + 다크모드/패널 토글 ✅
- [x] LeftPanel → **Shapes 패널** (카테고리별 도형) ✅
- [x] 3열 레이아웃 구조 ✅
- [x] Radix UI 도입 (@radix-ui/react-tooltip) ✅
- [x] Tooltip 컴포넌트 ✅
- [x] BottomToolbar (플로팅 툴바로 이동) ✅
- [x] 패널 리사이즈 기능 ✅
- [x] Figma 스타일 툴바 (아이콘 기반, 그룹화) ✅
- [x] 무한 캔버스 (동적 그리드, 무제한 패닝/줌) ✅
- [x] **점선 그리드** (Figma 스타일) ✅ NEW
- [x] **검색 입력창** (UI만) ✅ NEW
- [x] **접을 수 있는 섹션** (Connectors, Basic, Flowchart) ✅ NEW
- [ ] 패널 접기/펼치기 (Shift+\) - 선택적
- [ ] EditorLayout 컴포넌트 분리 - 선택적

---

## Phase 2.5: 속성 패널 편집 ✅ 완료

> **목표**: 속성 패널에서 도형 속성 편집 가능

### 2.5.1 기본 편집 ✅

- [x] DrawCanvasHandle 인터페이스 (forwardRef + useImperativeHandle)
- [x] updateShape, deleteSelected, duplicateSelected, copySelected 메서드 노출
- [x] Position 편집 (X, Y)
- [x] Size 편집 (W, H)
- [x] Rotation 편집

### 2.5.2 선택 컨텍스트 메뉴 ✅

- [x] 플로팅 컨텍스트 메뉴 (선택된 도형 위에 표시)
- [x] Copy, Duplicate, Delete 버튼
- [x] 툴팁 및 키보드 단축키 힌트

### 2.5.3 추가 기능 ⏳ (Phase 3으로 이동)

- [ ] Fill 색상 편집 (Color Picker 필요)
- [ ] Stroke 색상/두께 편집

---

## Phase 2.6: 다중 선택 ✅ 완료

> **목표**: 여러 도형 동시 선택 및 편집

### 2.6.1 다중 선택 구현

- [x] selectedIds: string[] (단일 → 다중) ✅
- [x] Shift+Click 다중 선택 ✅
- [x] 드래그 박스 선택 (Marquee selection) ✅
- [x] 선택된 도형들 그룹 이동/삭제 ✅

### 2.6.2 UI 연동

- [x] 속성 패널 "N개 선택됨" 표시 ✅
- [x] Transformer 다중 노드 지원 ✅

---

## Phase 3: 속성 패널 ✅ 완료

> **목표**: 선택된 도형 속성 실시간 편집

### 3.1 Design 탭 섹션

- [x] Position 섹션 (X, Y 입력) ✅
- [x] Size 섹션 (Width, Height 입력) ✅
- [x] Rotation 섹션 (각도 입력) ✅
- [x] Corner Radius 섹션 (모서리 둥글기) ✅
- [x] Fill 섹션 (Color Picker) ✅
- [x] Stroke 섹션 (색상, 두께) ✅

### 3.2 UI 컴포넌트

- [x] ColorPicker (react-colorful) ✅
- [x] Section (접을 수 있는 섹션) ✅

---

## Phase 3.5: 커넥터 고급 기능 ✅ 완료

> **목표**: Figma/Excalidraw 수준 커넥터

### 3.5.1 Connection Points

- [x] 도형 4방향 (T/R/B/L) 연결점 표시 ✅
- [x] 연결점 스냅 (hover 시 하이라이트) ✅

### 3.5.2 라우팅 옵션

- [x] Straight (직선) ✅
- [x] Orthogonal (Elbow) - 직각 경로 ✅
- [x] 라우팅 선택 UI ✅

### 3.5.3 스타일링

- [x] 화살촉 종류: None, Arrow ✅
- [x] 라인 스타일: Solid, Dashed, Dotted ✅
- [x] 속성 패널 연동 (커넥터 색상/두께/스타일) ✅

---

## Phase 4: 레이어 패널 ✅ 완료

> **목표**: 레이어 트리 뷰 및 관리

### 4.1 레이어 기능

- [x] Design/Layers 탭 UI ✅
- [x] 레이어 목록 표시 (shape 타입별 아이콘) ✅
- [x] 레이어 클릭 → 선택 ✅
- [x] 레이어 이름 변경 (더블클릭) ✅
- [x] 레이어 순서 변경 (HTML5 Drag API) ✅
- [x] 레이어 잠금/숨김 아이콘 ✅

---

## Phase 5: 텍스트 도형 ✅ 완료

> **목표**: 독립 텍스트 도형 지원

### 5.1 텍스트 도형

- [x] 독립 Text 도형 (도형 없는 텍스트) ✅
- [x] 텍스트 도구 버튼 (T 단축키) ✅
- [x] 텍스트 스타일링 (폰트 크기, 색상, 정렬) ✅

### 5.2 추가 도형 (미구현)

- [ ] Line 도형 (직선)
- [ ] Polygon 도형 (다각형)
- [ ] Star 도형 (별)
- [ ] Frame 도형 (자식 포함 컨테이너)

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

## Phase 6: 정렬/분배 및 그룹핑 ✅ 완료

> **목표**: 생산성 향상 기능

### 6.1 다중 선택 고급

- [x] Select All (Ctrl+A) ✅

### 6.2 정렬/분배

- [x] 정렬 (좌/중앙/우/상/중/하) ✅
- [x] 균등 분배 (수평/수직) ✅
- [x] 정렬/분배 버튼 UI ✅

### 6.3 그룹핑

- [x] 그룹 만들기 (Ctrl+G) ✅
- [x] 그룹 해제 (Ctrl+Shift+G) ✅

---

## Phase 7: 고급 기능 ✅ 완료

> **목표**: 프로덕션 수준 완성

### 7.1 스냅 및 가이드

- [x] Grid Snap (그리드 스냅) ✅
- [x] Smart Guides (정렬 가이드라인) ✅
- [x] 스냅 토글 옵션 ✅

### 7.2 Export

- [x] PNG Export ✅
- [x] SVG Export ✅

### 7.3 줌 컨트롤

- [x] 줌 프리셋 (Fit, 100%) ✅
- [x] 줌 +/- 버튼 ✅
- [x] 줌 레벨 표시 ✅

### 7.4 미구현

- [ ] 이미지 도형 (드래그 앤 드롭)
- [ ] 미니맵

---

## Phase 8: 화이트보드 기본 도구 ⏳ 신규

> **목표**: FigJam 핵심 기능 - 스티키 노트, 펜 도구
> **예상 기간**: 1주

### 8.1 스티키 노트

- [ ] StickyNote 도형 타입 추가
- [ ] 6가지 색상 프리셋
- [ ] 자동 크기 조절 (텍스트에 따라)
- [ ] 작성자 표시 옵션
- [ ] 툴바 스티키 노트 버튼 (단축키: S)

### 8.2 펜/마커 도구

- [ ] Konva.Line 기반 프리핸드 드로잉
- [ ] 펜 도구 (단축키: P)
- [ ] 마커 도구 (단축키: M)
- [ ] 하이라이터 도구 (단축키: H)
- [ ] 지우개 도구 (단축키: E)

---

## Phase 9: 이미지 및 미디어 ⏳ 예정

> **예상 기간**: 4일

- [ ] 드래그 앤 드롭 이미지 삽입
- [ ] 클립보드 붙여넣기
- [ ] 링크 프리뷰

---

## Phase 10: 스탬프 및 이모지 ⏳ 예정

> **예상 기간**: 4일

- [ ] 스탬프 휠 UI
- [ ] 이모지 버스트 애니메이션
- [ ] 커스텀 이모지 지원

---

## Phase 11: 실시간 협업 ⏳ 핵심

> **예상 기간**: 2주 (가장 중요한 Phase)

### 11.1 Yjs 통합

- [ ] Yjs 패키지 설치
- [ ] Y.Map으로 shapes/connectors 동기화
- [ ] 충돌 해결 (CRDT 자동 처리)

### 11.2 커서 공유

- [ ] Awareness API 설정
- [ ] 다른 사용자 커서 실시간 표시
- [ ] 사용자별 색상/이름

### 11.3 WebSocket 서버

- [ ] y-websocket 서버 설정
- [ ] 룸(Room) 기반 문서 분리
- [ ] 문서 영구 저장

### 11.4 오프라인 지원

- [ ] y-indexeddb 로컬 저장
- [ ] 오프라인 편집 지원

---

## Phase 12-17: 추가 협업 기능 ⏳ 예정

- **Phase 12**: 댓글 시스템 (5일)
- **Phase 13**: 투표/타이머 (5일)
- **Phase 14**: Spotlight, 섹션 (1주)
- **Phase 15**: 테이블, 마인드맵 (1주)
- **Phase 16**: 템플릿 시스템 (5일)
- **Phase 17**: 성능 최적화, 접근성 (1주)

**상세 내용**: `docs/FIGJAM-ROADMAP.md` 참조

---

## [Archive] Phase 8 (구): zm-editor 통합

> **상태**: 보류 (협업 화이트보드 완성 후 재검토)
> **목표**: zm-draw를 zm-editor (Tiptap 기반 리치 텍스트 에디터)에 통합
> **선행 조건**: zm-draw Phase 7 완료 후 진행
> **예상 작업량**: 400~500줄 통합 코드

### 8.1 zm-editor 분석 결과

**zm-editor 개요**:
- Tiptap/ProseMirror 기반 Notion 스타일 에디터
- 28개 커스텀 노드 (MermaidNode, ImageNode 등)
- React 19, TypeScript 5.7, ESM, pnpm (zm-draw와 동일 스택)

**통합 가능성**: ✅ 완전 호환

| 항목 | zm-draw | zm-editor | 호환성 |
|------|---------|-----------|--------|
| React | 19 | 19 | ✅ |
| TypeScript | 5.7+ | 5.7+ | ✅ |
| 모듈 | ESM | ESM | ✅ |
| 패키지 매니저 | pnpm | pnpm | ✅ |

### 8.2 통합 아키텍처

**참고 패턴**: MermaidNode 확장 구조
- `mermaid-extension.ts`: Tiptap Node.create() 정의
- `MermaidNode.tsx`: ReactNodeViewRenderer 컴포넌트

**zm-draw 통합 파일 구조**:
```
zm-editor/packages/react/src/components/
└── DrawDiagramNode/
    ├── draw-diagram-extension.ts  (~100줄)
    └── DrawDiagramNode.tsx        (~200줄)
```

### 8.3 확장 정의 (draw-diagram-extension.ts)

```typescript
import { Node } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { DrawDiagramNode } from './DrawDiagramNode';

export const DrawDiagram = Node.create({
  name: 'drawDiagram',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      diagramData: {
        default: { shapes: [], connectors: [] },
        parseHTML: (el) => JSON.parse(el.getAttribute('data-diagram') || '{}'),
        renderHTML: (attrs) => ({ 'data-diagram': JSON.stringify(attrs.diagramData) }),
      },
      width: { default: 600 },
      height: { default: 400 },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="draw-diagram"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', { ...HTMLAttributes, 'data-type': 'draw-diagram' }];
  },

  addNodeView() {
    return ReactNodeViewRenderer(DrawDiagramNode);
  },
});
```

### 8.4 React 컴포넌트 (DrawDiagramNode.tsx)

```typescript
import { NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import { DrawCanvas, Shape, Connector } from '@zm-draw/react';

export function DrawDiagramNode({ node, updateAttributes }: NodeViewProps) {
  const { diagramData, width, height } = node.attrs;

  const handleChange = (shapes: Shape[], connectors: Connector[]) => {
    updateAttributes({ diagramData: { shapes, connectors } });
  };

  return (
    <NodeViewWrapper>
      <DrawCanvas
        width={width}
        height={height}
        shapes={diagramData.shapes}
        connectors={diagramData.connectors}
        onChange={handleChange}
      />
    </NodeViewWrapper>
  );
}
```

### 8.5 Slash Command 통합

```typescript
// 기존 zm-editor 슬래시 메뉴에 추가
{
  title: 'Draw Diagram',
  description: 'Insert a diagram editor',
  icon: DiagramIcon,
  command: ({ editor }) => {
    editor.chain().focus().insertContent({
      type: 'drawDiagram',
      attrs: { diagramData: { shapes: [], connectors: [] } }
    }).run();
  },
}
```

### 8.6 통합 체크리스트

- [ ] @zm-draw/react 패키지 npm 배포
- [ ] draw-diagram-extension.ts 생성
- [ ] DrawDiagramNode.tsx 생성
- [ ] Slash command 등록
- [ ] 스타일 통합 (다크모드 등)
- [ ] 리사이즈 핸들 추가 (선택)
- [ ] 전체화면 편집 모드 (선택)

---

## 기술 스택 검토 (2026-01-25)

### 현재 스택

| 패키지 | 버전 | React 19 호환 |
|--------|------|--------------|
| React | ^19.0.0 | ✅ |
| Next.js | ^15.0.0 | ✅ |
| Konva | ^10.0.0 | ✅ (vanilla) |
| Zustand | ^5.0.10 | ✅ |
| Radix UI | ^1.1.x | ✅ |

### 추가 필요 라이브러리

| 라이브러리 | 용도 | 설치 시점 |
|-----------|------|----------|
| react-colorful | Color Picker | Phase 3 |
| @radix-ui/react-slider | Opacity, Corner Radius | Phase 3 |
| @radix-ui/react-dropdown-menu | Blend Mode 선택 | Phase 3 |
| @radix-ui/react-popover | Color Picker 컨테이너 | Phase 3 |

### Konva 성능 최적화 상태

| 최적화 | 권장 | 현재 |
|--------|------|------|
| 레이어 분리 (3-5개) | ✅ | ✅ 5개 |
| listening: false | ✅ | ✅ bg/grid |
| 그리드 sceneFunc | ✅ | ✅ 단일 Shape로 최적화 |
| 드래그 레이어 분리 | ✅ | ❌ |
| Shape 캐싱 | 복잡 도형 | ❌ |

---

## 기술 부채

| 항목 | 설명 | 해결 시점 | 우선순위 |
|------|------|----------|---------|
| ~~**Konva 버전**~~ | ~~^9.3.0 → ^10.0.0~~ | ~~Phase 0.9~~ | ✅ 해결됨 |
| ~~**Copy/Paste**~~ | ~~기본 기능 누락~~ | ~~Phase 1~~ | ✅ 해결됨 |
| ~~**커넥터 화살촉 가려짐**~~ | ~~중심→중심 연결~~ | ~~Phase 1.5~~ | ✅ 해결됨 |
| ~~**커넥터 선택 불가**~~ | ~~클릭 이벤트 없음~~ | ~~Phase 1.5~~ | ✅ 해결됨 |
| ~~**Diamond 비율**~~ | ~~width≠height 시 시각적 이슈~~ | ~~2026-01-28~~ | ✅ 해결됨 |
| ~~**메모리 누수**~~ | ~~Stage cleanup 미흡~~ | ~~2026-01-28~~ | ✅ 해결됨 |
| ~~**History 초기 상태**~~ | ~~첫 Undo 동작 안 함~~ | ~~2026-01-28~~ | ✅ 해결됨 |
| ~~**그리드 성능**~~ | ~~수천 개 노드 생성~~ | ~~2026-01-28~~ | ✅ 해결됨 |
| 드래그 레이어 미분리 | 드래그 시 전체 레이어 redraw | Phase 4 | 중 |
| ~~react-colorful 설치~~ | ~~Color Picker 필요~~ | ~~Phase 3~~ | ✅ 해결됨 |
| ~~Radix Popover 설치~~ | ~~Color Picker 컨테이너~~ | ~~Phase 3~~ | ✅ 해결됨 |
| Radix 추가 컴포넌트 | Slider, Dropdown 등 | Phase 3 | 중 |
| shapes/connectors 마이그레이션 | props 연동 필요 | 선택적 | 낮음 |

---

## 예상 일정 (수정됨)

| Phase | 내용 | 예상 기간 | 비고 |
|-------|------|----------|------|
| ~~Phase 0.9~~ | ~~즉시 조치~~ | ~~0.5일~~ | ✅ 완료 |
| ~~Phase 1~~ | ~~기초 리팩토링~~ | ~~4일~~ | ✅ 90% 완료 |
| **Phase 1.5** | **커넥터 기초 수정** | **1.25일** | **신규 (긴급)** |
| Phase 2 | UI 레이아웃 | 3일 | ✅ 95% 완료 |
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
| 2026-01-28 | e6a55a9 | refactor: Code quality improvements and bug fixes |
| 2026-01-25 | 58bce3d | docs: Update documentation with Phase 2.5 completion |
| 2026-01-25 | 2a62d70 | fix: Context menu follows shape during zoom/pan |
| 2026-01-25 | e187394 | feat(phase2.5): Add selection context menu |
| 2026-01-25 | cde0ce6 | feat(phase2.5): Add property panel editing |
| 2026-01-25 | 03afb20 | docs: Fix inconsistencies across documentation |
| 2026-01-25 | b543f2a | feat(phase2): Add dotted grid and Shapes panel |
| 2026-01-25 | 684061a | docs: Update docs with Figma-style toolbar and infinite canvas |
| 2026-01-25 | 6889993 | feat(phase2): Add Figma-style toolbar and infinite canvas |
| 2026-01-25 | bd482f8 | feat(phase2): Add panel resize functionality |
| 2026-01-25 | 9bf008e | feat(phase2): Move toolbar to bottom floating position |
| 2026-01-25 | 3de24ba | docs: Update progress with Phase 2 UI layout status |
| 2026-01-25 | 1e5e11f | feat(phase2): Add Radix UI with Tooltip component |
| 2026-01-25 | e07a760 | feat(phase2): Add LeftPanel for layers (3-column layout) |

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
