"use client";

import { ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";
import { fetchAdminSources, type AdminSource } from "@/components/admin/admin-demo-data";
import styles from "@/components/admin/admin.module.css";
import { logClientError } from "@/lib/client-logger";

export default function AdminSourcesPage() {
  const [sources, setSources] = useState<AdminSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;
    fetchAdminSources()
      .then((data) => { if (!ignore) { setSources(data.items); setError(""); } })
      .catch((caught: Error) => {
        if (!ignore) {
          logClientError("admin.sources_load_failed", caught);
          setError(caught.message);
        }
      })
      .finally(() => { if (!ignore) setLoading(false); });
    return () => { ignore = true; };
  }, []);

  return (
    <div className={styles.pageStack}>
      <div className={styles.pageHeader}>
        <div>
          <h2 className={styles.pageTitle}>출처 관리</h2>
          <p className={styles.pageDescription}>공고 수집 출처를 관리합니다. 출처는 공고 등록 시 선택할 수 있습니다.</p>
        </div>
      </div>

      {error && <div className={styles.messageError}>{error}</div>}

      <section className={styles.tablePanel}>
        <div className={styles.tableScroller}>
          <table className={styles.table}>
            <thead className={styles.tableHead}>
              <tr><th>출처명</th><th>기본 URL</th><th>설명</th></tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={3} className={styles.emptyCell}>불러오는 중입니다.</td></tr>
              ) : sources.length ? (
                sources.map((source) => (
                  <tr key={source.id}>
                    <td><span className={styles.tableTitleLink}>{source.name}</span></td>
                    <td>
                      {source.baseUrl ? (
                        <a href={source.baseUrl} target="_blank" rel="noopener noreferrer" className={styles.tableTitleLink} style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
                          {source.baseUrl} <ExternalLink size={12} />
                        </a>
                      ) : <span className={styles.tableMono}>-</span>}
                    </td>
                    <td className={styles.tableDetailText}>{source.description ?? "-"}</td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={3} className={styles.emptyCell}>등록된 출처가 없습니다.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className={styles.panel}>
        <p className={styles.tableDetailText}>
          출처는 공고 등록/수정 시 자동 생성됩니다. 기업회원 제출 공고 승인 시 &quot;기업회원 제출&quot; 출처가 자동으로 추가됩니다.
        </p>
      </section>
    </div>
  );
}
