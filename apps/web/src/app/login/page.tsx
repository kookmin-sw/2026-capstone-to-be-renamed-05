"use client";

import { Building2, LogIn, Upload, UserPlus } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useRef, useState } from "react";
import { ActionButton } from "@/components/ui/action-button";
import { authRequest, type AuthUser, uploadCompanyLogo } from "@/lib/api";
import { companyTypeLabels } from "@/lib/labels";
import { cn } from "@/lib/utils";
import styles from "./login-page.module.css";

type RegisterRole = "JOB_SEEKER" | "COMPANY";

export default function LoginPage() {
  return (
    <Suspense fallback={<main className={styles.page} />}>
      <LoginPageContent />
    </Suspense>
  );
}

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roleSelectRef = useRef<HTMLSelectElement | null>(null);
  const [mode, setMode] = useState<"login" | "register">(
    searchParams.get("mode") === "register" ? "register" : "login",
  );
  const [role, setRole] = useState<RegisterRole>("JOB_SEEKER");
  const [username, setUsername] = useState("test002");
  const [password, setPassword] = useState("password123");
  const [displayName, setDisplayName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companyType, setCompanyType] = useState("LOCAL_ACCOUNTING_FIRM");
  const [companyLogoUrl, setCompanyLogoUrl] = useState("");
  const [companyLogoFileName, setCompanyLogoFileName] = useState("");
  const [companyLogoUploading, setCompanyLogoUploading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (mode !== "register") return;

    const syncRoleFromSelect = () => {
      const selectedRole = roleSelectRef.current?.value as
        | RegisterRole
        | undefined;
      if (selectedRole === "JOB_SEEKER" || selectedRole === "COMPANY") {
        setRole(selectedRole);
      }
    };

    syncRoleFromSelect();
    const timers = [
      window.setTimeout(syncRoleFromSelect, 50),
      window.setTimeout(syncRoleFromSelect, 500),
    ];
    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [mode]);

  function changeRole(value: string) {
    setRole(value as RegisterRole);
  }

  async function uploadLogo(event: FormEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    setCompanyLogoUrl("");
    setCompanyLogoFileName("");
    if (!file) return;

    setCompanyLogoUploading(true);
    setMessage("");
    try {
      const logoUrl = await uploadCompanyLogo(file);
      setCompanyLogoUrl(logoUrl);
      setCompanyLogoFileName(file.name);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "이미지 업로드에 실패했습니다.",
      );
    } finally {
      setCompanyLogoUploading(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    if (mode === "register" && role === "COMPANY" && !companyLogoUrl) {
      setMessage("기업 이미지를 업로드해 주세요.");
      return;
    }
    try {
      const payload: Record<string, string> = { username, password };
      if (mode === "register") {
        payload.role = role;
        if (displayName) payload.displayName = displayName;
        if (role === "COMPANY") {
          payload.companyName = companyName;
          payload.companyType = companyType;
          payload.logoUrl = companyLogoUrl;
        }
      }
      const user = await authRequest(mode, payload);
      setMessage(`${user?.username} 계정으로 로그인되었습니다.`);
      router.push(nextPathForRole(user));
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "요청에 실패했습니다.",
      );
    }
  }

  return (
    <main className={styles.page}>
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <Link
            href="/"
            className="text-2xl font-black tracking-tight text-gray-900"
          >
            Account<span className={styles.logoAccent}>it</span>
          </Link>
          <p className="mt-1 text-sm text-gray-500">
            CPA 전용 채용 큐레이션 플랫폼
          </p>
        </div>

        <div className="rounded-2xl border border-[var(--app-line)] bg-white p-8 shadow-sm">
          <div className="mb-6 grid grid-cols-2 gap-2">
            <button
              type="button"
              className={cn(styles.tab, mode === "login" && styles.tabActive)}
              onClick={() => setMode("login")}
            >
              <LogIn size={16} />
              로그인
            </button>
            <button
              type="button"
              className={cn(
                styles.tab,
                mode === "register" && styles.tabActive,
              )}
              onClick={() => setMode("register")}
            >
              <UserPlus size={16} />
              회원가입
            </button>
          </div>

          <form className="grid gap-4" onSubmit={submit}>
            <label className="text-sm font-semibold text-gray-700">
              아이디
              <input
                className="mt-2 w-full rounded-xl border border-[var(--app-line)] px-3 py-2.5 text-sm outline-none focus:border-[var(--brand)]"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
              />
            </label>
            <label className="text-sm font-semibold text-gray-700">
              비밀번호
              <input
                className="mt-2 w-full rounded-xl border border-[var(--app-line)] px-3 py-2.5 text-sm outline-none focus:border-[var(--brand)]"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </label>

            {mode === "register" && (
              <>
                <label className="text-sm font-semibold text-gray-700">
                  회원 유형
                  <select
                    ref={roleSelectRef}
                    className="mt-2 w-full rounded-xl border border-[var(--app-line)] px-3 py-2.5 text-sm outline-none"
                    value={role}
                    onBlur={(event) => changeRole(event.target.value)}
                    onChange={(event) => changeRole(event.target.value)}
                    onInput={(event) => changeRole(event.currentTarget.value)}
                  >
                    <option value="JOB_SEEKER">일반(구직자)</option>
                    <option value="COMPANY">회사(채용하는 사람)</option>
                  </select>
                </label>
                <label className="text-sm font-semibold text-gray-700">
                  표시 이름
                  <input
                    className="mt-2 w-full rounded-xl border border-[var(--app-line)] px-3 py-2.5 text-sm outline-none focus:border-[var(--brand)]"
                    value={displayName}
                    onChange={(event) => setDisplayName(event.target.value)}
                  />
                </label>
                {role === "COMPANY" && (
                  <>
                    <label className="text-sm font-semibold text-gray-700">
                      회사명
                      <input
                        className="mt-2 w-full rounded-xl border border-[var(--app-line)] px-3 py-2.5 text-sm outline-none focus:border-[var(--brand)]"
                        value={companyName}
                        onChange={(event) => setCompanyName(event.target.value)}
                        placeholder="예: 한빛회계법인"
                      />
                    </label>
                    <label className="text-sm font-semibold text-gray-700">
                      회사 유형
                      <select
                        className="mt-2 w-full rounded-xl border border-[var(--app-line)] px-3 py-2.5 text-sm outline-none"
                        value={companyType}
                        onChange={(event) => setCompanyType(event.target.value)}
                      >
                        {Object.entries(companyTypeLabels).map(
                          ([value, label]) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          ),
                        )}
                      </select>
                    </label>
                    <label className="text-sm font-semibold text-gray-700">
                      기업 이미지 업로드
                      <input
                        accept="image/png,image/jpeg,image/webp,image/gif"
                        className="mt-2 w-full rounded-xl border border-[var(--app-line)] px-3 py-2.5 text-sm outline-none file:mr-3 file:rounded-lg file:border-0 file:bg-[#ffe8f0] file:px-3 file:py-1.5 file:text-sm file:font-bold file:text-[var(--brand)] focus:border-[var(--brand)]"
                        required={!companyLogoUrl}
                        type="file"
                        onChange={(event) => void uploadLogo(event)}
                      />
                    </label>
                    {companyLogoUrl && (
                      <div className={styles.uploadPreview}>
                        <div className={styles.uploadPreviewFrame}>
                          {/* eslint-disable-next-line @next/next/no-img-element -- uploaded local image preview before registration. */}
                          <img src={companyLogoUrl} alt="업로드한 기업 이미지" />
                        </div>
                        <p className={styles.uploadPreviewText}>
                          <Upload size={14} />
                          {companyLogoFileName || "업로드 완료"}
                        </p>
                      </div>
                    )}
                  </>
                )}
              </>
            )}

            <ActionButton
              type="submit"
              className={styles.submit}
              disabled={companyLogoUploading}
              size="lg"
              iconStart={<Building2 size={17} />}
            >
              {companyLogoUploading
                ? "이미지 업로드 중"
                : mode === "login"
                  ? "로그인"
                  : "회원가입"}
            </ActionButton>
          </form>

          {message && (
            <div className="mt-4 rounded-xl border border-[var(--app-line)] bg-[#fbfbf8] p-3 text-sm text-gray-700">
              {message}
            </div>
          )}
        </div>

        <p className="mt-4 text-center text-xs text-gray-400">
          <Link href="/" className="hover:underline">
            ← 공고 목록으로 돌아가기
          </Link>
        </p>
      </div>
    </main>
  );
}

function nextPathForRole(user: AuthUser | undefined) {
  if (user?.role === "COMPANY") return "/company";
  if (user?.role === "ADMIN") return "/admin";
  return "/jobs";
}
