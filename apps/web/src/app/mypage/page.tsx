"use client";

import type {
  BookmarkItem,
  BookmarkTargetType,
  MyProfileResponse,
  PersonalCareerStage,
  ResumeItem,
} from "@cpa/shared";
import {
  Bookmark,
  Download,
  FileText,
  ShieldCheck,
  Trash2,
  Upload,
  User,
} from "lucide-react";
import Link from "next/link";
import {
  type ChangeEvent,
  type FormEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { SiteNav } from "@/components/site-nav";
import { ActionButton, ActionLink } from "@/components/ui/action-button";
import {
  deleteMyBookmark,
  deleteMyResume,
  fetchCurrentUser,
  fetchMyBookmarks,
  fetchMyProfile,
  fetchMyResumes,
  getMyResumeDownloadUrl,
  submitMyCpaVerificationRequest,
  updateMyProfile,
  uploadMyResume,
} from "@/lib/api";
import { companyDetailHref, jobDetailHref } from "@/lib/routes";
import styles from "./mypage.module.css";

type Tab = "profile" | "bookmarks" | "resumes";

const RESUME_MAX_BYTES = 10 * 1024 * 1024;
const RESUME_EXTENSIONS = new Set(["pdf", "doc", "docx", "hwp", "hwpx"]);

const careerStageLabels: Record<PersonalCareerStage, string> = {
  CPA_UNPLACED: "CPA 취득, 수습처 미확정",
  TRAINEE: "수습 CPA",
  LICENSED_CPA: "일반 회계사",
};

const verificationLabels: Record<string, string> = {
  UNVERIFIED: "미검증",
  PENDING: "검토 중",
  CPA_VERIFIED: "검증 완료",
  REJECTED: "반려",
};

const employmentLabels: Record<string, string> = {
  UNKNOWN: "확인 전",
  NONE: "고용 이력 없음",
  HAS_EMPLOYMENT: "고용 이력 있음",
};

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
  const [loadError, setLoadError] = useState("");
  const [message, setMessage] = useState("");
  const [uploadingResume, setUploadingResume] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [displayNameInput, setDisplayNameInput] = useState("");
  const [applicantName, setApplicantName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [requestedCareerStage, setRequestedCareerStage] =
    useState<PersonalCareerStage>("CPA_UNPLACED");
  const [submittingVerification, setSubmittingVerification] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let ignore = false;

    async function load() {
      setLoadError("");
      try {
        const user = await fetchCurrentUser();
        if (!user || user.role !== "JOB_SEEKER") {
          if (!ignore) {
            setAuthorized(false);
            setLoading(false);
          }
          return;
        }

        if (!ignore) setAuthorized(true);

        const [profileResult, bookmarkResult, resumeResult] =
          await Promise.allSettled([
            fetchMyProfile(),
            fetchMyBookmarks(),
            fetchMyResumes(),
          ]);

        if (ignore) return;

        if (profileResult.status === "fulfilled") {
          setProfile(profileResult.value);
        } else {
          setProfile(null);
          setLoadError(
            profileResult.reason instanceof Error
              ? profileResult.reason.message
              : "프로필 정보를 불러오지 못했습니다.",
          );
        }

        if (bookmarkResult.status === "fulfilled") {
          setBookmarks(bookmarkResult.value.items);
        } else {
          setBookmarks([]);
        }

        if (resumeResult.status === "fulfilled") {
          setResumes(resumeResult.value.items);
        } else {
          setResumes([]);
        }

        const sideLoadErrors = [
          bookmarkResult.status === "rejected" ? "북마크" : "",
          resumeResult.status === "rejected" ? "이력서" : "",
        ].filter(Boolean);

        if (profileResult.status === "fulfilled" && sideLoadErrors.length > 0) {
          setMessage(
            `${sideLoadErrors.join(", ")} 정보를 일부 불러오지 못했습니다.`,
          );
        }
      } catch (error) {
        if (!ignore) {
          setAuthorized(false);
          setLoadError(
            error instanceof Error
              ? error.message
              : "현재 사용자를 확인하지 못했습니다.",
          );
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    void load();
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
      setMessage("프로필을 수정했습니다.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "프로필 수정에 실패했습니다.",
      );
    }
  }

  async function handleVerificationSubmit(event: FormEvent) {
    event.preventDefault();
    setMessage("");
    if (!isValidBirthDate(birthDate)) {
      setMessage("생년월일은 YYYY-MM-DD 형식으로 입력해주세요.");
      return;
    }
    setSubmittingVerification(true);
    try {
      await submitMyCpaVerificationRequest({
        applicantName,
        birthDate,
        registrationNumber,
        requestedCareerStage,
      });
      const updated = await fetchMyProfile();
      setProfile(updated);
      setApplicantName("");
      setBirthDate("");
      setRegistrationNumber("");
      setMessage(
        "CPA 검증 요청을 제출했습니다. 관리자가 확인한 뒤 반영됩니다.",
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "CPA 검증 요청에 실패했습니다.",
      );
    } finally {
      setSubmittingVerification(false);
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

  async function handleUploadResume(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    if (!file) return;
    setMessage("");

    const validationMessage = validateResumeFile(file);
    if (validationMessage) {
      setMessage(validationMessage);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setUploadingResume(true);
    try {
      const resume = await uploadMyResume(file);
      setResumes((prev) => [resume, ...prev]);
      setMessage("이력서를 업로드했습니다.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "이력서 업로드에 실패했습니다.",
      );
    } finally {
      setUploadingResume(false);
    }
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

  if (!authorized) {
    return (
      <>
        <SiteNav />
        <main className={styles.page}>
          <div className={styles.authCard}>
            <h1 className={styles.authTitle}>마이페이지</h1>
            <p className={styles.authError}>개인회원 로그인이 필요합니다.</p>
            <ActionLink
              href="/login?next=/mypage"
              className={styles.authAction}
            >
              로그인
            </ActionLink>
          </div>
        </main>
      </>
    );
  }

  if (!profile) {
    return (
      <>
        <SiteNav />
        <main className={styles.page}>
          <div className={styles.authCard}>
            <h1 className={styles.authTitle}>마이페이지</h1>
            <p className={styles.authError}>
              로그인은 확인됐지만 마이페이지 정보를 불러오지 못했습니다.
            </p>
            {loadError && <p className={styles.loadErrorDetail}>{loadError}</p>}
            <div className={styles.authActions}>
              <ActionButton
                type="button"
                onClick={() => window.location.reload()}
              >
                다시 시도
              </ActionButton>
              <ActionLink href="/jobs" variant="subtle">
                채용공고로 이동
              </ActionLink>
            </div>
          </div>
        </main>
      </>
    );
  }

  const filteredBookmarks =
    bookmarkFilter === "ALL"
      ? bookmarks
      : bookmarks.filter((bm) => bm.targetType === bookmarkFilter);
  const canSubmitVerification =
    profile.cpaVerificationStatus !== "PENDING" &&
    profile.cpaVerificationStatus !== "CPA_VERIFIED";

  return (
    <>
      <SiteNav />
      <main className={styles.page}>
        <div className={styles.container}>
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
              북마크({bookmarks.length})
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
              이력서({resumes.length})
            </button>
          </div>

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
                      <div className={styles.fieldValue}>개인회원</div>
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

              <div className={styles.card}>
                <h2 className={styles.sectionTitle}>
                  <ShieldCheck size={18} />
                  CPA 검증
                </h2>
                <div className={styles.profileForm} style={{ marginTop: 16 }}>
                  <div className={styles.field}>
                    검증 상태
                    <div className={styles.fieldValue}>
                      {verificationLabels[profile.cpaVerificationStatus]}
                    </div>
                  </div>
                  <div className={styles.field}>
                    수습 상태
                    <div className={styles.fieldValue}>
                      {profile.careerStage
                        ? careerStageLabels[profile.careerStage]
                        : "미설정"}
                    </div>
                  </div>
                  <div className={styles.field}>
                    고용 이력
                    <div className={styles.fieldValue}>
                      {employmentLabels[profile.employmentHistoryStatus]}
                    </div>
                  </div>
                  <div className={styles.field}>
                    수습 CPA 방
                    <div className={styles.fieldValue}>
                      {profile.traineeRoomAccess
                        ? "입장 가능"
                        : "검증 후 입장 가능"}
                    </div>
                  </div>
                  {profile.pendingVerificationRequest && (
                    <div className={styles.field}>
                      검토 중인 요청
                      <div className={styles.fieldValue}>
                        {
                          careerStageLabels[
                            profile.pendingVerificationRequest
                              .requestedCareerStage
                          ]
                        }{" "}
                        ·{" "}
                        {new Date(
                          profile.pendingVerificationRequest.createdAt,
                        ).toLocaleDateString("ko-KR")}
                      </div>
                    </div>
                  )}
                </div>

                {canSubmitVerification && (
                  <form
                    className={styles.profileForm}
                    style={{ marginTop: 24 }}
                    onSubmit={handleVerificationSubmit}
                  >
                    <label className={styles.field}>
                      성명
                      <input
                        className={styles.input}
                        value={applicantName}
                        onChange={(e) => setApplicantName(e.target.value)}
                        maxLength={80}
                        required
                      />
                    </label>
                    <label className={styles.field}>
                      생년월일
                      <input
                        className={styles.input}
                        inputMode="numeric"
                        value={birthDate}
                        onChange={(e) =>
                          setBirthDate(formatBirthDateInput(e.target.value))
                        }
                        placeholder="YYYY-MM-DD"
                        maxLength={10}
                        required
                      />
                    </label>
                    <label className={styles.field}>
                      등록번호 또는 수습번호
                      <input
                        className={styles.input}
                        value={registrationNumber}
                        onChange={(e) => setRegistrationNumber(e.target.value)}
                        placeholder="예: CPA-12345 또는 수습-12345"
                        maxLength={40}
                        required
                      />
                      <span className={styles.fieldHint}>
                        한국공인회계사회 조회에 사용하는 등록번호나 수습번호를
                        입력해주세요.
                      </span>
                    </label>
                    <label className={styles.field}>
                      신청 단계
                      <select
                        className={styles.input}
                        value={requestedCareerStage}
                        onChange={(e) =>
                          setRequestedCareerStage(
                            e.target.value as PersonalCareerStage,
                          )
                        }
                      >
                        {Object.entries(careerStageLabels).map(
                          ([value, label]) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          ),
                        )}
                      </select>
                    </label>
                    <div className={styles.formActions}>
                      <ActionButton
                        type="submit"
                        size="sm"
                        disabled={
                          submittingVerification ||
                          !applicantName.trim() ||
                          !isValidBirthDate(birthDate) ||
                          !registrationNumber.trim()
                        }
                      >
                        {submittingVerification ? "제출 중" : "검증 요청"}
                      </ActionButton>
                    </div>
                  </form>
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
                <div className={styles.empty}>북마크한 항목이 없습니다.</div>
              )}
            </section>
          )}

          {tab === "resumes" && (
            <section className={styles.section}>
              <button
                type="button"
                className={styles.uploadArea}
                onClick={() => {
                  if (uploadingResume) return;
                  if (resumes.length >= 5) {
                    setMessage("이력서는 최대 5개까지 업로드할 수 있습니다.");
                    return;
                  }
                  fileInputRef.current?.click();
                }}
                disabled={uploadingResume}
              >
                <Upload size={24} className={styles.uploadAreaIcon} />
                <span>
                  {uploadingResume
                    ? "이력서를 업로드하는 중입니다."
                    : "이력서 파일을 선택하세요"}
                </span>
                <span className={styles.uploadHint}>
                  PDF, DOC, DOCX, HWP, HWPX · 최대 10MB · 최대 5개
                </span>
              </button>
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
                      <div className={styles.resumeActions}>
                        <a
                          href={getMyResumeDownloadUrl(resume.id)}
                          className={styles.downloadBtn}
                          aria-label="이력서 다운로드"
                        >
                          <Download size={15} />
                        </a>
                        <button
                          type="button"
                          className={styles.deleteBtn}
                          onClick={() => void handleDeleteResume(resume.id)}
                          aria-label="이력서 삭제"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.empty}>업로드한 이력서가 없습니다.</div>
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

function validateResumeFile(file: File) {
  const extension = file.name.split(".").pop()?.toLowerCase();
  if (!extension || !RESUME_EXTENSIONS.has(extension)) {
    return "이력서는 PDF, DOC, DOCX, HWP, HWPX 파일만 업로드할 수 있습니다.";
  }
  if (file.size <= 0) {
    return "빈 이력서 파일은 업로드할 수 없습니다.";
  }
  if (file.size > RESUME_MAX_BYTES) {
    return "이력서는 10MB 이하로 업로드해주세요.";
  }
  return "";
}

function formatBirthDateInput(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 4) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6)}`;
}

function isValidBirthDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}
