# zm-draw 세션 상태

> 최종 업데이트: 2026-01-25 (커넥터 분석 및 고도화 계획 추가)

---

## 현재 상태

**Phase**: Phase 1 (기초 리팩토링) 90% 완료 → Phase 1.5 (커넥터 수정) 예정
**진행률**: MVP 100% / Phase 1 90% / Figma 스타일 5%

### 마지막 작업 (2026-01-25)

- **커넥터 문제 분석 완료** ✅
  - 화살촉 가려짐: 중심→중심 연결 + 레이어 순서 문제
  - 커넥터 선택 불가: 클릭 이벤트 없음
  - Figma/Excalidraw/Draw.io 비교 분석 완료
  - Phase 1.5, 3.5, 5.5 커넥터 고도화 계획 수립

- **Phase 1: 기초 리팩토링 90% 완료** ✅
  - Zustand stores 마이그레이션 (tool, selection, viewport)
  - 컴포넌트 분리 (Toolbar, TextEditor)
  - useKeyboard 훅 통합
  - 타입 확장 완료

- **Dark Mode + Right Panel** ✅
- **Phase 0.9: Konva 업그레이드** ✅

### 개발 서버

- **상태**: 정상 동작
- **포트**: 3200
- **URL**: http://localhost:3200

### Git 상태

- **브랜치**: main
- **원격**: origin/main (동기화됨)
- **마지막 커밋**: `d83e864 docs: Update SESSION.md with Zustand migration progress`

---

## 커넥터 문제점 (긴급)

### 발견된 문제

```
현재 상태:
┌─────────────┐      ┌─────────────┐
│   도형 A    │      │   도형 B    │
│      ●──────────────────>●      │  ← 화살촉이 도형 내부에!
└─────────────┘      └─────────────┘

개선 후:
┌─────────────┐      ┌─────────────┐
│   도형 A    │──────>│   도형 B    │  ← 화살촉이 도형 외곽에
└─────────────┘      └─────────────┘
```

| 문제 | 원인 | 해결 Phase |
|------|------|-----------|
| 화살촉 가려짐 | 중심→중심 연결 | Phase 1.5 |
| 레이어 순서 | 커넥터가 도형 아래 | Phase 1.5 |
| 선택 불가 | 클릭 이벤트 없음 | Phase 1.5 |
| 라우팅 없음 | 직선만 지원 | Phase 3.5 |

---

## 다음 작업: Phase 1.5 (커넥터 기초 수정)

### 우선순위 1: 화살촉 위치 수정

```typescript
// 현재 코드 (문제)
const from = getShapeCenter(fromShape);  // 도형 중심
const to = getShapeCenter(toShape);      // 도형 중심
points: [from.x, from.y, to.x, to.y]

// 개선 코드
const from = getShapeEdgePoint(fromShape, toCenter);  // 도형 외곽
const to = getShapeEdgePoint(toShape, fromCenter);    // 도형 외곽
```

### 우선순위 2: 커넥터 선택 가능

- 클릭 이벤트 추가
- 선택 시 하이라이트
- Delete 키로 삭제

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
| 커넥터 선택 | ✅ | ✅ | ✅ | ❌ |
| 화살촉 위치 | 도형 외곽 | 도형 외곽 | 커스텀 | **도형 내부** |
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
| 커넥터/화살표 | ⚠️ 문제 있음 | 20% |
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
| UI 컴포넌트 | 직접 구현 | Radix UI | 🔶 예정 |
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
