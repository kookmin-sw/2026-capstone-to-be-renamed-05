"use client";

import { CheckCircle2, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import {
  fetchAdminAiSuggestions,
  reviewAdminAiSuggestion,
  type AdminAiSuggestion,
} from "@/lib/api";
import { logClientError } from "@/lib/client-logger";
import styles from "@/components/admin/admin.module.css";

function SuggestionStatusBadge({ status }: { status: string }) {
  if (status === "APPROVED") return <span className={styles.statusOpen}>승인</span>;
  if (status === "REJECTED") return <span className={styles.statusClosed}>반려</span>;
  return <span className={styles.statusDraft}>검수 대기</span>;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium" }).format(new Date(value));
}

export default function AdminAiSuggestionsPage() {
  const [suggestions, setSuggestions] = useState<AdminAiSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"" | "PENDING" | "APPROVED" | "REJECTED">("");

  useEffect(() => {
    let ignore = false;
    fetchAdminAiSuggestions()
      .then((data) => { if (!ignore) { setSuggestions(data.items); setError(""); } })
      .catch((caught: Error) => {
        if (!ignore) {
          logClientError("admin.ai_suggestions_load_failed", caught);
          setError(caught.message);
        }
      })
      .finally(() => { if (!ignore) setLoading(false); });
    return () => { ignore = true; };
  }, []);

  const filtered = filter ? suggestions.filter((item) => item.status === filter) : suggestions;

  async function handleReview(id: string, action: "approve" | "reject") {
    try {
      const updated = await reviewAdminAiSuggestion(id, action);
      setSuggestions((current) => current.map((item) => (item.id === updated.id ? updated : item)));
    } catch (caught) {
      logClientError("admin.ai_suggestion_review_failed", caught, {
        suggestionId: id,
        action,
      });
      setError(caught instanceof Error ? caught.message : "처리에 실패했습니다.");
    }
  }

  const pendingCount = suggestions.filter((item) => item.status === "PENDING").length;

  return (
    <div className={styles.pageStack}>
      <div className={styles.pageHeader}>
        <div>
          <h2 className={styles.pageTitle}>AI 태그 검수</h2>
          <p className={styles.pageDescription}>
            AI가 추천한 공고 요약, 태그, 위험요소를 검수합니다.
            {pendingCount > 0 && ` (대기 ${pendingCount}건)`}
          </p>
        </div>
      </div>

      <section className={styles.panel}>
        <div className={styles.filtersGrid}>
          <select value={filter} onChange={(e) => setFilter(e.target.value as typeof filter)} className={styles.select}>
            <option value="">전체 상태</option>
            <option value="PENDING">검수 대기</option>
            <option value="APPROVED">승인</option>
            <option value="REJECTED">반려</option>
          </select>
          <div className={styles.resultCount}>총 {filtered.length}건</div>
        </div>
      </section>

      {error && <div className={styles.messageError}>{error}</div>}

      {loading ? (
        <p className={styles.loadingText}>불러오는 중입니다.</p>
      ) : filtered.length === 0 ? (
        <section className={styles.panel}>
          <p className={styles.tableDetailText}>검수할 AI 제안이 없습니다.</p>
        </section>
      ) : (
        <div className={styles.pageStack}>
          {filtered.map((suggestion) => (
            <section key={suggestion.id} className={styles.formCard}>
              <div className={styles.pageHeader}>
                <div>
                  <p className={styles.tableTitleLink}>{suggestion.jobTitle}</p>
                  <p className={styles.tableSubtext}>{formatDate(suggestion.createdAt)}</p>
                </div>
                <SuggestionStatusBadge status={suggestion.status} />
              </div>

              <div className={styles.formGridTwo}>
                <label className={styles.field}>
                  AI 요약
                  <p className={styles.tableDetailText}>{suggestion.summary || "(없음)"}</p>
                </label>
                <label className={styles.field}>
                  추천 태그
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem" }}>
                    {suggestion.tags.length ? suggestion.tags.map((tag) => (
                      <span key={tag} className={styles.statusBadge} style={{ borderColor: "var(--proto-brand-mid)", background: "var(--proto-brand-light)", color: "var(--proto-brand)" }}>
                        #{tag}
                      </span>
                    )) : <span className={styles.tableMono}>없음</span>}
                  </div>
                </label>
              </div>

              {suggestion.risks.length > 0 && (
                <label className={styles.field}>
                  위험요소
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem" }}>
                    {suggestion.risks.map((risk) => (
                      <span key={risk} className={styles.statusBadge} style={{ borderColor: "#fecaca", background: "#fef2f2", color: "#b91c1c" }}>
                        ⚠ {risk}
                      </span>
                    ))}
                  </div>
                </label>
              )}

              {suggestion.status === "PENDING" && (
                <div className={styles.rowActions}>
                  <button type="button" className={styles.primaryButton} onClick={() => handleReview(suggestion.id, "approve")}>
                    <CheckCircle2 size={15} /> 승인
                  </button>
                  <button type="button" className={styles.secondaryButton} onClick={() => handleReview(suggestion.id, "reject")}>
                    <XCircle size={15} /> 반려
                  </button>
                </div>
              )}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
