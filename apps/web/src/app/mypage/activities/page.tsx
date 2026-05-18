"use client";

import type { CommunityBoardType, MyCommunityActivityItem } from "@cpa/shared";
import { MessageCircle } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { SiteNav } from "@/components/site-nav";
import { ActionLink } from "@/components/ui/action-button";
import { Pagination } from "@/components/ui/pagination";
import { fetchCurrentUser, fetchMyCommunityActivity } from "@/lib/api";
import { logClientError } from "@/lib/client-logger";
import { communityDetailHref } from "@/lib/routes";
import styles from "../mypage.module.css";

const PAGE_SIZE = 10;

const boardLabels: Record<CommunityBoardType, string> = {
  CPA_PREP: "질문게시판",
  TRAINEE: "수습 CPA방",
  SENIOR: "선배 CPA Q&A",
  FREE: "비밀게시판",
};

export default function MyActivitiesPage() {
  return (
    <Suspense fallback={<ActivitiesShell loading />}>
      <MyActivitiesPageContent />
    </Suspense>
  );
}

function MyActivitiesPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryString = searchParams.toString();
  const page = normalizePage(searchParams.get("page"));

  const [activities, setActivities] = useState<MyCommunityActivityItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const user = await fetchCurrentUser();
        if (!user) {
          const next = `/mypage/activities${queryString ? `?${queryString}` : ""}`;
          router.replace(`/login?next=${encodeURIComponent(next)}`);
          return;
        }
        if (user.role !== "JOB_SEEKER") {
          if (!ignore) {
            setAuthorized(false);
            setActivities([]);
            setTotal(0);
          }
          return;
        }

        if (!ignore) setAuthorized(true);
        const result = await fetchMyCommunityActivity({
          page,
          pageSize: PAGE_SIZE,
        });
        if (ignore) return;

        const lastPage = Math.max(1, Math.ceil(result.total / PAGE_SIZE));
        if (result.total > 0 && page > lastPage) {
          router.replace(`/mypage/activities?page=${lastPage}`);
          return;
        }

        setActivities(result.items);
        setTotal(result.total);
      } catch (caught) {
        if (!ignore) {
          logClientError("mypage.activities_load_failed", caught, { page });
          setActivities([]);
          setTotal(0);
          setError(
            caught instanceof Error
              ? caught.message
              : "커뮤니티 활동을 불러오지 못했습니다.",
          );
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    void load();
    return () => {
      ignore = true;
    };
  }, [page, queryString, router]);

  function handlePageChange(nextPage: number) {
    const params = new URLSearchParams(queryString);
    if (nextPage <= 1) {
      params.delete("page");
    } else {
      params.set("page", String(nextPage));
    }
    const query = params.toString();
    router.push(`/mypage/activities${query ? `?${query}` : ""}`);
  }

  if (loading) return <ActivitiesShell loading />;

  if (!authorized) {
    return (
      <>
        <SiteNav />
        <main className={styles.page}>
          <div className={styles.authCard}>
            <h1 className={styles.authTitle}>내 커뮤니티 활동</h1>
            <p className={styles.authError}>
              개인회원 로그인이 필요한 페이지입니다.
            </p>
            <ActionLink
              href={`/login?next=${encodeURIComponent("/mypage/activities")}`}
              className={styles.authAction}
            >
              로그인
            </ActionLink>
          </div>
        </main>
      </>
    );
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <ActivitiesShell
      activities={activities}
      error={error}
      page={page}
      total={total}
      totalPages={totalPages}
      onPageChange={handlePageChange}
    />
  );
}

function ActivitiesShell({
  activities = [],
  error = "",
  loading = false,
  page = 1,
  total = 0,
  totalPages = 1,
  onPageChange,
}: {
  activities?: MyCommunityActivityItem[];
  error?: string;
  loading?: boolean;
  page?: number;
  total?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
}) {
  return (
    <>
      <SiteNav />
      <main className={styles.page}>
        <div className={styles.container}>
          <section className={styles.panel}>
            <div className={styles.panelHeader}>
              <h2>
                <MessageCircle size={17} />내 커뮤니티 활동
              </h2>
              <Link href="/mypage" className={styles.textButton}>
                마이페이지로
              </Link>
            </div>
            <p className={styles.activityPageSummary}>
              내가 쓴 글 전체 {total.toLocaleString("ko-KR")}개
            </p>

            {loading ? (
              <div className={styles.empty}>커뮤니티 활동을 불러오는 중입니다.</div>
            ) : error ? (
              <div className={styles.empty}>{error}</div>
            ) : activities.length ? (
              <>
                <div className={styles.activityList}>
                  {activities.map((activity) => (
                    <Link
                      key={activity.id}
                      href={communityDetailHref(activity.id)}
                      className={styles.activityItem}
                    >
                      <div className={styles.activityTitle}>
                        <span>{boardLabels[activity.boardType]}</span>
                        <span>{activity.title}</span>
                      </div>
                      <div className={styles.activityMeta}>
                        댓글 {activity.commentCount} · 좋아요{" "}
                        {activity.likeCount} · {formatDate(activity.createdAt)}
                      </div>
                    </Link>
                  ))}
                </div>
                {onPageChange && (
                  <Pagination
                    page={page}
                    totalPages={totalPages}
                    onPageChange={onPageChange}
                  />
                )}
              </>
            ) : (
              <div className={styles.empty}>아직 작성한 글이 없습니다.</div>
            )}
          </section>
        </div>
      </main>
    </>
  );
}

function normalizePage(value: string | null) {
  const page = Number(value);
  if (!Number.isFinite(page) || page < 1) return 1;
  return Math.floor(page);
}

function formatDate(iso: string) {
  const date = new Date(iso);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}.${month}.${day}`;
}
