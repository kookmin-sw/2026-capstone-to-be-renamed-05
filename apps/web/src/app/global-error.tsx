"use client";

import { useEffect } from "react";
import { logClientError } from "@/lib/client-logger";

export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    logClientError("app.global_render_failed", error, {
      digest: error.digest,
    });
  }, [error]);

  return (
    <html lang="ko">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          background: "#f8fafc",
          color: "#111827",
          fontFamily:
            'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        }}
      >
        <main
          style={{
            minHeight: "100vh",
            display: "grid",
            placeItems: "center",
            padding: "24px",
          }}
        >
          <section
            style={{
              width: "min(100%, 520px)",
              border: "1px solid #fecaca",
              borderRadius: "12px",
              background: "#fff",
              padding: "24px",
              boxShadow: "0 10px 24px rgba(15, 23, 42, 0.08)",
            }}
          >
            <p
              style={{
                margin: 0,
                color: "#b91c1c",
                fontSize: "14px",
                fontWeight: 700,
              }}
            >
              앱을 복구하지 못했습니다.
            </p>
            <h1 style={{ margin: "8px 0 0", fontSize: "24px" }}>
              새로 시도해 주세요.
            </h1>
            <p
              style={{
                margin: "12px 0 0",
                color: "#4b5563",
                fontSize: "14px",
                lineHeight: 1.6,
              }}
            >
              같은 오류가 반복되면 UT 진행자에게 현재 화면과 직전 행동을 알려주세요.
            </p>
            <button
              type="button"
              onClick={() => unstable_retry()}
              style={{
                marginTop: "20px",
                border: 0,
                borderRadius: "8px",
                background: "#e8457a",
                color: "#fff",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: 700,
                padding: "10px 16px",
              }}
            >
              다시 시도
            </button>
          </section>
        </main>
      </body>
    </html>
  );
}
