"use client";

import { LockKeyhole, MessageCircle, PenSquare, RefreshCw, Search } from "lucide-react";
import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SiteNav } from "@/components/site-nav";
import { ActionButton, ActionLink } from "@/components/ui/action-button";
import { getPosts, getTrendingPosts } from "@/lib/community-api";
import {
  BOARD_TYPES,
  boardTypeLabels,
  type BoardType,
  type CommunityPost,
  type SortOrder,
} from "@/lib/community-types";
import { communityDetailHref, communityWriteHref } from "@/lib/routes";
import styles from "./community-page.module.css";

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "방금 전";
  if (m < 60) return `${m}분 전`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}시간 전`;
  const d = Math.floor(h / 24);
  return `${d}일 전`;
}

function statusBadgeClass(status: CommunityPost["status"]): string {
  if (status === "ANSWERED") return styles.badgeAnswered;
  if (status === "INFO") return styles.badgeInfo;
  if (status === "FREE") return styles.badgeFree;
  return styles.badgeQuestion;
}

function statusLabel(status: CommunityPost["status"]): string {
  if (status === "ANSWERED") return "답변완료";
  if (status === "INFO") return "정보";
  if (status === "FREE") return "자유";
  return "질문";
}

function PostRow({ post }: { post: CommunityPost }) {
  return (
    <Link href={communityDetailHref(post.id)} className={styles.postRow}>
      <span className={`${styles.badge} ${statusBadgeClass(post.status)}`}>
        {statusLabel(post.status)}
      </span>
      <div className={styles.postBody}>
        <p className={styles.postTitle}>{post.title}</p>
        {post.tags.length > 0 && (
          <div className={styles.postTags}>
            {post.tags.slice(0, 3).map((tag) => (
              <span key={tag} className={styles.tag}>
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
      <div className={styles.postMeta}>
        <span className={styles.metaItem}>{post.authorName}</span>
        <span className={styles.metaItem}>{relativeTime(post.createdAt)}</span>
        <span className={styles.metaItem}>조회 {post.viewCount}</span>
        <span className={`${styles.metaItem} ${post.commentCount > 0 ? styles.metaComment : ""}`}>
          <MessageCircle size={12} />
          {post.commentCount}
        </span>
      </div>
    </Link>
  );
}

function CommunityPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const activeBoard = (searchParams.get("board") as BoardType | null) ?? "CPA_PREP";

  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [trendingPosts, setTrendingPosts] = useState<CommunityPost[]>([]);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [sort, setSort] = useState<SortOrder>("latest");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;
    void Promise.resolve().then(async () => {
      if (ignore) return;
      setLoading(true);
      setError("");
      try {
        const items = await getPosts({ board: activeBoard, search, sort });
        if (!ignore) setPosts(items);
      } catch (caught) {
        if (!ignore) {
          setPosts([]);
          setError(
            caught instanceof Error
              ? caught.message
              : "게시글을 불러오지 못했습니다.",
          );
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    });
    return () => {
      ignore = true;
    };
  }, [activeBoard, search, sort]);

  useEffect(() => {
    let ignore = false;
    getTrendingPosts()
      .then((items) => {
        if (!ignore) setTrendingPosts(items);
      })
      .catch(() => {
        if (!ignore) setTrendingPosts([]);
      });
    return () => {
      ignore = true;
    };
  }, []);

  function handleSearch() {
    setSearch(searchInput.trim());
  }

  function handleReset() {
    setSearchInput("");
    setSearch("");
    setSort("latest");
  }

  function handleBoardChange(board: BoardType) {
    setSearch("");
    setSearchInput("");
    router.push(`/community?board=${board}`);
  }

  const traineeLocked = activeBoard === "TRAINEE" && Boolean(error);

  return (
    <main className="min-h-screen bg-[var(--background)]">
      <SiteNav />

      <div className="border-b border-[var(--app-line)] bg-[var(--background)]">
        <div className="mx-auto max-w-7xl px-6 pt-6 pb-4">
          <h1 className="text-2xl font-semibold text-gray-900">커뮤니티</h1>
          <p className="mt-1 text-sm leading-relaxed text-gray-500">
            CPA 준비생부터 현직 회계사까지, 경험과 정보를 나누는 공간입니다.
          </p>

          <div className="mt-4 flex items-center gap-2">
            <div className="relative flex-1">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="제목, 내용, 태그로 검색"
                className="w-full rounded-xl border border-[var(--app-line)] bg-white py-2.5 pl-9 pr-4 text-sm outline-none focus:border-[var(--brand)]"
              />
            </div>
            <ActionButton
              type="button"
              iconStart={<Search size={15} />}
              onClick={handleSearch}
            >
              검색
            </ActionButton>
            {(search || searchInput) && (
              <ActionButton
                type="button"
                variant="subtle"
                iconStart={<RefreshCw size={14} />}
                onClick={handleReset}
              >
                초기화
              </ActionButton>
            )}
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-6">
          <div className={styles.boardTabBar}>
            {BOARD_TYPES.map((board) => (
              <button
                key={board}
                type="button"
                onClick={() => handleBoardChange(board)}
                className={`${styles.boardTab} ${activeBoard === board ? styles.boardTabActive : ""}`}
              >
                {boardTypeLabels[board]}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-6">
        <div className={styles.layout}>
          <div className={styles.main}>
            <div className={styles.statsRow}>
              <p className={styles.statsCount}>
                전체 <strong>{posts.length.toLocaleString("ko-KR")}</strong>건
              </p>
              <div className={styles.statsRowRight}>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SortOrder)}
                  className={styles.sortSelect}
                >
                  <option value="latest">최신순</option>
                  <option value="popular">인기순</option>
                </select>
                {traineeLocked ? (
                  <ActionLink href="/mypage" variant="outline" size="sm">
                    CPA 검증하기
                  </ActionLink>
                ) : (
                  <ActionLink
                    href={communityWriteHref(activeBoard)}
                    variant="outline"
                    size="sm"
                    iconStart={<PenSquare size={14} />}
                  >
                    글쓰기
                  </ActionLink>
                )}
              </div>
            </div>

            <div className={styles.postList}>
              {loading ? (
                <div className={styles.emptyState}>게시글을 불러오는 중입니다.</div>
              ) : traineeLocked ? (
                <div className={styles.emptyState}>
                  <LockKeyhole size={22} className="mx-auto mb-2 text-[var(--brand)]" />
                  수습 CPA 방은 CPA 검증이 완료된 개인회원만 입장할 수 있습니다.
                </div>
              ) : error ? (
                <div className={styles.emptyState}>{error}</div>
              ) : posts.length > 0 ? (
                posts.map((post) => <PostRow key={post.id} post={post} />)
              ) : (
                <div className={styles.emptyState}>
                  {search
                    ? `"${search}"에 해당하는 게시글이 없습니다.`
                    : "아직 게시글이 없습니다. 첫 번째 글을 작성해보세요."}
                </div>
              )}
            </div>
          </div>

          <aside className={styles.sidebar}>
            <div className={styles.sidebarSpacer} aria-hidden="true" />

            <div className={styles.sidebarCard}>
              <p className={styles.sidebarCardTitle}>실시간 인기 글</p>
              <div className={styles.trendingList}>
                {trendingPosts.map((post, i) => (
                  <Link
                    key={post.id}
                    href={communityDetailHref(post.id)}
                    className={styles.trendingItem}
                  >
                    <span className={styles.trendingRank}>{i + 1}</span>
                    <span className={styles.trendingTitle}>{post.title}</span>
                    <span className={styles.trendingMeta}>
                      <MessageCircle size={10} />
                      {post.commentCount}
                    </span>
                  </Link>
                ))}
                {!trendingPosts.length && (
                  <span className={styles.trendingTitle}>아직 인기 글이 없습니다.</span>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

export default function CommunityPage() {
  return (
    <Suspense>
      <CommunityPageContent />
    </Suspense>
  );
}
