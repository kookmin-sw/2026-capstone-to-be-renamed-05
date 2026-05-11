import { Heart } from "lucide-react";
import type { CommunityPost } from "@/lib/community-types";
import {
  isQABoard,
  relativeTime,
  statusBadgeClass,
  statusLabel,
} from "../_lib/community-detail-utils";
import styles from "../community-detail.module.css";

interface PostCardProps {
  post: CommunityPost;
  liked: boolean;
  onLike: () => void;
}

export function PostCard({ post, liked, onLike }: PostCardProps) {
  const showQA = isQABoard(post);

  return (
    <div className={styles.postCard}>
      <div className={styles.postHeader}>
        <div className={styles.postTitleRow}>
          <h1 className={styles.postTitle}>{post.title}</h1>
          <span className={`${styles.badge} ${statusBadgeClass(post)}`}>
            {statusLabel(post)}
          </span>
        </div>
        <div className={styles.postMeta}>
          <span>{post.authorName}</span>
          <span className={styles.postMetaDot}>·</span>
          <span>{relativeTime(post.createdAt)}</span>
          <span className={styles.postMetaDot}>·</span>
          <span>조회 {post.viewCount}</span>
          <span className={styles.postMetaDot}>·</span>
          <span>좋아요 {post.likeCount}</span>
        </div>
        {post.tags.length > 0 && (
          <div className={styles.postTags}>
            {post.tags.map((tag) => (
              <span key={tag} className={styles.tag}>
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className={styles.postContent}>{post.content}</div>

      <div className={styles.postFooter}>
        <button
          type="button"
          className={styles.likeButton}
          onClick={onLike}
          disabled={liked}
        >
          <Heart size={15} />
          도움됐어요 {post.likeCount}
        </button>

        {showQA && !post.isResolved && (
          <p className={styles.resolveButtonDesc}>
            작성자는 가장 도움이 된 답변을 채택할 수 있습니다.
          </p>
        )}
      </div>
    </div>
  );
}
