# Accountit

CPA와 회계사를 위한 채용공고 큐레이션 플랫폼입니다.

## 1. 프로젝트 소개

**Accountit**은 흩어진 회계사 채용공고를 한 곳에 모아 수습 가능 여부, KICPA
조건, 직무군, 요구 연차, 회사 유형, 마감일, 출처, 최종 확인 시각 기준으로
빠르게 검색하고 비교할 수 있게 돕는 서비스입니다.

회계사 채용 정보는 회사별 채용 페이지, KICPA 게시판, 일반 채용 플랫폼 등에
분산되어 있고, 지원 판단에 필요한 CPA 특화 조건이 충분히 구조화되어 있지
않습니다. Accountit은 공고 탐색, 마감일 관리, 회사 정보 비교, AI 요약 및
태그 추천을 통해 CPA 구직자가 지원 우선순위를 더 빠르게 판단할 수 있도록
돕습니다.

### 주요 기능

- CPA 채용 공고 통합 탐색
- 직무군, 회사 유형, 지역, 경력, KICPA 조건, 수습 가능 여부 기반 필터
- D-day, 오늘 마감, 이번 주 마감, 채용 시 마감 등 마감 중심 UI
- 공고 원문 링크, 출처, 최종 확인 시각 표시
- AI 기반 공고 요약 및 CPA 특화 태그 추천
- 회사 공개 페이지와 기업회원 대시보드
- 관심 공고, 마감일 캘린더, 커뮤니티 기능

### 데모 및 배포 주소

http://pj-kmucd2-5-s3.s3-website-us-east-1.amazonaws.com

### 프리뷰

#### 채용 공고 탐색

![채용 공고 탐색 화면](docs/images/accountit-page/jobs.png)

#### 공고별 AI 적합도 분석

![공고별 AI 적합도 분석 화면](docs/images/accountit-page/job-detail-fit.png)

#### 기업회원 대시보드

![기업회원 대시보드 화면](docs/images/accountit-page/company-dashboard.png)

#### 마감일 캘린더

![마감일 캘린더 화면](docs/images/accountit-page/calendar.png)

#### 커뮤니티

![커뮤니티 화면](docs/images/accountit-page/community.png)

#### 회사 상세 정보

![회사 상세 정보 화면](docs/images/accountit-page/company-detail.png)

## 2. 소개 영상

TODO: 프로젝트 소개 영상을 촬영한 뒤 YouTube, Google Drive, GitHub Pages 등으로
접근 가능한 링크를 추가합니다. 영상에는 문제 정의, 핵심 기능, 사용 흐름, 팀별
구현 내용을 포함합니다.

## 3. 팀 소개

<table>
  <tr>
    <td align="center" width="160">
      <a href="https://github.com/pookjw">
        <img src="docs/images/team/jinwoo.jpeg" width="100" height="100" alt="김진우" /><br />
        <b>김진우</b>
      </a><br />
      <sub>팀 리더 · BE · PM</sub>
    </td>
    <td align="center" width="160">
      <a href="https://github.com/suuuujinnnn">
        <img src="https://github.com/suuuujinnnn.png" width="100" height="100" alt="박수진" /><br />
        <b>박수진</b>
      </a><br />
      <sub>BE · PM</sub>
    </td>
    <td align="center" width="160">
      <a href="https://github.com/dfevgd">
        <img src="https://github.com/dfevgd.png" width="100" height="100" alt="박지영" /><br />
        <b>박지영</b>
      </a><br />
      <sub>FE</sub>
    </td>
    <td align="center" width="160">
      <a href="https://github.com/jisw0822">
        <img src="https://github.com/jisw0822.png" width="100" height="100" alt="지성은" /><br />
        <b>지성은</b>
      </a><br />
      <sub>FE</sub>
    </td>
  </tr>
</table>

## 4. 사용법

### 요구사항

- Node.js 24.x
- npm 11 이상
- Docker 및 Docker Compose

### 설치 및 실행

```bash
npm install
cp .env.example .env
docker compose up -d
npm run prisma:migrate
npm run prisma:mock
npm run dev
```

로컬 실행 주소:

- Web: http://localhost:3000
- API: http://localhost:4000
- Swagger: http://localhost:4000/docs

`npm run prisma:seed`는 기본 데이터를 넣지 않습니다. 샘플 데이터를 넣으려면
`npm run prisma:mock`을 실행합니다.

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

## 5. 기타

### 기술 스택

- Monorepo: npm workspaces
- Web: Next.js App Router, TypeScript, Tailwind CSS, shadcn/ui, lucide-react
- API: NestJS, Prisma, PostgreSQL, Swagger/OpenAPI
- Shared: TypeScript enums and DTO-friendly types
- Auth: username/password, argon2 password hashing, HTTP-only JWT cookies
- Roles: `JOB_SEEKER`, `COMPANY`, `ADMIN`

### 프로젝트 구조

```text
apps/web          사용자 및 관리자 웹 UI
apps/api          REST API, 인증, Prisma, Swagger
packages/shared   공유 enum 및 TypeScript 타입
prisma            Prisma 스키마, 마이그레이션, seed/mock 스크립트
docs              배포 문서 및 프리뷰 이미지
```

### 추가 문서

- AWS EC2 + S3 배포 가이드: `docs/aws-ec2-s3-deployment.md`
- 로컬 AWS 환경 가이드: `docs/local-aws-environments.md`

### 팀 페이지

https://kookmin-sw.github.io/2026-capstone-85/
