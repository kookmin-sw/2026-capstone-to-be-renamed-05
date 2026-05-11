import Link from "next/link";
import { ActionButton } from "@/components/ui/action-button";
import { boardTypeLabels, type CommunityPost } from "@/lib/community-types";
import { communityDetailHref, communityWriteHref } from "@/lib/routes";
import { formatDate, isQABoard } from "../_lib/community-detail-utils";
import styles from "../community-detail.module.css";

interface DetailSidebarProps {
  post: CommunityPost;
  relatedPosts: CommunityPost[];
}

export function DetailSidebar({ post, relatedPosts }: DetailSidebarProps) {
  const showQA = isQABoard(post);

  return (
    <aside className={styles.sidebar}>
      <div className={styles.sidebarCard}>
        <p className={styles.sidebarCardTitle}>게시글 정보</p>
        <div>
          <div className={styles.sidebarInfoRow}>
            <span className={styles.sidebarInfoLabel}>게시판</span>
            <span className={styles.sidebarInfoValue}>
              {boardTypeLabels[post.boardType]}
            </span>
          </div>
          <div className={styles.sidebarInfoRow}>
            <span className={styles.sidebarInfoLabel}>작성일</span>
            <span className={styles.sidebarInfoValue}>
              {formatDate(post.createdAt)}
            </span>
          </div>
          <div className={styles.sidebarInfoRow}>
            <span className={styles.sidebarInfoLabel}>조회</span>
            <span className={styles.sidebarInfoValue}>{post.viewCount}</span>
          </div>
          <div className={styles.sidebarInfoRow}>
            <span className={styles.sidebarInfoLabel}>
              {showQA ? "답변" : "댓글"}
            </span>
            <span className={styles.sidebarInfoValue}>{post.commentCount}</span>
          </div>
          <div className={styles.sidebarInfoRow}>
            <span className={styles.sidebarInfoLabel}>좋아요</span>
            <span className={styles.sidebarInfoValue}>{post.likeCount}</span>
          </div>
        </div>
      </div>

      {showQA && (
        <div className={styles.resolveGuideCard}>
          <p className={styles.resolveGuideTitle}>답변 채택 안내</p>
          <p className={styles.resolveGuideDesc}>
            {post.isResolved
              ? "채택된 답변이 있는 질문입니다."
              : "작성자는 가장 도움이 된 답변을 채택해 질문을 답변완료 상태로 바꿀 수 있습니다."}
          </p>
          <ActionButton
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              window.location.href = communityWriteHref(post.boardType);
            }}
          >
            같은 게시판에 질문하기
          </ActionButton>
        </div>
      )}

      {relatedPosts.length > 0 && (
        <div className={styles.sidebarCard}>
          <p className={styles.sidebarCardTitle}>관련 게시글</p>
          <div className={styles.relatedList}>
            {relatedPosts.map((related) => (
              <Link
                key={related.id}
                href={communityDetailHref(related.id)}
                className={styles.relatedItem}
              >
                <span className={styles.relatedDot}>·</span>
                <span>{related.title}</span>
              </Link>
            ))}
          </div>
          <Link
            href={`/community?board=${post.boardType}`}
            className={styles.relatedMore}
          >
            더 보기
          </Link>
        </div>
      )}
    </aside>
  );
}
