# Figma 스타일 커넥터 구현 계획

> **상태**: 다음 할 일 (미착수)
> **우선순위**: 높음
> **예상 영향 범위**: `DrawCanvas.tsx`, `toolStore.ts`, overlay layer

---

## 1. 현재 상태 분석

### 현재 구현 (click-click 방식)

```
1. 커넥터 도구 선택
2. 소스 도형 클릭 → connectingFrom 설정
3. 대상 도형 클릭 → addConnector(from, to) 호출
4. 커넥터 생성 완료
```

**문제점**:
- 첫 번째 클릭 후 아무런 시각적 피드백이 없음
- 사용자가 "지금 연결 중"인 상태를 인지하기 어려움
- Figma 사용자에게 비직관적

### 관련 코드 위치

| 파일 | 라인 | 역할 |
|------|------|------|
| `DrawCanvas.tsx` | 805-850 | `addConnector` 함수 |
| `DrawCanvas.tsx` | 1848-1858 | 도형 클릭 시 커넥터 로직 |
| `DrawCanvas.tsx` | 4015-4074 | 연결점(connection points) 렌더링 |
| `DrawCanvas.tsx` | 4128-4153 | 스테이지 클릭 핸들러 |
| `DrawCanvas.tsx` | 2598-2693 | `renderConnectors` 함수 |
| `DrawCanvas.tsx` | 851-855 | `connectingFromRef` / `addConnectorRef` |
| `toolStore.ts` | - | `connectingFrom`, `setConnectingFrom` |

---

## 2. Figma 커넥터 동작 방식 (FigJam)

### 핵심 인터랙션 흐름

```
1. 커넥터 도구 선택 (또는 도형 호버 시 연결점 표시)
2. 연결점 또는 도형 위에서 mousedown → 드래그 시작
3. mousemove → 실시간 프리뷰 라인이 커서를 따라감
4. 대상 도형 호버 → 가장 가까운 연결점에 스냅 + 하이라이트
5. mouseup on 대상 도형 → 커넥터 확정 생성
6. mouseup on 빈 공간 → 취소 (또는 미연결 끝점 생성)
7. 커넥터 도구 유지 (V/Esc로 전환)
```

### 주요 특징

| 기능 | 설명 |
|------|------|
| **드래그 기반 생성** | 클릭-클릭이 아닌 mousedown→drag→mouseup |
| **실시간 프리뷰 라인** | 드래그 중 소스 연결점 → 커서 위치까지 라인 표시 |
| **대상 스냅** | 대상 도형 근처에서 가장 가까운 연결점에 자동 스냅 |
| **소스 하이라이트** | 드래그 시작한 도형/연결점 시각적 강조 |
| **대상 하이라이트** | 드래그 중 대상 도형 위 호버 시 하이라이트 |
| **커서 변경** | 연결점 호버 시 pointer, 드래그 중 crosshair |
| **Hover Zone** | 4방향 연결점 + 가장자리 + 내부 영역 감지 |

### 참고 자료

