import { ThumbsUp } from "lucide-react";
import type { CommunityAnswer } from "@/lib/community-types";
import { relativeTime } from "../_lib/community-detail-utils";
import styles from "../community-detail.module.css";

interface AnswerListProps {
  answers: CommunityAnswer[];
  isResolved: boolean;
  onLike: (answerId: string) => void;
  onAccept: (answerId: string) => void;
}

export function AnswerList({
  answers,
  isResolved,
  onLike,
  onAccept,
}: AnswerListProps) {
  return (
    <div className={styles.answersSection}>
      <div className={styles.answersHeader}>
        답변 <span className={styles.answersCount}>{answers.length}</span>
      </div>

      {answers.length === 0 ? (
        <div className={styles.emptyAnswers}>
          아직 답변이 없습니다. 첫 번째 답변을 남겨주세요.
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
              {!isResolved && (
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
