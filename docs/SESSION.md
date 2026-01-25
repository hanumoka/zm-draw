# zm-draw 세션 상태

> 최종 업데이트: 2026-01-25 (Figma UI 분석 완료 + UI 변경)

---

## 현재 상태

**Phase**: Phase 2 (UI 레이아웃) 완료 → Phase 2.5 준비
**진행률**: MVP 100% / Phase 1 90% / Phase 1.5 100% / Phase 2 95% / Figma 스타일 45%

### 마지막 작업 (2026-01-25)

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
- **원격**: origin/main (동기화됨)
- **마지막 커밋**: `1e5695b docs: Fix inconsistencies across documentation files`

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

## 다음 작업: Phase 2.5 (속성 패널 기본)

### 목표: 속성 패널 편집 기능 + 선택 컨텍스트 메뉴

```
┌─────────────────────────────┐
│ Design                      │
├─────────────────────────────┤
│ Position                    │
│ X [120]  →  편집 가능!      │
│ Y [80]   →  편집 가능!      │
├─────────────────────────────┤
│ Size                        │
│ W [100]  →  편집 가능!      │
│ H [60]   →  편집 가능!      │
├─────────────────────────────┤
│ Rotation                    │
│ R [0°]   →  편집 가능!      │
└─────────────────────────────┘
```

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

### Phase 2.5 체크리스트 (다음 단계)

- [ ] Position 편집 (X, Y) - 속성 패널
- [ ] Size 편집 (W, H) - 속성 패널
- [ ] Rotation 편집 - 속성 패널
- [ ] 선택 컨텍스트 메뉴 (도형 위 미니 툴바)

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
| UI 컴포넌트 | Radix UI (일부) | Radix UI | 🔄 진행 중 |
| 컬러 피커 | 없음 | react-colorful | 🔶 예정 |
| Canvas 라이브러리 | Konva 10.2.0 | Konva 10.x | ✅ 완료 |
| Copy/Paste | 앱 내부 전용 | 앱 내부 전용 | ✅ 완료 |

---

## 해결된 이슈 기록

| 이슈 | 원인 | 해결책 |
|------|------|--------|
| react-konva + Next.js 15 | canvas 모듈 resolve 실패 | vanilla Konva 사용 |
| Transformer 충돌 | destroyChildren() | 별도 레이어 |
| 리사이즈 시 작아짐 | node.width() bbox | s.width * scale |
| Ctrl+Shift+Z 미동작 | 대소문자 | toLowerCase() |

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
