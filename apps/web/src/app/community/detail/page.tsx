"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AnswerList } from "./_components/answer-list";
import { DetailSidebar } from "./_components/detail-sidebar";
import { PostCard } from "./_components/post-card";
import { ReplyForm } from "./_components/reply-form";
import { isQABoard } from "./_lib/community-detail-utils";
import { SiteNav } from "@/components/site-nav";
import {
  createAnswer,
  getPostDetail,
  getPosts,
  likeAnswer,
  likePost,
  resolvePost,
} from "@/lib/community-api";
import {
  boardTypeLabels,
  type CommunityAnswer,
  type CommunityPost,
} from "@/lib/community-types";
import styles from "./community-detail.module.css";

function CommunityDetailContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id") ?? "";

  const [post, setPost] = useState<CommunityPost | undefined>();
  const [answers, setAnswers] = useState<CommunityAnswer[]>([]);
  const [relatedPosts, setRelatedPosts] = useState<CommunityPost[]>([]);
  const [liked, setLiked] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [replyAnonymous, setReplyAnonymous] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;
    void Promise.resolve().then(async () => {
      if (ignore) return;
      if (!id) {
        setLoading(false);
        setError("게시글을 찾을 수 없습니다.");
        return;
      }

      setLoading(true);
      setError("");
      try {
        const detail = await getPostDetail(id);
        if (ignore) return;
        setPost(detail.post);
        setAnswers(detail.answers);
        const related = await getPosts({ board: detail.post.boardType }).catch(
          () => [],
        );
        if (!ignore) {
          setRelatedPosts(
            related.filter((item) => item.id !== detail.post.id).slice(0, 5),
          );
        }
      } catch (caught) {
        if (!ignore) {
          setPost(undefined);
          setAnswers([]);
          setRelatedPosts([]);
          setError(
            caught instanceof Error
              ? caught.message
              : "게시글을 불러오지 못했습니다.",
          );
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    });

    return () => {
      ignore = true;
    };
  }, [id]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[var(--background)]">
        <SiteNav />
        <div className={styles.pageWrap}>
          <p className="text-center text-[var(--app-muted)]">
            게시글을 불러오는 중입니다.
          </p>
        </div>
      </main>
    );
  }

  if (!post) {
    return (
      <main className="min-h-screen bg-[var(--background)]">
        <SiteNav />
        <div className={styles.pageWrap}>
          <p className="text-center text-[var(--app-muted)]">
            {error || "게시글을 찾을 수 없습니다."}
          </p>
        </div>
      </main>
    );
  }

  async function handleLikePost() {
    if (liked || !post) return;
    try {
      const updated = await likePost(post.id);
      setPost(updated);
      setLiked(true);
    } catch (caught) {
      window.alert(
        caught instanceof Error ? caught.message : "좋아요 처리에 실패했습니다.",
      );
    }
  }

  async function handleLikeAnswer(answerId: string) {
    try {
      const updated = await likeAnswer(answerId);
      setAnswers((prev) =>
        prev.map((answer) => (answer.id === answerId ? updated : answer)),
      );
    } catch (caught) {
      window.alert(
        caught instanceof Error ? caught.message : "좋아요 처리에 실패했습니다.",
      );
    }
  }

  async function handleAccept(answerId: string) {
    if (!post) return;
    try {
      const detail = await resolvePost(post.id, answerId);
      setPost(detail.post);
      setAnswers(detail.answers);
    } catch (caught) {
      window.alert(
        caught instanceof Error ? caught.message : "답변 채택에 실패했습니다.",
      );
    }
  }

  async function handleSubmitReply() {
    if (!replyText.trim() || !post) return;
    setSubmitting(true);
    try {
      const answer = await createAnswer({
        postId: post.id,
        content: replyText.trim(),
        isAnonymous: replyAnonymous,
      });
      setAnswers((prev) => [...prev, answer]);
      setPost((current) =>
        current
          ? { ...current, commentCount: current.commentCount + 1 }
          : current,
      );
      setReplyText("");
    } catch (caught) {
      window.alert(
        caught instanceof Error ? caught.message : "답변 등록에 실패했습니다.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  const showQA = isQABoard(post);

  return (
    <main className="min-h-screen bg-[var(--background)]">
      <SiteNav />

      <div className="border-b border-[var(--app-line)] bg-white">
        <div className="mx-auto flex max-w-7xl items-center gap-2 px-6 py-3 text-sm text-gray-500">
          <a href="/community" className="hover:text-gray-800">
            커뮤니티
          </a>
          <span>/</span>
          <a
            href={`/community?board=${post.boardType}`}
            className="hover:text-gray-800"
          >
            {boardTypeLabels[post.boardType]}
          </a>
          <span>/</span>
          <span className="truncate font-semibold text-gray-800">
            {post.title}
          </span>
        </div>
      </div>

      <div className={styles.pageWrap}>
        <div className={styles.layout}>
          <div className={styles.main}>
            <PostCard post={post} liked={liked} onLike={handleLikePost} />

            <AnswerList
              answers={answers}
              isQA={showQA}
              isResolved={post.isResolved}
              onLike={handleLikeAnswer}
              onAccept={handleAccept}
            />

            <ReplyForm
              isQA={showQA}
              value={replyText}
              anonymous={replyAnonymous}
              submitting={submitting}
              onChange={setReplyText}
              onAnonymousChange={setReplyAnonymous}
              onSubmit={handleSubmitReply}
            />
          </div>

          <DetailSidebar post={post} relatedPosts={relatedPosts} />
        </div>
      </div>
    </main>
  );
}

export default function CommunityDetailPage() {
  return (
    <Suspense>
      <CommunityDetailContent />
    </Suspense>
  );
}
