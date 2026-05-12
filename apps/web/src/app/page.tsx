import React from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  SlidersHorizontal,
  Target,
  UserRound,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

import { SiteNav } from '@/components/site-nav';
import { ActionLink } from '@/components/ui/action-button';
import { IconTile } from '@/components/ui/icon-tile';
import { buildJobUrlParams, quickJobFilters, quickFilterState, type QuickJobFilterId } from '@/lib/job-filters';
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
    title: '원하는 공고 찾기 어려워요',
    description: '맞는 공고를 찾는 데 시간과 노력이 너무 많이 필요합니다.',
  },
];

const solutionItems = [
  {
    title: '모든 공고를 한 곳에',
    description: '다양한 채용 채널의 공고를 한 곳에서 확인',
  },
  {
    title: '정확한 조건 필터링',
    description: '수습·KICPA·직무·연차·마감일로 정교하게 필터링',
  },
  {
    title: '한눈에 비교 분석',
    description: '카드 형태로 빠른 비교와 의사결정 지원',
  },
  {
    title: '마감일 캘린더',
    description: '달력으로 마감일을 한눈에 확인',
  },
];

const stats: Array<{ icon: LucideIcon; value: string; label: string }> = [
  { icon: BriefcaseBusiness, value: '10,000+', label: '누적 채용공고' },
  { icon: UserRound, value: '5,000+', label: '회계사 회원' },
  { icon: Building2, value: '300+', label: '제휴 기업' },
];

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
      {/* sparkle accent */}
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
      {/* accent dot */}
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
      {/* urgent accent */}
      <circle cx="44" cy="10" r="5" fill="#FBBF24" />
      <line x1="44" y1="7.5" x2="44" y2="11" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="44" cy="12.5" r="1" fill="white" />
    </svg>
  );
}

const QuickNavIcons: Record<QuickJobFilterId, React.ReactNode> = {
  trainee: <IconTrainee />,
  entry: <IconEntry />,
  experienced: <IconExperienced />,
  deadlineSoon: <IconDeadlineSoon />,
};

const assetBasePath =
  process.env.NEXT_PUBLIC_ASSET_PREFIX?.replace(/\/$/, '') ??
  process.env.NEXT_PUBLIC_BASE_PATH?.replace(/\/$/, '') ??
  '';

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
            <ActionLink href="/jobs" size="lg" iconEnd={<ArrowRight size={17} />}>
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
              sizes="(max-width: 900px) 100vw, 58vw"
            />
          </div>
        </div>
      </section>

      <section className={styles.quickSection} aria-label="빠른 탐색">
        <div className={styles.quickRow}>
          {quickJobFilters.map((item) => {
            const params = buildJobUrlParams(quickFilterState(item));
            return (
              <Link className={styles.quickItem} href={`/jobs?${params.toString()}`} key={item.label}>
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

      <section className={styles.solutionSection} aria-labelledby="solution-title">
        <div className={styles.solutionPanel}>
          <div className={styles.solutionCopy}>
            <span className={styles.solutionEyebrow}>Accountit가 해결해 드립니다</span>
            <h2 id="solution-title">
              필요한 공고만,
              <br />
              <span>한눈에</span>
            </h2>
            <p>
              핵심 조건을 기반으로 나에게 맞는 공고를 빠르게 제공합니다.
            </p>
          </div>
          <div className={styles.solutionList}>
            {solutionItems.map((item) => (
              <div className={styles.solutionItem} key={item.title}>
                <CheckCircle2 size={18} />
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.outroSection} aria-label="서비스 지표">
        <h2>
          회계사를 위한 모든 여정을
          <br />더 <span>든든하게</span> 함께합니다
        </h2>
        <div className={styles.statsGrid}>
          {stats.map(({ icon: Icon, value, label }) => (
            <div className={styles.statCard} key={label}>
              <strong>{value}</strong>
              <span>{label}</span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
