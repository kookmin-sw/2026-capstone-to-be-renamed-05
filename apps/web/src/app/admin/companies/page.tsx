"use client";

import { COMPANY_TYPES } from "@cpa/shared";
import { Plus, Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  fetchAdminCompanies,
  type AdminCompany,
  companyTypeLabels,
} from "@/components/admin/admin-demo-data";
import styles from "@/components/admin/admin.module.css";
import { logClientError } from "@/lib/client-logger";
import { adminCompanyEditHref } from "@/lib/routes";
import { cn } from "@/lib/utils";

function formatNullableNumber(value: number | null, suffix = "") {
  if (value === null) return "-";
  return `${value.toLocaleString("ko-KR")}${suffix}`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium" }).format(
    new Date(value),
  );
}

export default function AdminCompaniesPage() {
  const [companies, setCompanies] = useState<AdminCompany[]>([]);
  const [search, setSearch] = useState("");
  const [companyType, setCompanyType] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const params = useMemo(() => {
    const next = new URLSearchParams({
      page: String(page),
      pageSize: "20",
    });
    if (search.trim()) next.set("search", search.trim());
    if (companyType) next.set("companyType", companyType);
    return next;
  }, [companyType, page, search]);

  useEffect(() => {
    let ignore = false;
    fetchAdminCompanies(params)
      .then((data) => {
        if (!ignore) {
          setCompanies(data.items);
          setTotal(data.total);
          setError("");
        }
      })
      .catch((caught: Error) => {
        if (!ignore) {
          logClientError("admin.companies_load_failed", caught, {
            page,
            filterCount: Array.from(params.keys()).length,
          });
          setError(caught.message);
        }
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [params]);

  const totalPages = Math.max(1, Math.ceil(total / 20));

  return (
    <div className={styles.pageStack}>
      <div className={styles.pageHeader}>
        <div>
          <h2 className={styles.pageTitle}>회사 관리</h2>
          <p className={styles.pageDescription}>
            회사 생성과 수정만 제공합니다. 숨김/삭제는 이번 범위에서 제외합니다.
          </p>
        </div>
        <Link
          href="/admin/companies/new"
          className={styles.primaryButton}
        >
          <Plus size={16} />
          회사 생성
        </Link>
      </div>

      <section className={styles.panel}>
        <div className={styles.filtersGrid}>
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
              placeholder="회사명, 설명, 태그 검색"
            />
          </div>
          <select
            value={companyType}
            onChange={(event) => {
              setCompanyType(event.target.value);
              setPage(1);
            }}
            className={styles.select}
          >
            <option value="">전체 유형</option>
            {COMPANY_TYPES.map((type) => (
              <option key={type} value={type}>
                {companyTypeLabels[type]}
              </option>
            ))}
          </select>
          <div className={styles.resultCount}>
            총 {total.toLocaleString("ko-KR")}개
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
                <th>회사</th>
                <th>유형</th>
                <th>프로필</th>
                <th>공고/등록일</th>
                <th>관리</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className={styles.emptyCell}>
                    회사를 불러오는 중입니다.
                  </td>
                </tr>
              ) : companies.length ? (
                companies.map((company) => (
                  <tr key={company.id} className={styles.tableRowTop}>
                    <td>
                      <Link
                        href={adminCompanyEditHref(company.id)}
                        className={styles.tableTitleLink}
                      >
                        {company.name}
                      </Link>
                      <p className={styles.tableSubtext}>
                        {company.description ?? "설명 없음"}
                      </p>
                      {company.websiteUrl && (
                        <p className={styles.tableFadedText}>
                          {company.websiteUrl}
                        </p>
                      )}
                    </td>
                    <td>
                      {companyTypeLabels[company.type]}
                    </td>
                    <td className={styles.tableDetailText}>
                      <p>직원 {formatNullableNumber(company.employeeCount, "명")}</p>
                      <p>평균연봉 {formatNullableNumber(company.averageSalary, "만원")}</p>
                      <p>설립 {formatNullableNumber(company.foundedYear, "년")}</p>
                    </td>
                    <td className={styles.tableDetailText}>
                      <p>공고 {company.jobCount.toLocaleString("ko-KR")}건</p>
                      <p>{formatDate(company.createdAt)}</p>
                    </td>
                    <td>
                      <Link
                        href={adminCompanyEditHref(company.id)}
                        className={styles.smallButton}
                      >
                        수정
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className={styles.emptyCell}>
                    조건에 맞는 회사가 없습니다.
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
    </div>
  );
}
