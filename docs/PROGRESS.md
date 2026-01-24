# zm-draw 진행상황

> 최종 업데이트: 2026-01-24

---

## 전체 진행률

**현재 Phase**: 초기 설정
**완료율**: 10%

---

## Phase 1: 프로젝트 설정

### 1.1 모노레포 구조 (진행 중)

- [x] 루트 package.json 생성
- [x] pnpm-workspace.yaml 설정
- [x] turbo.json 설정
- [x] .gitignore 설정
- [x] CLAUDE.md 작성
- [ ] Git 초기화
- [ ] 첫 커밋

### 1.2 packages/core

- [x] package.json 생성
- [x] tsconfig.json 설정
- [x] tsup.config.ts 설정
- [x] 기본 타입 정의 (types.ts)
- [x] shapes/types.ts 생성
- [x] connectors/types.ts 생성
- [x] utils/index.ts 생성
- [ ] 빌드 테스트

### 1.3 packages/react

- [x] package.json 생성
- [x] tsconfig.json 설정
- [x] tsup.config.ts 설정
- [x] DrawCanvas 컴포넌트 기본 구조
- [ ] 빌드 테스트

### 1.4 apps/demo

- [ ] Next.js 프로젝트 생성
- [ ] @zm-draw/react 연동
- [ ] 기본 데모 페이지

---

## Phase 2: 기본 도형 (예정)

- [ ] Rectangle 도형
- [ ] Ellipse 도형
- [ ] Diamond 도형
- [ ] 도형 선택/이동/리사이즈

---

## Phase 3: ERD 도형 (예정)

- [ ] Table 도형
- [ ] Column 렌더링
- [ ] PK/FK 표시
- [ ] Crow's Foot 관계선

---

## Phase 4: 플로우차트 (예정)

- [ ] Process 도형
- [ ] Decision 도형
- [ ] Terminal 도형
- [ ] 커넥터 라벨

---

## 기술 부채

- 없음 (신규 프로젝트)

---

*작업 완료 시 이 파일을 업데이트하세요.*
