"use client";

import type {
  BookmarkItem,
  BookmarkTargetType,
  MyProfileResponse,
  ResumeItem,
} from "@cpa/shared";
import {
  Bookmark,
  FileText,
  Trash2,
  Upload,
  User,
} from "lucide-react";
import Link from "next/link";
import { type FormEvent, useEffect, useRef, useState } from "react";
import { SiteNav } from "@/components/site-nav";
import { ActionButton, ActionLink } from "@/components/ui/action-button";
import {
  deleteMyBookmark,
  deleteMyResume,
  fetchCurrentUser,
  fetchMyBookmarks,
  fetchMyProfile,
  fetchMyResumes,
  updateMyProfile,
  uploadMyResume,
} from "@/lib/api";
import { jobDetailHref, companyDetailHref } from "@/lib/routes";
import styles from "./mypage.module.css";

type Tab = "profile" | "bookmarks" | "resumes";

export default function MyPage() {
  const [tab, setTab] = useState<Tab>("profile");
  const [profile, setProfile] = useState<MyProfileResponse | null>(null);
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [resumes, setResumes] = useState<ResumeItem[]>([]);
  const [bookmarkFilter, setBookmarkFilter] = useState<
    BookmarkTargetType | "ALL"
  >("ALL");
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [message, setMessage] = useState("");

  // Profile edit state
  const [editingProfile, setEditingProfile] = useState(false);
  const [displayNameInput, setDisplayNameInput] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let ignore = false;

    async function load() {
      try {
        const user = await fetchCurrentUser();
        if (!user || user.role !== "JOB_SEEKER") {
          if (!ignore) {
            setAuthorized(false);
            setLoading(false);
          }
          return;
        }
        const [profileData, bookmarkData, resumeData] = await Promise.all([
          fetchMyProfile(),
          fetchMyBookmarks(),
          fetchMyResumes(),
        ]);
        if (!ignore) {
          setProfile(profileData);
          setBookmarks(bookmarkData.items);
          setResumes(resumeData.items);
          setAuthorized(true);
        }
      } catch {
        if (!ignore) setAuthorized(false);
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    load();
    return () => {
      ignore = true;
    };
  }, []);

  async function handleProfileSave(event: FormEvent) {
    event.preventDefault();
    setMessage("");
    try {
      const updated = await updateMyProfile({
        displayName: displayNameInput,
      });
      setProfile(updated);
      setEditingProfile(false);
      setMessage("프로필이 수정되었습니다.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "프로필 수정에 실패했습니다.",
      );
    }
  }

  async function handleDeleteBookmark(id: string) {
    setMessage("");
    try {
      await deleteMyBookmark(id);
      setBookmarks((prev) => prev.filter((bm) => bm.id !== id));
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "북마크 삭제에 실패했습니다.",
      );
    }
  }

  async function handleUploadResume(event: FormEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    if (!file) return;
    setMessage("");
    try {
      const resume = await uploadMyResume(file);
      setResumes((prev) => [resume, ...prev]);
      setMessage("이력서가 업로드되었습니다.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "이력서 업로드에 실패했습니다.",
      );
    }
    // reset input
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleDeleteResume(id: string) {
    if (!window.confirm("이력서를 삭제할까요?")) return;
    setMessage("");
    try {
      await deleteMyResume(id);
      setResumes((prev) => prev.filter((r) => r.id !== id));
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "이력서 삭제에 실패했습니다.",
      );
    }
  }

  if (loading) {
    return (
      <>
        <SiteNav />
        <main className={styles.page}>
          <div className={styles.container}>
            <p style={{ color: "var(--app-muted)", fontSize: "0.875rem" }}>
              마이페이지를 불러오는 중입니다.
            </p>
          </div>
        </main>
      </>
    );
  }

  if (!authorized || !profile) {
    return (
      <>
        <SiteNav />
        <main className={styles.page}>
          <div className={styles.authCard}>
            <h1 className={styles.authTitle}>마이페이지</h1>
            <p className={styles.authError}>
              개인 회원(구직자) 로그인이 필요합니다.
            </p>
            <ActionLink href="/login" className={styles.authAction}>
              로그인
            </ActionLink>
          </div>
        </main>
      </>
    );
  }

  const filteredBookmarks =
    bookmarkFilter === "ALL"
      ? bookmarks
      : bookmarks.filter((bm) => bm.targetType === bookmarkFilter);

  return (
    <>
      <SiteNav />
      <main className={styles.page}>
        <div className={styles.container}>
          {/* Header */}
          <div className={styles.header}>
            <div className={styles.headerLeft}>
              <div className={styles.avatar}>
                {(profile.displayName ?? profile.username).slice(0, 1)}
              </div>
              <div className={styles.headerInfo}>
                <h1>{profile.displayName ?? profile.username}</h1>
                <p className={styles.headerMeta}>
                  @{profile.username} · 가입일{" "}
                  {new Date(profile.createdAt).toLocaleDateString("ko-KR")}
                </p>
              </div>
            </div>
          </div>

          {message && <div className={styles.message}>{message}</div>}

          {/* Tabs */}
          <div className={styles.tabs}>
            <button
              type="button"
              className={`${styles.tab} ${tab === "profile" ? styles.tabActive : ""}`}
              onClick={() => setTab("profile")}
            >
              <User size={14} style={{ marginRight: 4, verticalAlign: -2 }} />
              프로필
            </button>
            <button
              type="button"
              className={`${styles.tab} ${tab === "bookmarks" ? styles.tabActive : ""}`}
              onClick={() => setTab("bookmarks")}
            >
              <Bookmark
                size={14}
                style={{ marginRight: 4, verticalAlign: -2 }}
              />
              북마크 ({bookmarks.length})
            </button>
            <button
              type="button"
              className={`${styles.tab} ${tab === "resumes" ? styles.tabActive : ""}`}
              onClick={() => setTab("resumes")}
            >
              <FileText
                size={14}
                style={{ marginRight: 4, verticalAlign: -2 }}
              />
              이력서 ({resumes.length})
            </button>
          </div>

          {/* Tab Content */}
          {tab === "profile" && (
            <section className={styles.section}>
              <div className={styles.card}>
                {editingProfile ? (
                  <form
                    className={styles.profileForm}
                    onSubmit={handleProfileSave}
                  >
                    <label className={styles.field}>
                      아이디
                      <div className={styles.fieldValue}>
                        {profile.username}
                      </div>
                    </label>
                    <label className={styles.field}>
                      표시 이름
                      <input
                        className={styles.input}
                        value={displayNameInput}
                        onChange={(e) => setDisplayNameInput(e.target.value)}
                        placeholder="표시 이름을 입력하세요"
                        maxLength={50}
                      />
                    </label>
                    <div className={styles.formActions}>
                      <ActionButton type="submit" size="sm">
                        저장
                      </ActionButton>
                      <ActionButton
                        type="button"
                        variant="subtle"
                        size="sm"
                        onClick={() => setEditingProfile(false)}
                      >
                        취소
                      </ActionButton>
                    </div>
                  </form>
                ) : (
                  <div className={styles.profileForm}>
                    <div className={styles.field}>
                      아이디
                      <div className={styles.fieldValue}>
                        {profile.username}
                      </div>
                    </div>
                    <div className={styles.field}>
                      표시 이름
                      <div className={styles.fieldValue}>
                        {profile.displayName || "(미설정)"}
                      </div>
                    </div>
                    <div className={styles.field}>
                      회원 유형
                      <div className={styles.fieldValue}>일반(구직자)</div>
                    </div>
                    <div className={styles.formActions}>
                      <ActionButton
                        type="button"
                        size="sm"
                        onClick={() => {
                          setDisplayNameInput(profile.displayName ?? "");
                          setEditingProfile(true);
                        }}
                      >
                        프로필 수정
                      </ActionButton>
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          {tab === "bookmarks" && (
            <section className={styles.section}>
              <div className={styles.filterRow}>
                <button
                  type="button"
                  className={`${styles.filterBtn} ${bookmarkFilter === "ALL" ? styles.filterBtnActive : ""}`}
                  onClick={() => setBookmarkFilter("ALL")}
                >
                  전체
                </button>
                <button
                  type="button"
                  className={`${styles.filterBtn} ${bookmarkFilter === "JOB" ? styles.filterBtnActive : ""}`}
                  onClick={() => setBookmarkFilter("JOB")}
                >
                  공고
                </button>
                <button
                  type="button"
                  className={`${styles.filterBtn} ${bookmarkFilter === "COMPANY" ? styles.filterBtnActive : ""}`}
                  onClick={() => setBookmarkFilter("COMPANY")}
                >
                  회사
                </button>
              </div>

              {filteredBookmarks.length ? (
                <div className={styles.bookmarkList}>
                  {filteredBookmarks.map((bm) => (
                    <div key={bm.id} className={styles.bookmarkItem}>
                      <Link
                        href={
                          bm.targetType === "JOB"
                            ? jobDetailHref(bm.targetId)
                            : companyDetailHref(bm.targetId)
                        }
                        className={styles.bookmarkInfo}
                      >
                        <div className={styles.bookmarkTitle}>
                          {bm.targetTitle}
                        </div>
                        <div className={styles.bookmarkSub}>
                          {bm.targetSubtitle} ·{" "}
                          {new Date(bm.createdAt).toLocaleDateString("ko-KR")}
                        </div>
                      </Link>
                      <span className={styles.bookmarkType}>
                        {bm.targetType === "JOB" ? "공고" : "회사"}
                      </span>
                      <button
                        type="button"
                        className={styles.deleteBtn}
                        onClick={() => void handleDeleteBookmark(bm.id)}
                        aria-label="북마크 삭제"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.empty}>
                  북마크한 항목이 없습니다. 공고나 회사 페이지에서 북마크를
                  추가해보세요.
                </div>
              )}
            </section>
          )}

          {tab === "resumes" && (
            <section className={styles.section}>
              <div
                className={styles.uploadArea}
                onClick={() => {
                  if (resumes.length >= 5) {
                    setMessage("이력서는 최대 5개까지 업로드할 수 있습니다.");
                    return;
                  }
                  fileInputRef.current?.click();
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    if (resumes.length >= 5) {
                      setMessage("이력서는 최대 5개까지 업로드할 수 있습니다.");
                      return;
                    }
                    fileInputRef.current?.click();
                  }
                }}
              >
                <Upload size={24} className={styles.uploadAreaIcon} />
                <span>이력서 파일을 선택하세요</span>
                <span className={styles.uploadHint}>
                  PDF, DOCX 등 · 최대 10MB · 최대 5개
                </span>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.hwp,.hwpx"
                style={{ display: "none" }}
                onChange={handleUploadResume}
              />

              {resumes.length ? (
                <div className={styles.resumeList}>
                  {resumes.map((resume) => (
                    <div key={resume.id} className={styles.resumeItem}>
                      <div className={styles.resumeInfo}>
                        <FileText size={18} className={styles.resumeIcon} />
                        <div>
                          <div className={styles.resumeName}>
                            {resume.fileName}
                          </div>
                          <div className={styles.resumeMeta}>
                            {formatFileSize(resume.byteSize)} ·{" "}
                            {new Date(resume.createdAt).toLocaleDateString(
                              "ko-KR",
                            )}
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        className={styles.deleteBtn}
                        onClick={() => void handleDeleteResume(resume.id)}
                        aria-label="이력서 삭제"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.empty}>
                  업로드된 이력서가 없습니다.
                </div>
              )}
            </section>
          )}
        </div>
      </main>
    </>
  );
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}
