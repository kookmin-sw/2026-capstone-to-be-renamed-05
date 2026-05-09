"use client";

import { jobPresetConfigs, type UserJobPresetItem } from "@cpa/shared";
import { Plus, X } from "lucide-react";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import type { SetJobFiltersOptions } from "@/hooks/use-job-filter-state";
import {
  createUserJobPreset,
  deleteUserJobPreset,
  fetchCurrentUser,
  fetchUserJobPresets,
  markUserJobPresetUsed,
} from "@/lib/api";
import {
  isMeaningfulJobPresetSnapshot,
  jobFiltersToPresetSnapshot,
  jobPresetSignatureFromFilters,
  userPresetState,
  type JobFilterState,
} from "@/lib/job-filters";
import { cn } from "@/lib/utils";
import styles from "./job-preset-bar.module.css";

type JobPresetBarProps = {
  filters: JobFilterState;
  onChange: (filters: JobFilterState, options?: SetJobFiltersOptions) => void;
  className?: string;
};

const personalPresetLimit = 5;

export function JobPresetBar({
  filters,
  onChange,
  className,
}: JobPresetBarProps) {
  const [authMode, setAuthMode] = useState<
    "loading" | "guest" | "job-seeker" | "hidden"
  >("loading");
  const [personalPresets, setPersonalPresets] = useState<UserJobPresetItem[]>(
    [],
  );
  const [naming, setNaming] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;

    void fetchCurrentUser()
      .then(async (user) => {
        if (ignore) return null;
        if (!user) {
          setAuthMode("guest");
          return null;
        }
        if (user.role !== "JOB_SEEKER") {
          setAuthMode("hidden");
          return null;
        }
        setAuthMode("job-seeker");
        try {
          const data = await fetchUserJobPresets();
          if (!ignore) {
            setPersonalPresets(data.items);
            setError("");
          }
        } catch (caught) {
          if (!ignore) {
            setError(
              caught instanceof Error
                ? caught.message
                : "개인 프리셋을 불러오지 못했습니다.",
            );
          }
        }
      })
      .catch(() => {
        if (!ignore) {
          setAuthMode("guest");
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  const signature = useMemo(
    () => jobPresetSignatureFromFilters(filters),
    [filters],
  );
  const canSave = useMemo(
    () => isMeaningfulJobPresetSnapshot(filters),
    [filters],
  );
  const isDuplicate = personalPresets.some(
    (preset) => preset.filterSignature === signature,
  );
  const isAtLimit = personalPresets.length >= personalPresetLimit;
  const saveDisabled =
    authMode !== "job-seeker" || !canSave || isDuplicate || isAtLimit || saving;
  const confirmDisabled = saveDisabled || !draftName.trim();

  const saveTitle = !canSave
    ? "저장할 필터 조합이 없습니다."
    : isDuplicate
      ? "이미 저장된 조합입니다."
      : isAtLimit
        ? `개인 프리셋은 최대 ${personalPresetLimit}개까지 저장할 수 있습니다.`
        : "현재 필터 조합 저장";
  const confirmTitle = !draftName.trim()
    ? "프리셋 이름을 입력해 주세요."
    : saveTitle;

  const applyBasePreset = (id: JobFilterState["preset"]) => {
    onChange({
      ...filters,
      preset: filters.preset === id ? "" : id,
      userPresetId: "",
    });
  };

  const applyPersonalPreset = (preset: UserJobPresetItem) => {
    onChange(userPresetState(preset.filterState, preset.id), {
      preserveUserPreset: true,
    });
    markUserJobPresetUsed(preset.id)
      .then((updated) => {
        setPersonalPresets((current) =>
          current.map((item) => (item.id === updated.id ? updated : item)),
        );
      })
      .catch(() => {});
  };

  const handleStartSave = () => {
    if (saveDisabled) return;
    setNaming(true);
    setError("");
  };

  const handleCancelName = () => {
    if (saving) return;
    setNaming(false);
    setDraftName("");
  };

  const handleSave = (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    if (confirmDisabled) return;
    setSaving(true);
    setError("");
    createUserJobPreset(jobFiltersToPresetSnapshot(filters), draftName.trim())
      .then((created) => {
        setPersonalPresets((current) => [...current, created]);
        setNaming(false);
        setDraftName("");
        onChange(userPresetState(created.filterState, created.id), {
          preserveUserPreset: true,
        });
      })
      .catch((caught: Error) => {
        setError(caught.message);
      })
      .finally(() => {
        setSaving(false);
      });
  };

  const handleDelete = (preset: UserJobPresetItem) => {
    setError("");
    deleteUserJobPreset(preset.id)
      .then(() => {
        setPersonalPresets((current) =>
          current.filter((item) => item.id !== preset.id),
        );
        if (filters.userPresetId === preset.id) {
          onChange({ ...filters, userPresetId: "" });
        }
      })
      .catch((caught: Error) => {
        setError(caught.message);
      });
  };

  return (
    <div className={cn(styles.root, className)}>
      <div className={styles.row}>
        {jobPresetConfigs.map((preset) => {
          const selected = filters.preset === preset.id;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => applyBasePreset(preset.id)}
              className={cn(styles.chip, selected && styles.chipSelected)}
            >
              {preset.label}
            </button>
          );
        })}

        {authMode !== "hidden" && <span className={styles.divider} />}

        {authMode === "guest" && (
          <span className={styles.guestHint}>개인회원 로그인 시 저장 가능</span>
        )}

        {authMode === "job-seeker" &&
          personalPresets.map((preset) => {
            const selected = filters.userPresetId === preset.id;
            return (
              <span
                key={preset.id}
                className={cn(
                  styles.personalChip,
                  selected && styles.personalChipSelected,
                )}
              >
                <button
                  type="button"
                  onClick={() => applyPersonalPreset(preset)}
                  className={styles.personalChipLabel}
                >
                  {preset.autoLabel}
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(preset)}
                  className={styles.personalChipDelete}
                  aria-label={`${preset.autoLabel} 삭제`}
                >
                  <X size={12} />
                </button>
              </span>
            );
          })}

        {authMode === "job-seeker" && naming && (
          <form className={styles.nameForm} onSubmit={handleSave}>
            <input
              type="text"
              value={draftName}
              onChange={(event) => setDraftName(event.target.value)}
              maxLength={30}
              placeholder="프리셋 이름"
              aria-label="개인 프리셋 이름"
              disabled={saving}
              className={styles.nameInput}
              autoFocus
            />
            <button
              type="submit"
              disabled={confirmDisabled}
              title={confirmTitle}
              className={cn(
                styles.nameConfirm,
                confirmDisabled && styles.disabled,
              )}
            >
              {saving ? "저장 중" : "저장"}
            </button>
            <button
              type="button"
              onClick={handleCancelName}
              disabled={saving}
              className={styles.nameCancel}
            >
              취소
            </button>
          </form>
        )}

        {authMode === "job-seeker" && !naming && (
          <button
            type="button"
            onClick={handleStartSave}
            disabled={saveDisabled}
            title={saveTitle}
            className={cn(styles.saveButton, saveDisabled && styles.disabled)}
          >
            <Plus size={12} />
            {saving ? "저장 중" : "내 조합 저장"}
          </button>
        )}
      </div>
      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
}
