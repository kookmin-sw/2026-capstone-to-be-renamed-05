import React from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  ArrowRight,
  BarChart3,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Building2,
  MessageCircle,
  SlidersHorizontal,
  Sparkles,
  Target,
  TrendingUp,
  Upload,
  UsersRound,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

import { SiteNav } from '@/components/site-nav';
import { ActionLink } from '@/components/ui/action-button';
import { IconTile } from '@/components/ui/icon-tile';
import {
  buildJobUrlParams,
  defaultJobFilters,
  type JobFilterState,
} from '@/lib/job-filters';
import styles from './page.module.css';

const problemCards: Array<{
  icon: LucideIcon;
  title: string;
  description: string;
}> = [
  {
    icon: ClipboardList,
    title: '정보가 흩어져 있어요',
    description: '여러 사이트를 매번 방문해야 해서 시간이 걸립니다.',
  },
  {
    icon: SlidersHorizontal,
    title: '조건 비교가 어려워요',
    description: '수습·KICPA·직무·마감일 등 복잡한 조건을 한눈에 보기 어렵습니다.',
  },
  {
    icon: CalendarClock,
    title: '마감일을 놓치기 쉬워요',
    description: '마감일을 일일이 확인하다 기회를 놓치기 쉽습니다.',
  },
  {
    icon: Target,
    title: '지원정보를 직접 찾아야 해요',
    description: '회사 규모, 후기, 평균연봉, 입퇴사 흐름 등이 공고와 별도로 존재합니다.',
  },
];

const stats: Array<{ value: string; label: string }> = [
  { value: '10,000+', label: '누적 채용공고' },
  { value: '5,000+', label: '회계사 회원' },
  { value: '300+', label: '제휴 기업' },
];


const intelligenceSections: Array<{
  icon: LucideIcon;
  eyebrow: string;
  title: React.ReactNode;
  description: string;
  points: Array<{ icon: LucideIcon; title: string; description: string }>;
  primaryAction: { label: string; href: string };
  secondaryAction: { label: string; href: string };
  visual: {
    label: string;
    value: string;
    detail: string;
    chips: string[];
  };
}> = [
  {
    icon: Sparkles,
    eyebrow: 'AI Resume Fit',
    title: (
      <>
        이력서를 올리면,
        <br />
        <span>공고별 적합도</span>까지 분석합니다
      </>
    ),
    description:
      '대표 이력서를 등록하면 Accountit AI가 채용공고의 직무, 경력, KICPA 조건, 기업 우선순위와 비교해 강점과 보완 포인트를 정리합니다.',
    points: [
      {
        icon: Upload,
        title: '이력서 업로드',
        description: '마이페이지에서 이력서를 등록하고 대표 이력서로 설정',
      },
      {
        icon: Target,
        title: '공고별 매칭',
        description: '각 공고가 요구하는 조건과 내 이력서의 연결점 분석',
      },
      {
        icon: CheckCircle2,
        title: '지원 판단 정리',
        description: '강점, 감점 요인, 기업이 보는 포인트를 한 화면에 표시',
      },
    ],
    primaryAction: { label: '이력서 등록하기', href: '/mypage' },
    secondaryAction: { label: '채용공고에서 확인하기', href: '/jobs' },
    visual: {
      label: 'AI 적합도 분석',
      value: 'Fit 86%',
      detail: '감사 직무 · 신입 가능 · 수습 조건 일치',
      chips: ['강점 4개', '보완 2개', '기업 우선순위'],
    },
  },
  {
    icon: BarChart3,
    eyebrow: 'Company Insight',
    title: (
      <>
        기업회원에게는
        <br />
        <span>지원자 관심 데이터</span>를 제공합니다
      </>
    ),
    description:
      '공고 조회, 북마크, 지원 관심 흐름을 모아 기업회원이 어떤 조건과 포지션에 반응이 높은지 데이터로 확인할 수 있게 돕습니다.',
    points: [
      {
        icon: UsersRound,
        title: '관심 흐름 수집',
        description: '공고별 조회와 북마크 등 지원자 반응을 한눈에 확인',
      },
      {
        icon: TrendingUp,
        title: '성과 지표 분석',
        description: '최근 기간별 추이와 공고별 관심도를 대시보드로 제공',
      },
      {
        icon: Building2,
        title: '채용 전략 보완',
        description: '지원자가 많이 보는 조건을 바탕으로 공고 운영 방향 점검',
      },
    ],
    primaryAction: { label: '기업회원 가입하기', href: '/login?mode=register' },
    secondaryAction: { label: '기업 대시보드 보기', href: '/company' },
    visual: {
      label: '지원자 관심 분석',
      value: '+38%',
      detail: '최근 30일 북마크 증가 · 마감 임박 공고 반응 상승',
      chips: ['조회 추이', '공고별 관심도', '북마크 흐름'],
    },
  },
];

