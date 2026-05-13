'use client';

import { Eye, LockKeyhole, MessageCircle, PenSquare, Search } from 'lucide-react';
import Link from 'next/link';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { SiteNav } from '@/components/site-nav';
import { ActionLink } from '@/components/ui/action-button';
import { FilterSelect } from '@/components/ui/filter-select';
import { Pagination } from '@/components/ui/pagination';
import { fetchCurrentUser } from '@/lib/api';
import { CommunityHero } from './_components/community-hero';
import { PostListItem } from './_components/post-list-item';
import { getPosts, getTrendingPosts } from '@/lib/community-api';
import {
  BOARD_TYPES,
  boardTypeLabels,
  type BoardType,
  type CommunityPost,
  type SortOrder,
} from '@/lib/community-types';
import { communityDetailHref, communityWriteHref } from '@/lib/routes';
import styles from './community-page.module.css';

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return '방금 전';
  if (m < 60) return `${m}분 전`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}시간 전`;
  const d = Math.floor(h / 24);
  return `${d}일 전`;
}

const POSTS_PER_PAGE = 10;

function CommunityPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const activeBoard = (searchParams.get('board') as BoardType | null) ?? 'CPA_PREP';
  const mineOnly = searchParams.get('mine') === 'true';
  const queryString = searchParams.toString();

  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [trendingPosts, setTrendingPosts] = useState<CommunityPost[]>([]);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [sort, setSort] = useState<SortOrder>('latest');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [activeBoard, search, sort, mineOnly]);

  useEffect(() => {
    let ignore = false;
    void Promise.resolve().then(async () => {
      if (ignore) return;
      setLoading(true);
      setError('');
      try {
        if (mineOnly) {
          const user = await fetchCurrentUser();
          if (!user) {
            const next = `/community${queryString ? `?${queryString}` : ''}`;
            router.replace(`/login?next=${encodeURIComponent(next)}`);
            return;
          }
        }

        const items = await getPosts({
          board: activeBoard,
          search,
          sort,
          mine: mineOnly,
        });
        if (!ignore) setPosts(items);
      } catch (caught) {
        if (!ignore) {
          setPosts([]);
          setError(caught instanceof Error ? caught.message : '게시글을 불러오지 못했습니다.');
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    });
    return () => {
      ignore = true;
    };
  }, [activeBoard, mineOnly, queryString, router, search, sort]);

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

  const totalPages = Math.ceil(posts.length / POSTS_PER_PAGE);
  const paginatedPosts = useMemo(
    () => posts.slice((page - 1) * POSTS_PER_PAGE, page * POSTS_PER_PAGE),
    [posts, page],
  );

  function handleSearch() {
    setSearch(searchInput.trim());
  }

  function handleBoardChange(board: BoardType) {
    setSearch('');
    setSearchInput('');
    const params = new URLSearchParams(queryString);
    params.set('board', board);
    router.push(`/community?${params.toString()}`);
  }

  function handleMineChange(checked: boolean) {
    const params = new URLSearchParams(queryString);
    if (checked) {
      params.set('mine', 'true');
    } else {
      params.delete('mine');
    }
    router.push(`/community?${params.toString()}`);
  }

  const traineeLocked = activeBoard === 'TRAINEE' && Boolean(error);

  return (
    <main className="min-h-screen bg-[var(--background)]">
      <SiteNav />

      <CommunityHero />

      <div className="border-b border-[var(--app-line)] bg-white">
        <div className="mx-auto max-w-7xl px-6">
          <div className={styles.boardTabBar}>
            {BOARD_TYPES.map((board) => (
              <button
                key={board}
                type="button"
                onClick={() => handleBoardChange(board)}
                className={`${styles.boardTab} ${activeBoard === board ? styles.boardTabActive : ''}`}
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
            <div className={styles.boardToolbar}>
              <p className={styles.statsCount}>
                전체 <strong>{posts.length.toLocaleString('ko-KR')}</strong>건
              </p>
              <FilterSelect
                label="정렬"
                hideLabel
                value={sort}
                options={[
                  { value: 'latest', label: '최신순' },
                  { value: 'popular', label: '인기순' },
                ]}
                onChange={(value) => setSort(value as SortOrder)}
                className={styles.sortSelect}
              />
              <label className={styles.mineFilter}>
                <input
                  type="checkbox"
                  checked={mineOnly}
                  onChange={(event) => handleMineChange(event.currentTarget.checked)}
                />
                <span>내가 쓴 글</span>
              </label>
              <form
                className={styles.searchInputWrap}
                onSubmit={(event) => {
                  event.preventDefault();
                  handleSearch();
                }}
              >
                <input
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder={`${boardTypeLabels[activeBoard]}에서 검색`}
                  className={styles.searchInput}
                />
                <button type="submit" className={styles.searchSubmitButton} aria-label="검색">
                  <Search size={14} />
                </button>
              </form>
              {traineeLocked ? (
                <ActionLink href="/mypage" variant="outline" className={styles.writeButton}>
                  CPA 검증하기
                </ActionLink>
              ) : (
                <ActionLink
                  href={communityWriteHref(activeBoard)}
                  variant="outline"
                  className={styles.writeButton}
                  iconStart={<PenSquare size={14} />}
                >
                  글쓰기
                </ActionLink>
              )}
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
              ) : paginatedPosts.length > 0 ? (
                paginatedPosts.map((post) => <PostListItem key={post.id} post={post} />)
              ) : (
                <div className={styles.emptyState}>
                  {search
                    ? mineOnly
                      ? `"${search}"에 해당하는 내가 쓴 글이 없습니다.`
                      : `"${search}"에 해당하는 게시글이 없습니다.`
                    : mineOnly
                      ? '이 게시판에 내가 쓴 글이 없습니다.'
                      : '아직 게시글이 없습니다. 첫 번째 글을 작성해보세요.'}
                </div>
              )}
            </div>

            {!loading && !error && totalPages > 1 && (
              <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
            )}
          </div>

          <aside className={styles.sidebar}>
            <div className={styles.sidebarCard}>
              <p className={styles.sidebarCardTitle}>실시간 인기글</p>
              <div className={styles.trendingList}>
                {trendingPosts.length > 0 ? (
                  trendingPosts.map((post, i) => (
                    <Link key={post.id} href={communityDetailHref(post.id)} className={styles.trendingItem}>
                      <span className={i < 3 ? styles.trendingRankTop : styles.trendingRankRest}>
                        {i + 1}
                      </span>
                      <span className={styles.trendingBody}>
                        <span className={styles.trendingTitle}>{post.title}</span>
                        <span className={styles.trendingMeta}>
                          <MessageCircle size={10} />
                          {post.commentCount}
                          <Eye size={10} />
                          {post.viewCount.toLocaleString('ko-KR')}
                          · {relativeTime(post.createdAt)}
                        </span>
                      </span>
                    </Link>
                  ))
                ) : (
                  <span className={styles.trendingTitle}>아직 인기글이 없습니다.</span>
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
