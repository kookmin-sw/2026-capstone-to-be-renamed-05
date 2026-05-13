"use client";

import type { NotificationItem, TagSubscriptionItem } from "@cpa/shared";
import { Bell, CheckCheck, Tag } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { SiteNav } from "@/components/site-nav";
import { ActionButton, ActionLink } from "@/components/ui/action-button";
import { Pagination } from "@/components/ui/pagination";
import {
  fetchCurrentUser,
  fetchNotifications,
  fetchTagSubscriptions,
  markAllNotificationsRead,
  markNotificationRead,
  NOTIFICATIONS_CHANGED_EVENT,
  subscribeTag,
  unsubscribeTag,
} from "@/lib/api";
import { cn } from "@/lib/utils";
import styles from "../mypage.module.css";

const PAGE_SIZE = 10;

export default function MyNotificationsPage() {
  return (
    <Suspense fallback={<NotificationsShell loading />}>
      <MyNotificationsPageContent />
    </Suspense>
  );
}

function MyNotificationsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryString = searchParams.toString();
  const page = normalizePage(searchParams.get("page"));
  const unreadOnly = searchParams.get("unreadOnly") === "true";

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [tags, setTags] = useState<TagSubscriptionItem[]>([]);
  const [total, setTotal] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [updatingAllRead, setUpdatingAllRead] = useState(false);
  const [updatingTagId, setUpdatingTagId] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    async function load() {
      setLoading(true);
      setError("");
      setMessage("");
      try {
        const user = await fetchCurrentUser();
        if (!user) {
          const next = `/mypage/notifications${queryString ? `?${queryString}` : ""}`;
          router.replace(`/login?next=${encodeURIComponent(next)}`);
          return;
        }
        if (user.role !== "JOB_SEEKER") {
          if (!ignore) {
            setAuthorized(false);
            setNotifications([]);
            setTags([]);
            setTotal(0);
            setUnreadCount(0);
          }
          return;
        }

        if (!ignore) setAuthorized(true);
        const [notificationResult, tagResult] = await Promise.all([
          fetchNotifications({ page, pageSize: PAGE_SIZE, unreadOnly }),
          fetchTagSubscriptions(),
        ]);
        if (ignore) return;

        const lastPage = Math.max(
          1,
          Math.ceil(notificationResult.total / PAGE_SIZE),
        );
        if (notificationResult.total > 0 && page > lastPage) {
          const params = new URLSearchParams(queryString);
          params.set("page", String(lastPage));
          router.replace(`/mypage/notifications?${params.toString()}`);
          return;
        }

        setNotifications(notificationResult.items);
        setTotal(notificationResult.total);
        setUnreadCount(notificationResult.unreadCount);
        setTags(tagResult.items);
        notifyNotificationsChanged();
      } catch (caught) {
        if (!ignore) {
          setNotifications([]);
          setTags([]);
          setTotal(0);
          setUnreadCount(0);
          setError(
            caught instanceof Error
              ? caught.message
              : "알림을 불러오지 못했습니다.",
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
  }, [page, queryString, router, unreadOnly]);

  function handlePageChange(nextPage: number) {
    const params = new URLSearchParams(queryString);
    if (nextPage <= 1) {
      params.delete("page");
    } else {
      params.set("page", String(nextPage));
    }
    const query = params.toString();
    router.push(`/mypage/notifications${query ? `?${query}` : ""}`);
  }

  function handleUnreadFilter(nextUnreadOnly: boolean) {
    const params = new URLSearchParams(queryString);
    params.delete("page");
    if (nextUnreadOnly) {
      params.set("unreadOnly", "true");
    } else {
      params.delete("unreadOnly");
    }
    const query = params.toString();
    router.push(`/mypage/notifications${query ? `?${query}` : ""}`);
  }

  async function handleRead(id: string) {
    const current = notifications.find((item) => item.id === id);
    if (!current || current.readAt) return;
    try {
      const updated = await markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((item) => (item.id === id ? updated : item)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      notifyNotificationsChanged();
    } catch (caught) {
      setMessage(
        caught instanceof Error ? caught.message : "알림 읽음 처리에 실패했습니다.",
      );
    }
  }

  async function handleReadAll() {
    if (updatingAllRead || unreadCount === 0) return;
    setUpdatingAllRead(true);
    setMessage("");
    try {
      await markAllNotificationsRead();
      const readAt = new Date().toISOString();
      setNotifications((prev) =>
        prev.map((item) => ({ ...item, readAt: item.readAt ?? readAt })),
      );
      setUnreadCount(0);
      notifyNotificationsChanged();
      setMessage("모든 알림을 읽음 처리했습니다.");
    } catch (caught) {
      setMessage(
        caught instanceof Error
          ? caught.message
          : "알림 전체 읽음 처리에 실패했습니다.",
      );
    } finally {
      setUpdatingAllRead(false);
    }
  }

  async function handleToggleTag(tagItem: TagSubscriptionItem) {
    if (updatingTagId) return;
    setUpdatingTagId(tagItem.id);
    setMessage("");
    try {
      if (tagItem.subscribed) {
        await unsubscribeTag(tagItem.id);
      } else {
        await subscribeTag(tagItem.id);
      }
      setTags((prev) =>
        prev.map((item) =>
          item.id === tagItem.id
            ? { ...item, subscribed: !tagItem.subscribed }
            : item,
        ),
      );
      notifyNotificationsChanged();
    } catch (caught) {
      setMessage(
        caught instanceof Error ? caught.message : "태그 구독 변경에 실패했습니다.",
      );
    } finally {
      setUpdatingTagId(null);
    }
  }

  if (loading) return <NotificationsShell loading />;

  if (!authorized) {
    return (
      <>
        <SiteNav />
        <main className={styles.page}>
          <div className={styles.authCard}>
            <h1 className={styles.authTitle}>알림</h1>
            <p className={styles.authError}>
              개인회원 로그인이 필요한 페이지입니다.
            </p>
            <ActionLink
              href={`/login?next=${encodeURIComponent("/mypage/notifications")}`}
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
    <NotificationsShell
      notifications={notifications}
      tags={tags}
      error={error}
      message={message}
      page={page}
      total={total}
      totalPages={totalPages}
      unreadCount={unreadCount}
      unreadOnly={unreadOnly}
      updatingAllRead={updatingAllRead}
      updatingTagId={updatingTagId}
      onPageChange={handlePageChange}
      onRead={handleRead}
      onReadAll={handleReadAll}
      onToggleUnreadFilter={handleUnreadFilter}
      onToggleTag={handleToggleTag}
    />
  );
}

function NotificationsShell({
  notifications = [],
  tags = [],
  error = "",
  message = "",
  loading = false,
  page = 1,
  total = 0,
  totalPages = 1,
  unreadCount = 0,
  unreadOnly = false,
  updatingAllRead = false,
  updatingTagId = null,
  onPageChange,
  onRead,
  onReadAll,
  onToggleUnreadFilter,
  onToggleTag,
}: {
  notifications?: NotificationItem[];
  tags?: TagSubscriptionItem[];
  error?: string;
  message?: string;
  loading?: boolean;
  page?: number;
  total?: number;
  totalPages?: number;
  unreadCount?: number;
  unreadOnly?: boolean;
  updatingAllRead?: boolean;
  updatingTagId?: string | null;
  onPageChange?: (page: number) => void;
  onRead?: (id: string) => void;
  onReadAll?: () => void;
  onToggleUnreadFilter?: (unreadOnly: boolean) => void;
  onToggleTag?: (tag: TagSubscriptionItem) => void;
}) {
  return (
    <>
      <SiteNav />
      <main className={styles.page}>
        <div className={styles.container}>
          <section className={styles.panel}>
            <div className={styles.panelHeader}>
              <h2>
                <Bell size={17} />
                알림
              </h2>
              <Link href="/mypage" className={styles.textButton}>
                마이페이지로
              </Link>
            </div>
            <div className={styles.notificationToolbar}>
              <p className={styles.activityPageSummary}>
                전체 {total.toLocaleString("ko-KR")}개 · 읽지 않음{" "}
                {unreadCount.toLocaleString("ko-KR")}개
              </p>
              <div className={styles.filterRow}>
                <button
                  type="button"
                  className={cn(
                    styles.filterBtn,
                    !unreadOnly && styles.filterBtnActive,
                  )}
                  onClick={() => onToggleUnreadFilter?.(false)}
                >
                  전체
                </button>
                <button
                  type="button"
                  className={cn(
                    styles.filterBtn,
                    unreadOnly && styles.filterBtnActive,
                  )}
                  onClick={() => onToggleUnreadFilter?.(true)}
                >
                  읽지 않음
                </button>
                <ActionButton
                  type="button"
                  size="sm"
                  variant="outline"
                  iconStart={<CheckCheck size={14} />}
                  disabled={updatingAllRead || unreadCount === 0}
                  onClick={onReadAll}
                >
                  전체 읽음
                </ActionButton>
              </div>
            </div>

            {message && <div className={styles.message}>{message}</div>}

            {loading ? (
              <div className={styles.empty}>알림을 불러오는 중입니다.</div>
            ) : error ? (
              <div className={styles.empty}>{error}</div>
            ) : notifications.length ? (
              <>
                <div className={styles.notificationList}>
                  {notifications.map((item) => (
                    <NotificationRow
                      key={item.id}
                      item={item}
                      onRead={onRead}
                    />
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
              <div className={styles.empty}>표시할 알림이 없습니다.</div>
            )}
          </section>

          <section className={styles.panel}>
            <div className={styles.panelHeader}>
              <h2>
                <Tag size={17} />
                태그 알림
              </h2>
            </div>
            {loading ? (
              <div className={styles.empty}>태그를 불러오는 중입니다.</div>
            ) : tags.length ? (
              <div className={styles.tagSubscriptionGrid}>
                {tags.map((tagItem) => (
                  <button
                    key={tagItem.id}
                    type="button"
                    className={cn(
                      styles.tagSubscriptionButton,
                      tagItem.subscribed && styles.tagSubscriptionButtonActive,
                    )}
                    disabled={updatingTagId === tagItem.id}
                    onClick={() => onToggleTag?.(tagItem)}
                  >
                    <span
                      className={styles.tagColor}
                      style={{ backgroundColor: tagItem.color ?? "#e8457a" }}
                      aria-hidden="true"
                    />
                    <span>{tagItem.name}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className={styles.empty}>구독할 수 있는 태그가 없습니다.</div>
            )}
          </section>
        </div>
      </main>
    </>
  );
}

function NotificationRow({
  item,
  onRead,
}: {
  item: NotificationItem;
  onRead?: (id: string) => void;
}) {
  const unread = !item.readAt;

  return (
    <Link
      href={item.href}
      className={cn(styles.notificationItem, unread && styles.notificationUnread)}
      onClick={() => onRead?.(item.id)}
    >
      <div className={styles.notificationMain}>
        <div className={styles.notificationTitleRow}>
          {unread && <span className={styles.unreadDot} aria-hidden="true" />}
          <span>{notificationTypeLabel(item.type)}</span>
          <strong>{item.title}</strong>
        </div>
        <p>{item.body}</p>
        <time dateTime={item.createdAt}>{formatDateTime(item.createdAt)}</time>
      </div>
    </Link>
  );
}

function notificationTypeLabel(type: NotificationItem["type"]) {
  if (type === "BOOKMARK_DEADLINE_SOON") return "관심 공고";
  if (type === "BOOKMARK_STATUS_CHANGED") return "관심 공고";
  return "태그";
}

function normalizePage(value: string | null) {
  const number = Number(value);
  if (!Number.isInteger(number) || number < 1) return 1;
  return number;
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function notifyNotificationsChanged() {
  window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED_EVENT));
}
