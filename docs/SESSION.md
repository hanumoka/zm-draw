# zm-draw 세션 상태

> 최종 업데이트: 2026-01-29 (Phase 10 스탬프 기능 완료)

---

## 현재 상태

**Phase**: **Phase 10 완료** ✅ (스탬프 기능)
**목표**: FigJam 스타일 실시간 협업 화이트보드
**진행률**: Phase 1-10 완료 / Phase 11-17 예정

### 마지막 작업 (2026-01-29)

- **Phase 10: 스탬프 기능** ✅ 완료
  - **스탬프 도형** 구현 ✅
    - `stamp` 도형 타입 추가
    - `StampType`: thumbsUp, thumbsDown, heart, star, check, question, exclamation, celebration
    - `STAMP_EMOJIS` 상수 (이모지 매핑)
    - Shape에 `stampType` 속성 추가
    - `defaultStampProps` 기본 속성
  - **스탬프 렌더링** ✅
    - Konva.Text 기반 이모지 렌더링
    - SVG export 지원
  - **툴바 UI** ✅
    - 스탬프 버튼 + 팝오버 선택기 (8가지 이모지)
    - 현재 선택된 스탬프 표시
  - **단축키** ✅
    - 숫자 1-8: 스탬프 빠른 선택 및 추가
  - **Store 확장** ✅
    - `toolStore`: currentStampType, setStampType

- **Phase 9: 이미지 기능** ✅ 완료
  - **이미지 도형** 구현 ✅
    - `image` 도형 타입 추가
    - Shape에 `src`, `naturalWidth`, `naturalHeight`, `preserveAspectRatio` 속성 추가
    - `defaultImageShapeProps` 기본 속성
    - 이미지 캐싱 (`imageCache` Map)
    - Konva.Image 렌더링
    - 비율 유지 Transformer
  - **드래그앤드롭** 구현 ✅
    - 캔버스에 이미지 파일 드롭
    - 드롭 위치에 이미지 삽입
  - **클립보드 붙여넣기** 구현 ✅
    - Ctrl+V로 클립보드 이미지 붙여넣기
    - 뷰포트 중앙에 삽입
  - **툴바 버튼** 추가 ✅
    - Image 버튼 (단축키: I)
    - 파일 선택 다이얼로그
  - **Export 지원** ✅
    - SVG export에 이미지 포함

### 이전 작업 (2026-01-28)

- **Phase 8: 스티키 노트 + 펜 도구** ✅
  - **스티키 노트** 구현 ✅
    - `sticky` 도형 타입 추가
    - 6가지 색상 프리셋 (yellow, pink, blue, green, purple, orange)
    - 150x150 기본 크기, 그림자 효과
    - 텍스트 자동 편집 모드 (더블클릭)
    - 색상 선택 UI (좌측 패널)
    - 단축키 S
  - **펜 도구** 구현 ✅
    - `freedraw` 도형 타입 추가
    - 펜 (P): 2px, 부드러운 곡선
    - 마커 (M): 8px
    - 하이라이터 (H): 20px, opacity 0.5
    - 지우개 (E): freedraw 도형 삭제
  - **타입 시스템 확장** ✅
    - `StickyNoteColor`, `DrawingToolType` 타입
    - `STICKY_COLORS` 상수
    - `FreeDrawPoint` 인터페이스
    - Shape에 `points`, `stickyColor`, `lineCap`, `author` 속성 추가
  - **Store 확장** ✅
    - `toolStore`: isDrawing, currentStrokeWidth/Color/Opacity, currentStickyColor
    - `canvasStore`: defaultStickyNoteProps, defaultFreeDrawProps
  - **UI 추가** ✅
    - 좌측 패널에 FigJam 섹션 추가
    - 스티키 노트 색상 선택 버튼
    - 펜/마커/하이라이터/지우개 버튼
    - 키보드 단축키 (S, P, M, H, E)

### 이전 작업 (2026-01-28)

- **미니맵 구현** ✅
- **Phase 7: Zoom Controls** ✅
- **Phase 7: Grid Snap** ✅
- **Phase 7: Smart Guides** ✅
- **Phase 7: PNG/SVG Export** ✅
- **Phase 6: 정렬/분배/그룹핑** ✅
- **Phase 5: 독립 텍스트 도형** ✅
- **Phase 4: 레이어 패널 완료** ✅
- **Phase 3.5: 커넥터 고급 기능** ✅
- **Phase 2.6: 다중 선택** ✅
- **Phase 2.5: 속성 패널** ✅

