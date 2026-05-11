"use client";

import { Check, ChevronRight, Home } from "lucide-react";
import Link from "next/link";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SiteNav } from "@/components/site-nav";
import { ActionButton, ActionLink } from "@/components/ui/action-button";
import { createPost } from "@/lib/community-api";
import {
  BOARD_TYPES,
  boardTags,
  boardTypeLabels,
  type BoardType,
} from "@/lib/community-types";
import { communityDetailHref } from "@/lib/routes";
import styles from "./community-write.module.css";

function CommunityWriteContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialBoard = (searchParams.get("board") as BoardType | null) ?? "CPA_PREP";

  const [activeBoard, setActiveBoard] = useState<BoardType>(initialBoard);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const availableTags = boardTags[activeBoard];

  function toggleTag(tag: string) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  }

  function handleBoardChange(board: BoardType) {
    setActiveBoard(board);
    setSelectedTags([]);
    setMessage("");
  }

  async function handleSubmit() {
    if (!title.trim() || !content.trim()) {
      setMessage("제목과 내용을 입력해주세요.");
      return;
    }
    setSubmitting(true);
    setMessage("");
    try {
      const post = await createPost({
        boardType: activeBoard,
        title: title.trim(),
        content: content.trim(),
        tags: selectedTags,
        isAnonymous,
      });
      router.push(communityDetailHref(post.id));
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "게시글 등록에 실패했습니다.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[var(--background)]">
      <SiteNav />

      <div className="border-b border-[var(--app-line)] bg-[var(--background)]">
        <div className="mx-auto max-w-7xl px-6 pt-5 pb-0">
          <nav className="mb-4 flex items-center gap-1 text-sm text-gray-500">
            <Link href="/" className="flex items-center hover:text-gray-700">
              <Home size={14} />
            </Link>
            <ChevronRight size={13} className="text-gray-300" />
            <Link href="/community" className="hover:text-gray-700">
              커뮤니티
            </Link>
            <ChevronRight size={13} className="text-gray-300" />
            <Link
              href={`/community?board=${activeBoard}`}
              className="hover:text-gray-700"
            >
              {boardTypeLabels[activeBoard]}
            </Link>
            <ChevronRight size={13} className="text-gray-300" />
            <span className="font-semibold text-gray-800">글쓰기</span>
          </nav>

          <div className="flex overflow-x-auto border-b border-[var(--app-line)]">
            {BOARD_TYPES.map((board) => (
              <button
                key={board}
                type="button"
                onClick={() => handleBoardChange(board)}
                className={`flex-none whitespace-nowrap border-b-2 px-5 py-3 text-sm font-semibold transition-colors ${
                  activeBoard === board
                    ? "border-[var(--brand)] text-[var(--brand)]"
                    : "border-transparent text-gray-500 hover:text-gray-800"
                } -mb-px`}
              >
                {boardTypeLabels[board]}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-6">
        <div className={styles.layout}>
          <div className={styles.form}>
            <div className={styles.formInner}>
              {message && (
                <div className="rounded-xl border border-[var(--app-line)] bg-[#fbfbf8] p-3 text-sm text-gray-700">
                  {message}
                </div>
              )}

              <div className={styles.formField}>
                <label className={styles.formLabel}>
                  제목 <span className={styles.required}>*</span>
                </label>
                <input
                  className={styles.formInput}
                  placeholder="제목을 입력해주세요."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={100}
                />
                <p className={styles.charCount}>{title.length}/100</p>
              </div>

              <div className={styles.formField}>
                <label className={styles.formLabel}>
                  카테고리 <span className={styles.optional}>(선택)</span>
                </label>
                <div className={styles.tagGrid}>
                  {availableTags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`${styles.tagChip} ${
                        selectedTags.includes(tag) ? styles.tagChipSelected : ""
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.formField}>
                <label className={styles.formLabel}>
                  내용 <span className={styles.required}>*</span>
                </label>
                <textarea
                  className={styles.formTextarea}
                  placeholder="내용을 입력해주세요."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  maxLength={5000}
                />
                <p className={styles.charCount}>{content.length}/5000</p>
              </div>

              <div className={styles.formField}>
                <label className={styles.formLabel}>익명 설정</label>
                <label className={styles.anonymousRow}>
                  <input
                    type="checkbox"
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                  />
                  <span className={styles.anonymousLabel}>
                    익명으로 게시글을 작성합니다.
                  </span>
                </label>
                <p className={styles.anonymousHint}>
                  체크를 해제하면 표시 이름 또는 아이디가 노출됩니다.
                </p>
              </div>
            </div>

            <div className={styles.formFooter}>
              <ActionLink href={`/community?board=${activeBoard}`} variant="subtle">
                취소
              </ActionLink>
              <ActionButton
                type="button"
                disabled={submitting || !title.trim() || !content.trim()}
                onClick={handleSubmit}
              >
                {submitting ? "등록 중" : "등록하기"}
              </ActionButton>
            </div>
          </div>

          <aside className={styles.sidebar}>
            <div className={styles.sidebarCard}>
              <p className={styles.sidebarCardTitle}>게시글 작성 가이드</p>
              <div className={styles.guideList}>
                {[
                  {
                    title: "상황을 구체적으로 적어주세요",
                    desc: "배경, 질문, 원하는 답변 범위를 함께 적으면 더 정확한 답변을 받을 수 있습니다.",
                  },
                  {
                    title: "민감정보는 제외해주세요",
                    desc: "실명, 연락처, 회사 내부자료 등은 게시하지 않는 편이 안전합니다.",
                  },
                  {
                    title: "수습 CPA 방은 검증 후 이용됩니다",
                    desc: "CPA 검증이 완료된 개인회원만 수습 CPA 방에 글을 쓸 수 있습니다.",
                  },
                ].map((guide) => (
                  <div key={guide.title} className={styles.guideItem}>
                    <div className={styles.guideIcon}>
                      <Check size={14} />
                    </div>
                    <div className={styles.guideText}>
                      <p className={styles.guideTextTitle}>{guide.title}</p>
                      <p className={styles.guideTextDesc}>{guide.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

export default function CommunityWritePage() {
  return (
    <Suspense>
      <CommunityWriteContent />
    </Suspense>
  );
}
