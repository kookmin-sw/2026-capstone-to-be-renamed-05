import { ImageIcon, Send } from "lucide-react";
import type { FormEvent } from "react";
import { Field } from "./form-field";
import { SectionTitle } from "./section-title";
import type { ProfileImageForm } from "../_lib/profile-image-form";
import { ActionButton } from "@/components/ui/action-button";
import styles from "../company-page.module.css";

export function ProfileImageSettings({
  imageKind,
  companyName,
  currentImageUrl,
  form,
  fileName,
  uploading,
  onFileChange,
  onSubmit,
}: {
  imageKind: "logo" | "background";
  companyName: string;
  currentImageUrl: string | null;
  form: ProfileImageForm;
  fileName: string;
  uploading: boolean;
  onFileChange: (event: FormEvent<HTMLInputElement>) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const isBackground = imageKind === "background";
  const title = isBackground ? "기업 배경 이미지 설정" : "기업 로고 설정";
  const fileLabel = isBackground ? "배경 이미지 파일" : "로고 이미지 파일";
  const accept = isBackground
    ? "image/png,image/jpeg,image/webp"
    : "image/png,image/jpeg,image/webp,image/gif";

  return (
    <form className={styles.form} onSubmit={onSubmit}>
      <SectionTitle
        icon={<ImageIcon size={19} />}
        title={title}
        aside="즉시 반영"
      />
      <div className={styles.profileImageGrid}>
        <LogoPreview
          imageKind={imageKind}
          label="현재 공개 이미지"
          imageUrl={currentImageUrl}
          name={companyName}
        />
        <LogoPreview
          imageKind={imageKind}
          label="새 이미지 미리보기"
          imageUrl={form.imageUrl}
          name={companyName}
        />
      </div>
      <Field label={fileLabel}>
        <input
          accept={accept}
          className="form-input"
          disabled={uploading}
          type="file"
          onChange={onFileChange}
        />
      </Field>
      {fileName || form.imageUrl !== currentImageUrl ? (
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
  imageKind,
  label,
  imageUrl,
  name,
}: {
  imageKind: "logo" | "background";
  label: string;
  imageUrl: string | null | undefined;
  name: string;
}) {
  const src = imageUrl?.trim();
  const frameClassName =
    imageKind === "background"
      ? `${styles.logoPreviewFrame} ${styles.backgroundPreviewFrame}`
      : styles.logoPreviewFrame;

  return (
    <div className={styles.logoPreview}>
      <p className={styles.logoPreviewLabel}>{label}</p>
      <div className={frameClassName}>
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
