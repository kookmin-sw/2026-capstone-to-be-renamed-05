import type { LucideIcon } from "lucide-react";
import {
  AlarmClock,
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  GraduationCap,
  Search,
  SlidersHorizontal,
  Target,
  UserRound,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { SiteNav } from "@/components/site-nav";
import { ActionLink } from "@/components/ui/action-button";
import { IconTile } from "@/components/ui/icon-tile";
import {
  buildJobFilterParams,
  quickFilterState,
  type JobFilterState,
} from "@/lib/job-filters";
import styles from "./page.module.css";

const problemCards: Array<{
  icon: LucideIcon;
  title: string;
  description: string;
}> = [
  {
    icon: ClipboardList,
    title: "정보가 흩어져 있어요",
    description: "여러 사이트를 일일이 확인해야 해서 시간이 많이 걸려요.",
  },
  {
    icon: SlidersHorizontal,
    title: "조건 비교가 어려워요",
    description: "수습, KICPA, 직무, 연차, 마감일 등 복잡한 조건을 한눈에 보기 어려워요.",
  },
  {
    icon: CalendarClock,
    title: "마감일을 놓치기 쉬워요",
    description: "공고 마감일을 일일이 확인해야 해서 기회를 놓치기 쉬워요.",
  },
  {
    icon: Target,
    title: "원하는 공고 찾기 어려워요",
    description: "나에게 맞는 공고를 찾기까지 많은 시간과 노력이 필요해요.",
  },
];

const solutionItems = [
  {
    title: "모든 공고를 한 곳에",
    description: "다양한 채용 채널의 공고를 수집하여 한 곳에서 확인",
  },
  {
    title: "정확한 조건 필터링",
    description: "수습 가능 여부, KICPA 조건, 직무군, 연차, 마감일로 정교하게 필터링",
  },
  {
    title: "한눈에 비교 분석",
    description: "중요 정보를 카드 형태로 제공하여 빠른 비교와 의사결정 지원",
  },
  {
    title: "마감일 캘린더",
    description: "달력으로 마감일을 한눈에 확인하고 놓치지 않도록 일정 제공",
  },
];

const stats: Array<{ icon: LucideIcon; value: string; label: string }> = [
  { icon: BriefcaseBusiness, value: "10,000+", label: "누적 채용공고" },
  { icon: UserRound, value: "5,000+", label: "회계사 회원" },
  { icon: Building2, value: "300+", label: "제휴 기업" },
];

const quickLinks: Array<{
  icon: LucideIcon;
  label: string;
  values: Partial<JobFilterState>;
}> = [
  { icon: GraduationCap, label: "수습 CPA", values: { traineeStatus: "AVAILABLE" } },
  { icon: UserRound, label: "신입", values: { maxExperienceYears: "0" } },
  { icon: BriefcaseBusiness, label: "경력/이직", values: { minExperienceYears: "1" } },
  {
    icon: AlarmClock,
    label: "마감 임박",
    values: {
      deadlineType: "FIXED_DATE",
      deadlineWithinDays: "7",
      sort: "deadlineAsc",
    },
  },
];

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
              <span>한 곳에서 빠르고</span>
              <br />
              <span>정확하게</span>
            </h1>
            <p className={styles.description}>
              수습 가능 여부, KICPA 조건, 직무군, 연차, 마감일 기준으로
              <br className={styles.copyBreak} />
              {" "}필요한 공고만 모아 드립니다.
            </p>
            <ActionLink href="/jobs" size="lg" iconEnd={<ArrowRight size={17} />}>
              채용공고 보기
            </ActionLink>
          </div>

          <div className={styles.heroVisual} aria-hidden="true">
            <Image
              className={styles.heroImage}
              src="/landing/accountit-hero.png"
              alt=""
              width={1680}
              height={936}
              priority
              sizes="(max-width: 900px) 100vw, 58vw"
            />
          </div>
        </div>
      </section>

      <section className={styles.problemSection} aria-labelledby="problem-title">
        <div className={styles.sectionHeader}>
          <h2 id="problem-title">회계사 채용, 왜 어려울까요?</h2>
          <p>파편화된 채용 정보와 복잡한 조건들 속에서 원하는 공고를 찾기란 쉽지 않습니다.</p>
        </div>
        <div className={styles.problemGrid}>
          {problemCards.map((item) => (
            <article className={styles.problemCard} key={item.title}>
              <IconTile icon={item.icon} size="lg" className={styles.problemIcon} />
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
              필요한 공고를 <span>빠르게</span> 찾고,
              <br />
              <span>정확하게</span> 비교하세요
            </h2>
            <p>
              Accountit는 회계사 채용 공고를 한 곳에 모아 수습 가능 여부,
              KICPA 조건, 직무군, 연차, 마감일 기준으로 정리해 제공합니다.
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
          &quot;회계사의 커리어 여정을
          <br />
          더 <span>빠르고, 더 정확하게</span>&quot;
        </h2>
        <p>
          Accountit는 회계사 여러분의 소중한 시간과 기회를 지키고,
          더 나은 커리어 선택을 할 수 있도록 함께합니다.
        </p>
        <div className={styles.statsGrid}>
          {stats.map((item) => (
            <div className={styles.statCard} key={item.label}>
              <IconTile icon={item.icon} />
              <div>
                <strong>{item.value}</strong>
                <span>{item.label}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.quickSection} aria-labelledby="quick-title">
        <div className={styles.quickPanel}>
          <div className={styles.quickIntro}>
            <h2 id="quick-title">빠른 탐색</h2>
            <p>원하는 공고를 빠르게 찾아보세요</p>
          </div>
          <div className={styles.quickGrid}>
            {quickLinks.map((item) => {
              const params = buildJobFilterParams(quickFilterState(item.values));
              return (
                <Link
                  className={styles.quickCard}
                  href={`/jobs?${params.toString()}`}
                  key={item.label}
                >
                  <IconTile icon={item.icon} size="lg" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
          <ActionLink
            className={styles.quickSearch}
            href="/jobs"
            variant="ghost"
            iconStart={<Search size={16} />}
          >
            전체 공고 검색
          </ActionLink>
        </div>
      </section>
    </main>
  );
}
