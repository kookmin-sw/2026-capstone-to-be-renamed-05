"use client";

import { CheckCircle2, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import type { CompanyProfileSubmissionItem } from "@cpa/shared";
import { companyTypeLabels } from "@/components/admin/admin-demo-data";
import { fetchAdminProfileSubmissions, reviewAdminProfileSubmission } from "@/lib/api";
import { logClientError } from "@/lib/client-logger";
import styles from "@/components/admin/admin.module.css";

type ReviewAction = { submission: CompanyProfileSubmissionItem; action: "approve" | "reject" };

function formatDate(value: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium" }).format(new Date(value));
}

function SubmissionStatusBadge({ status }: { status: string }) {
  if (status === "APPROVED") return <span className={styles.statusOpen}>승인</span>;
  if (status === "REJECTED") return <span className={styles.statusClosed}>반려</span>;
  return <span className={styles.statusDraft}>검수 대기</span>;
}

function proposalKeyLabel(key: string) {
const labels: Record<string, string> = { name: "회사명", type: "유형", websiteUrl: "웹사이트", description: "설명", businessNumber: "사업자번호", externalLinks: "외부 링크", tags: "태그" };
  return labels[key] ?? key;
}

function ProposalDetails({ proposed }: { proposed: Record<string, unknown> }) {
  const entries = Object.entries(proposed).filter(([, v]) => v !== undefined && v !== null);
  if (!entries.length) return <span className={styles.tableMono}>변경 없음</span>;
  return (
    <div className={styles.tableDetailText}>
      {entries.map(([key, value]) => (
        <p key={key}><strong>{proposalKeyLabel(key)}:</strong> {key === "type" && typeof value === "string" ? (companyTypeLabels[value] ?? value) : Array.isArray(value) ? value.join(", ") : value === null ? "(삭제)" : String(value)}</p>
      ))}
    </div>
  );
}

export default function AdminProfileSubmissionsPage() {
  const [submissions, setSubmissions] = useState<CompanyProfileSubmissionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reviewTarget, setReviewTarget] = useState<ReviewAction | null>(null);
  const [adminNote, setAdminNote] = useState("");
  const [filter, setFilter] = useState<"" | "PENDING" | "APPROVED" | "REJECTED">("");

  useEffect(() => {
    let ignore = false;
    fetchAdminProfileSubmissions()
      .then((data) => { if (!ignore) { setSubmissions(data.items); setError(""); } })
      .catch((caught: Error) => {
        if (!ignore) {
          logClientError("admin.profile_submissions_load_failed", caught);
          setError(caught.message);
        }
      })
      .finally(() => { if (!ignore) setLoading(false); });
    return () => { ignore = true; };
  }, []);

  const filtered = filter ? submissions.filter((item) => item.status === filter) : submissions;

  async function handleReview() {
    if (!reviewTarget) return;
    const { submission, action } = reviewTarget;
    setReviewTarget(null);
    try {
      const updated = await reviewAdminProfileSubmission(submission.id, action, adminNote.trim() || undefined);
      setSubmissions((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      setAdminNote("");
    } catch (caught) {
      logClientError("admin.profile_submission_review_failed", caught, {
        submissionId: submission.id,
        action,
      });
      setError(caught instanceof Error ? caught.message : "처리에 실패했습니다.");
    }
  }

  const pendingCount = submissions.filter((item) => item.status === "PENDING").length;

  return (
    <div className={styles.pageStack}>
      <div className={styles.pageHeader}>
        <div>
          <h2 className={styles.pageTitle}>회사 프로필 검수</h2>
          <p className={styles.pageDescription}>
            기업회원이 제출한 회사 정보 수정 요청을 승인하거나 반려합니다.
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

      <section className={styles.tablePanel}>
        <div className={styles.tableScroller}>
          <table className={styles.table}>
            <thead className={styles.tableHead}>
              <tr><th>회사</th><th>수정 요청 내용</th><th>상태</th><th>제출 정보</th><th>관리</th></tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className={styles.emptyCell}>불러오는 중입니다.</td></tr>
              ) : filtered.length ? (
                filtered.map((s) => (
                  <tr key={s.id} className={styles.tableRowTop}>
                    <td><p className={styles.tableTitleLink}>{s.companyName}</p></td>
                    <td><ProposalDetails proposed={s.proposed as Record<string, unknown>} /></td>
                    <td><SubmissionStatusBadge status={s.status} /></td>
                    <td className={styles.tableDetailText}>
                      <p>제출: {s.submittedByUsername}</p>
                      <p>{formatDate(s.createdAt)}</p>
                      {s.reviewedByUsername && <p>검수: {s.reviewedByUsername}</p>}
                      {s.adminNote && <p>메모: {s.adminNote}</p>}
                    </td>
                    <td>
                      {s.status === "PENDING" ? (
                        <div className={styles.rowActions}>
                          <button type="button" className={styles.smallButton} onClick={() => { setAdminNote(""); setReviewTarget({ submission: s, action: "approve" }); }}>
                            <CheckCircle2 size={13} /> 승인
                          </button>
                          <button type="button" className={styles.smallButton} onClick={() => { setAdminNote(""); setReviewTarget({ submission: s, action: "reject" }); }}>
                            <XCircle size={13} /> 반려
                          </button>
                        </div>
                      ) : <span className={styles.tableMono}>처리 완료</span>}
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={5} className={styles.emptyCell}>검수 대기 중인 프로필 수정 요청이 없습니다.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {reviewTarget && (
        <div className={styles.dialogBackdrop}>
          <div className={styles.dialog}>
            <h3 className={styles.dialogTitle}>{reviewTarget.action === "approve" ? "프로필 수정 승인" : "프로필 수정 반려"}</h3>
            <p className={styles.dialogDescription}>
              &quot;{reviewTarget.submission.companyName}&quot;의 프로필 수정 요청을 {reviewTarget.action === "approve" ? "승인" : "반려"}합니다.
              {reviewTarget.action === "approve" && " 승인 시 회사 정보가 즉시 반영됩니다."}
            </p>
            <label className={styles.field} style={{ marginTop: "0.75rem" }}>
              관리자 메모 (선택)
              <textarea className={`${styles.input} ${styles.textareaShort}`} value={adminNote} onChange={(e) => setAdminNote(e.target.value)} placeholder="검수 메모를 입력하세요" />
            </label>
            <div className={styles.dialogActions}>
              <button type="button" className={styles.secondaryButton} onClick={() => setReviewTarget(null)}>취소</button>
              <button type="button" className={styles.primaryButton} onClick={handleReview}>{reviewTarget.action === "approve" ? "승인" : "반려"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
