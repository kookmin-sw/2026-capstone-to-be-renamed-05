import { ActionButton } from "@/components/ui/action-button";
import styles from "../community-detail.module.css";

interface ReplyFormProps {
  isQA: boolean;
  value: string;
  anonymous: boolean;
  submitting: boolean;
  onChange: (value: string) => void;
  onAnonymousChange: (value: boolean) => void;
  onSubmit: () => void;
}

export function ReplyForm({
  isQA,
  value,
  anonymous,
  submitting,
  onChange,
  onAnonymousChange,
  onSubmit,
}: ReplyFormProps) {
  return (
    <div className={styles.replySection}>
      <div className={styles.replyHeader}>
        {isQA ? "답변 작성" : "댓글 작성"}
      </div>
      <div className={styles.replyInner}>
        <textarea
          className={styles.replyTextarea}
          placeholder={isQA ? "답변을 입력해주세요." : "댓글을 입력해주세요."}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <div className={styles.replyFooter}>
          <label className={styles.anonymousRow}>
            <input
              type="checkbox"
              checked={anonymous}
              onChange={(e) => onAnonymousChange(e.target.checked)}
            />
            <span className={styles.anonymousLabel}>익명</span>
          </label>
          <ActionButton
            type="button"
            disabled={submitting || !value.trim()}
            onClick={onSubmit}
          >
            {isQA ? "답변 등록" : "댓글 등록"}
          </ActionButton>
        </div>
      </div>
    </div>
  );
}