### 개발 서버

- **상태**: 정상 동작
- **포트**: 3200
- **URL**: http://localhost:3200

### Git 상태

- **브랜치**: main
- **원격**: origin/main
- **마지막 커밋**: `d2f3e32 docs: Add FigJam-style collaborative whiteboard roadmap`

---

## Phase 8 완료 ✅

### 스티키 노트
```
┌─────────────────────┐
│  ┌───────────────┐  │
│  │    Yellow     │  │  ← 6가지 색상 선택
│  │   Sticky      │  │  ← 150x150 기본 크기
│  │    Note       │  │  ← 그림자 효과
│  └───────────────┘  │
└─────────────────────┘
```

### 펜 도구
| 도구 | 두께 | 투명도 | lineCap | 단축키 |
|------|------|--------|---------|--------|
| Pen | 2px | 1.0 | round | P |
| Marker | 8px | 1.0 | round | M |
| Highlighter | 20px | 0.5 | square | H |
| Eraser | - | - | - | E |

---

## Phase 9: 이미지 기능 🔄 진행 중

### 구현 완료 ✅

**이미지 삽입:**
- [x] 이미지 도형 타입 (`image`) 추가
- [x] `src`, `naturalWidth`, `naturalHeight`, `preserveAspectRatio` 속성
- [x] Konva.Image 렌더링 + 이미지 캐싱
- [x] 드래그앤드롭 업로드
- [x] 클립보드 붙여넣기 (Ctrl+V)
- [x] 툴바 버튼 (I 단축키) + 파일 선택 다이얼로그
- [x] 이미지 리사이즈 (비율 유지)
- [x] SVG export 지원

### 남은 작업 (선택적)

**미디어:**
- [ ] 웹 링크 임베드
- [ ] 외부 리소스 미리보기 (OG 메타데이터)

### 이후 로드맵 (예상 9주)

| Phase | 내용 | 기간 |
|-------|------|------|
| ~~8~~ | ~~스티키 노트 + 펜~~ | ~~1주~~ ✅ |
| 9 | 이미지/미디어 | 4일 |
| 10 | 스탬프/이모지 | 4일 |
| **11** | **실시간 협업 (Yjs)** | **2주** |
| 12 | 댓글 | 5일 |
| 13 | 투표/타이머 | 5일 |
| 14-17 | 고급 기능 | 4주 |

**상세 로드맵**: `docs/FIGJAM-ROADMAP.md`

---

## 구현 완료된 기능 (Phase 8 기준)

| 기능 | 상태 | Figma 대비 |
|------|------|-----------|
| 도형 생성 (Rect, Ellipse, Diamond) | ✅ 완료 | 30% |
| **스티키 노트** | ✅ 완료 | 80% |
| **펜/마커/하이라이터** | ✅ 완료 | 70% |
| 도형 선택/삭제/이동 | ✅ 완료 | 100% |
| 리사이즈/회전 | ✅ 완료 | 100% |
| 텍스트 편집 | ✅ 완료 | 50% |
| 커넥터/화살표 | ✅ 기본+고급 | 60% |
| 줌/팬 | ✅ 완료 | 100% |
| Undo/Redo | ✅ 완료 | 100% |
| Save/Load (JSON) | ✅ 완료 | 100% |
| Copy/Paste/Duplicate | ✅ 완료 | 100% |
| 화살표 키 이동 | ✅ 완료 | 100% |
| 정렬/분배/그룹핑 | ✅ 완료 | 80% |
| 레이어 관리 | ✅ 완료 | 70% |
| PNG/SVG Export | ✅ 완료 | 80% |
| 미니맵 | ✅ 완료 | 90% |

---

## 기술 결정사항

| 항목 | 현재 | 목표 | 상태 |
|------|------|-----|------|
| 상태 관리 | Zustand | Zustand | ✅ 완료 |
| UI 컴포넌트 | Radix UI | Radix UI | ✅ 완료 |
| 컬러 피커 | react-colorful | react-colorful | ✅ 완료 |
| Canvas 라이브러리 | Konva 10.0.0 | Konva 10.x | ✅ 완료 |
| 실시간 협업 | - | Yjs | 📋 Phase 11 |

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
- **FigJam 스타일 로드맵**: `docs/FIGJAM-ROADMAP.md`
- **프로젝트 구조**: `docs/PROJECT.md`

---

*다음 세션 시작 시 이 파일을 먼저 읽으세요.*
