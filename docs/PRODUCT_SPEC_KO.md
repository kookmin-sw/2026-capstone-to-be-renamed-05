# TidyX 제품 문서 (PRD 초안)

## 1. 프로젝트 소개
TidyX는 GitHub Open Source Repository의 Issues와 Pull Requests를 관리하는 SaaS입니다.  
Maintainer/Contributor가 해야 하는 triage(우선순위 판단, 중복 확인, 라벨 분류, 대응 액션) 시간을 줄이는 것이 목표입니다.

## 2. 문제 정의
오픈소스 저장소에는 대량의 Issues/PR이 계속 들어오며, 아래 문제가 반복됩니다.
- 중복된 이슈/PR이 올라온다.
- 라벨이 없거나 잘못 분류된다.
- "지금 내가 먼저 처리해야 할 것"을 빠르게 판단하기 어렵다.
- 리뷰어 지정, 보안 이슈, 크래시 이슈 같은 고위험 항목이 일반 항목과 섞여서 묻힌다.

결과적으로 Maintainer와 Contributor는 triage에 많은 시간을 사용하게 됩니다.

## 3. 핵심 가치
- 사용자 맞춤형 Priority 정렬
- 중복 이슈/PR 탐지와 그룹화
- 라벨 추천/자동화
- 앱 내부에서 댓글/라벨/Close 같은 액션 수행
- Summary를 통한 현황 시각화

## 4. Priority 기준 (예시)
Priority는 절대값이 아니라 사용자 문맥에 따른 상대값입니다.

### 낮음
- 단순 문서 수정
- 코드 오타/문법/네이밍 수정

### 중간
- 단순 기능 추가

### 높음
- 내가 Reviewer인 PR
- 보안 문제 수정
- Critical Issue(크래시, 데이터 오적재 등)
- Maintainer/Core Contributor 생성 항목
- 내가 속한 Project와 직접 연관된 항목
- 마감 임박 항목

## 5. Label 분류 (예시)
- `bug`
- `feature`
- `release` (예: version up)

## 6. 기능 요구사항

### 6.1 Dashboard
사용자가 콘솔 진입 시 가장 먼저 보는 화면

#### List
- Issues + PR 통합 목록
- Sort: Priority, Time(ASC/DESC)
- Filter: Priority, Task Type, Reviewer 여부, Project, Label
- 상태 변경 반영(예: GitHub에서 Close된 항목 반영)

#### Item
- 제목, 요약, 날짜, Priority, Task Type, Reviewer 여부 노출
- 중복 여부 표기 및 중복 그룹 표시
- 클릭 시 Detail 이동

### 6.2 Dashboard - Detail
- 제목/본문 전문
- Conversation 조회 및 작성/수정
- Code Diff 조회
- 추천 라벨 적용
- 중복 배너 및 중복 해소(무엇을 Close할지 선택)
- 원본 GitHub 페이지 이동

### 6.3 Projects
- Repository별 Project 정의/관리
  - 이름
  - 설명(AI 분류 문맥)
- Project 선택 시 Dashboard 필터 연동

### 6.4 Labels
- Repository Label 목록 동기화/관리
- Label 선택 시 Dashboard 필터 연동
- Auto Labeling ON/OFF 토글

### 6.5 Summary
- Priority/Label 통계 시각화
- Priority 상위 5개, Label 상위 5개 항목

### 6.6 Menu
- 화면 전환: Dashboard / Projects / Labels / Summary
- 계정 전환(로그아웃 포함)
- Repository 추가/삭제/전환

## 7. 연동 원칙
- 데이터 소스: GitHub
- API 계약: OpenAPI(Swagger) 기반
- 백엔드: NestJS code-first 명세

## 8. 현재 구현 상태 (요약)
- API 명세 및 Swagger 문서화 완료
- 일부 엔드포인트는 스텁 데이터 반환
- 다음 단계: GitHub Auth/API, DB, 실제 우선순위/중복/라벨링 로직 연동

## 9. v1 범위 (현 시점 기준)
- 플랫폼: GitHub 우선
- 콘솔 화면: Dashboard, Detail, Projects, Labels, Summary
- 목표: "명세 확정 + 실제 데이터 연동 전환" 단계 완료
