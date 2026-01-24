# zm-draw 프로젝트 문서

> 최종 업데이트: 2026-01-24

---

## 프로젝트 개요

**zm-draw**는 Figma 스타일의 다이어그램 에디터 라이브러리입니다.

### 목표

- MIT 라이센스로 npm 배포
- **React 19** / Next.js 15 호환
- **Figma 스타일 UI** (3열 패널, 속성 패널, 레이어 패널)
- ERD, 플로우차트 다이어그램 지원

### 기술 스택

| 분류 | 현재 | 목표 (Figma 스타일) |
|------|------|---------------------|
| **코어** | Konva.js (vanilla) | Konva.js |
| **상태 관리** | React useState | **Zustand** |
| **프레임워크** | React 19, Next.js 15 | React 19, Next.js 15 |
| **UI 컴포넌트** | 직접 구현 | **Radix UI** |
| **빌드** | tsup, Turbo | tsup, Turbo |

---

## 아키텍처

### 현재 구조 (MVP)

```
┌──────────────────────────────────────┐
│          Toolbar (상단)              │
├──────────────────────────────────────┤
│                                      │
│            Canvas                    │
│        (단일 컴포넌트)                │
│                                      │
└──────────────────────────────────────┘
```

### 목표 구조 (Figma 스타일)

```
┌──────────────────────────────────────────────┐
│           Navigation Bar                     │
├──────────┬─────────────────┬─────────────────┤
│          │                 │                 │
│  Left    │                 │   Right Panel   │
│  Panel   │     Canvas      │   ───────────   │
│ ──────── │                 │   Position      │
│  Pages   │                 │   Size          │
│ ──────── │                 │   Fill          │
│  Layers  │                 │   Stroke        │
│          │                 │   Effects       │
│          │                 │                 │
├──────────┴─────────────────┴─────────────────┤
│           Bottom Toolbar (도구)              │
└──────────────────────────────────────────────┘
```

### Konva 레이어 구조

```
Konva.Stage
├── Layer 0: Background (배경색, listening: false)
├── Layer 1: Grid (그리드 라인, listening: false)
├── Layer 2: Connectors (화살표/연결선)
├── Layer 3: Shapes (도형 + 텍스트 그룹)
└── Layer 4: Selection (Transformer)
```

---

## 상태 관리 아키텍처

### 현재 (React useState)

```typescript
// 단일 컴포넌트 내 useState
const [shapes, setShapes] = useState<Shape[]>([]);
const [connectors, setConnectors] = useState<Connector[]>([]);
const [selectedId, setSelectedId] = useState<string | null>(null);
const [tool, setTool] = useState<ToolType>('select');
```

### 목표 (Zustand)

```typescript
// stores/canvasStore.ts
interface CanvasStore {
  // 데이터
  shapes: Shape[];
  connectors: Connector[];
  pages: Page[];

  // 선택
  selectedIds: string[];  // 다중 선택 지원
  hoveredId: string | null;

  // 액션
  addShape: (shape: Shape) => void;
  updateShape: (id: string, updates: Partial<Shape>) => void;
  deleteShapes: (ids: string[]) => void;
  setSelection: (ids: string[]) => void;
}

// stores/uiStore.ts
interface UIStore {
  tool: ToolType;
  viewport: { x: number; y: number; zoom: number };
  panels: {
    left: { open: boolean; width: number };
    right: { open: boolean; width: number };
  };
}

// stores/historyStore.ts
interface HistoryStore {
  past: CanvasState[];
  future: CanvasState[];
  undo: () => void;
  redo: () => void;
}
```

---

## 타입 정의

### Shape (현재)

```typescript
export type ShapeType = 'rectangle' | 'ellipse' | 'diamond' | 'text';

export interface Shape {
  id: string;
  type: ShapeType;
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
  rotation?: number;
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  textColor?: string;
}
```

### Shape (목표 - 확장)

```typescript
export type ShapeType =
  | 'rectangle' | 'ellipse' | 'diamond'
  | 'line' | 'polygon' | 'star'
  | 'text' | 'frame' | 'image';

export interface Shape {
  id: string;
  type: ShapeType;
  name: string;           // 레이어 이름

  // 위치/크기
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;

  // 스타일
  fill: string;
  fillOpacity: number;
  stroke: string;
  strokeWidth: number;
  strokeOpacity: number;
  cornerRadius: number;

  // 텍스트
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: number;
  textColor?: string;
  textAlign?: 'left' | 'center' | 'right';

  // 상태
  locked: boolean;
  visible: boolean;

  // 계층
  parentId?: string;      // Frame의 자식인 경우
  children?: string[];    // Frame인 경우
}
```

