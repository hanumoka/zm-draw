# zm-draw Figma 스타일 구현 로드맵

> 최종 업데이트: 2026-01-25 (문서 재검토 완료)
> 작성 근거: Figma UI3 공식 문서, Penpot 오픈소스, Konva.js 모범 사례
>
> ⚠️ **2026-01-25 검토 결과 반영**: 기술 스택 호환성 검증, 로드맵 우선순위 재조정

---

## 1. Figma UI 구조 분석 (UI3 기준)

### 1.1 전체 레이아웃

Figma는 2024년 Config에서 UI3로 대폭 개편되었습니다.

```
┌─────────────────────────────────────────────────────────────────┐
│  Navigation Bar (상단)                                           │
│  [파일명] [브랜치] [프로젝트]                    [공유] [Dev Mode] │
├──────────┬────────────────────────────────────┬─────────────────┤
│          │                                    │                 │
│  Left    │                                    │  Right          │
│  Panel   │         Canvas (캔버스)             │  Panel          │
│          │                                    │                 │
│ ─────────│                                    │ ─────────────── │
│ Pages    │                                    │ Design Tab      │
│ ─────────│                                    │ - Alignment     │
│ Layers   │                                    │ - Position      │
│          │                                    │ - Size          │
│          │                                    │ - Fill          │
│          │                                    │ - Stroke        │
│          │                                    │ - Effects       │
│          │                                    │ ─────────────── │
│          │                                    │ Prototype Tab   │
│          │                                    │ ─────────────── │
│          │                                    │ Inspect Tab     │
├──────────┴────────────────────────────────────┴─────────────────┤
│                    Bottom Toolbar (하단)                         │
│  [Move][Frame][Shapes][Pen][Text][Hand][Comment]    [Zoom 100%] │
└─────────────────────────────────────────────────────────────────┘
```

