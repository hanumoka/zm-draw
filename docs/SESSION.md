# zm-draw 세션 상태

> 최종 업데이트: 2026-01-24 20:30

---

## 현재 상태

**Phase**: MVP 개발
**진행률**: 75%

### 마지막 작업 (2026-01-24)

- Save/Load (JSON export/import) 기능 구현 완료
- 전체 코드 리뷰 완료 (버그 없음 확인)
- Git 커밋 및 푸시 완료 (commit: 164613f)
- 문서 체계 정비 중

### 개발 서버

- **상태**: 정상 동작
- **포트**: 3200
- **URL**: http://localhost:3200

### Git 상태

- **브랜치**: main
- **원격**: origin/main (동기화됨)
- **마지막 커밋**: `feat: Add save/load JSON export/import`

---

## 구현 완료된 기능 (MVP)

| 기능 | 상태 | 키보드 단축키 |
|------|------|--------------|
| 도형 생성 (Rectangle, Ellipse, Diamond) | ✅ 완료 | 툴바 클릭 후 캔버스 클릭 |
| 도형 선택/삭제 | ✅ 완료 | Delete / Backspace |
| 도형 드래그 이동 | ✅ 완료 | 마우스 드래그 |
| 리사이즈/회전 (Transformer) | ✅ 완료 | 핸들 드래그 |
| 텍스트 편집 (더블클릭) | ✅ 완료 | Enter (확인), Esc (취소) |
| 커넥터/화살표 | ✅ 완료 | Connector 툴 선택 후 도형 클릭 |
| 줌 (마우스 휠) | ✅ 완료 | 마우스 휠 |
| 팬 (Space + 드래그) | ✅ 완료 | Space 누른 상태로 드래그 |
| Undo/Redo | ✅ 완료 | Ctrl+Z / Ctrl+Shift+Z (또는 Ctrl+Y) |
| Save/Load (JSON) | ✅ 완료 | 툴바 Save/Load 버튼 |

---

## 다음 작업

### 즉시 진행 (Phase 1.5)
1. [ ] Copy/Paste 기능 (Ctrl+C/V)
2. [ ] Multi-select (Shift+Click 또는 드래그 선택)
3. [ ] 키보드 화살표 이동

### 예정 (Phase 2 - ERD)
1. [ ] ERD Table 도형
2. [ ] Smart connectors (도형 가장자리 연결)
3. [ ] Crow's Foot 관계선

### 예정 (Phase 3 - 고급 기능)
1. [ ] Grid snap
2. [ ] Color picker
3. [ ] 레이어 관리

---

## 핵심 기술 결정사항

| 항목 | 결정 | 이유 |
|------|------|------|
| Canvas 라이브러리 | **Konva.js (vanilla)** | react-konva가 React 19 미지원 |
| 도형+텍스트 그룹핑 | **Konva.Group** | 함께 드래그/회전/리사이즈 |
| Transformer 레이어 | **별도 selectionLayer** | destroyChildren() 충돌 방지 |
| 빌드 도구 | **tsup (단일 엔트리)** | ESM 호환성 |
| 데모 앱 프레임워크 | **Next.js 15** | App Router, React 19 |

---

## 해결된 이슈 기록

| 이슈 | 원인 | 해결책 |
|------|------|--------|
| react-konva React 19 미지원 | ReactCurrentOwner 오류 | vanilla Konva + useRef/useEffect |
| Transformer 충돌 | destroyChildren() 시 삭제됨 | 별도 레이어로 분리 |
| 텍스트 입력 안보임 | 배경과 같은 색 | `color: '#000000'` 추가 |
| Backspace로 도형 삭제 | INPUT 체크 누락 | `activeElement.tagName` 체크 |
| 텍스트 드래그 지연 | 별도 Konva.Text 사용 | Konva.Group으로 그룹핑 |
| Ctrl+Shift+Z 미동작 | 대소문자 비교 | `toLowerCase()` 사용 |

---

## 현재 블로커

**없음** - 정상 진행 중

---

## 개발 환경 확인 명령어

```bash
# 개발 서버 시작
cd C:/Users/amagr/projects/zm-draw && pnpm dev

# 빌드 확인
pnpm build

# 타입 체크
pnpm type-check

# Git 상태
git status
```

---

*다음 세션 시작 시 이 파일을 먼저 읽으세요.*
