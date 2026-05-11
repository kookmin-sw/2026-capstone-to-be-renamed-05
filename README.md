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

## 기획 고도화 방향

### 명확한 유입 포인트

Accountit은 단순 채용공고 모음이 아니라 CPA 구직자가 반복적으로 방문할 이유가
있는 서비스를 지향합니다. 채용공고 통합, 마감일 캘린더, 개인화 필터, 북마크,
AI 추천, CPA 인증 기반 커뮤니티를 결합해 개인 사용자의 체류와 재방문을 먼저
만듭니다. 개인 사용자가 충분히 모이면 채용 노출이 필요한 기업 사용자가 자연스럽게
유입될 수 있습니다.

### 사용자별 요구

초기 핵심 타깃은 개인 회원입니다. 수습 CPA, 신입 CPA, 주니어 회계사가 원하는
공고를 빠르게 찾고 놓치지 않도록 돕는 것이 우선입니다.

기업 회원은 특히 지원자 확보가 어려운 중소·로컬 회계법인을 중심으로 접근합니다.
지원자가 충분한 기업보다 지원자 부족을 겪는 기업에서 채용공고 노출, 관심도 데이터,
공고 개선 인사이트의 가치가 더 큽니다.

### 차별화 포인트

개인 회원에게는 CPA 전용 채용공고 통합, 맞춤형 공고 추천, 북마크, 선호도 기반
필터, 이력서 기반 AI 추천, 마감일 캘린더를 제공합니다. 커뮤니티는 CPA 인증
회원과 준비생을 구분해 신뢰도를 높이고, 미인증 사용자는 준비생 게시판 중심으로
이용 범위를 제한합니다.

기업 회원에게는 단순 공고 등록을 넘어 조회수, 필터 선택, 북마크, 원문 클릭 등
지원자가 중요하게 보는 지표를 데이터로 가공해 제공합니다. 지원자 수가 부족한
기업에는 공고 개선과 노출 전략을 위한 유의미한 분석 자료가 될 수 있으며, 향후
유료화 포인트로 확장할 수 있습니다.

### 공고 등록 부담 완화

기업 사용자가 채용공고를 등록할 때 모든 필드를 직접 입력해야 한다면 부담이 큽니다.
이를 줄이기 위해 과거 공고 불러오기, 기본 공고 템플릿, 공통 블록 일괄 수정,
AI 자동 입력 기능을 제공합니다.

AI 자동 입력은 사용자가 텍스트나 이미지를 제공하면 제목, 회사명, 마감일, 직무군,
KICPA 조건, 수습 가능 여부 등 필요한 필드를 자동으로 채우고 기본 공고 문안까지
제안하는 방식으로 설계합니다. 채용 홈페이지 빌더가 제공하는 공고 작성 흐름도
참고해 기업 사용자의 입력 단계를 줄입니다.

### 운영 및 검수 전략

필터 드롭박스와 태그 기준은 사용자가 헷갈리지 않도록 명확한 선택지와 설명을
제공해야 합니다. AI가 추천한 라벨, 수습 가능 여부, KICPA 조건, 회사 정보는
관리자 검수를 거쳐 신뢰도를 확보합니다. 초기 운영 대상이 제한적인 회계법인
채용 시장에서는 관리자 검수 기반 운영이 현실적인 품질 관리 방식이 될 수 있습니다.

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

## 개발 가이드

### 로컬 실행

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

### S3 회사 이미지 및 이력서 업로드

회사 로고/배경 이미지는 브라우저에서 미리 서명된 `PUT` URL을 사용해 S3로 직접 업로드합니다.
API는 `Asset` 레코드를 생성하고, S3 `HeadObject`로 업로드된 객체를 확인한 뒤
준비된 자산을 회사 프로필에 연결합니다.

필수 환경 변수:

- `AWS_REGION`
- `S3_ASSET_BUCKET`
- `S3_PUBLIC_BASE_URL`
- `S3_PRESIGN_EXPIRES_SECONDS`: 생략 시 기본값 `300`
- `NEXT_PUBLIC_S3_PUBLIC_BASE_URL`: Next.js 이미지 호스트 허용 목록에 사용
- `S3_RESUME_BUCKET`: 이력서 비공개 저장 버킷
- `S3_RESUME_KEY_PREFIX`: 생략 시 기본값 `resumes`

S3 버킷은 `company-logos/*`, `company-backgrounds/*` 및 정적 웹 파일에 대한 공개
`GetObject` 권한을 허용해야 합니다. 이력서가 저장되는 `resumes/*` prefix는 공개하면
안 됩니다. 하나의 버킷을 웹/이미지/이력서에 함께 쓰는 경우 `npm run deploy:web:s3`는
기본적으로 `company-logos/`, `company-backgrounds/`, `resumes/`, `postgres/`,
`backups/`, `out/` prefix를 삭제 대상에서 제외하고, mock 정적 회사 이미지는 별도
동기화로 업로드합니다.
CORS 설정에서는 웹 출처가 `Content-Type` 헤더와 함께 `PUT` 요청을 보낼 수
있어야 합니다. 운영 환경이 AWS 위에서 실행된다면 장기 액세스 키 대신 EC2/ECS
IAM 역할 사용을 권장합니다.

### AWS EC2 + S3 배포

운영 배포는 다음 구성을 기준으로 준비되어 있습니다.

- S3 정적 웹 사이트 호스팅: Next.js 정적 내보내기 산출물
- EC2: NestJS API, PostgreSQL, 선택적으로 Caddy/HTTPS 종료
- GitHub Actions: `develop` push 시 EC2 `POST /ops/deploy` 호출
- S3 미리 서명된 업로드: 회사 로고 자산 저장
- S3 비공개 저장소: 이력서 업로드 및 인증 API 다운로드

`deploy/production.env.example`을 `.env.production`으로 복사해 운영 값을 채운 뒤
`docs/aws-ec2-s3-deployment.md`의 운영 가이드를 따릅니다. 자동 배포는 GitHub
Secrets `DEPLOY_API_URL`, `DEPLOY_API_TOKEN`을 사용하며, EC2가 자체 IAM role로 S3
동기화를 수행합니다. `DEPLOY_AUTO_UPDATE_EC2_HOST=true`이면 S3 정적 빌드 직전에
현재 EC2 public IP로 `NEXT_PUBLIC_API_BASE_URL`을 갱신합니다.

```bash
set -a
source .env.production
set +a
npm run deploy:web:s3
docker compose --env-file .env.production -f compose.prod.yml up -d --build
docker compose --env-file .env.production -f compose.prod.yml run --rm api npm run prisma:migrate:deploy
```

### 주요 명령어

```bash
npm run dev
npm run dev:web
npm run dev:api
npm run lint
npm run typecheck
npm run test
npm run build
npm run prisma:generate
npm run prisma:migrate
npm run prisma:migrate:deploy
npm run prisma:seed
npm run prisma:mock
```
