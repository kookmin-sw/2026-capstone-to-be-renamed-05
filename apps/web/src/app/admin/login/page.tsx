"use client";

import { ShieldCheck } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";
import { loginAdminDemo } from "@/components/admin/admin-demo-data";
import styles from "@/components/admin/admin.module.css";
import { cn } from "@/lib/utils";

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<main className={styles.loginPage} />}>
      <AdminLoginPageContent />
    </Suspense>
  );
}

function AdminLoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState("test001");
  const [password, setPassword] = useState("password123");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const nextPath = getSafeAdminNextPath(searchParams.get("next"));

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setSubmitting(true);
    try {
      await loginAdminDemo(username, password);
      router.replace(nextPath ?? "/admin");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "관리자 로그인에 실패했습니다.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className={styles.loginPage}>
      <div className={styles.loginWrap}>
        <div className={styles.loginBrand}>
          <p className={styles.loginBrandName}>
            Account<span className={styles.brandAccent}>it</span>
          </p>
          <p className={styles.pageDescription}>prototype admin</p>
        </div>

        <div className={styles.loginCard}>
          <div className={styles.loginHeader}>
            <ShieldCheck size={22} className={styles.loginIcon} />
            <div>
              <h1 className={styles.loginTitle}>관리자 로그인</h1>
              <p className={styles.topbarCaption}>test 계정 전용 접근</p>
            </div>
          </div>

          <form className={styles.loginForm} onSubmit={submit}>
            <label className={styles.field}>
              아이디
              <input
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                className={styles.input}
                autoComplete="username"
              />
            </label>
            <label className={styles.field}>
              비밀번호
              <input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className={styles.input}
                type="password"
                autoComplete="current-password"
              />
            </label>

            <button
              type="submit"
              disabled={submitting}
              className={cn(styles.primaryButton, styles.loginSubmit)}
            >
              {submitting ? "확인 중" : "로그인"}
            </button>
          </form>

          {message && (
            <div className={cn(styles.messageError, styles.loginError)}>
              {message}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function getSafeAdminNextPath(value: string | null) {
  if (!value) return null;
  if (!value.startsWith("/admin") || value.startsWith("//")) return null;
  if (value.startsWith("/admin/login")) return null;
  return value;
}
