import type { CommunityPost } from "@/lib/community-types";
import styles from "../community-detail.module.css";

export function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "방금 전";
  if (m < 60) return `${m}분 전`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}시간 전`;
  const d = Math.floor(h / 24);
  return `${d}일 전`;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function statusBadgeClass(post: CommunityPost): string {
  if (post.status === "ANSWERED") return styles.badgeAnswered;
  if (post.status === "INFO") return styles.badgeInfo;
  if (post.status === "FREE") return styles.badgeFree;
  return styles.badgeQuestion;
}

export function statusLabel(post: CommunityPost): string {
  if (post.status === "ANSWERED") return "답변완료";
  if (post.status === "INFO") return "정보";
  if (post.status === "FREE") return "자유";
  return "질문";
}

export function isQABoard(post: CommunityPost): boolean {
  return post.boardType !== "FREE";
}
