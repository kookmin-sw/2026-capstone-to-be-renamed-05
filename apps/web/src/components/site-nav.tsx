"use client";

import type { NotificationItem } from "@cpa/shared";
import { Bell, LogOut } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { ActionButton, ActionLink } from "@/components/ui/action-button";
import {
  AUTH_USER_CHANGED_EVENT,
  fetchCurrentUser,
  fetchNotifications,
  fetchNotificationUnreadCount,
  logoutRequest,
  markNotificationRead,
  NOTIFICATIONS_CHANGED_EVENT,
  type AuthUser,
} from "@/lib/api";
import { cn } from "@/lib/utils";
import styles from "./site-nav.module.css";

const navItems = [
  { href: "/", label: "홈", key: "home" },
  { href: "/jobs", label: "채용공고", key: "jobs" },
  { href: "/companies", label: "회사소개", key: "companies" },
  { href: "/calendar", label: "마감일 캘린더", key: "calendar" },
  { href: "/community", label: "커뮤니티", key: "community" },
] as const;

const NOTIFICATION_PREVIEW_SIZE = 5;

type SiteNavProps = {
  variant?: "app" | "landing";
};

export function SiteNav({ variant = "app" }: SiteNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [notificationUnreadCount, setNotificationUnreadCount] = useState(0);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notificationPreview, setNotificationPreview] = useState<
    NotificationItem[]
  >([]);
  const [notificationPreviewLoading, setNotificationPreviewLoading] =
    useState(false);
  const [notificationPreviewError, setNotificationPreviewError] = useState("");
  const notificationPopoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let ignore = false;

    function loadCurrentUser() {
      fetchCurrentUser()
        .then((currentUser) => {
          if (!ignore) setUser(currentUser);
        })
        .catch(() => {
          if (!ignore) setUser(null);
        })
        .finally(() => {
          if (!ignore) setAuthReady(true);
        });
    }

    loadCurrentUser();
    window.addEventListener(AUTH_USER_CHANGED_EVENT, loadCurrentUser);
    return () => {
      ignore = true;
      window.removeEventListener(AUTH_USER_CHANGED_EVENT, loadCurrentUser);
    };
  }, [pathname]);

  useEffect(() => {
    if (user?.role !== "JOB_SEEKER") {
      setNotificationsOpen(false);
      setNotificationPreview([]);
      setNotificationUnreadCount(0);
      return;
    }

    let ignore = false;

    function loadNotificationCount() {
      fetchNotificationUnreadCount()
        .then((result) => {
          if (!ignore) setNotificationUnreadCount(result.unreadCount);
        })
        .catch(() => {
          if (!ignore) setNotificationUnreadCount(0);
        });
    }

    loadNotificationCount();
    window.addEventListener(
      NOTIFICATIONS_CHANGED_EVENT,
      loadNotificationCount,
    );
    return () => {
      ignore = true;
      window.removeEventListener(
        NOTIFICATIONS_CHANGED_EVENT,
        loadNotificationCount,
      );
    };
  }, [pathname, user?.id, user?.role]);

  const loadNotificationPreview = useCallback(async () => {
    if (user?.role !== "JOB_SEEKER") return;

    setNotificationPreviewLoading(true);
    setNotificationPreviewError("");
    try {
      const result = await fetchNotifications({
        page: 1,
        pageSize: NOTIFICATION_PREVIEW_SIZE,
      });
      setNotificationPreview(result.items);
      setNotificationUnreadCount(result.unreadCount);
    } catch (error) {
      setNotificationPreviewError(
        error instanceof Error ? error.message : "알림을 불러오지 못했습니다.",
      );
    } finally {
      setNotificationPreviewLoading(false);
    }
  }, [user?.id, user?.role]);

  useEffect(() => {
    if (!notificationsOpen) return;

    void loadNotificationPreview();
  }, [loadNotificationPreview, notificationsOpen]);

  useEffect(() => {
    if (!notificationsOpen) return;

    function closeOnOutsidePointerDown(event: PointerEvent) {
      if (
        notificationPopoverRef.current?.contains(event.target as Node) === false
      ) {
        setNotificationsOpen(false);
      }
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setNotificationsOpen(false);
    }

    document.addEventListener("pointerdown", closeOnOutsidePointerDown);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePointerDown);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [notificationsOpen]);

  const isLanding = variant === "landing";

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  const roleItems = [
    ...(user?.role === "JOB_SEEKER"
      ? [{ href: "/mypage", label: "마이페이지", key: "mypage" }]
      : []),
    ...(user?.role === "COMPANY"
      ? [{ href: "/company", label: "기업 관리", key: "company" }]
      : []),
    ...(user?.role === "ADMIN"
      ? [{ href: "/admin", label: "Admin", key: "admin" }]
      : []),
  ];

  const loginHref =
    pathname.startsWith("/mypage") || pathname.startsWith("/company")
      ? `/login?next=${encodeURIComponent(pathname)}`
      : "/login";

  async function logout() {
    if (loggingOut) return;

    setLoggingOut(true);
    try {
      await logoutRequest();
      setUser(null);
      if (pathname.startsWith("/company") || pathname.startsWith("/mypage")) {
        router.replace("/login");
      } else {
        router.refresh();
      }
    } catch (error) {
      window.alert(
        error instanceof Error ? error.message : "로그아웃에 실패했습니다.",
      );
    } finally {
      setLoggingOut(false);
    }
  }

  async function markPreviewNotificationRead(id: string) {
    const current = notificationPreview.find((item) => item.id === id);
    if (!current || current.readAt) return;

    try {
      const updated = await markNotificationRead(id);
      setNotificationPreview((prev) =>
        prev.map((item) => (item.id === id ? updated : item)),
      );
      setNotificationUnreadCount((count) => Math.max(0, count - 1));
      window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED_EVENT));
    } catch {
      // The destination navigation should not be blocked by a read-state update.
    }
  }

  return (
    <nav className={cn(styles.nav, isLanding && styles.landingNav)}>
      <div className={styles.inner}>
        <Link href="/" className={styles.logo}>
          <span className={styles.logoMark} aria-hidden="true" />
          <span>
            Account<span className={styles.logoAccent}>it</span>
          </span>
        </Link>
        <div className={styles.links}>
          {[...navItems, ...roleItems].map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.key}
                href={item.href}
                className={cn(
                  styles.navLink,
                  item.key === "company" && styles.companyNavLink,
                  active && styles.active,
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
        <div className={styles.spacer}>
          {!authReady ? null : user ? (
            <div className={styles.userActions}>
              {user.role === "JOB_SEEKER" && (
                <div
                  className={styles.notificationPopoverWrap}
                  ref={notificationPopoverRef}
                >
                  <button
                    type="button"
                    className={styles.notificationLink}
                    aria-expanded={notificationsOpen}
                    aria-haspopup="dialog"
                    aria-label={`알림 ${notificationUnreadCount}개`}
                    onClick={() => setNotificationsOpen((open) => !open)}
                  >
                    <Bell size={17} />
                    {notificationUnreadCount > 0 && (
                      <span className={styles.notificationBadge}>
                        {notificationUnreadCount > 99
                          ? "99+"
                          : notificationUnreadCount}
                      </span>
                    )}
                  </button>
                  {notificationsOpen && (
                    <div
                      className={styles.notificationPopover}
                      role="dialog"
                      aria-label="알림"
                    >
                      <div className={styles.notificationPopoverHeader}>
                        <div>
                          <p>알림</p>
                          <span>
                            읽지 않음{" "}
                            {notificationUnreadCount.toLocaleString("ko-KR")}개
                          </span>
                        </div>
                        <Link
                          href="/mypage/notifications"
                          className={styles.notificationAllLink}
                          onClick={() => setNotificationsOpen(false)}
                        >
                          전체 보기
                        </Link>
                      </div>
                      <div className={styles.notificationPopoverList}>
                        {notificationPreviewLoading ? (
                          <div className={styles.notificationEmpty}>
                            알림을 불러오는 중입니다.
                          </div>
                        ) : notificationPreviewError ? (
                          <div className={styles.notificationError}>
                            {notificationPreviewError}
                          </div>
                        ) : notificationPreview.length ? (
                          notificationPreview.map((item) => (
                            <Link
                              key={item.id}
                              href={item.href}
                              className={cn(
                                styles.notificationItem,
                                !item.readAt && styles.notificationUnread,
                              )}
                              onClick={() => {
                                void markPreviewNotificationRead(item.id);
                                setNotificationsOpen(false);
                              }}
                            >
                              <div className={styles.notificationTitleRow}>
                                {!item.readAt && (
                                  <span
                                    className={styles.unreadDot}
                                    aria-hidden="true"
                                  />
                                )}
                                <span>{notificationTypeLabel(item.type)}</span>
                                <strong>{item.title}</strong>
                              </div>
                              <p>{item.body}</p>
                              <time dateTime={item.createdAt}>
                                {formatNotificationDateTime(item.createdAt)}
                              </time>
                            </Link>
                          ))
                        ) : (
                          <div className={styles.notificationEmpty}>
                            표시할 알림이 없습니다.
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
              {user.profileImageUrl && (
                <span className={styles.userAvatar}>
                  <Image
                    src={user.profileImageUrl}
                    alt={`${user.displayName ?? user.username} 프로필 사진`}
                    width={29}
                    height={29}
                  />
                </span>
              )}
              <span className={styles.userName}>
                {user.displayName ?? user.username}
              </span>
              <ActionButton
                type="button"
                variant="subtle"
                size="sm"
                disabled={loggingOut}
                iconStart={<LogOut size={14} />}
                onClick={logout}
              >
                {loggingOut ? "로그아웃 중" : "로그아웃"}
              </ActionButton>
            </div>
          ) : (
            <div className={styles.guestActions}>
              <Link href={loginHref} className={styles.loginLink}>
                로그인
              </Link>
              <ActionLink href="/login?mode=register" size="sm">
                회원가입
              </ActionLink>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

function notificationTypeLabel(type: NotificationItem["type"]) {
  if (type === "BOOKMARK_DEADLINE_SOON") return "관심 공고";
  if (type === "BOOKMARK_STATUS_CHANGED") return "관심 공고";
  return "태그";
}

function formatNotificationDateTime(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
