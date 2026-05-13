'use client';

import Link from 'next/link';
import { Eye, MessageCircle } from 'lucide-react';
import { AuthorAvatar } from './author-avatar';
import { communityDetailHref } from '@/lib/routes';
import type { CommunityPost } from '@/lib/community-types';
import styles from './post-list-item.module.css';

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();

  const m = Math.floor(diff / 60000);

  if (m < 1) return '방금 전';
  if (m < 60) return `${m}분 전`;

  const h = Math.floor(m / 60);

  if (h < 24) return `${h}시간 전`;

  const d = Math.floor(h / 24);

  return `${d}일 전`;
}

function getPreview(content: string, maxLen = 90): string {
  const plain = content.replace(/\n/g, ' ').trim();

  return plain.length > maxLen
    ? `${plain.slice(0, maxLen)}…`
    : plain;
}

export function PostListItem({ post }: { post: CommunityPost }) {
  const authorLabel = post.isAnonymous ? '익명' : post.authorName;

  return (
    <Link href={communityDetailHref(post.id)} className={styles.row}>
      <div className={styles.body}>
        <div className={styles.titleRow}>
          {post.isResolved && (
            <span className={styles.resolvedTag}>채택완료</span>
          )}

          <span className={styles.titleContent}>
            <span className={styles.title}>{post.title}</span>

            <span className={styles.commentStat}>
              <MessageCircle size={15} />
              {post.commentCount}
            </span>
          </span>
        </div>

        <p className={styles.preview}>{getPreview(post.content)}</p>
      </div>

      <div className={styles.metaRow}>
        <span className={styles.authorBlock}>
          <AuthorAvatar
            authorName={post.authorName}
            imageUrl={post.authorProfileImageUrl}
            isAnonymous={post.isAnonymous}
          />

          <span className={styles.authorName}>{authorLabel}</span>
        </span>

        <span className={styles.timeText}>{relativeTime(post.createdAt)}</span>

        <span className={styles.viewStat}>
          <Eye size={12} />
          {post.viewCount.toLocaleString('ko-KR')}
        </span>
      </div>
    </Link>
  );
}