---

## 프로젝트 구조

### 현재 구조

```
zm-draw/
├── packages/
│   ├── core/
│   │   └── src/index.ts
│   └── react/
│       └── src/
│           ├── components/
│           │   └── DrawCanvas.tsx  # 990줄 단일 파일
│           ├── types.ts
│           └── index.ts
└── apps/demo/
```

### 목표 구조 (모듈화)

```
zm-draw/
├── packages/
│   ├── core/                       # @zm-draw/core
│   │   └── src/
│   │       ├── types/
│   │       │   ├── shape.ts
│   │       │   ├── connector.ts
│   │       │   └── tool.ts
│   │       └── index.ts
│   │
│   └── react/                      # @zm-draw/react
│       └── src/
│           ├── components/
│           │   ├── DrawEditor.tsx         # 메인 에디터
│           │   ├── Canvas/
│           │   │   ├── Canvas.tsx         # Konva Stage
│           │   │   ├── ShapeRenderer.tsx
│           │   │   ├── ConnectorRenderer.tsx
│           │   │   └── GridLayer.tsx
│           │   ├── Panels/
│           │   │   ├── LeftPanel/
│           │   │   │   ├── PagesList.tsx
│           │   │   │   └── LayersTree.tsx
│           │   │   └── RightPanel/
│           │   │       ├── DesignTab.tsx
│           │   │       └── sections/
│           │   │           ├── PositionSection.tsx
│           │   │           ├── FillSection.tsx
│           │   │           └── StrokeSection.tsx
│           │   ├── Toolbar/
│           │   │   ├── BottomToolbar.tsx
│           │   │   └── ToolButton.tsx
│           │   └── common/
│           │       ├── ColorPicker.tsx
│           │       └── NumberInput.tsx
│           ├── stores/
│           │   ├── canvasStore.ts
│           │   ├── uiStore.ts
│           │   └── historyStore.ts
│           ├── hooks/
│           │   ├── useCanvas.ts
│           │   ├── useSelection.ts
│           │   ├── useKeyboard.ts
│           │   └── useHistory.ts
│           └── index.ts
│
└── apps/demo/
```

---

## 핵심 컴포넌트 API

### DrawEditor (목표)

```tsx
import { DrawEditor } from '@zm-draw/react';

<DrawEditor
  width={1200}
  height={800}

  // 초기 데이터
  initialShapes={[]}
  initialConnectors={[]}

  // 콜백
  onShapesChange={(shapes) => {}}
  onSelectionChange={(ids) => {}}
  onSave={(data) => {}}

  // UI 옵션
  showGrid={true}
  showLeftPanel={true}
  showRightPanel={true}

  // 테마
  theme="light" // 'light' | 'dark'
/>
```

### DrawCanvas (현재)

```tsx
import { DrawCanvas } from '@zm-draw/react';

<DrawCanvas
  width={800}
  height={600}
  backgroundColor="#ffffff"
  showGrid={true}
  gridSize={20}
  initialShapes={[]}
  onShapesChange={(shapes) => {}}
  onReady={(stage) => {}}
/>
```

---

## 개발 명령어

```bash
# 의존성 설치
pnpm install

# 개발 서버 시작 (demo: 3200)
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
- **Zustand**: https://github.com/pmndrs/zustand
- **Radix UI**: https://www.radix-ui.com/

### 참조 프로젝트
- **Penpot**: https://github.com/penpot/penpot
- **Figma Clone**: https://github.com/adrianhajdin/figma_clone

### 프로젝트 문서
- **상세 로드맵**: `docs/FIGMA-STYLE-ROADMAP.md`
- **진행상황**: `docs/PROGRESS.md`
- **세션 상태**: `docs/SESSION.md`

---

## 주의사항

- **react-konva 사용 불가**: React 19와 호환되지 않음
- **vanilla Konva 사용**: useRef + useEffect 패턴
- **Server Component 주의**: 'use client' 필수

---

*마지막 업데이트: 2026-01-24*
