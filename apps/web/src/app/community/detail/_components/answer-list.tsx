import { ThumbsUp } from "lucide-react";
import type { CommunityAnswer } from "@/lib/community-types";
import { relativeTime } from "../_lib/community-detail-utils";
import styles from "../community-detail.module.css";

interface AnswerListProps {
  answers: CommunityAnswer[];
  isQA: boolean;
  isResolved: boolean;
  onLike: (answerId: string) => void;
  onAccept: (answerId: string) => void;
}

export function AnswerList({
  answers,
  isQA,
  isResolved,
  onLike,
  onAccept,
}: AnswerListProps) {
  const noun = isQA ? "답변" : "댓글";

  return (
    <div className={styles.answersSection}>
      <div className={styles.answersHeader}>
        {noun} <span className={styles.answersCount}>{answers.length}</span>
      </div>

      {answers.length === 0 ? (
        <div className={styles.emptyAnswers}>
          아직 {noun}이 없습니다. 첫 번째 {noun}을 남겨주세요.
        </div>
      ) : (
        answers.map((answer) => (
          <div
            key={answer.id}
            className={`${styles.answerCard} ${answer.isAccepted ? styles.answerAccepted : ""}`}
          >
            {answer.isAccepted && (
              <div className={styles.acceptedBadge}>채택된 답변</div>
            )}
            <div className={styles.answerMeta}>
              <span className={styles.answerAuthor}>{answer.authorName}</span>
              <span>·</span>
              <span>{relativeTime(answer.createdAt)}</span>
            </div>
            <div className={styles.answerContent}>{answer.content}</div>
            <div className={styles.answerFooter}>
              <button
                type="button"
                className={styles.answerLikeButton}
                onClick={() => onLike(answer.id)}
              >
                <ThumbsUp size={13} />
                도움돼요 {answer.likeCount}
              </button>
              {isQA && !isResolved && (
                <button
                  type="button"
                  className={styles.answerAcceptButton}
                  onClick={() => onAccept(answer.id)}
                >
                  채택하기
                </button>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
