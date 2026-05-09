# Accountit

CPA와 회계사를 위한 채용공고 큐레이션 플랫폼입니다.

Accountit은 흩어진 회계사 채용공고를 한 곳에 모아 수습 가능 여부, KICPA 조건,
직무군, 요구 연차, 회사 유형, 마감일, 출처, 최종 확인 시각 기준으로 빠르게
검색하고 비교할 수 있게 돕습니다.

## 문제 정의

회계사 채용 정보는 많지만 지원 판단에 필요한 조건이 충분히 구조화되어 있지
않습니다.

- 대형펌, 로컬 회계법인, 일반 기업, 수습 CPA 공고가 여러 채널에 흩어져 있습니다.
- 마감일 기준으로 오늘 마감, 이번 주 마감, 채용 시 마감 공고를 보기 어렵습니다.
- 수습 가능 여부, 실무수습기관 인정 가능성, KICPA 필수/우대 여부, 직무군,
  요구 연차, 회사 유형을 한눈에 비교하기 어렵습니다.
- 회사별 특징, 규모, 평균연봉, 외부 리뷰 링크 등 지원 판단 정보가 공고와
  분리되어 있습니다.

## 사용자

- 수습 CPA / 신입 CPA: 수습 가능 여부, 실무수습기관 인정 가능성, 마감일,
  KICPA 조건을 빠르게 확인해야 하는 사용자
- 주니어·경력 회계사: 이직 공고, 회사 유형, 직무군, 고용형태, 요구 연차를
  비교하는 사용자
- 운영 관리자: 공고 등록, 수정, 마감 처리, 출처 관리, AI 추천 태그 검수를
  담당하는 사용자
- 인증 회계사 회원: 커뮤니티, Q&A, 회사 정보 제보, 공고 제보, 관심 태그 알림
  기능을 활용하는 사용자

## 서비스 범위

Accountit은 채용 공고 탐색과 큐레이션 경험에 집중합니다.

- 공고 목록 및 상세 조회
- CPA 특화 필터
- 마감일 D-day 표시
- 마감 임박 공고 강조
- 마감일 캘린더
- 원문 링크 연결
- 관리자 공고 등록, 수정, 마감 처리
- 회사 공개 페이지
- AI 기반 공고 요약 및 태그/라벨 추천

## 핵심 기능

### 통합 공고 탐색

KICPA 구인 게시판, 대형 회계법인 채용 페이지, 일반 채용 플랫폼, 개별 회사
채용 페이지의 공고를 한 리스트에서 탐색합니다.

### CPA 특화 필터

빠른 필터, 기본 필터, 상세 필터를 조합해 필요한 공고만 찾습니다.

- 빠른 필터: 수습 CPA, 신입, 주니어 이직, 경력 이직, 마감 임박
- 기본 필터: 직무군, 회사 유형, 지역
- 상세 필터: 실무수습기관 인정 가능성, 고용 형태, KICPA 조건, 마감 유형,
  업력, 퇴사율, 경력

### 마감 중심 UI

공고 리스트와 캘린더에서 마감일을 중심으로 지원 우선순위를 판단합니다.

- D-day 배지
- 오늘 마감 / 이번 주 마감 / D-7 마감 임박
- 마감 임박순 정렬
- 마감일 캘린더
- 채용 시 마감 및 상시채용 별도 표시

### AI 요약 및 태그

공고 원문을 요약하고 CPA에게 중요한 조건을 추천합니다.

- 공고 핵심 요약
- KICPA 필수/우대, 수습 가능, 감사/세무 등 CPA 태그 추천
- 계약직, 수습 불명확, 채용 시 마감 등 확인 필요 요소 표시
- `#수습가능`, `#KICPA우대`, `#감사`, `#내부회계`, `#마감임박` 등 라벨 생성

### 회사 공개 페이지

공고와 연결된 회사 정보를 함께 보여줍니다.

- 회사 기본 정보
- 현재 진행 중인 공고
- 회사 유형 및 태그
- 최근 업데이트 시각
- 잡플래닛, 블라인드 등 외부 리뷰 링크
- 평균연봉, 직원 수, 입사/퇴사 흐름 등 공공 데이터 기반 회사 정보

> 잡플래닛/블라인드 리뷰를 직접 크롤링하거나 재게시하지 않습니다.
> 외부 링크 또는 수동 검수 데이터로만 제한합니다.

## 기술 스택

- 모노레포: npm workspaces
- 웹: Next.js App Router, TypeScript, Tailwind CSS, shadcn/ui, lucide-react
- API: NestJS, Prisma 7, PostgreSQL, Swagger/OpenAPI
- 공유 패키지: TypeScript enum 및 DTO 친화 타입
- 인증: username/password, argon2, HTTP-only JWT cookie
- 권한: `JOB_SEEKER`, `COMPANY`, `ADMIN`

## 프로젝트 구조

```text
apps/web          사용자 및 관리자 웹 UI
apps/api          REST API, 인증, Prisma, Swagger
packages/shared   공유 enum 및 TypeScript 타입
prisma            Prisma 스키마, 마이그레이션, seed/mock 스크립트
```

## 실행 방법

```bash
npm install
cp .env.example .env
docker compose up -d
npm run prisma:migrate
npm run prisma:mock
npm run dev
```

로컬 실행 주소:

- 웹: http://localhost:3000
- API: http://localhost:4000
- Swagger: http://localhost:4000/docs

`npm run prisma:seed`는 기본 데이터를 넣지 않습니다. 샘플 데이터를 넣으려면
`npm run prisma:mock`을 실행합니다.

## 개발 명령어

```bash
npm run dev
npm run lint
npm run typecheck
npm run test
npm run build
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run prisma:mock
```
