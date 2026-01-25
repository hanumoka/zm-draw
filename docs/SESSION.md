# zm-draw 세션 상태

> 최종 업데이트: 2026-01-25 (문서 재검토 완료)

---

## 현재 상태

**Phase**: Phase 0.9 완료 → Phase 1 (기초 리팩토링) 준비
**진행률**: MVP 100% / Phase 0.9 100% / Figma 스타일 0%

### 마지막 작업 (2026-01-25)

- **Phase 0.9: Konva 업그레이드 완료** ✅
  - konva: ^9.3.0 → ^10.0.0 (실제 설치: 10.2.0)
  - 빌드 성공 확인
  - 타입 체크 통과
  - 개발 서버 정상 동작 확인

### 개발 서버

- **상태**: 정상 동작
- **포트**: 3200
- **URL**: http://localhost:3200

### Git 상태

- **브랜치**: main
- **원격**: origin/main (동기화됨)
- **마지막 커밋**: `docs: Fix inconsistencies across documentation files`

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

### Phase 0.9: 즉시 조치 ✅ 완료

| 작업 | 설명 | 상태 |
|------|------|------|
| Konva 업그레이드 | ^9.3.0 → ^10.0.0 (실제: 10.2.0) | ✅ 완료 |
| 문서 정확성 검토 | react-konva/Next.js 이슈 정확 기재 | ✅ 완료 |

### Phase 1: 기초 리팩토링 (다음 단계)

| 작업 | 설명 | 예상 |
|------|------|------|
| Zustand 도입 | useState → Zustand store | 1일 |
| 컴포넌트 분리 | DrawCanvas 990줄 → 모듈화 | 1일 |
| 타입 확장 | Shape, Tool 타입 강화 | 0.5일 |
| useKeyboard 훅 | 키보드 단축키 분리 | 0.5일 |
| **Copy/Paste/Duplicate** | Ctrl+C/V/D 구현 (누락 기능) | 0.5일 |
| **화살표 키 이동** | 1px / Shift 10px | 0.5일 |
| **드래그 레이어 분리** | 성능 최적화 | 0.5일 |

### Phase 2: UI 레이아웃

- EditorLayout (3열 구조)
- LeftPanel, RightPanel 껍데기
- BottomToolbar (Figma UI3 스타일)

### Phase 2.5: 다중 선택 기본 (앞으로 이동)

- Shift+Click 다중 선택
- 드래그 박스 선택
- 다중 선택 시 속성 패널 "N개 선택됨" 표시

### Phase 3-7: 상세 계획

➡️ **docs/FIGMA-STYLE-ROADMAP.md** 참조

### Phase 4 결정사항 ✅

@dnd-kit React 19 호환성 이슈로 대안 결정됨:
- **결정**: HTML5 Drag API 사용
- ~~Option B: Konva zIndex 버튼 조작~~
- ~~Option C: @dnd-kit/react v0.2.1~~

---

## 핵심 기술 결정사항

| 항목 | 현재 | 목표 (Figma 스타일) | 상태 |
|------|------|---------------------|------|
| 상태 관리 | React useState | **Zustand** | ✅ 결정됨 |
| UI 컴포넌트 | 직접 구현 | **Radix UI** | ✅ 결정됨 |
| 컬러 피커 | 없음 | **react-colorful** | 🔶 테스트 필요 |
| 드래그 앤 드롭 | 없음 | **HTML5 Drag API** | ✅ 결정됨 |
| Canvas 라이브러리 | Konva ^10.0.0 (vanilla) | **Konva ^10.0.0 (vanilla)** | ✅ 완료 |
| Copy/Paste | 없음 | **앱 내부 전용** | ✅ 결정됨 |
| Dark Mode | 없음 | **Phase 2 기본 지원** | ✅ 결정됨 |
| UI 레이아웃 | 단일 캔버스 | **3열 패널** | - |
| 컴포넌트 구조 | 단일 파일 (990줄) | **모듈화 (~20 파일)** | - |

---

## 해결된 이슈 기록

| 이슈 | 원인 | 해결책 |
|------|------|--------|
| react-konva + Next.js 15 | canvas 모듈 resolve 실패 | vanilla Konva 사용 (※ react-konva v19는 React 19 지원하나 Next.js App Router 이슈) |
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
