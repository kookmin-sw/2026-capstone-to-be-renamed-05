"use client";

import { Plus, Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { JobStatusBadge } from "@/components/admin/status-badge";
import {
  fetchAdminCompanies,
  fetchAdminJobs,
  updateAdminJobStatus,
  type AdminCompany,
  type AdminJob,
  type JobStatus,
  deadlineTypeLabels,
  employmentLabels,
  jobFamilyLabels,
  jobStatusLabels,
  kicpaLabels,
  traineeLabels,
} from "@/components/admin/admin-demo-data";
import styles from "@/components/admin/admin.module.css";
import { cn } from "@/lib/utils";

const STATUS_OPTIONS = ["OPEN", "CLOSED", "DRAFT"] as const;

function formatDate(value: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium" }).format(
    new Date(value),
  );
}

export default function AdminJobsPage() {
  const [jobs, setJobs] = useState<AdminJob[]>([]);
  const [companies, setCompanies] = useState<AdminCompany[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pendingStatus, setPendingStatus] = useState<{
    job: AdminJob;
    status: JobStatus;
  } | null>(null);

  const params = useMemo(() => {
    const next = new URLSearchParams({
      page: String(page),
      pageSize: "20",
    });
    if (search.trim()) next.set("search", search.trim());
    if (status) next.set("status", status);
    if (companyId) next.set("companyId", companyId);
    return next;
  }, [companyId, page, search, status]);

  useEffect(() => {
    let ignore = false;
    fetchAdminCompanies(new URLSearchParams({ pageSize: "100" }))
      .then((data) => {
        if (!ignore) setCompanies(data.items);
      })
      .catch(() => undefined);
    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    let ignore = false;
    fetchAdminJobs(params)
      .then((data) => {
        if (!ignore) {
          setJobs(data.items);
          setTotal(data.total);
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
  }, [params]);

  async function applyStatusChange() {
    if (!pendingStatus) return;
    const target = pendingStatus;
    setPendingStatus(null);
    try {
      const updated = await updateAdminJobStatus(target.job.id, target.status);
      setJobs((current) =>
        current.map((job) => (job.id === updated.id ? updated : job)),
      );
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "상태 변경 실패");
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / 20));

  return (
    <div className={styles.pageStack}>
      <div className={styles.pageHeader}>
        <div>
          <h2 className={styles.pageTitle}>공고 관리</h2>
          <p className={styles.pageDescription}>
            공고 상태를 게시중, 마감, 숨김/임시저장으로 관리합니다.
          </p>
        </div>
        <Link
          href="/admin/jobs/new"
          className={styles.primaryButton}
        >
          <Plus size={16} />
          공고 생성
        </Link>
      </div>

      <section className={styles.panel}>
        <div className={styles.filtersGridWide}>
          <div className={styles.searchField}>
            <Search
              size={16}
              className={styles.searchIcon}
            />
            <input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              className={cn(styles.input, styles.inputWithIcon)}
              placeholder="제목, 설명, 회사명 검색"
            />
          </div>
          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setPage(1);
            }}
            className={styles.select}
          >
            <option value="">전체 상태</option>
            {STATUS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {jobStatusLabels[option]}
              </option>
            ))}
          </select>
          <select
            value={companyId}
            onChange={(event) => {
              setCompanyId(event.target.value);
              setPage(1);
            }}
            className={styles.select}
          >
            <option value="">전체 회사</option>
            {companies.map((company) => (
              <option key={company.id} value={company.id}>
                {company.name}
              </option>
            ))}
          </select>
          <div className={styles.resultCount}>
            총 {total.toLocaleString("ko-KR")}건
          </div>
        </div>
      </section>

      {error && (
        <div className={styles.messageError}>
          {error}
        </div>
      )}

      <section className={styles.tablePanel}>
        <div className={styles.tableScroller}>
          <table className={styles.table}>
            <thead className={styles.tableHead}>
              <tr>
                <th>공고</th>
                <th>상태</th>
                <th>조건</th>
                <th>마감/출처</th>
                <th>관리</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className={styles.emptyCell}>
                    공고를 불러오는 중입니다.
                  </td>
                </tr>
              ) : jobs.length ? (
                jobs.map((job) => (
                  <tr key={job.id} className={styles.tableRowTop}>
                    <td>
                      <Link
                        href={`/admin/jobs/${job.id}`}
                        className={styles.tableTitleLink}
                      >
                        {job.title}
                      </Link>
                      <p className={styles.tableSubtext}>{job.companyName}</p>
                      <p className={styles.tableFadedText}>
                        {job.originalUrl}
                      </p>
                    </td>
                    <td>
                      <JobStatusBadge status={job.status} />
                    </td>
                    <td className={styles.tableDetailText}>
                      <p>{jobFamilyLabels[job.jobFamily]} · {employmentLabels[job.employmentType]}</p>
                      <p>{kicpaLabels[job.kicpaCondition]} · {traineeLabels[job.traineeStatus]}</p>
                    </td>
                    <td className={styles.tableDetailText}>
                      <p>
                        {deadlineTypeLabels[job.deadlineType]} · {formatDate(job.deadline)}
                      </p>
                      <p>{job.sourceName}</p>
                      <p>확인 {formatDate(job.lastCheckedAt)}</p>
                    </td>
                    <td>
                      <div className={styles.rowActions}>
                        <Link
                          href={`/admin/jobs/${job.id}`}
                          className={styles.smallButton}
                        >
                          수정
                        </Link>
                        {STATUS_OPTIONS.map((nextStatus) => (
                          <button
                            key={nextStatus}
                            type="button"
                            disabled={job.status === nextStatus}
                            onClick={() =>
                              setPendingStatus({ job, status: nextStatus })
                            }
                            className={styles.smallButton}
                          >
                            {jobStatusLabels[nextStatus]}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className={styles.emptyCell}>
                    조건에 맞는 공고가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <div className={styles.pagination}>
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => setPage((current) => Math.max(1, current - 1))}
          className={styles.paginationButton}
        >
          이전
        </button>
        <span className={styles.paginationLabel}>
          {page} / {totalPages}
        </span>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
          className={styles.paginationButton}
        >
          다음
        </button>
      </div>

      <ConfirmDialog
        open={Boolean(pendingStatus)}
        title="공고 상태 변경"
        description={
          pendingStatus
            ? `"${pendingStatus.job.title}" 상태를 "${jobStatusLabels[pendingStatus.status]}"로 변경합니다.`
            : ""
        }
        confirmLabel="변경"
        onConfirm={applyStatusChange}
        onCancel={() => setPendingStatus(null)}
      />
    </div>
  );
}
