"use client";

import { USER_ROLES } from "@cpa/shared";
import { Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  fetchAdminMembers,
  type AdminMember,
  userRoleLabels,
} from "@/components/admin/admin-demo-data";
import styles from "@/components/admin/admin.module.css";
import { RoleBadge } from "@/components/admin/status-badge";
import { logClientError } from "@/lib/client-logger";
import { cn } from "@/lib/utils";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function AdminMembersPage() {
  const [members, setMembers] = useState<AdminMember[]>([]);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
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
    if (role) next.set("role", role);
    return next;
  }, [page, role, search]);

  useEffect(() => {
    let ignore = false;
    fetchAdminMembers(params)
      .then((data) => {
        if (!ignore) {
          setMembers(data.items);
          setTotal(data.total);
          setError("");
        }
      })
      .catch((caught: Error) => {
        if (!ignore) {
          logClientError("admin.members_load_failed", caught, {
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
      <div>
        <h2 className={styles.pageTitle}>회원 리스트</h2>
        <p className={styles.pageDescription}>
          민감 정보와 프로필 상세는 표시하지 않고, 조회 전용으로만 제공합니다.
        </p>
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
              placeholder="아이디 또는 표시 이름 검색"
            />
          </div>
          <select
            value={role}
            onChange={(event) => {
              setRole(event.target.value);
              setPage(1);
            }}
            className={styles.select}
          >
            <option value="">전체 유형</option>
            {USER_ROLES.map((option) => (
              <option key={option} value={option}>
                {userRoleLabels[option]}
              </option>
            ))}
          </select>
          <div className={styles.resultCount}>
            총 {total.toLocaleString("ko-KR")}명
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
                <th>ID</th>
                <th>아이디</th>
                <th>표시 이름</th>
                <th>유형</th>
                <th>상태</th>
                <th>가입일</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className={styles.emptyCell}>
                    회원을 불러오는 중입니다.
                  </td>
                </tr>
              ) : members.length ? (
                members.map((member) => (
                  <tr key={member.id}>
                    <td className={styles.tableMono}>
                      {member.id}
                    </td>
                    <td className={styles.tableTitleLink}>{member.username}</td>
                    <td className={styles.tableMeta}>
                      {member.displayName ?? "-"}
                    </td>
                    <td>
                      <RoleBadge role={member.role} />
                    </td>
                    <td className={styles.activeStateText}>
                      활성
                    </td>
                    <td className={styles.tableMeta}>
                      {formatDate(member.createdAt)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className={styles.emptyCell}>
                    조건에 맞는 회원이 없습니다.
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
