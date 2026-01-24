# zm-draw 진행상황

> 최종 업데이트: 2026-01-24

---

## 전체 진행률

**현재 Phase**: MVP 개발 완료, Phase 1.5 준비 중
**완료율**: 75%

---

## Phase 1: 프로젝트 설정 ✅ 완료

### 1.1 모노레포 구조

- [x] 루트 package.json 생성
- [x] pnpm-workspace.yaml 설정
- [x] turbo.json 설정
- [x] .gitignore 설정
- [x] CLAUDE.md 작성
- [x] Git 초기화 및 GitHub 연동
- [x] 첫 커밋 및 푸시

### 1.2 packages/core

- [x] package.json 생성
- [x] tsconfig.json 설정
- [x] tsup.config.ts 설정
- [x] 기본 타입 정의 (types.ts)
- [x] 빌드 테스트 통과

### 1.3 packages/react

- [x] package.json 생성
- [x] tsconfig.json 설정
- [x] tsup.config.ts 설정
- [x] DrawCanvas 컴포넌트 구현
- [x] 빌드 테스트 통과

### 1.4 apps/demo

- [x] Next.js 15 프로젝트 생성
- [x] @zm-draw/react 연동
- [x] 기본 데모 페이지 구현
- [x] 개발 서버 동작 확인 (port 3200)

---

## Phase 1-MVP: 기본 기능 ✅ 완료

### 캔버스 기본

- [x] Konva Stage 초기화
- [x] 배경 레이어
- [x] 그리드 레이어
- [x] 줌 (마우스 휠)
- [x] 팬 (Space + 드래그)
- [x] 줌 리셋 버튼

### 도형

- [x] Rectangle 도형
- [x] Ellipse 도형
- [x] Diamond 도형
- [x] 도형 선택 (클릭)
- [x] 도형 삭제 (Delete/Backspace)
- [x] 도형 드래그 이동
- [x] 도형 리사이즈 (Transformer)
- [x] 도형 회전 (Transformer)

### 텍스트

- [x] 도형 내 텍스트 표시
- [x] 더블클릭 텍스트 편집
- [x] 텍스트 입력 오버레이
- [x] Enter 키로 확정
- [x] Escape 키로 취소

### 커넥터

- [x] Connector 툴
- [x] 도형 간 연결선
- [x] 화살표 표시
- [x] 도형 이동 시 커넥터 업데이트

### Undo/Redo

- [x] 히스토리 스택 관리
- [x] Ctrl+Z (Undo)
- [x] Ctrl+Shift+Z / Ctrl+Y (Redo)
- [x] 툴바 버튼

### Save/Load

- [x] JSON export (다운로드)
- [x] JSON import (파일 선택)
- [x] 버전 관리 (version: '1.0')

---

## Phase 1.5: 추가 기본 기능 (예정)

- [ ] Copy/Paste (Ctrl+C/V)
- [ ] Multi-select (Shift+Click)
- [ ] 드래그 박스 선택
- [ ] 키보드 화살표 이동
- [ ] 선택된 도형들 그룹 이동

---

## Phase 2: ERD 도형 (예정)

- [ ] ERD Table 도형 디자인
- [ ] Column 렌더링 (이름, 타입, PK/FK)
- [ ] 테이블 헤더 스타일
- [ ] Crow's Foot 관계선
- [ ] Smart connectors (도형 가장자리 연결)
- [ ] 관계 타입 (1:1, 1:N, N:M)

---

## Phase 3: 플로우차트 도형 (예정)

- [ ] Process 도형 (사각형)
- [ ] Decision 도형 (다이아몬드)
- [ ] Terminal 도형 (둥근 사각형)
- [ ] Data 도형 (평행사변형)
- [ ] 커넥터 라벨 (Yes/No)

---

## Phase 4: 고급 기능 (예정)

- [ ] Grid snap
- [ ] 정렬 가이드
- [ ] Color picker
- [ ] 레이어 관리
- [ ] 미니맵
- [ ] 이미지 export (PNG/SVG)

---

## 기술 부채

| 항목 | 설명 | 우선순위 |
|------|------|----------|
| Diamond 비율 | width/height 다를 때 시각적 이슈 | 낮음 |
| 히스토리 중복 | shapes/connectors 동시 변경 시 2회 저장 | 낮음 |

---

## 커밋 히스토리 (최근)

| 날짜 | 커밋 | 설명 |
|------|------|------|
| 2026-01-24 | 164613f | feat: Add save/load JSON export/import |
| 2026-01-24 | 962ecfd | (이전 커밋들) |

---

*작업 완료 시 이 파일을 업데이트하세요.*
