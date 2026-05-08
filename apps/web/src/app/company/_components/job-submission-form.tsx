import type { CompanyManagedJobItem, JobSubmissionItem } from "@cpa/shared";
import {
  DEADLINE_TYPES,
  EMPLOYMENT_TYPES,
  JOB_FAMILIES,
  KICPA_CONDITIONS,
  TRAINEE_STATUSES,
} from "@cpa/shared";
import { ClipboardList, PencilLine, Send } from "lucide-react";
import type { FormEvent } from "react";
import { Field, SelectField } from "./form-field";
import { SectionTitle } from "./section-title";
import type { JobForm } from "../_lib/job-form";
import { ActionButton } from "@/components/ui/action-button";
import {
  deadlineTypeLabels,
  employmentLabels,
  jobFamilyLabels,
  kicpaLabels,
  traineeLabels,
} from "@/lib/labels";
import { cn } from "@/lib/utils";
import styles from "../company-page.module.css";

export function JobSubmissionForm({
  editingJob,
  editingSubmission,
  form,
  onChange,
  onSubmit,
  onCancelEdit,
}: {
  editingJob: CompanyManagedJobItem | null;
  editingSubmission: JobSubmissionItem | null;
  form: JobForm;
  onChange: (form: JobForm) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCancelEdit: () => void;
}) {
  const mode = editingSubmission ? "submission" : editingJob ? "job" : "new";

  return (
    <form className={styles.form} onSubmit={onSubmit}>
      <SectionTitle
        icon={
          mode === "new" ? (
            <ClipboardList size={19} />
          ) : (
            <PencilLine size={19} />
          )
        }
        title={
          mode === "submission"
            ? "공고 요청 수정"
            : mode === "job"
              ? "공고 수정 요청"
              : "채용공고 게시 요청"
        }
        aside={
          mode === "submission"
            ? "검수 전 내용 수정"
            : mode === "job"
              ? "Admin 검수 후 반영"
              : "Admin 검수 후 공개"
        }
      />
      {editingJob || editingSubmission ? (
        <div className={styles.editNotice}>
          <span className={styles.editTarget}>
            수정 대상: {editingSubmission?.title ?? editingJob?.title}
          </span>
          <button
            className={styles.textButton}
            type="button"
            onClick={onCancelEdit}
          >
            취소
          </button>
        </div>
      ) : null}
      <div className={styles.formSection}>
        <p className={styles.formSectionLabel}>기본 정보</p>
        <div className={styles.formSectionGrid}>
          <Field label="공고명">
            <input
              className="form-input"
              required
              value={form.title}
              onChange={(event) =>
                onChange({ ...form, title: event.target.value })
              }
            />
          </Field>
          <Field label="원문 링크">
            <input
              className="form-input"
              required
              value={form.originalUrl}
              onChange={(event) =>
                onChange({ ...form, originalUrl: event.target.value })
              }
            />
          </Field>
        </div>
      </div>
      <div className={styles.formSection}>
        <p className={styles.formSectionLabel}>채용 조건</p>
        <div className={styles.formSectionGrid}>
          <SelectField
            label="직무군"
            value={form.jobFamily}
            options={JOB_FAMILIES}
            labels={jobFamilyLabels}
            onChange={(value) => onChange({ ...form, jobFamily: value })}
          />
          <SelectField
            label="고용 형태"
            value={form.employmentType}
            options={EMPLOYMENT_TYPES}
            labels={employmentLabels}
            onChange={(value) => onChange({ ...form, employmentType: value })}
          />
          <SelectField
            label="KICPA 조건"
            value={form.kicpaCondition}
            options={KICPA_CONDITIONS}
            labels={kicpaLabels}
            onChange={(value) => onChange({ ...form, kicpaCondition: value })}
          />
          <SelectField
            label="수습 CPA"
            value={form.traineeStatus}
            options={TRAINEE_STATUSES}
            labels={traineeLabels}
            onChange={(value) => onChange({ ...form, traineeStatus: value })}
          />
          <Field label="실무수습기관">
            <select
              className="form-input"
              value={form.practicalTrainingInstitution}
              onChange={(event) =>
                onChange({
                  ...form,
                  practicalTrainingInstitution: event.target.value,
                })
              }
            >
              <option value="">불명확</option>
              <option value="true">가능</option>
              <option value="false">불가</option>
            </select>
          </Field>
        </div>
      </div>
      <div className={styles.formSection}>
        <p className={styles.formSectionLabel}>마감 · 경력 · 지역</p>
        <div className={styles.formSectionGrid}>
          <SelectField
            label="마감 유형"
            value={form.deadlineType}
            options={DEADLINE_TYPES}
            labels={deadlineTypeLabels}
            onChange={(value) => onChange({ ...form, deadlineType: value })}
          />
          <Field label="마감일">
            <input
              className="form-input"
              disabled={form.deadlineType !== "FIXED_DATE"}
              required={form.deadlineType === "FIXED_DATE"}
              type="date"
              value={form.deadline}
              onChange={(event) =>
                onChange({ ...form, deadline: event.target.value })
              }
            />
          </Field>
          <Field label="최소 경력">
            <input
              className="form-input"
              min={0}
              type="number"
              value={form.minExperienceYears}
              onChange={(event) =>
                onChange({ ...form, minExperienceYears: event.target.value })
              }
            />
          </Field>
          <Field label="최대 경력">
            <input
              className="form-input"
              min={0}
              type="number"
              value={form.maxExperienceYears}
              onChange={(event) =>
                onChange({ ...form, maxExperienceYears: event.target.value })
              }
            />
          </Field>
          <Field label="지역">
            <input
              className="form-input"
              value={form.location}
              onChange={(event) =>
                onChange({ ...form, location: event.target.value })
              }
            />
          </Field>
        </div>
      </div>
      <Field label="공고 내용">
        <textarea
          className={cn("form-input", styles.descriptionInput)}
          required
          value={form.description}
          onChange={(event) =>
            onChange({ ...form, description: event.target.value })
          }
        />
      </Field>
      <ActionButton
        type="submit"
        className={styles.fitAction}
        iconStart={<Send size={16} />}
      >
        {mode === "submission"
          ? "요청 수정"
          : mode === "job"
            ? "수정 요청"
            : "게시 요청"}
      </ActionButton>
    </form>
  );
}