- [Create diagrams and flows with connectors in FigJam](https://help.figma.com/hc/en-us/articles/1500004414542-Create-diagrams-and-flows-with-connectors-in-FigJam)
- [Custom connection points on shapes in FigJam](https://forum.figma.com/suggest-a-feature-11/launched-custom-connection-points-on-shapes-in-figjam-36105)

---

## 3. 구현 계획

### Step 1: 드래그 기반 커넥터 생성

**목표**: click-click → mousedown-drag-mouseup 전환

**변경 사항**:

1. **toolStore 상태 추가**:
   ```ts
   // 기존
   connectingFrom: string | null

   // 추가
   connectingFromPoint: 'top' | 'right' | 'bottom' | 'left' | 'auto' | null
   isDraggingConnector: boolean
   dragPreviewEnd: { x: number; y: number } | null
   ```

2. **도형/연결점에서 mousedown 핸들러**:
   - 연결점 원 또는 도형에서 mousedown → 드래그 시작
   - `connectingFrom = shape.id`, `isDraggingConnector = true`
   - 기존 click 핸들러 → mousedown으로 변경

3. **stage mousemove 핸들러**:
   - `isDraggingConnector === true` 일 때 커서 위치 추적
   - `dragPreviewEnd` 업데이트

4. **stage mouseup 핸들러**:
   - 대상 도형 위 → `addConnector(from, to)` 호출
   - 빈 공간 → 드래그 취소, 상태 초기화
   - `isDraggingConnector = false`

**주의점**:
- 기존 도형 드래그(이동)와 충돌하지 않도록 해야 함
- 커넥터 모드(`tool === 'connector'`)에서만 드래그 커넥터 동작

---

### Step 2: 실시간 프리뷰 라인

**목표**: 드래그 중 소스→커서까지 라인 표시

**변경 사항**:

1. **프리뷰 라인 렌더링** (overlay layer 활용):
   ```ts
   // overlayLayer (guidesGroup 또는 새 그룹)에 임시 Konva.Arrow 렌더링
   const previewLine = new Konva.Arrow({
     points: [fromX, fromY, cursorX, cursorY],
     stroke: '#3b82f6',
     strokeWidth: 2,
     dash: [6, 4],
     pointerLength: 8,
     pointerWidth: 6,
     opacity: 0.7,
   });
   ```

2. **useEffect로 프리뷰 업데이트**:
   - `isDraggingConnector`, `dragPreviewEnd` 변경 시 프리뷰 라인 갱신
   - 드래그 종료 시 프리뷰 라인 제거

3. **성능 고려**:
   - mousemove는 매우 자주 발생 → `requestAnimationFrame` 또는 throttle 적용
   - 프리뷰 라인은 단일 Konva.Arrow 인스턴스를 재사용 (매 프레임 destroy/create 방지)
   - ref로 프리뷰 라인 인스턴스 관리

---

### Step 3: 대상 스냅 + 시각적 피드백

**목표**: 대상 도형 근처에서 연결점 스냅 + 하이라이트

**변경 사항**:

1. **스냅 로직**:
   ```ts
   // mousemove에서 커서 위치와 가장 가까운 도형/연결점 탐색
   function findSnapTarget(cursorPos: {x: number, y: number}, shapes: Shape[]) {
     const SNAP_DISTANCE = 30; // px (캔버스 좌표 기준)
     let closestShape: Shape | null = null;
     let closestPoint: 'top' | 'right' | 'bottom' | 'left' = 'top';
     let minDistance = SNAP_DISTANCE;

     for (const shape of shapes) {
       if (shape.id === connectingFrom) continue; // 소스 제외
       const points = getConnectionPoints(shape);
       for (const [pos, pt] of Object.entries(points)) {
         const dist = Math.hypot(cursorPos.x - pt.x, cursorPos.y - pt.y);
         if (dist < minDistance) {
           minDistance = dist;
           closestShape = shape;
           closestPoint = pos;
         }
       }
     }
     return { shape: closestShape, point: closestPoint };
   }
   ```

2. **스냅 시 프리뷰 라인 끝점 변경**:
   - 스냅 대상이 있으면 → 프리뷰 라인 끝점을 연결점 좌표로 설정
   - 스냅 대상이 없으면 → 커서 위치 그대로

3. **시각적 피드백**:
   - 스냅 대상 도형: 파란 테두리 하이라이트
   - 스냅 대상 연결점: 원 크기 확대 + 색상 변경
   - 소스 도형: 연결 시작점에 강조 원 표시

---

### Step 4: 커서 + UX 개선

**목표**: 커서 변경, 소스 하이라이트, 기타 UX

1. **커서 변경**:
   - 커넥터 모드 기본: `crosshair`
   - 연결점 호버: `pointer`
   - 드래그 중: `crosshair` 또는 `grabbing`

2. **소스 도형 하이라이트**:
   - 드래그 시작 시 소스 도형에 파란 테두리 추가
   - 드래그 종료 시 제거

3. **ESC로 드래그 취소**:
   - 드래그 중 ESC 키 → 프리뷰 라인 제거, 상태 초기화

---

## 4. 기존 코드와의 호환성

### 제거해야 할 코드
- 도형 클릭 시 `connectingFrom` 설정하는 click 핸들러 (mousedown으로 대체)
- 대상 도형 클릭 시 `addConnector` 호출하는 click 핸들러 (mouseup으로 대체)

### 유지해야 할 코드
- `addConnector` 함수 자체 (커넥터 생성 로직)
- `renderConnectors` 함수 (기존 커넥터 렌더링)
- 연결점 호버 시 원 표시 (`connectionPointsGroup`)
- 커넥터 클릭 시 선택 (`selectConnector`)

### 새로 추가해야 할 것
- 프리뷰 라인 ref (`previewLineRef`)
- 드래그 상태 관리 (toolStore 또는 로컬 state)
- 스냅 탐색 함수 (`findSnapTarget`)
- 소스/대상 하이라이트 렌더링

---

## 5. 구현 순서 요약

```
Step 1: 드래그 기반 생성 (click-click → drag)          ← 핵심 변경
Step 2: 실시간 프리뷰 라인                              ← 시각적 피드백
Step 3: 대상 스냅 + 하이라이트                          ← UX 완성도
Step 4: 커서 + 소스 하이라이트 + ESC 취소               ← 마무리
```

각 Step은 독립적으로 테스트 가능하며, Step 1이 완료되면 기본적인 Figma 스타일 동작이 작동합니다.

---

*작성일: 2026-02-07*
*관련 Phase: 커넥터 UX 개선*