**참고**: [Figma UI3 공식 가이드](https://help.figma.com/hc/en-us/articles/23954856027159-Navigating-UI3-Figma-s-new-UI)

### 1.2 핵심 UI 영역

| 영역 | 위치 | 역할 |
|------|------|------|
| **Navigation Bar** | 상단 | 파일/브랜치 정보, 공유, 모드 전환 |
| **Left Panel** | 좌측 | 페이지 목록, 레이어 트리 |
| **Canvas** | 중앙 | 무한 캔버스, 디자인 작업 영역 |
| **Right Panel** | 우측 | 속성 패널 (Design/Prototype/Inspect) |
| **Bottom Toolbar** | 하단 | 도구 선택 (UI3에서 하단으로 이동) |

**참고**: [Figma 좌측 사이드바](https://help.figma.com/hc/en-us/articles/360039831974-View-layers-and-pages-in-the-left-sidebar), [Figma 우측 사이드바](https://help.figma.com/hc/en-us/articles/360039832014-Design-prototype-and-explore-layer-properties-in-the-right-sidebar)

---

## 2. 도구 (Tools) 목록

### 2.1 Figma 기본 도구

| 도구 | 단축키 | 설명 | zm-draw 상태 |
|------|--------|------|-------------|
| Move/Selection | V | 선택 및 이동 | ✅ 완료 |
| Frame | F | 프레임 생성 (컨테이너) | ❌ 미구현 |
| Rectangle | R | 사각형 | ✅ 완료 |
| Ellipse | O | 원/타원 | ✅ 완료 |
| Polygon | - | 다각형 | ❌ 미구현 |
| Star | - | 별 | ❌ 미구현 |
| Line | L | 직선 | ❌ 미구현 |
| Arrow | Shift+L | 화살표 | ✅ 완료 (커넥터) |
| Pen | P | 벡터 패스 그리기 | ❌ 미구현 |
| Pencil | Shift+P | 자유 드로잉 | ❌ 미구현 |
| Text | T | 텍스트 | ⚠️ 부분 (도형 내 텍스트만) |
| Hand | H / Space | 캔버스 이동 | ✅ 완료 |
| Comment | C | 코멘트 | ❌ 미구현 |

**참고**: [Figma 도구 사용법](https://help.figma.com/hc/en-us/articles/360041064174-Access-design-tools-from-the-toolbar), [Figma 단축키](https://help.figma.com/hc/en-us/articles/360040328653-Keyboard-shortcuts-in-Figma)

### 2.2 우선순위별 구현 계획

**Phase A (필수)**: Move, Frame, Rectangle, Ellipse, Line, Text (독립), Hand
**Phase B (권장)**: Polygon, Star, Pen, Arrow (개선)
**Phase C (선택)**: Pencil, Comment

---

## 3. 속성 패널 (Properties Panel)

### 3.1 Design 탭 속성

| 카테고리 | 속성 | 설명 | zm-draw 상태 |
|----------|------|------|-------------|
| **Alignment** | 정렬 버튼 | 좌/중앙/우/상/중/하 정렬 | ❌ 미구현 |
| **Position** | X, Y | 절대 좌표 | ❌ 미구현 (표시만) |
| **Size** | W, H | 너비, 높이 | ❌ 미구현 (표시만) |
| **Rotation** | 각도 | 회전 각도 | ✅ 완료 (Transformer) |
| **Corner Radius** | 모서리 반경 | 둥근 모서리 | ❌ 미구현 |
| **Fill** | 색상 | 채우기 색상 | ❌ 미구현 (고정값) |
| **Stroke** | 색상, 두께 | 테두리 | ❌ 미구현 (고정값) |
| **Effects** | Shadow, Blur | 그림자, 블러 | ❌ 미구현 |
| **Constraints** | 반응형 제약 | 부모 대비 위치 고정 | ❌ 미구현 |
| **Auto Layout** | Flex 레이아웃 | 자동 배치 | ❌ 미구현 |

**참고**: [Figma Auto Layout](https://help.figma.com/hc/en-us/articles/360040451373-Explore-auto-layout-properties)

### 3.2 텍스트 속성 (Text 선택 시)

| 속성 | 설명 | zm-draw 상태 |
|------|------|-------------|
| Font Family | 글꼴 | ⚠️ 고정 (Arial) |
| Font Size | 크기 | ⚠️ 고정 (14px) |
| Font Weight | 굵기 | ❌ 미구현 |
| Line Height | 줄 높이 | ❌ 미구현 |
| Letter Spacing | 자간 | ❌ 미구현 |
| Text Align | 정렬 | ⚠️ 고정 (center) |
| Text Color | 색상 | ⚠️ 고정 (white) |

---

## 4. 레이어 관리

### 4.1 Figma 레이어 기능

| 기능 | 설명 | zm-draw 상태 |
|------|------|-------------|
| 레이어 목록 표시 | 트리 구조로 표시 | ❌ 미구현 |
| 레이어 이름 변경 | 더블클릭으로 편집 | ❌ 미구현 |
| 레이어 순서 변경 | 드래그 앤 드롭 | ❌ 미구현 |
| 레이어 잠금 | 편집 방지 | ❌ 미구현 |
| 레이어 숨김 | 표시/숨김 토글 | ❌ 미구현 |
| 그룹핑 | Ctrl+G | ❌ 미구현 |
| 프레임으로 감싸기 | Ctrl+Alt+G | ❌ 미구현 |
| 레이어 검색 | 이름으로 검색 | ❌ 미구현 |
| 레이어 필터 | 타입별 필터 | ❌ 미구현 |

### 4.2 Konva.js 레이어 모범 사례

**참고**: [Konva Layer Management](https://konvajs.org/docs/performance/Layer_Management.html)

```
권장 레이어 구조 (3-5개):

Layer 1: Background (정적, listening: false)
Layer 2: Grid (정적, listening: false)
Layer 3: Shapes (동적, 도형들)
Layer 4: Connectors (동적, 연결선)
Layer 5: Selection (Transformer, 선택 UI)
```

**핵심 원칙**:
- 정적 콘텐츠와 동적 콘텐츠 분리
- 레이어는 3-5개로 제한 (성능)
- 드래그 중인 요소는 임시 레이어로 이동
- `listening: false`로 불필요한 이벤트 비활성화

---

## 5. 상태 관리 아키텍처

### 5.1 현재 zm-draw 상태 구조

```typescript
// 현재: React useState (단순)
const [shapes, setShapes] = useState<Shape[]>([]);
const [connectors, setConnectors] = useState<Connector[]>([]);
const [selectedId, setSelectedId] = useState<string | null>(null);
const [tool, setTool] = useState<ToolType>('select');
```

### 5.2 권장: Zustand 기반 상태 관리

**참고**: [Zustand GitHub](https://github.com/pmndrs/zustand), [React Flow State Management](https://reactflow.dev/learn/advanced-use/state-management)

```typescript
// 권장: Zustand Store
interface CanvasStore {
  // 캔버스 상태
  shapes: Shape[];
  connectors: Connector[];
  pages: Page[];
  currentPageId: string;

  // 선택 상태
  selectedIds: string[];  // 다중 선택 지원
  hoveredId: string | null;

  // 도구 상태
  tool: ToolType;
  toolOptions: ToolOptions;

  // 뷰포트 상태
  viewport: { x: number; y: number; zoom: number };

  // 히스토리 (Undo/Redo)
  history: HistoryState[];
  historyIndex: number;

  // 액션
  addShape: (shape: Shape) => void;
  updateShape: (id: string, updates: Partial<Shape>) => void;
  deleteShapes: (ids: string[]) => void;
  setSelection: (ids: string[]) => void;
  setTool: (tool: ToolType) => void;
  undo: () => void;
  redo: () => void;
}
```

**Zustand 장점**:
- 보일러플레이트 최소화
- 불필요한 리렌더링 방지
- DevTools 지원 (redux-devtools)
- 미들웨어 지원 (persist, immer)

---

## 6. 컴포넌트 구조

### 6.1 권장 컴포넌트 트리

```
<DrawEditor>                    # 최상위 컨테이너
├── <NavigationBar>             # 상단 네비게이션
│   ├── <FileInfo>              # 파일명, 브랜치
│   ├── <ShareButton>           # 공유 버튼
│   └── <ModeToggle>            # Edit/Dev Mode
│
├── <EditorLayout>              # 3열 레이아웃
│   ├── <LeftPanel>             # 좌측 패널
│   │   ├── <PagesList>         # 페이지 목록
│   │   └── <LayersTree>        # 레이어 트리
│   │
│   ├── <CanvasArea>            # 캔버스 영역
│   │   ├── <Canvas>            # Konva Stage
│   │   ├── <SelectionOverlay>  # 선택 영역 표시
│   │   └── <TextEditor>        # 텍스트 편집 오버레이
│   │
│   └── <RightPanel>            # 우측 패널
│       ├── <DesignTab>         # Design 탭
│       │   ├── <AlignmentSection>
│       │   ├── <PositionSection>
│       │   ├── <SizeSection>
│       │   ├── <FillSection>
│       │   ├── <StrokeSection>
│       │   └── <EffectsSection>
│       ├── <PrototypeTab>      # Prototype 탭
│       └── <InspectTab>        # Inspect 탭
│
└── <BottomToolbar>             # 하단 툴바
    ├── <ToolGroup>             # 도구 그룹
    │   ├── <MoveTool>
    │   ├── <FrameTool>
    │   ├── <ShapesDropdown>
    │   ├── <PenTool>
    │   ├── <TextTool>
    │   └── <HandTool>
    └── <ZoomControls>          # 줌 컨트롤
```

### 6.2 파일 구조

```
packages/react/src/
├── components/
│   ├── DrawEditor.tsx           # 메인 에디터
│   ├── Canvas/
│   │   ├── Canvas.tsx           # Konva Stage 래퍼
│   │   ├── CanvasGrid.tsx       # 그리드 레이어
│   │   ├── ShapeRenderer.tsx    # 도형 렌더링
│   │   └── ConnectorRenderer.tsx
│   ├── Panels/
│   │   ├── LeftPanel/
│   │   │   ├── PagesList.tsx
│   │   │   └── LayersTree.tsx
│   │   └── RightPanel/
│   │       ├── DesignTab.tsx
│   │       ├── sections/
│   │       │   ├── AlignmentSection.tsx
│   │       │   ├── PositionSection.tsx
│   │       │   ├── FillSection.tsx
│   │       │   └── StrokeSection.tsx
│   │       └── controls/
│   │           ├── ColorPicker.tsx
│   │           └── NumberInput.tsx
│   ├── Toolbar/
│   │   ├── BottomToolbar.tsx
│   │   ├── ToolButton.tsx
│   │   └── ZoomControls.tsx
│   └── common/
│       ├── Panel.tsx
│       ├── Tabs.tsx
│       └── Icons.tsx
├── stores/
│   ├── canvasStore.ts           # Zustand 메인 스토어
│   ├── uiStore.ts               # UI 상태 (패널 열림/닫힘)
│   └── historyStore.ts          # Undo/Redo
├── hooks/
│   ├── useCanvas.ts
│   ├── useSelection.ts
│   ├── useKeyboard.ts
│   └── useTool.ts
├── types/
│   ├── shapes.ts
│   ├── tools.ts
│   └── editor.ts
└── index.ts
```

---

## 7. 구현 로드맵

### Phase 0.9: 즉시 조치 (Phase 1 전) ← **새 Phase**

**목표**: 기반 정리

| 작업 | 설명 | 예상 |
|------|------|------|
| Konva 업그레이드 | ^9.3.0 → ^10.0.0 | 0.5일 |

### Phase 1: 기초 리팩토링 (현재 → 구조 개선)

**목표**: 현재 단일 컴포넌트를 모듈화

| 작업 | 설명 | 예상 |
|------|------|------|
| Zustand 도입 | 상태 관리 분리 | 1일 |
| 컴포넌트 분리 | Canvas, Toolbar 분리 | 1일 |
| 타입 정의 확장 | Shape, Tool 타입 확장 | 0.5일 |
| 키보드 단축키 훅 | useKeyboard 커스텀 훅 | 0.5일 |
| **Copy/Paste/Duplicate** | Ctrl+C/V/D 구현 | 0.5일 |
| **화살표 키 이동** | 1px, Shift 10px | 0.25일 |
| **드래그 레이어 분리** | 성능 최적화 | 0.25일 |

### Phase 2: UI 레이아웃 (Figma 스타일)

**목표**: 3열 레이아웃 + 패널 시스템

| 작업 | 설명 | 예상 |
|------|------|------|
| EditorLayout | 3열 레이아웃 컴포넌트 | 0.5일 |
| LeftPanel (빈 껍데기) | 레이어 패널 영역 | 0.5일 |
| RightPanel (빈 껍데기) | 속성 패널 영역 | 0.5일 |
| BottomToolbar | 하단 툴바 이동 | 0.5일 |
| 패널 리사이즈/토글 | 패널 접기/펼치기 | 1일 |
| **Dark Mode 기본** | UI3 핵심 기능 | 0.5일 |

### Phase 2.5: 다중 선택 기본 ← **새 Phase (앞으로 이동)**

**목표**: 속성 패널 구현 전에 다중 선택 기반 마련

> **이동 이유**: 다중 선택이 있어야 속성 패널에서 "N개 선택됨" 표시 가능

| 작업 | 설명 | 예상 |
|------|------|------|
| selectedIds 배열화 | string → string[] | 0.5일 |
| Shift+Click | 다중 선택 추가/제거 | 0.5일 |
| 드래그 박스 선택 | Marquee selection | 1일 |

### Phase 3: 속성 패널

**목표**: 선택된 도형의 속성 편집

| 작업 | 설명 | 예상 |
|------|------|------|
| Position 섹션 | X, Y 좌표 입력 | 0.5일 |
| Size 섹션 | Width, Height 입력 | 0.5일 |
| Fill 섹션 | Color Picker | 1일 |
| Stroke 섹션 | 색상, 두께 | 0.5일 |
| Corner Radius | 모서리 둥글기 | 0.5일 |
| Rotation 입력 | 각도 직접 입력 | 0.5일 |

### Phase 4: 레이어 패널

**목표**: 레이어 트리 뷰

| 작업 | 설명 | 예상 |
|------|------|------|
| LayersTree 기본 | 레이어 목록 표시 | 1일 |
| 레이어 선택 | 클릭으로 선택 | 0.5일 |
| 레이어 순서 변경 | **아래 대안 참조** | 0.5일 |
| 레이어 잠금/숨김 | 아이콘 토글 | 0.5일 |
| 레이어 이름 변경 | 더블클릭 편집 | 0.5일 |

#### 레이어 순서 변경 - 구현 방식 ✅ 결정됨

> **결정 (2026-01-25)**: HTML5 Drag API 사용

```typescript
// 구현 예시
<div
  draggable="true"
  onDragStart={(e) => e.dataTransfer.setData('layerId', layer.id)}
  onDragOver={(e) => e.preventDefault()}
  onDrop={(e) => reorderLayer(e.dataTransfer.getData('layerId'), targetIndex)}
>
  {layer.name}
</div>
```

### Phase 5: 추가 도형 및 기능

**목표**: 도형 종류 확장

| 작업 | 설명 | 예상 |
|------|------|------|
| Line 도형 | 직선 | 0.5일 |
| Polygon 도형 | 다각형 | 0.5일 |
| Star 도형 | 별 모양 | 0.5일 |
| 독립 Text | 도형 없는 텍스트 | 1일 |
| Frame (컨테이너) | 그룹 컨테이너 | 2일 |

### Phase 6: 정렬/분배 및 그룹핑

**목표**: 고급 편집 기능

> **참고**: 다중 선택 기본 기능은 **Phase 2.5**로 앞으로 이동됨

| 작업 | 설명 | 예상 |
|------|------|------|
| 다중 선택 고급 | Select All, Invert Selection | 0.5일 |
| 정렬 기능 | 좌/중/우/상/중/하 | 1일 |
| 분배 기능 | 균등 분배 | 0.5일 |
| 그룹핑 | Ctrl+G / Ctrl+Shift+G | 1일 |

### Phase 7: 고급 기능

**목표**: 프로덕션 수준 기능

| 작업 | 설명 | 예상 |
|------|------|------|
| Grid Snap | 그리드에 스냅 | 1일 |
| Smart Guides | 정렬 가이드라인 | 1.5일 |
| Copy/Paste | Ctrl+C/V | 0.5일 |
| 이미지 추가 | 이미지 도형 | 1일 |
| Export PNG/SVG | 이미지 내보내기 | 1일 |

---

## 8. 참조 프로젝트

### 8.1 Penpot (오픈소스)

**참고**: [Penpot GitHub](https://github.com/penpot/penpot), [Penpot 공식 사이트](https://penpot.app/)

- SVG 기반 (표준 웹 파일)
- Flex/Grid 레이아웃 지원
- 컴포넌트 시스템
- 디자인 토큰
- 개발자 Inspect 탭

### 8.2 Figma Clone 프로젝트

| 프로젝트 | 기술 스택 | 특징 |
|----------|----------|------|
| [adrianhajdin/figma_clone](https://github.com/adrianhajdin/figma_clone) | Next.js + Fabric.js + Liveblocks | 실시간 협업, 커서 채팅 |
| [ganeshdanuri/figma-clone](https://github.com/ganeshdanuri/figma-clone) | React + Vite | 경량, 기본 기능 |
| [swimmingkiim/react-image-editor](https://github.com/swimmingkiim/react-image-editor) | React + Konva | Konva 기반, 이미지 편집 |

### 8.3 유용한 라이브러리

| 라이브러리 | 용도 | React 19 호환 |
|------------|------|--------------|
| **@radix-ui/react-*** | 패널, 드롭다운, 탭 UI | ✅ 확인됨 |
| **react-colorful** | 경량 Color Picker | 🔶 테스트 필요 |
| **zustand** | 상태 관리 | ✅ 확인됨 |
| **immer** | 불변 상태 업데이트 | ✅ |
| **lucide-react** | 아이콘 | ✅ |

#### ⚠️ 드래그 앤 드롭 라이브러리 주의

| 라이브러리 | 상태 | 비고 |
|------------|------|------|
| **@dnd-kit/core** | ⚠️ React 19 이슈 | GitHub #1511 미해결, 1년간 미업데이트 |
| **@dnd-kit/react** | 🔶 테스트 필요 | v0.2.1 최신, "use client" 수동 추가 필요 |
| **HTML5 Drag API** | ✅ 권장 | 네이티브, 호환성 좋음 |
| **react-beautiful-dnd** | ❌ | 유지보수 중단 |

**권장**: 레이어 순서 변경에 HTML5 Drag API 또는 버튼 조작 방식 사용

---

## 9. 기술적 고려사항

### 9.1 성능 최적화

**Konva 레이어 관리**:
```typescript
// 정적 레이어는 listening 비활성화
gridLayer.listening(false);

// 드래그 중 임시 레이어 사용
shape.on('dragstart', () => {
  shape.moveTo(dragLayer);
});
shape.on('dragend', () => {
  shape.moveTo(shapesLayer);
});

// 복잡한 도형은 캐싱
complexGroup.cache();
```

### 9.2 React 19 호환성

- `react-konva` 사용 불가 → vanilla Konva 유지
- Server Component 주의 → `'use client'` 필수
- Suspense 경계 설정

### 9.3 접근성 (A11y)

- 키보드 네비게이션
- 스크린 리더 지원 (레이어 목록)
- 고대비 모드

---

## 10. 결론

### 현재 zm-draw vs Figma 기능 비교

| 카테고리 | Figma | zm-draw 현재 | 완성도 |
|----------|-------|-------------|--------|
| UI 레이아웃 | 3열 패널 | 단일 캔버스 | 10% |
| 도구 | 10+ 도구 | 5 도구 | 30% |
| 속성 패널 | 풀 기능 | 없음 | 0% |
| 레이어 관리 | 풀 기능 | 없음 | 0% |
| 도형 | 10+ 종류 | 3종류 | 20% |
| 텍스트 | 독립 텍스트 | 도형 내부만 | 30% |
| 정렬/분배 | 있음 | 없음 | 0% |
| 다중 선택 | 있음 | 없음 | 0% |
| 그룹핑 | 있음 | 없음 | 0% |

### 예상 총 개발 기간

| Phase | 작업 | 예상 기간 | 비고 |
|-------|------|----------|------|
| Phase 0.9 | 즉시 조치 | 0.5일 | Konva 업그레이드 |
| Phase 1 | 기초 리팩토링 | 4일 | Copy/Paste 등 추가 |
| Phase 2 | UI 레이아웃 | 3.5일 | Dark Mode 포함 |
| Phase 2.5 | 다중 선택 기본 | 2일 | **앞으로 이동** |
| Phase 3 | 속성 패널 | 4일 | |
| Phase 4 | 레이어 패널 | 3일 | dnd-kit 대안 반영 |
| Phase 5 | 추가 도형 | 5일 | |
| Phase 6 | 정렬/그룹핑 | 3일 | 다중선택 기본 제외 |
| Phase 7 | 고급 기능 | 5일 | |
| **총계** | | **약 30일 (4주+)** | |

### 권장 우선순위 (2026-01-25 재조정)

1. **Phase 0.9**: 즉시 조치 (Konva 업그레이드)
2. **Phase 1-2**: 기초 + UI 구조 (핵심)
3. **Phase 2.5**: 다중 선택 기본 ← **앞으로 이동** (속성 패널 전제조건)
4. **Phase 3**: 속성 패널 (사용성 대폭 향상)
5. **Phase 4**: 레이어 패널 (기능 확장)
6. **Phase 5-6**: 도형/정렬 (기능 확장)
7. **Phase 7**: 고급 기능 (완성도)

---

## Sources

### Figma UI3
- [Figma UI3 Navigation](https://help.figma.com/hc/en-us/articles/23954856027159-Navigating-UI3-Figma-s-new-UI)
- [Figma Left Sidebar](https://help.figma.com/hc/en-us/articles/360039831974-View-layers-and-pages-in-the-left-sidebar)
- [Figma Right Sidebar Properties](https://help.figma.com/hc/en-us/articles/360039832014-Design-prototype-and-explore-layer-properties-in-the-right-sidebar)
- [Figma Toolbar Tools](https://help.figma.com/hc/en-us/articles/360041064174-Access-design-tools-from-the-toolbar)
- [Figma Keyboard Shortcuts](https://help.figma.com/hc/en-us/articles/360040328653-Keyboard-shortcuts-in-Figma)
- [Figma Auto Layout](https://help.figma.com/hc/en-us/articles/360040451373-Explore-auto-layout-properties)

### Konva.js
- [Konva Layer Management](https://konvajs.org/docs/performance/Layer_Management.html)
- [Konva Performance Tips](https://konvajs.org/docs/performance/All_Performance_Tips.html)

### React 19 호환성 (2026-01-25 검증)
- [react-konva GitHub Releases](https://github.com/konvajs/react-konva/releases) - v19 React 19 지원
- [react-konva Next.js 15 이슈 #826](https://github.com/konvajs/react-konva/issues/826)
- [Zustand React 19 Discussion #2686](https://github.com/pmndrs/zustand/discussions/2686) - ✅ 호환
- [Radix UI React 19 이슈 #2900](https://github.com/radix-ui/primitives/issues/2900) - ✅ 호환
- [@dnd-kit React 19 이슈 #1511](https://github.com/clauderic/dnd-kit/issues/1511) - ⚠️ 미해결

### 참조 프로젝트
- [Zustand GitHub](https://github.com/pmndrs/zustand)
- [Penpot GitHub](https://github.com/penpot/penpot)
- [Figma Clone (adrianhajdin)](https://github.com/adrianhajdin/figma_clone)
- [React Image Editor (Konva)](https://github.com/swimmingkiim/react-image-editor)

---

*마지막 업데이트: 2026-01-24*
