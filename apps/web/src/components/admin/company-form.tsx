"use client";

import { COMPANY_TYPES } from "@cpa/shared";
import { Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import {
  createAdminCompany,
  fetchAdminCompany,
  updateAdminCompany,
  type AdminCompanyPayload,
  type AdminCompanyType,
  companyTypeLabels,
} from "@/components/admin/admin-demo-data";
import { logClientError } from "@/lib/client-logger";
import { cn } from "@/lib/utils";
import styles from "./admin.module.css";

type CompanyFormState = {
  name: string;
  type: AdminCompanyType;
  websiteUrl: string;
  description: string;
  businessNumber: string;
  externalLinks: string;
  tags: string;
  employeeCount: string;
  averageSalary: string;
  foundedYear: string;
  recentAttritionRate: string;
};

const blankForm: CompanyFormState = {
  name: "",
  type: "LOCAL_ACCOUNTING_FIRM",
  websiteUrl: "",
  description: "",
  businessNumber: "",
  externalLinks: "",
  tags: "",
  employeeCount: "",
  averageSalary: "",
  foundedYear: "",
  recentAttritionRate: "",
};

function nullable(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function optionalNumber(value: string) {
  if (!value.trim()) return null;
  return Number(value);
}

function splitList(value: string) {
  return value
    .split(/[,\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function CompanyForm({ companyId }: { companyId?: string }) {
  const router = useRouter();
  const [form, setForm] = useState<CompanyFormState>(blankForm);
  const [loading, setLoading] = useState(Boolean(companyId));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!companyId) return;
    let ignore = false;
    fetchAdminCompany(companyId)
      .then((company) => {
        if (ignore) return;
        setForm({
          name: company.name,
          type: company.type,
          websiteUrl: company.websiteUrl ?? "",
          description: company.description ?? "",
          businessNumber: company.businessNumber ?? "",
          externalLinks: company.externalLinks.join("\n"),
          tags: company.tags.join(", "),
          employeeCount:
            company.employeeCount === null ? "" : String(company.employeeCount),
          averageSalary:
            company.averageSalary === null ? "" : String(company.averageSalary),
          foundedYear:
            company.foundedYear === null ? "" : String(company.foundedYear),
          recentAttritionRate:
            company.recentAttritionRate === null
              ? ""
              : String(company.recentAttritionRate),
        });
      })
      .catch((caught: Error) => {
        if (!ignore) {
          logClientError("admin.company_form_load_failed", caught, {
            companyId,
          });
          setMessage(caught.message);
        }
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [companyId]);

  function update<K extends keyof CompanyFormState>(
    key: K,
    value: CompanyFormState[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    const payload: AdminCompanyPayload = {
      name: form.name.trim(),
      type: form.type,
      websiteUrl: nullable(form.websiteUrl),
      description: nullable(form.description),
      businessNumber: nullable(form.businessNumber),
      externalLinks: splitList(form.externalLinks),
      tags: splitList(form.tags),
      employeeCount: optionalNumber(form.employeeCount),
      averageSalary: optionalNumber(form.averageSalary),
      foundedYear: optionalNumber(form.foundedYear),
      recentAttritionRate: optionalNumber(form.recentAttritionRate),
    };

    setSaving(true);
    try {
      if (companyId) {
        await updateAdminCompany(companyId, payload);
      } else {
        await createAdminCompany(payload);
      }
      router.push("/admin/companies");
    } catch (error) {
      logClientError("admin.company_save_failed", error, {
        mode: companyId ? "edit" : "create",
        companyId,
      });
      setMessage(
        error instanceof Error ? error.message : "저장에 실패했습니다.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className={styles.loadingText}>회사 정보를 불러오는 중입니다.</div>
    );
  }

  return (
    <form className={styles.form} onSubmit={submit}>
      <div className={styles.pageHeader}>
        <div>
          <h2 className={styles.pageTitle}>
            {companyId ? "회사 수정" : "회사 생성"}
          </h2>
          <p className={styles.pageDescription}>
            회사 삭제와 숨김 처리는 이번 프로토타입 범위에서 제외합니다.
          </p>
        </div>
        <button
          type="submit"
          disabled={saving}
          className={styles.primaryButton}
        >
          <Save size={16} />
          {saving ? "저장 중" : "저장"}
        </button>
      </div>

      {message && <div className={styles.messageError}>{message}</div>}

      <section className={styles.formCard}>
        <div className={styles.formGridTwo}>
          <Field label="회사명">
            <input
              required
              value={form.name}
              onChange={(event) => update("name", event.target.value)}
              className={styles.input}
            />
          </Field>
          <Field label="회사 유형">
            <select
              value={form.type}
              onChange={(event) =>
                update("type", event.target.value as AdminCompanyType)
              }
              className={styles.select}
            >
              {COMPANY_TYPES.map((type) => (
                <option key={type} value={type}>
                  {companyTypeLabels[type]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="홈페이지 URL">
            <input
              value={form.websiteUrl}
              onChange={(event) => update("websiteUrl", event.target.value)}
              className={styles.input}
              placeholder="https://example.com"
            />
          </Field>
          <Field label="사업자번호">
            <input
              value={form.businessNumber}
              onChange={(event) => update("businessNumber", event.target.value)}
              className={styles.input}
            />
          </Field>
          <Field label="태그">
            <input
              value={form.tags}
              onChange={(event) => update("tags", event.target.value)}
              className={styles.input}
              placeholder="감사, 수습, Big4"
            />
          </Field>
        </div>

        <Field label="회사 설명">
          <textarea
            value={form.description}
            onChange={(event) => update("description", event.target.value)}
            className={cn(styles.textarea, styles.textareaMedium)}
          />
        </Field>

        <Field label="외부 링크">
          <textarea
            value={form.externalLinks}
            onChange={(event) => update("externalLinks", event.target.value)}
            className={cn(styles.textarea, styles.textareaShort)}
            placeholder="한 줄에 하나씩 입력"
          />
        </Field>
      </section>

      <section className={cn(styles.formCard, styles.formGridFour)}>
        <Field label="직원 수">
          <input
            type="number"
            min={0}
            value={form.employeeCount}
            onChange={(event) => update("employeeCount", event.target.value)}
            className={styles.input}
          />
        </Field>
        <Field label="평균연봉(만원)">
          <input
            type="number"
            min={0}
            value={form.averageSalary}
            onChange={(event) => update("averageSalary", event.target.value)}
            className={styles.input}
          />
        </Field>
        <Field label="설립연도">
          <input
            type="number"
            min={1800}
            max={2100}
            value={form.foundedYear}
            onChange={(event) => update("foundedYear", event.target.value)}
            className={styles.input}
          />
        </Field>
        <Field label="최근 퇴사율(%)">
          <input
            type="number"
            min={0}
            max={100}
            step="0.1"
            value={form.recentAttritionRate}
            onChange={(event) =>
              update("recentAttritionRate", event.target.value)
            }
            className={styles.input}
          />
        </Field>
      </section>
    </form>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className={styles.field}>
      {label}
      {children}
    </label>
  );
}