const communityHighlights: Array<{ icon: LucideIcon; label: string }> = [
  { icon: UsersRound, label: '회계사 중심 대화' },
  { icon: ClipboardList, label: '지원 준비 정보' },
  { icon: CheckCircle2, label: '커리어 고민 공유' },
];

type HomeQuickFilterId =
  | 'trainee'
  | 'entry'
  | 'experienced'
  | 'deadlineSoon'
  | 'salaryAbove'
  | 'big4'
  | 'seoul';

type HomeQuickFilter = {
  id: HomeQuickFilterId;
  label: string;
  values: Partial<JobFilterState>;
};

function IconTrainee() {
  return (
    <svg width="72" height="72" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
      <polygon points="28,6 50,18 28,30 6,18" fill="#E8457A" />
      <path d="M15 25V35C15 35 20 42 28 42C36 42 41 35 41 35V25L28 30L15 25Z" fill="#FFD6E5" />
      <line x1="48" y1="18" x2="48" y2="33" stroke="#D03368" strokeWidth="3.5" strokeLinecap="round" />
      <circle cx="48" cy="36" r="3.5" fill="#D03368" />
    </svg>
  );
}

function IconEntry() {
  return (
    <svg width="72" height="72" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="28" cy="17" r="10" fill="#E8457A" />
      <path d="M6 51C6 38.85 15.85 29 28 29C40.15 29 50 38.85 50 51" fill="#FFD6E5" />
      <circle cx="44" cy="12" r="2.5" fill="#60A5FA" />
      <line x1="44" y1="7" x2="44" y2="9" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round" />
      <line x1="44" y1="15" x2="44" y2="17" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round" />
      <line x1="39" y1="12" x2="41" y2="12" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round" />
      <line x1="47" y1="12" x2="49" y2="12" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IconExperienced() {
  return (
    <svg width="72" height="72" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="6" y="24" width="44" height="27" rx="5" fill="#E8457A" />
      <path d="M20 24V18C20 15.791 21.791 14 24 14H32C34.209 14 36 15.791 36 18V24" stroke="#D03368" strokeWidth="3" strokeLinecap="round" />
      <rect x="6" y="24" width="44" height="8" rx="4" fill="#D03368" opacity="0.2" />
      <rect x="24.5" y="29" width="7" height="7" rx="2" fill="#D03368" />
      <circle cx="46" cy="14" r="5" fill="#818CF8" />
      <line x1="46" y1="11.5" x2="46" y2="16.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="43.5" y1="14" x2="48.5" y2="14" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function IconDeadlineSoon() {
  return (
    <svg width="72" height="72" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="28" cy="32" r="19" fill="#E8457A" />
      <circle cx="28" cy="32" r="14" fill="#FFF0F5" />
      <line x1="28" y1="32" x2="28" y2="22" stroke="#D03368" strokeWidth="3" strokeLinecap="round" />
      <line x1="28" y1="32" x2="36" y2="32" stroke="#D03368" strokeWidth="3" strokeLinecap="round" />
      <circle cx="28" cy="32" r="2.5" fill="#D03368" />
      <path d="M13 18C11 16 10.5 13 13 11" stroke="#FFD6E5" strokeWidth="3" strokeLinecap="round" />
      <path d="M43 18C45 16 45.5 13 43 11" stroke="#FFD6E5" strokeWidth="3" strokeLinecap="round" />
      <circle cx="44" cy="10" r="5" fill="#FBBF24" />
      <line x1="44" y1="7.5" x2="44" y2="11" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="44" cy="12.5" r="1" fill="white" />
    </svg>
  );
}

function IconSalaryAbove() {
  return (
    <svg width="72" height="72" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="28" cy="42" rx="18" ry="7" fill="#FFD6E5" />
      <rect x="10" y="31" width="36" height="11" rx="5.5" fill="#E8457A" />
      <ellipse cx="28" cy="31" rx="18" ry="7" fill="#FF8AB0" />
      <circle cx="28" cy="21" r="13" fill="#E8457A" />
      <circle cx="28" cy="21" r="8" fill="#FFF0F5" />
      <path d="M28 15V27" stroke="#D03368" strokeWidth="2.8" strokeLinecap="round" />
      <path d="M24.5 18.5C25.2 17.4 26.3 16.8 28 16.8C30.1 16.8 31.5 17.8 31.5 19.3C31.5 22.9 24.5 20.6 24.5 24.1C24.5 25.8 26 26.8 28.3 26.8C30.1 26.8 31.3 26.1 32 24.8" stroke="#D03368" strokeWidth="2.1" strokeLinecap="round" />
      <path d="M39 18L45 12L50 17" stroke="#60A5FA" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M45 12V29" stroke="#60A5FA" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function IconBig4() {
  return (
    <svg width="72" height="72" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="8" y="18" width="17" height="33" rx="4" fill="#FFD6E5" />
      <rect x="31" y="10" width="17" height="41" rx="4" fill="#E8457A" />
      <rect x="13" y="24" width="4" height="4" rx="1" fill="#D03368" />
      <rect x="20" y="24" width="4" height="4" rx="1" fill="#D03368" />
      <rect x="13" y="33" width="4" height="4" rx="1" fill="#D03368" />
      <rect x="20" y="33" width="4" height="4" rx="1" fill="#D03368" />
      <rect x="36" y="17" width="4" height="4" rx="1" fill="#FFF0F5" />
      <rect x="43" y="17" width="4" height="4" rx="1" fill="#FFF0F5" />
      <rect x="36" y="26" width="4" height="4" rx="1" fill="#FFF0F5" />
      <rect x="43" y="26" width="4" height="4" rx="1" fill="#FFF0F5" />
      <rect x="36" y="35" width="4" height="4" rx="1" fill="#FFF0F5" />
      <rect x="43" y="35" width="4" height="4" rx="1" fill="#FFF0F5" />
      <rect x="5" y="48" width="46" height="4" rx="2" fill="#D03368" />
      <circle cx="14" cy="11" r="5" fill="#818CF8" />
      <path d="M14 8.6V13.4" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M11.6 11H16.4" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function IconSeoul() {
  return (
    <svg width="72" height="72" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 16L20 11L36 16L48 11V41L36 46L20 41L8 46V16Z" fill="#FFD6E5" />
      <path d="M20 11V41" stroke="#FFF0F5" strokeWidth="3" strokeLinecap="round" />
      <path d="M36 16V46" stroke="#FFF0F5" strokeWidth="3" strokeLinecap="round" />
      <path d="M28 7C20.8 7 15 12.8 15 20C15 30 28 44 28 44C28 44 41 30 41 20C41 12.8 35.2 7 28 7Z" fill="#E8457A" />
      <circle cx="28" cy="20" r="6" fill="#FFF0F5" />
      <path d="M19 48H43" stroke="#D03368" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

const homeQuickFilters: HomeQuickFilter[] = [
  {
    id: 'trainee',
    label: '실무수습 가능',
    values: { traineeStatus: 'AVAILABLE' },
  },
  {
    id: 'entry',
    label: '신입 가능',
    values: { careerLevel: 'entry' },
  },
  {
    id: 'experienced',
    label: '경력 이직',
    values: { careerLevel: 'junior,experienced' },
  },
  {
    id: 'deadlineSoon',
    label: '마감 7일 이내',
    values: {
      deadline: 'soon',
      deadlineType: 'FIXED_DATE',
      deadlineWithinDays: '7',
      sort: 'deadlineAsc',
    },
  },
  {
    id: 'salaryAbove',
    label: '연봉 평균 이상',
    values: { salaryLevel: 'ABOVE_AVERAGE' },
  },
  {
    id: 'big4',
    label: 'Big4',
    values: { companyType: 'BIG4' },
  },
  {
    id: 'seoul',
    label: '서울',
    values: { selectedLocations: ['서울'] },
  },
];

const QuickNavIcons: Record<HomeQuickFilterId, React.ReactNode> = {
  trainee: <IconTrainee />,
  entry: <IconEntry />,
  experienced: <IconExperienced />,
  deadlineSoon: <IconDeadlineSoon />,
  salaryAbove: <IconSalaryAbove />,
  big4: <IconBig4 />,
  seoul: <IconSeoul />,
};

const assetBasePath =
  process.env.NEXT_PUBLIC_ASSET_PREFIX?.replace(/\/$/, '') ??
  process.env.NEXT_PUBLIC_BASE_PATH?.replace(/\/$/, '') ??
  '';

function buildHomeQuickHref(values: Partial<JobFilterState>) {
  const params = buildJobUrlParams({
    ...defaultJobFilters,
    ...values,
    selectedLocations: values.selectedLocations ?? [],
  });

  return `/jobs?${params.toString()}`;
}

export default function Home() {
  return (
    <main className={styles.page}>
      <SiteNav variant="landing" />

      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.heroCopy}>
            <span className={styles.eyebrow}>CPA 전용 채용 큐레이션 플랫폼</span>
            <h1 className={styles.headline}>
              회계사 채용,
              <br />
              <span>필요한 공고만</span>
              <br />
              <span>정확하게</span>
            </h1>
            <p className={styles.description}>
              수습·KICPA·직무·연차·마감일 기준으로
              <br className={styles.copyBreak} />필요한 공고만 모아드립니다.
            </p>
            <ActionLink
              href="/jobs"
              size="lg"
              iconEnd={<ArrowRight size={17} />}
            >
              채용공고 보기
            </ActionLink>
          </div>

          <div className={styles.heroVisual} aria-hidden="true">
            <Image
              className={styles.heroImage}
              src={`${assetBasePath}/landing/accountit-hero.png`}
              alt=""
              width={1680}
              height={936}
              priority
              sizes="58vw"
            />
          </div>
        </div>
      </section>

      <section className={styles.quickSection} aria-label="빠른 탐색">
        <div className={styles.quickRow}>
          {homeQuickFilters.map((item) => {
            return (
              <Link className={styles.quickItem} href={buildHomeQuickHref(item.values)} key={item.id}>
                <span className={styles.quickIcon}>
                  {QuickNavIcons[item.id]}
                </span>
                <span className={styles.quickLabel}>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className={styles.problemSection} aria-labelledby="problem-title">
        <div className={styles.sectionHeader}>
          <h2 id="problem-title">회계사 채용, 왜 어려울까요?</h2>
          <p>파편화된 정보와 복잡한 조건들 속에서 원하는 공고를 찾기가 쉽지 않습니다.</p>
        </div>
        <div className={styles.problemGrid}>
          {problemCards.map((item) => (
            <article className={styles.problemCard} key={item.title}>
              <IconTile icon={item.icon} size="lg" tone="neutral" className={styles.problemIcon} />
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.intelligenceSection} aria-label="AI와 기업회원 분석 기능">
        {intelligenceSections.map(({ icon: Icon, ...section }, index) => (
          <article className={styles.intelligencePanel} key={section.eyebrow}>
            <div className={styles.intelligenceCopy}>
              <span className={styles.intelligenceEyebrow}>
                <Icon size={15} aria-hidden="true" />
                {section.eyebrow}
              </span>
              <h2>{section.title}</h2>
              <p>{section.description}</p>

              <div className={styles.intelligencePointGrid}>
                {section.points.map(({ icon: PointIcon, title, description }) => (
                  <div className={styles.intelligencePoint} key={title}>
                    <PointIcon size={17} aria-hidden="true" />
                    <div>
                      <h3>{title}</h3>
                      <p>{description}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className={styles.intelligenceActions}>
                <ActionLink
                  className={index === 1 ? styles.homeActionPurple : undefined}
                  href={section.primaryAction.href}
                  size="md"
                  iconEnd={<ArrowRight size={15} />}
                >
                  {section.primaryAction.label}
                </ActionLink>
                <ActionLink
                  className={
                    index === 1 ? styles.intelligenceSubtlePurple : undefined
                  }
                  href={section.secondaryAction.href}
                  size="md"
                  variant="subtle"
                >
                  {section.secondaryAction.label}
                </ActionLink>
              </div>
            </div>

            <div
              className={`${styles.intelligenceVisual} ${
                index % 2 === 1 ? styles.intelligenceVisualCompany : ''
              }`}
              aria-hidden="true"
            >
              <div className={styles.visualCard}>
                <div className={styles.visualCardHeader}>
                  <span>{section.visual.label}</span>
                  <span className={styles.visualBadge}>Live</span>
                </div>
                <strong>{section.visual.value}</strong>
                <p>{section.visual.detail}</p>
                <div className={styles.visualBars}>
                  <span />
                  <span />
                  <span />
                  <span />
                </div>
                <div className={styles.visualChips}>
                  {section.visual.chips.map((chip) => (
                    <span key={chip}>{chip}</span>
                  ))}
                </div>
              </div>
            </div>
          </article>
        ))}
      </section>

      <section className={styles.communitySection} aria-labelledby="community-title">
        <div className={styles.communityPanel}>
          <div className={styles.communityVisual} aria-hidden="true">
            <Image
              className={styles.communityImage}
              src={`${assetBasePath}/landing/accountit-community.png`}
              alt=""
              width={1680}
              height={936}
              sizes="48vw"
            />
          </div>

          <div className={styles.communityCopy}>
            <span className={styles.communityEyebrow}>
              <MessageCircle size={16} aria-hidden="true" />
              CPA Community
            </span>
            <h2 id="community-title">
              같은 길을 걷는 사람들과
              <br />
              <span>채용과 커리어 정보</span>를 나누세요
            </h2>
            <p>
              회계사와 회계사 준비생이 채용 준비, 실무수습, 법인 문화, 직무 선택,
              커리어 고민을 한 공간에서 나눌 수 있습니다.
            </p>

            <div className={styles.communityHighlights}>
              {communityHighlights.map(({ icon: Icon, label }) => (
                <span key={label}>
                  <Icon size={16} aria-hidden="true" />
                  {label}
                </span>
              ))}
            </div>

            <div className={styles.communityActions}>
              <ActionLink
                href="/community"
                size="lg"
                iconEnd={<ArrowRight size={17} />}
              >
                커뮤니티 둘러보기
              </ActionLink>
              <ActionLink
                href="/login?mode=register"
                size="lg"
                variant="subtle"
              >
                회원가입하고 참여하기
              </ActionLink>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.closingBand} aria-label="서비스 지표와 시작 안내">
        <section className={styles.outroSection} aria-label="서비스 지표">
          <h2>
            회계사를 위한 모든 여정을
            <br />더 <span>든든하게</span> 함께합니다
          </h2>
          <div className={styles.statsGrid}>
            {stats.map(({ value, label }) => (
              <div className={styles.statCard} key={label}>
                <strong>{value}</strong>
                <span>{label}</span>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.ctaSection} aria-labelledby="cta-title">
          <div className={styles.ctaInner}>
            <h2 id="cta-title">
              공고를 찾는 순간부터 마감 관리까지
              <br />
              <span>Accountit에서 이어가세요</span>
            </h2>
            <div className={styles.ctaActions}>
              <ActionLink
                href="/jobs"
                size="lg"
                iconEnd={<ArrowRight size={17} />}
              >
                서비스 이용해보기
              </ActionLink>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}
