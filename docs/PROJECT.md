# zm-draw 프로젝트 문서

> 최종 업데이트: 2026-01-24

---

## 프로젝트 개요

**zm-draw**는 개발자를 위한 Figma 라이크 다이어그램 에디터 라이브러리입니다.

### 목표

- MIT 라이센스로 npm 배포
- **React 19** / Next.js 15 호환 (핵심)
- ERD, 플로우차트 다이어그램 지원
- 확장 가능한 도형 시스템

### 기술 스택

| 분류 | 기술 | 비고 |
|------|------|------|
| **코어** | Konva.js (vanilla) | react-konva는 React 19 미지원 |
| **프레임워크** | React 19, Next.js 15 | App Router |
| **언어** | TypeScript 5.7+ | strict mode |
| **빌드** | tsup, Turbo | ESM only |
| **패키지 관리** | pnpm workspaces | |

---

## 아키텍처

### 레이어 구조 (Konva)

```
Konva.Stage
├── Layer 0: Background (배경색)
├── Layer 1: Grid (그리드 라인, listening: false)
├── Layer 2: Connectors (화살표/연결선)
├── Layer 3: Shapes (도형 + 텍스트 그룹)
└── Layer 4: Selection (Transformer)
```

### 도형 그룹 구조

```
Konva.Group (draggable)
├── Konva.Rect/Ellipse/RegularPolygon (도형)
└── Konva.Text (텍스트 라벨, listening: false)
```

### 상태 관리

```typescript
// React useState로 관리
const [shapes, setShapes] = useState<Shape[]>([]);
const [connectors, setConnectors] = useState<Connector[]>([]);
const [selectedId, setSelectedId] = useState<string | null>(null);
const [tool, setTool] = useState<ToolType>('select');
const [scale, setScale] = useState(1);
const [editingId, setEditingId] = useState<string | null>(null);

// History는 useRef로 관리 (렌더링 최적화)
const historyRef = useRef<HistoryState[]>([]);
const [historyIndex, setHistoryIndex] = useState(-1);
```

---

## 타입 정의

### Shape

```typescript
export type ShapeType = 'rectangle' | 'ellipse' | 'diamond' | 'text';
export type ToolType = 'select' | 'connector' | ShapeType;

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

### Connector

```typescript
export interface Connector {
  id: string;
  fromShapeId: string;
  toShapeId: string;
  stroke: string;
  strokeWidth: number;
  arrow: boolean;
}
```

### Canvas State (Save/Load 포맷)

```typescript
interface CanvasData {
  version: '1.0';
  shapes: Shape[];
  connectors: Connector[];
}
```

---

## 프로젝트 구조

```
zm-draw/
├── docs/                       # 문서 (Claude 필독)
│   ├── SESSION.md             # 세션 상태 ⭐
│   ├── PROGRESS.md            # 진행상황
│   └── PROJECT.md             # 이 파일
│
├── packages/
│   ├── core/                   # @zm-draw/core
│   │   └── src/
│   │       └── index.ts       # 타입 export
│   │
│   └── react/                  # @zm-draw/react
│       └── src/
│           ├── components/
│           │   ├── DrawCanvas.tsx  # 메인 컴포넌트 (990 lines)
│           │   └── index.ts
│           ├── hooks/
│           ├── context/
│           ├── types.ts       # Shape, Connector 타입
│           └── index.ts
│
├── apps/
│   └── demo/                   # Next.js 15 데모
│       └── src/app/
│           ├── page.tsx       # 데모 페이지
│           └── layout.tsx
│
├── package.json               # 루트 워크스페이스
├── turbo.json                 # Turbo 설정
├── pnpm-workspace.yaml
└── CLAUDE.md                  # Claude Code 가이드
```

---

## 핵심 컴포넌트: DrawCanvas

### Props

```typescript
export interface DrawCanvasProps {
  width?: number;              // default: 800
  height?: number;             // default: 600
  backgroundColor?: string;    // default: '#ffffff'
  showGrid?: boolean;          // default: true
  gridSize?: number;           // default: 20
  initialShapes?: Shape[];
  onShapesChange?: (shapes: Shape[]) => void;
  onReady?: (stage: Konva.Stage) => void;
}
```

### 사용 예시

```tsx
'use client';
import { DrawCanvas } from '@zm-draw/react';

export default function DiagramEditor() {
  return (
    <DrawCanvas
      width={1200}
      height={800}
      showGrid={true}
      onShapesChange={(shapes) => console.log(shapes)}
    />
  );
}
```

---

## 개발 명령어

```bash
# 의존성 설치
pnpm install

# 개발 서버 시작 (demo: 3200, packages watch)
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
- **Next.js 15**: https://nextjs.org/docs

### 주의사항

- **react-konva 사용 불가**: React 19와 호환되지 않음
- **vanilla Konva 사용**: useRef + useEffect 패턴으로 직접 관리
- **Server Component 주의**: DrawCanvas는 'use client' 필수

---

## 배포 계획

### npm 패키지

| 패키지 | 상태 | npm 이름 |
|--------|------|----------|
| core | MVP 완료 | @zm-draw/core |
| react | MVP 완료 | @zm-draw/react |

### 배포 전 체크리스트

- [ ] README.md 작성
- [ ] CHANGELOG.md 작성
- [ ] API 문서 작성
- [ ] 사용 예제 추가
- [ ] 테스트 작성
- [ ] npm 계정 설정

---

*마지막 업데이트: 2026-01-24*
