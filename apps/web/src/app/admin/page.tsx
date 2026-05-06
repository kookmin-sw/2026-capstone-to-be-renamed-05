"use client";

import { BriefcaseBusiness, Building2, Clock, Users } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { JobStatusBadge } from "@/components/admin/status-badge";
import {
  fetchAdminDashboard,
  type AdminDashboard,
} from "@/components/admin/admin-demo-data";
import styles from "@/components/admin/admin.module.css";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function AdminDashboardPage() {
  const [dashboard, setDashboard] = useState<AdminDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;
    fetchAdminDashboard()
      .then((data) => {
        if (!ignore) {
          setDashboard(data);
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

  if (loading) {
    return <div className={styles.loadingText}>대시보드를 불러오는 중입니다.</div>;
  }

  if (error || !dashboard) {
    return (
      <div className={styles.messageError}>
        {error || "대시보드를 불러오지 못했습니다."}
      </div>
    );
  }

  const cards = [
    {
      label: "공고 수",
      value: dashboard.counts.jobs,
      icon: BriefcaseBusiness,
    },
    { label: "회사 수", value: dashboard.counts.companies, icon: Building2 },
    { label: "회원 수", value: dashboard.counts.members, icon: Users },
    {
      label: "게시중 공고",
      value: dashboard.counts.jobsByStatus.OPEN,
      icon: Clock,
    },
  ];

  return (
    <div className={styles.dashboardStack}>
      <section className={styles.statsGrid}>
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <article key={card.label} className={styles.metricCard}>
              <div className={styles.metricHeader}>
                <p className={styles.metricLabel}>{card.label}</p>
                <Icon size={18} className={styles.metricIcon} />
              </div>
              <p className={styles.metricValue}>
                {card.value.toLocaleString("ko-KR")}
              </p>
            </article>
          );
        })}
      </section>

      <section className={styles.dashboardPanels}>
        <div className={styles.tablePanel}>
          <div className={styles.panelHeader}>
            <h2 className={styles.panelTitle}>최근 등록된 공고</h2>
            <Link
              href="/admin/jobs"
              className={styles.brandLink}
            >
              전체 보기
            </Link>
          </div>
          <div className={styles.list}>
            {dashboard.recentJobs.length ? (
              dashboard.recentJobs.map((job) => (
                <Link
                  key={job.id}
                  href={`/admin/jobs/${job.id}`}
                  className={styles.listItem}
                >
                  <div className={styles.listRowHeader}>
                    <p className={styles.listTitle}>{job.title}</p>
                    <JobStatusBadge status={job.status} />
                  </div>
                  <p className={styles.listMeta}>
                    {job.companyName} · {formatDate(job.createdAt)}
                  </p>
                </Link>
              ))
            ) : (
              <p className={styles.emptyCell}>
                등록된 공고가 없습니다.
              </p>
            )}
          </div>
        </div>

        <div className={styles.tablePanel}>
          <div className={styles.panelHeader}>
            <h2 className={styles.panelTitle}>최근 등록된 회사</h2>
            <Link
              href="/admin/companies"
              className={styles.brandLink}
            >
              전체 보기
            </Link>
          </div>
          <div className={styles.list}>
            {dashboard.recentCompanies.length ? (
              dashboard.recentCompanies.map((company) => (
                <Link
                  key={company.id}
                  href={`/admin/companies/${company.id}`}
                  className={styles.listItem}
                >
                  <div className={styles.listRowHeader}>
                    <p className={styles.listTitle}>{company.name}</p>
                    <span className={styles.inlineStat}>
                      공고 {company.jobCount}
                    </span>
                  </div>
                  <p className={styles.listMeta}>
                    {company.type} · {formatDate(company.createdAt)}
                  </p>
                </Link>
              ))
            ) : (
              <p className={styles.emptyCell}>
                등록된 회사가 없습니다.
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
