"use client";

import { Building2, LogIn, UserPlus } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useRef, useState } from "react";
import { ActionButton } from "@/components/ui/action-button";
import { authRequest, type AuthUser } from "@/lib/api";
import { logClientWarn } from "@/lib/client-logger";
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
  const [message, setMessage] = useState("");
  const nextPath = getSafeNextPath(searchParams.get("next"));

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

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    // 필수 입력 검증
    if (!username.trim()) {
      window.alert("아이디를 입력해주세요.");
      return;
    }
    if (!password.trim()) {
      window.alert("비밀번호를 입력해주세요.");
      return;
    }
    if (mode === "register") {
      if (!displayName.trim()) {
        window.alert("표시 이름을 입력해주세요.");
        return;
      }
      if (role === "COMPANY" && !companyName.trim()) {
        window.alert("회사명을 입력해주세요.");
        return;
      }
    }

    try {
      const payload: Record<string, string> = { username, password };
      if (mode === "register") {
        payload.role = role;
        if (displayName) payload.displayName = displayName;
        if (role === "COMPANY") {
          payload.companyName = companyName;
          payload.companyType = companyType;
        }
      }
      const user = await authRequest(mode, payload);

      if (mode === "register") {
        window.alert(
          "회원가입 완료! 관리자 승인 후 이용 가능하며, 승인은 2-3영업일 내로 이루어집니다.",
        );
      }

      setMessage(`${user?.username} 계정으로 로그인되었습니다.`);
      router.replace(nextPath ?? nextPathForRole(user));
    } catch (error) {
      logClientWarn("auth.request_failed", error, {
        mode,
        role: mode === "register" ? role : undefined,
      });
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
              아이디 <span className="text-red-500">*</span>
              <input
                className="mt-2 w-full rounded-xl border border-[var(--app-line)] px-3 py-2.5 text-sm outline-none focus:border-[var(--brand)]"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="아이디를 입력하세요"
              />
            </label>
            <label className="text-sm font-semibold text-gray-700">
              비밀번호 <span className="text-red-500">*</span>
              <input
                className="mt-2 w-full rounded-xl border border-[var(--app-line)] px-3 py-2.5 text-sm outline-none focus:border-[var(--brand)]"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="비밀번호를 입력하세요"
              />
            </label>

            {mode === "register" && (
              <>
                <label className="text-sm font-semibold text-gray-700">
                  회원 유형 <span className="text-red-500">*</span>
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
                  표시 이름 <span className="text-red-500">*</span>
                  <input
                    className="mt-2 w-full rounded-xl border border-[var(--app-line)] px-3 py-2.5 text-sm outline-none focus:border-[var(--brand)]"
                    value={displayName}
                    onChange={(event) => setDisplayName(event.target.value)}
                    placeholder="닉네임을 입력하세요"
                  />
                </label>
                {role === "COMPANY" && (
                  <>
                    <label className="text-sm font-semibold text-gray-700">
                      회사명 <span className="text-red-500">*</span>
                      <input
                        className="mt-2 w-full rounded-xl border border-[var(--app-line)] px-3 py-2.5 text-sm outline-none focus:border-[var(--brand)]"
                        value={companyName}
                        onChange={(event) => setCompanyName(event.target.value)}
                        placeholder="예: 한빛회계법인"
                      />
                    </label>
                    <label className="text-sm font-semibold text-gray-700">
                      회사 유형 <span className="text-red-500">*</span>
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
                  </>
                )}
              </>
            )}

            <ActionButton
              type="submit"
              className={styles.submit}
              size="lg"
              iconStart={<Building2 size={17} />}
            >
              {mode === "login" ? "로그인" : "회원가입"}
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

function getSafeNextPath(value: string | null) {
  if (!value) return null;
  if (!value.startsWith("/") || value.startsWith("//")) return null;
  if (value.startsWith("/login")) return null;
  return value;
}
