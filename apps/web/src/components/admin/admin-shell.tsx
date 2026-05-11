"use client";

import {
  BriefcaseBusiness,
  Building2,
  ClipboardCheck,
  FileText,
  LayoutDashboard,
  LogOut,
  Server,
  Sparkles,
  UserCheck,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  fetchAdminCurrentUser,
  getAdminDemoUser,
  logoutAdminDemo,
  type AdminUser,
} from "@/components/admin/admin-demo-data";
import { cn } from "@/lib/utils";
import styles from "./admin.module.css";

const navItems = [
  { href: "/admin", label: "대시보드", icon: LayoutDashboard },
  { href: "/admin/job-submissions", label: "공고 검수", icon: ClipboardCheck },
  { href: "/admin/profile-submissions", label: "회사 프로필 검수", icon: FileText },
  { href: "/admin/cpa-verifications", label: "CPA 검증", icon: UserCheck },
  { href: "/admin/ai-suggestions", label: "AI 제안 검수", icon: Sparkles },
  { href: "/admin/jobs", label: "등록 공고", icon: BriefcaseBusiness },
  { href: "/admin/companies", label: "등록 회사", icon: Building2 },
  { href: "/admin/members", label: "회원 목록", icon: Users },
  { href: "/admin/sources", label: "출처 관리", icon: Server },
] as const;

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isLoginPage = pathname === "/admin/login";
  const [user, setUser] = useState<AdminUser | null>(null);
  const [checking, setChecking] = useState(!isLoginPage);

  useEffect(() => {
    if (isLoginPage) return;
    let ignore = false;
    const timer = window.setTimeout(() => {
      void fetchAdminCurrentUser().then((nextUser) => {
        if (ignore) return;
        if (!nextUser) {
          const fallbackUser = getAdminDemoUser();
          if (fallbackUser) {
            setUser(fallbackUser);
            setChecking(false);
            return;
          }
          router.replace("/admin/login");
        }
        setUser(nextUser);
        setChecking(false);
      });
    }, 0);
    return () => {
      ignore = true;
      window.clearTimeout(timer);
    };
  }, [isLoginPage, router]);

  const pageTitle = useMemo(() => {
    if (pathname.startsWith("/admin/job-submissions")) return "공고 검수";
    if (pathname.startsWith("/admin/profile-submissions")) {
      return "회사 프로필 검수";
    }
    if (pathname.startsWith("/admin/cpa-verifications")) return "CPA 검증";
    if (pathname.startsWith("/admin/ai-suggestions")) return "AI 제안 검수";
    if (pathname.startsWith("/admin/sources")) return "출처 관리";
    if (pathname.startsWith("/admin/jobs")) return "등록 공고";
    if (pathname.startsWith("/admin/companies")) return "등록 회사";
    if (pathname.startsWith("/admin/members")) return "회원 목록";
    return "대시보드";
  }, [pathname]);

  async function logout() {
    await logoutAdminDemo();
    router.replace("/admin/login");
  }

  if (isLoginPage) return <>{children}</>;

  if (checking) {
    return (
      <main className={styles.authNotice}>
        관리자 접근 권한을 확인하는 중입니다.
      </main>
    );
  }

  if (!user) {
    return (
      <main className={styles.authNotice}>
        관리자 로그인 화면으로 이동하는 중입니다.
      </main>
    );
  }

  return (
    <main className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.brandBlock}>
          <div>
            <p className={styles.brandName}>
              Account<span className={styles.brandAccent}>it</span>
            </p>
            <p className={styles.brandCaption}>prototype admin</p>
          </div>
        </div>
        <nav className={styles.nav}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const active =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(styles.navLink, active && styles.navLinkActive)}
              >
                <Icon size={16} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <section className={styles.content}>
        <header className={styles.topbar}>
          <div>
            <h1 className={styles.topbarTitle}>{pageTitle}</h1>
            <p className={styles.topbarCaption}>
              운영 데이터와 검수 상태를 관리합니다.
            </p>
          </div>
          <div className={styles.userArea}>
            <div className={styles.userText}>
              <p className={styles.userName}>
                {user.displayName ?? user.username}
              </p>
              <p className={styles.userSubtext}>{user.username}</p>
            </div>
            <button
              type="button"
              onClick={logout}
              className={styles.logoutButton}
            >
              <LogOut size={15} />
              로그아웃
            </button>
          </div>
        </header>
        <div className={styles.pageBody}>{children}</div>
      </section>
    </main>
  );
}
