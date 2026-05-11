"use client";

import { LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ActionButton, ActionLink } from "@/components/ui/action-button";
import { fetchCurrentUser, logoutRequest, type AuthUser } from "@/lib/api";
import { cn } from "@/lib/utils";
import styles from "./site-nav.module.css";

const navItems = [
  { href: "/", label: "홈", key: "home" },
  { href: "/jobs", label: "채용공고", key: "jobs" },
  { href: "/companies", label: "회사소개", key: "companies" },
  { href: "/calendar", label: "마감일 캘린더", key: "calendar" },
] as const;

type SiteNavProps = {
  variant?: "app" | "landing";
};

export function SiteNav({ variant = "app" }: SiteNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    let ignore = false;
    fetchCurrentUser()
      .then((currentUser) => {
        if (!ignore) setUser(currentUser);
      })
      .catch(() => {
        if (!ignore) setUser(null);
      });
    return () => {
      ignore = true;
    };
  }, [pathname]);
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
                className={cn(styles.navLink, active && styles.active)}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
        <div className={styles.spacer}>
          {user ? (
            <div className={styles.userActions}>
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
          ) : isLanding ? (
            <div className={styles.landingActions}>
              <Link href="/login" className={styles.loginLink}>
                로그인
              </Link>
              <ActionLink href="/login?mode=register" size="sm">
                회원가입
              </ActionLink>
            </div>
          ) : (
            <ActionLink href="/login" size="sm">
              로그인 / 회원가입
            </ActionLink>
          )}
        </div>
      </div>
    </nav>
  );
}
