# zm-draw 세션 상태

> 최종 업데이트: 2026-01-24 22:00

---

## 현재 상태

**Phase**: MVP 완료 → Figma 스타일 리팩토링 준비
**진행률**: MVP 100% / Figma 스타일 0%

### 마지막 작업 (2026-01-24)

- 도형 리사이즈 버그 수정 완료
- **Figma 스타일 구현 로드맵 작성 완료** (FIGMA-STYLE-ROADMAP.md)
- 7 Phase, 약 28일 개발 계획 수립

### 개발 서버

- **상태**: 정상 동작
- **포트**: 3200
- **URL**: http://localhost:3200

### Git 상태

- **브랜치**: main
- **원격**: origin/main (동기화됨)
- **마지막 커밋**: `docs: Add comprehensive Figma-style implementation roadmap`

---

## 구현 완료된 기능 (MVP)

| 기능 | 상태 | Figma 대비 |
|------|------|-----------|
| 도형 생성 (Rect, Ellipse, Diamond) | ✅ 완료 | 30% |
| 도형 선택/삭제/이동 | ✅ 완료 | 100% |
| 리사이즈/회전 | ✅ 완료 | 100% |
| 텍스트 편집 (도형 내) | ✅ 완료 | 30% |
| 커넥터/화살표 | ✅ 완료 | 50% |
| 줌/팬 | ✅ 완료 | 100% |
| Undo/Redo | ✅ 완료 | 100% |
| Save/Load (JSON) | ✅ 완료 | 100% |

---

## Figma 스타일 대비 미구현 (핵심)

| 영역 | 상태 | 우선순위 |
|------|------|----------|
| **UI 레이아웃** (3열 패널) | ❌ 0% | Phase 2 |
| **속성 패널** (Fill, Stroke, Size) | ❌ 0% | Phase 3 |
| **레이어 패널** (트리뷰) | ❌ 0% | Phase 4 |
| **다중 선택** | ❌ 0% | Phase 6 |
| **정렬/분배** | ❌ 0% | Phase 6 |
| **상태 관리** (Zustand) | ❌ 0% | Phase 1 |

---

## 다음 작업 (Figma 스타일 로드맵)

### Phase 1: 기초 리팩토링 (다음 단계) ⭐

| 작업 | 설명 | 예상 |
|------|------|------|
| Zustand 도입 | useState → Zustand store | 1일 |
| 컴포넌트 분리 | DrawCanvas 990줄 → 모듈화 | 1일 |
| 타입 확장 | Shape, Tool 타입 강화 | 0.5일 |
| useKeyboard 훅 | 키보드 단축키 분리 | 0.5일 |

### Phase 2: UI 레이아웃

- EditorLayout (3열 구조)
- LeftPanel, RightPanel 껍데기
- BottomToolbar (Figma UI3 스타일)

### Phase 3-7: 상세 계획

➡️ **docs/FIGMA-STYLE-ROADMAP.md** 참조

---

## 핵심 기술 결정사항

| 항목 | 현재 | 목표 (Figma 스타일) |
|------|------|---------------------|
| 상태 관리 | React useState | **Zustand** |
| UI 레이아웃 | 단일 캔버스 | **3열 패널** |
| 컴포넌트 구조 | 단일 파일 (990줄) | **모듈화 (~20 파일)** |
| 속성 편집 | 고정값 | **속성 패널** |

---

## 해결된 이슈 기록

| 이슈 | 원인 | 해결책 |
|------|------|--------|
| react-konva React 19 미지원 | ReactCurrentOwner 오류 | vanilla Konva |
| Transformer 충돌 | destroyChildren() | 별도 레이어 |
| 텍스트 입력 안보임 | 같은 색 | color 지정 |
| Backspace로 도형 삭제 | INPUT 미체크 | tagName 체크 |
| 텍스트 드래그 지연 | 별도 Text | Konva.Group |
| Ctrl+Shift+Z 미동작 | 대소문자 | toLowerCase() |
| 리사이즈 시 작아짐 | node.width() bbox | s.width * scale |

---

## 참고 문서

- **Figma 스타일 로드맵**: `docs/FIGMA-STYLE-ROADMAP.md`
- **진행상황**: `docs/PROGRESS.md`
- **프로젝트 구조**: `docs/PROJECT.md`

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

*다음 세션 시작 시 이 파일을 먼저 읽으세요.*
