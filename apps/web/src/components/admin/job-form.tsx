"use client";

import {
  COMPANY_TYPES,
  DEADLINE_TYPES,
  EMPLOYMENT_TYPES,
  JOB_FAMILIES,
  KICPA_CONDITIONS,
  TRAINEE_STATUSES,
} from "@cpa/shared";
import { Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import {
  createAdminJob,
  fetchAdminCompanies,
  fetchAdminJob,
  fetchAdminSources,
  updateAdminJob,
  type AdminCompany,
  type AdminCompanyType,
  type AdminDeadlineType,
  type AdminEmploymentType,
  type AdminJobFamily,
  type AdminJobPayload,
  type AdminKicpaCondition,
  type AdminSource,
  type AdminTraineeStatus,
  type JobStatus,
  companyTypeLabels,
  deadlineTypeLabels,
  employmentLabels,
  jobFamilyLabels,
  jobStatusLabels,
  kicpaLabels,
  traineeLabels,
} from "@/components/admin/admin-demo-data";
import { logClientError } from "@/lib/client-logger";
import { cn } from "@/lib/utils";
import styles from "./admin.module.css";

const JOB_STATUSES = ["OPEN", "CLOSED", "DRAFT"] as const;

type JobFormState = {
  title: string;
  description: string;
  companyId: string;
  sourceId: string;
  originalUrl: string;
  jobFamily: AdminJobFamily;
  employmentType: AdminEmploymentType;
  companyType: AdminCompanyType;
  kicpaCondition: AdminKicpaCondition;
  traineeStatus: AdminTraineeStatus;
  practicalTrainingInstitution: "" | "true" | "false";
  minExperienceYears: string;
  maxExperienceYears: string;
  location: string;
  deadlineType: AdminDeadlineType;
  deadline: string;
  status: JobStatus;
};

const blankForm: JobFormState = {
  title: "",
  description: "",
  companyId: "",
  sourceId: "",
  originalUrl: "",
  jobFamily: "AUDIT",
  employmentType: "FULL_TIME",
  companyType: "LOCAL_ACCOUNTING_FIRM",
  kicpaCondition: "PREFERRED",
  traineeStatus: "UNCLEAR",
  practicalTrainingInstitution: "",
  minExperienceYears: "",
  maxExperienceYears: "",
  location: "",
  deadlineType: "FIXED_DATE",
  deadline: "",
  status: "OPEN",
};

function nullable(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function optionalNumber(value: string) {
  if (!value.trim()) return null;
  return Number(value);
}

function deadlineToIso(deadlineType: AdminDeadlineType, date: string) {
  if (deadlineType !== "FIXED_DATE" || !date) return null;
  return new Date(`${date}T23:59:59.000+09:00`).toISOString();
}

export function JobForm({ jobId }: { jobId?: string }) {
  const router = useRouter();
  const [form, setForm] = useState<JobFormState>(blankForm);
  const [companies, setCompanies] = useState<AdminCompany[]>([]);
  const [sources, setSources] = useState<AdminSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let ignore = false;
    const companyParams = new URLSearchParams({ pageSize: "100" });
    Promise.all([
      fetchAdminCompanies(companyParams),
      fetchAdminSources(),
      jobId ? fetchAdminJob(jobId) : Promise.resolve(null),
    ])
      .then(([companyData, sourceData, job]) => {
        if (ignore) return;
        setCompanies(companyData.items);
        setSources(sourceData.items);
        if (job) {
          setForm({
            title: job.title,
            description: job.description,
            companyId: job.companyId,
            sourceId: job.sourceId,
            originalUrl: job.originalUrl,
            jobFamily: job.jobFamily,
            employmentType: job.employmentType,
            companyType: job.companyType,
            kicpaCondition: job.kicpaCondition,
            traineeStatus: job.traineeStatus,
            practicalTrainingInstitution:
              job.practicalTrainingInstitution === null
                ? ""
                : job.practicalTrainingInstitution
                  ? "true"
                  : "false",
            minExperienceYears:
              job.minExperienceYears === null ? "" : String(job.minExperienceYears),
            maxExperienceYears:
              job.maxExperienceYears === null ? "" : String(job.maxExperienceYears),
            location: job.location ?? "",
            deadlineType: job.deadlineType,
            deadline: job.deadline ? job.deadline.slice(0, 10) : "",
            status: job.status,
          });
        } else {
          setForm((current) => ({
            ...current,
            companyId: companyData.items[0]?.id ?? "",
            companyType: companyData.items[0]?.type ?? current.companyType,
            sourceId: sourceData.items[0]?.id ?? "",
          }));
        }
        setMessage("");
      })
      .catch((caught: Error) => {
        if (!ignore) {
          logClientError("admin.job_form_load_failed", caught, { jobId });
          setMessage(caught.message);
        }
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [jobId]);

  function update<K extends keyof JobFormState>(key: K, value: JobFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function changeCompany(companyId: string) {
    const company = companies.find((item) => item.id === companyId);
    setForm((current) => ({
      ...current,
      companyId,
      companyType: company?.type ?? current.companyType,
    }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    if (!form.companyId || !form.sourceId) {
      setMessage("회사와 출처를 먼저 선택해 주세요.");
      return;
    }

    const payload: AdminJobPayload = {
      title: form.title.trim(),
      description: form.description.trim(),
      companyId: form.companyId,
      sourceId: form.sourceId,
      originalUrl: form.originalUrl.trim(),
      jobFamily: form.jobFamily,
      employmentType: form.employmentType,
      companyType: form.companyType,
      kicpaCondition: form.kicpaCondition,
      traineeStatus: form.traineeStatus,
      practicalTrainingInstitution:
        form.practicalTrainingInstitution === ""
          ? null
          : form.practicalTrainingInstitution === "true",
      minExperienceYears: optionalNumber(form.minExperienceYears),
      maxExperienceYears: optionalNumber(form.maxExperienceYears),
      location: nullable(form.location),
      deadlineType: form.deadlineType,
      deadline: deadlineToIso(form.deadlineType, form.deadline),
      status: form.status,
    };

    setSaving(true);
    try {
      if (jobId) {
        await updateAdminJob(jobId, payload);
      } else {
        await createAdminJob(payload);
      }
      router.push("/admin/jobs");
    } catch (error) {
      logClientError("admin.job_save_failed", error, {
        mode: jobId ? "edit" : "create",
        jobId,
      });
      setMessage(error instanceof Error ? error.message : "저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className={styles.loadingText}>공고 정보를 불러오는 중입니다.</div>;
  }

  return (
    <form className={styles.form} onSubmit={submit}>
      <div className={styles.pageHeader}>
        <div>
          <h2 className={styles.pageTitle}>
            {jobId ? "공고 수정" : "공고 생성"}
          </h2>
          <p className={styles.pageDescription}>
            공개 공고 화면과 충돌하지 않도록 기존 enum과 source를 그대로 사용합니다.
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

      {message && (
        <div className={styles.messageError}>
          {message}
        </div>
      )}

      <section className={styles.formCard}>
        <div className={styles.formGridTwo}>
          <Field label="공고 제목">
            <input
              required
              value={form.title}
              onChange={(event) => update("title", event.target.value)}
              className={styles.input}
            />
          </Field>
          <Field label="원문 URL">
            <input
              required
              value={form.originalUrl}
              onChange={(event) => update("originalUrl", event.target.value)}
              className={styles.input}
              placeholder="https://example.com/jobs/..."
            />
          </Field>
          <Field label="회사">
            <select
              required
              value={form.companyId}
              onChange={(event) => changeCompany(event.target.value)}
              className={styles.select}
            >
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="출처">
            <select
              required
              value={form.sourceId}
              onChange={(event) => update("sourceId", event.target.value)}
              className={styles.select}
            >
              {sources.map((source) => (
                <option key={source.id} value={source.id}>
                  {source.name}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="공고 설명">
          <textarea
            required
            value={form.description}
            onChange={(event) => update("description", event.target.value)}
            className={cn(styles.textarea, styles.textareaTall)}
          />
        </Field>
      </section>

      <section className={cn(styles.formCard, styles.formGridFour)}>
        <SelectField
          label="상태"
          value={form.status}
          options={JOB_STATUSES}
          labels={jobStatusLabels}
          onChange={(value) => update("status", value as JobStatus)}
        />
        <SelectField
          label="직무군"
          value={form.jobFamily}
          options={JOB_FAMILIES}
          labels={jobFamilyLabels}
          onChange={(value) => update("jobFamily", value as AdminJobFamily)}
        />
        <SelectField
          label="회사 유형"
          value={form.companyType}
          options={COMPANY_TYPES}
          labels={companyTypeLabels}
          onChange={(value) => update("companyType", value as AdminCompanyType)}
        />
        <SelectField
          label="고용 형태"
          value={form.employmentType}
          options={EMPLOYMENT_TYPES}
          labels={employmentLabels}
          onChange={(value) =>
            update("employmentType", value as AdminEmploymentType)
          }
        />
        <SelectField
          label="KICPA 조건"
          value={form.kicpaCondition}
          options={KICPA_CONDITIONS}
          labels={kicpaLabels}
          onChange={(value) =>
            update("kicpaCondition", value as AdminKicpaCondition)
          }
        />
        <SelectField
          label="수습 상태"
          value={form.traineeStatus}
          options={TRAINEE_STATUSES}
          labels={traineeLabels}
          onChange={(value) =>
            update("traineeStatus", value as AdminTraineeStatus)
          }
        />
        <SelectField
          label="수습기관 여부"
          value={form.practicalTrainingInstitution}
          options={["", "true", "false"]}
          labels={{ "": "미정", "true": "가능", "false": "불가능" }}
          onChange={(value) =>
            update(
              "practicalTrainingInstitution",
              value as "" | "true" | "false",
            )
          }
        />
        <Field label="지역">
          <input
            value={form.location}
            onChange={(event) => update("location", event.target.value)}
            className={styles.input}
            placeholder="서울 강남구"
          />
        </Field>
        <Field label="최소 경력">
          <input
            type="number"
            min={0}
            value={form.minExperienceYears}
            onChange={(event) => update("minExperienceYears", event.target.value)}
            className={styles.input}
          />
        </Field>
        <Field label="최대 경력">
          <input
            type="number"
            min={0}
            value={form.maxExperienceYears}
            onChange={(event) => update("maxExperienceYears", event.target.value)}
            className={styles.input}
          />
        </Field>
        <SelectField
          label="마감 유형"
          value={form.deadlineType}
          options={DEADLINE_TYPES}
          labels={deadlineTypeLabels}
          onChange={(value) => update("deadlineType", value as AdminDeadlineType)}
        />
        <Field label="마감일">
          <input
            type="date"
            value={form.deadline}
            disabled={form.deadlineType !== "FIXED_DATE"}
            onChange={(event) => update("deadline", event.target.value)}
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

function SelectField({
  label,
  value,
  options,
  labels,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly string[];
  labels: Record<string, string>;
  onChange: (value: string) => void;
}) {
  return (
    <Field label={label}>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={styles.select}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {labels[option] ?? option}
          </option>
        ))}
      </select>
    </Field>
  );
}
