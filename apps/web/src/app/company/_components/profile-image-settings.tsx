import { ImageIcon, Send } from "lucide-react";
import type { FormEvent } from "react";
import { Field } from "./form-field";
import { SectionTitle } from "./section-title";
import type { ProfileImageForm } from "../_lib/profile-image-form";
import { ActionButton } from "@/components/ui/action-button";
import styles from "../company-page.module.css";

export function ProfileImageSettings({
  companyName,
  currentLogoUrl,
  form,
  fileName,
  uploading,
  onFileChange,
  onSubmit,
}: {
  companyName: string;
  currentLogoUrl: string | null;
  form: ProfileImageForm;
  fileName: string;
  uploading: boolean;
  onFileChange: (event: FormEvent<HTMLInputElement>) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <form className={styles.form} onSubmit={onSubmit}>
      <SectionTitle
        icon={<ImageIcon size={19} />}
        title="기업 이미지 설정"
        aside="즉시 반영"
      />
      <div className={styles.profileImageGrid}>
        <LogoPreview
          label="현재 공개 이미지"
          logoUrl={currentLogoUrl}
          name={companyName}
        />
        <LogoPreview
          label="새 이미지 미리보기"
          logoUrl={form.logoUrl}
          name={companyName}
        />
      </div>
      <Field label="기업 이미지 파일">
        <input
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="form-input"
          disabled={uploading}
          type="file"
          onChange={onFileChange}
        />
      </Field>
      {fileName || form.logoUrl !== currentLogoUrl ? (
        <p className={styles.uploadHint}>
          {fileName || "새 기업 이미지가 업로드되었습니다."}
        </p>
      ) : null}
      <ActionButton
        type="submit"
        className={styles.fitAction}
        disabled={uploading}
        iconStart={<Send size={16} />}
      >
        {uploading ? "이미지 업로드 중" : "이미지 바로 변경"}
      </ActionButton>
    </form>
  );
}

function LogoPreview({
  label,
  logoUrl,
  name,
}: {
  label: string;
  logoUrl: string | null | undefined;
  name: string;
}) {
  const src = logoUrl?.trim();

  return (
    <div className={styles.logoPreview}>
      <p className={styles.logoPreviewLabel}>{label}</p>
      <div className={styles.logoPreviewFrame}>
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element -- company image URLs are user-provided local or external paths.
          <img src={src} alt={`${name} 이미지`} />
        ) : (
          <span>{name.slice(0, 2)}</span>
        )}
      </div>
    </div>
  );
}
