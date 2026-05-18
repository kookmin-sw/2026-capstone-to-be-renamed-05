"use client";

import { useEffect } from "react";
import { logClientError } from "@/lib/client-logger";

export default function AppError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    logClientError("app.route_render_failed", error, {
      digest: error.digest,
    });
  }, [error]);

  return (
    <main className="min-h-screen bg-[var(--background)] px-6 py-16">
      <div className="mx-auto max-w-xl rounded-xl border border-red-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold text-red-700">
          화면을 불러오지 못했습니다.
        </p>
        <h1 className="mt-2 text-2xl font-bold text-gray-950">
          일시적인 오류가 발생했습니다.
        </h1>
        <p className="mt-3 text-sm leading-6 text-gray-600">
          같은 동작에서 반복되면 UT 진행자에게 현재 화면과 방금 한 행동을 알려주세요.
        </p>
        <button
          type="button"
          onClick={() => unstable_retry()}
          className="mt-5 rounded-lg bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white"
        >
          다시 시도
        </button>
      </div>
    </main>
  );
}
