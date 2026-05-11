"use client";

import type {
  PersonalCareerStage,
  PersonalVerificationRequestItem,
} from "@cpa/shared";
import { CheckCircle2, Search, XCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  fetchAdminCpaVerificationRequests,
  reviewAdminCpaVerificationRequest,
} from "@/lib/api";
import styles from "@/components/admin/admin.module.css";
import { cn } from "@/lib/utils";

const careerStageLabels: Record<PersonalCareerStage, string> = {
  CPA_UNPLACED: "CPA 취득, 수습처 미확정",
  TRAINEE: "수습 CPA",
  LICENSED_CPA: "일반 회계사",
};

const statusLabels: Record<string, string> = {
  PENDING: "검토 중",
  APPROVED: "승인",
  REJECTED: "반려",
};

function formatDate(value: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function AdminCpaVerificationsPage() {
  const [items, setItems] = useState<PersonalVerificationRequestItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processingId, setProcessingId] = useState("");

  useEffect(() => {
    let ignore = false;
    fetchAdminCpaVerificationRequests()
      .then((data) => {
        if (!ignore) {
          setItems(data.items);
          setError("");
        }
      })
      .catch((caught: Error) => {
        if (!ignore) setError(caught.message);
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, []);

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) =>
      [
        item.username,
        item.displayName ?? "",
        item.applicantName,
        item.registrationNumber ?? "",
        item.registrationNumberLast4 ?? "",
      ].some((value) => value.toLowerCase().includes(q)),
    );
  }, [items, search]);

  async function handleReview(
    item: PersonalVerificationRequestItem,
    action: "approve" | "reject",
  ) {
    const defaultNote =
      action === "approve" ? "관리자 확인 완료" : "증빙 확인 불가";
    const adminNote = window.prompt("관리자 메모", defaultNote) ?? "";
    setProcessingId(item.id);
    setError("");
    try {
      const updated = await reviewAdminCpaVerificationRequest(item.id, action, {
        adminNote,
      });
      setItems((prev) =>
        prev.map((current) => (current.id === updated.id ? updated : current)),
      );
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "CPA 검증 요청 처리에 실패했습니다.",
      );
    } finally {
      setProcessingId("");
    }
  }

  return (
    <div className={styles.pageStack}>
      <div>
        <h2 className={styles.pageTitle}>CPA 검증 요청</h2>
        <p className={styles.pageDescription}>
          성명, 생년월일, 등록번호를 외부 자료와 대조한 뒤 승인 또는 반려합니다.
          검토 후 민감정보 원본은 API에서 비워집니다.
        </p>
      </div>

      <section className={styles.panel}>
        <div className={styles.filtersGrid}>
          <div className={styles.searchField}>
            <Search size={16} className={styles.searchIcon} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className={cn(styles.input, styles.inputWithIcon)}
              placeholder="아이디, 성명, 등록번호 검색"
            />
          </div>
          <div className={styles.resultCount}>
            총 {filteredItems.length.toLocaleString("ko-KR")}건
          </div>
        </div>
      </section>

      {error && <div className={styles.messageError}>{error}</div>}

      <section className={styles.tablePanel}>
        <div className={styles.tableScroller}>
          <table className={styles.table}>
            <thead className={styles.tableHead}>
              <tr>
                <th>회원</th>
                <th>신청 정보</th>
                <th>단계</th>
                <th>상태</th>
                <th>요청일</th>
                <th>검토</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className={styles.emptyCell}>
                    검증 요청을 불러오는 중입니다.
                  </td>
                </tr>
              ) : filteredItems.length ? (
                filteredItems.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div className={styles.tableTitleLink}>
                        {item.username}
                      </div>
                      <div className={styles.tableMeta}>
                        {item.displayName ?? "-"}
                      </div>
                    </td>
                    <td>
                      <div className={styles.tableTitleLink}>
                        {item.applicantName}
                      </div>
                      <div className={styles.tableMeta}>
                        생년월일 {item.birthDate ?? "검토 후 삭제"} · 번호{" "}
                        {item.registrationNumber ??
                          (item.registrationNumberLast4
                            ? `****${item.registrationNumberLast4}`
                            : "-")}
                      </div>
                    </td>
                    <td className={styles.tableMeta}>
                      {careerStageLabels[item.requestedCareerStage]}
                    </td>
                    <td className={styles.tableMeta}>
                      {statusLabels[item.status]}
                    </td>
                    <td className={styles.tableMeta}>
                      {formatDate(item.createdAt)}
                    </td>
                    <td>
                      {item.status === "PENDING" ? (
                        <div className={styles.rowActions}>
                          <button
                            type="button"
                            className={styles.smallButton}
                            disabled={processingId === item.id}
                            onClick={() => void handleReview(item, "approve")}
                            aria-label="승인"
                          >
                            <CheckCircle2 size={16} />
                          </button>
                          <button
                            type="button"
                            className={styles.smallButton}
                            disabled={processingId === item.id}
                            onClick={() => void handleReview(item, "reject")}
                            aria-label="반려"
                          >
                            <XCircle size={16} />
                          </button>
                        </div>
                      ) : (
                        <span className={styles.tableMeta}>
                          {item.reviewedByUsername ?? "-"} ·{" "}
                          {formatDate(item.reviewedAt)}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className={styles.emptyCell}>
                    조건에 맞는 검증 요청이 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
