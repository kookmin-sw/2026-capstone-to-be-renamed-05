"use client";

import type {
  BookmarkItem,
  BookmarkTargetType,
  CommunityBoardType,
  MyCommunityActivityItem,
  MyProfileResponse,
  PersonalCareerStage,
  ResumeItem,
} from "@cpa/shared";
import {
  Bookmark,
  BrainCircuit,
  Camera,
  CheckCircle2,
  Download,
  FileText,
  KeyRound,
  MessageCircle,
  Sparkles,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import {
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { SiteNav } from "@/components/site-nav";
import { ActionButton, ActionLink } from "@/components/ui/action-button";
import {
  AUTH_USER_CHANGED_EVENT,
  deleteMyBookmark,
  deleteMyProfileImage,
  deleteMyResume,
  fetchCurrentUser,
  fetchMyBookmarks,
  fetchMyCommunityActivity,
  fetchMyProfile,
  fetchMyResumes,
  getMyResumeDownloadUrl,
  updateMyProfile,
  uploadMyProfileImage,
  uploadMyResume,
} from "@/lib/api";
import {
  communityDetailHref,
  companyDetailHref,
  jobDetailHref,
} from "@/lib/routes";
import styles from "./mypage.module.css";

const RESUME_MAX_BYTES = 10 * 1024 * 1024;
const RESUME_EXTENSIONS = new Set(["pdf", "doc", "docx", "hwp", "hwpx"]);
const PROFILE_IMAGE_MAX_BYTES = 2 * 1024 * 1024;
const PROFILE_IMAGE_EXTENSIONS = new Set(["png", "jpg", "jpeg", "webp"]);
const PROFILE_IMAGE_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
]);

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

const boardLabels: Record<CommunityBoardType, string> = {
  CPA_PREP: "질문게시판",
  TRAINEE: "수습 CPA방",
  SENIOR: "선배 CPA Q&A",
  FREE: "비밀게시판",
};

export default function MyPage() {
  const [profile, setProfile] = useState<MyProfileResponse | null>(null);
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [resumes, setResumes] = useState<ResumeItem[]>([]);
  const [communityActivity, setCommunityActivity] = useState<
    MyCommunityActivityItem[]
  >([]);
  const [communityActivityTotal, setCommunityActivityTotal] = useState(0);
  const [bookmarkFilter, setBookmarkFilter] = useState<
    BookmarkTargetType | "ALL"
  >("ALL");
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [message, setMessage] = useState("");
  const [uploadingResume, setUploadingResume] = useState(false);
  const [updatingProfileImage, setUpdatingProfileImage] = useState(false);
  const [displayNameInput, setDisplayNameInput] = useState("");
  const [verificationModalOpen, setVerificationModalOpen] = useState(false);
  const [likelihoodResult, setLikelihoodResult] = useState("");

  const resumeFileInputRef = useRef<HTMLInputElement>(null);
  const profileImageInputRef = useRef<HTMLInputElement>(null);
  const verificationBadgeButtonRef = useRef<HTMLButtonElement>(null);

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

        const [profileResult, bookmarkResult, resumeResult, activityResult] =
          await Promise.allSettled([
            fetchMyProfile(),
            fetchMyBookmarks(),
            fetchMyResumes(),
            fetchMyCommunityActivity(5),
          ]);

        if (ignore) return;

        if (profileResult.status === "fulfilled") {
          setProfile(profileResult.value);
          setDisplayNameInput(profileResult.value.displayName ?? "");
        } else {
          setProfile(null);
          setLoadError(
            profileResult.reason instanceof Error
              ? profileResult.reason.message
              : "프로필 정보를 불러오지 못했습니다.",
          );
        }

        setBookmarks(
          bookmarkResult.status === "fulfilled"
            ? bookmarkResult.value.items
            : [],
        );
        setResumes(
          resumeResult.status === "fulfilled" ? resumeResult.value.items : [],
        );
        setCommunityActivity(
          activityResult.status === "fulfilled"
            ? activityResult.value.items
            : [],
        );
        setCommunityActivityTotal(
          activityResult.status === "fulfilled" ? activityResult.value.total : 0,
        );

        const sideLoadErrors = [
          bookmarkResult.status === "rejected" ? "북마크" : "",
          resumeResult.status === "rejected" ? "이력서" : "",
          activityResult.status === "rejected" ? "커뮤니티 활동" : "",
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

  useEffect(() => {
    const button = verificationBadgeButtonRef.current;
    if (!button || !profile) return;

    const open = () => setVerificationModalOpen(true);
    button.addEventListener("mousedown", open);
    button.addEventListener("click", open);
    return () => {
      button.removeEventListener("mousedown", open);
      button.removeEventListener("click", open);
    };
  }, [profile]);

  const filteredBookmarks =
    bookmarkFilter === "ALL"
      ? bookmarks
      : bookmarks.filter((bm) => bm.targetType === bookmarkFilter);

  const match = useMemo(() => {
    if (!profile) return null;
    return calculateMatch(profile, resumes, bookmarks);
  }, [profile, resumes, bookmarks]);

  async function handleProfileSave(event: FormEvent) {
    event.preventDefault();
    if (!profile) return;
    setMessage("");
    try {
      const updated = await updateMyProfile({
        displayName: displayNameInput,
      });
      setProfile(updated);
      setDisplayNameInput(updated.displayName ?? "");
      notifyAuthUserChanged();
      setMessage("프로필을 수정했습니다.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "프로필 수정에 실패했습니다.",
      );
    }
  }

  async function handleProfileImageUpload(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.currentTarget.files?.[0];
    if (!file) return;
    setMessage("");

    const validationMessage = validateProfileImage(file);
    if (validationMessage) {
      setMessage(validationMessage);
      if (profileImageInputRef.current) profileImageInputRef.current.value = "";
      return;
    }

    setUpdatingProfileImage(true);
    try {
      const image = await uploadMyProfileImage(file);
      const updated = await updateMyProfile({
        profileImageAssetId: image.assetId,
      });
      setProfile(updated);
      notifyAuthUserChanged();
      setMessage(
        profile?.profileImageUrl
          ? "프로필 사진을 변경했습니다."
          : "프로필 사진을 등록했습니다.",
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "프로필 사진 업로드에 실패했습니다.",
      );
    } finally {
      setUpdatingProfileImage(false);
      if (profileImageInputRef.current) profileImageInputRef.current.value = "";
    }
  }

  async function handleDeleteProfileImage() {
    if (!profile?.profileImageUrl) return;
    if (!window.confirm("프로필 사진을 삭제할까요?")) return;
    setMessage("");
    setUpdatingProfileImage(true);
    try {
      const updated = await deleteMyProfileImage();
      setProfile(updated);
      notifyAuthUserChanged();
      setMessage("프로필 사진을 삭제했습니다.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "프로필 사진 삭제에 실패했습니다.",
      );
    } finally {
      setUpdatingProfileImage(false);
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
      if (resumeFileInputRef.current) resumeFileInputRef.current.value = "";
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
      if (resumeFileInputRef.current) resumeFileInputRef.current.value = "";
    }
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
            <p className={styles.loadingText}>
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

  if (!profile || !match) {
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

  const displayName = profile.displayName ?? profile.username;
  const displayNameDirty =
    displayNameInput.trim() !== (profile.displayName ?? "");

  function openVerificationModal() {
    setVerificationModalOpen(true);
  }

  return (
    <>
      <SiteNav />
      <main className={styles.page}>
        <div className={styles.container}>
          <section className={styles.hero}>
            <div className={styles.coverImage} aria-hidden="true" />
            <div className={styles.heroBody}>
              <div className={styles.heroProfile}>
                <button
                  type="button"
                  className={styles.avatarButton}
                  onClick={() => profileImageInputRef.current?.click()}
                  disabled={updatingProfileImage}
                  aria-label="프로필 사진 업로드"
                >
                  {profile.profileImageUrl ? (
                    <Image
                      src={profile.profileImageUrl}
                      alt={`${displayName} 프로필 사진`}
                      className={styles.avatarImage}
                      fill
                      sizes="104px"
                      unoptimized
                    />
                  ) : (
                    <span className={styles.avatarInitial}>
                      {displayName.slice(0, 1).toUpperCase()}
                    </span>
                  )}
                  <span className={styles.avatarCamera}>
                    <Camera size={15} />
                  </span>
                </button>
                <input
                  ref={profileImageInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp"
                  className={styles.hiddenInput}
                  onChange={handleProfileImageUpload}
                />
                <div className={styles.heroInfo}>
                  <h1>{displayName}</h1>
                  <p>
                    @{profile.username} · 가입일 {formatDate(profile.createdAt)}
                  </p>
                </div>
              </div>
              <div className={styles.heroBadgeArea}>
                <button
                  ref={verificationBadgeButtonRef}
                  type="button"
                  className={styles.badgeButton}
                  onMouseDown={openVerificationModal}
                  onClick={openVerificationModal}
                  aria-label="CPA 인증 상세 보기"
                >
                  <VerificationBadge status={profile.cpaVerificationStatus} />
                </button>
              </div>
            </div>
          </section>

          {message && <div className={styles.message}>{message}</div>}

          <div className={styles.summaryGrid}>
            <section className={styles.panel}>
              <div className={styles.panelHeader}>
                <h2>
                  <Sparkles size={17} />
                  AI 매칭 점수
                </h2>
              </div>
              <div className={styles.matchScoreRow}>
                <div className={styles.scoreCircle}>
                  <strong>{match.score}</strong>
                  <span>점</span>
                </div>
                <div className={styles.matchCopy}>
                  <p>{match.level}</p>
                  <span>{match.reason}</span>
                </div>
              </div>
              <div className={styles.scoreTrack}>
                <span style={{ width: `${match.score}%` }} />
              </div>
              <ActionButton
                type="button"
                size="sm"
                iconStart={<BrainCircuit size={14} />}
                onClick={() => setLikelihoodResult(match.likelihood)}
              >
                합격 가능성 판단
              </ActionButton>
              {likelihoodResult && (
                <p className={styles.likelihoodResult}>{likelihoodResult}</p>
              )}
            </section>

            <section className={styles.panel}>
              <div className={styles.panelHeader}>
                <h2>
                  <CheckCircle2 size={17} />내 상태
                </h2>
              </div>
              <div className={styles.statGrid}>
                <StatItem label="이력서" value={`${resumes.length}/5`} />
                <StatItem label="북마크" value={`${bookmarks.length}개`} />
                <StatItem
                  label="CPA"
                  value={verificationLabels[profile.cpaVerificationStatus]}
                />
                <StatItem
                  label="활동"
                  value={`${communityActivityTotal}개`}
                />
              </div>
            </section>
          </div>

          <div className={styles.mainGrid}>
            <section className={styles.panel}>
              <div className={styles.panelHeader}>
                <h2>내 프로필</h2>
              </div>
              <div className={styles.profilePhotoActions}>
                <ActionButton
                  type="button"
                  size="sm"
                  iconStart={<Camera size={14} />}
                  disabled={updatingProfileImage}
                  onClick={() => profileImageInputRef.current?.click()}
                >
                  {updatingProfileImage
                    ? "처리 중"
                    : profile.profileImageUrl
                      ? "사진 변경"
                      : "사진 등록"}
                </ActionButton>
                {profile.profileImageUrl && (
                  <ActionButton
                    type="button"
                    variant="subtle"
                    size="sm"
                    iconStart={<Trash2 size={14} />}
                    disabled={updatingProfileImage}
                    onClick={() => void handleDeleteProfileImage()}
                  >
                    사진 삭제
                  </ActionButton>
                )}
                <span>PNG, JPG, WEBP · 최대 2MB</span>
              </div>
              <form className={styles.profileForm} onSubmit={handleProfileSave}>
                <label className={styles.field}>
                  표시이름
                  <input
                    className={styles.input}
                    value={displayNameInput}
                    onChange={(e) => setDisplayNameInput(e.target.value)}
                    placeholder="닉네임"
                    maxLength={50}
                  />
                </label>
                <div className={styles.field}>
                  아이디
                  <div className={styles.fieldValue}>{profile.username}</div>
                </div>
                <div className={styles.formActions}>
                  <ActionButton
                    type="submit"
                    size="sm"
                    disabled={!displayNameDirty}
                  >
                    프로필 저장
                  </ActionButton>
                </div>
              </form>

              <div className={styles.passwordForm}>
                <div className={styles.subsectionTitle}>
                  <KeyRound size={16} />
                  비밀번호
                </div>
                <label className={styles.field}>
                  현재 비밀번호
                  <input
                    className={styles.input}
                    type="password"
                    autoComplete="current-password"
                    disabled
                  />
                </label>
                <label className={styles.field}>
                  새 비밀번호
                  <input
                    className={styles.input}
                    type="password"
                    autoComplete="new-password"
                    minLength={8}
                    disabled
                  />
                </label>
                <label className={styles.field}>
                  새 비밀번호 확인
                  <input
                    className={styles.input}
                    type="password"
                    autoComplete="new-password"
                    minLength={8}
                    disabled
                  />
                </label>
                <div className={styles.formActions}>
                  <ActionButton
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled
                  >
                    비밀번호 변경
                  </ActionButton>
                </div>
              </div>
            </section>
          </div>

          <section className={styles.panel}>
            <div className={styles.panelHeader}>
              <h2>
                <FileText size={17} />
                이력서
              </h2>
              <ActionButton
                type="button"
                size="sm"
                variant="outline"
                iconStart={<Upload size={14} />}
                onClick={() => {
                  if (uploadingResume) return;
                  if (resumes.length >= 5) {
                    setMessage("이력서는 최대 5개까지 업로드할 수 있습니다.");
                    return;
                  }
                  resumeFileInputRef.current?.click();
                }}
                disabled={uploadingResume}
              >
                {uploadingResume ? "업로드 중" : "파일 선택"}
              </ActionButton>
            </div>
            <input
              ref={resumeFileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.hwp,.hwpx"
              className={styles.hiddenInput}
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
                          {formatDate(resume.createdAt)}
                        </div>
                      </div>
                    </div>
                    <div className={styles.itemActions}>
                      <a
                        href={getMyResumeDownloadUrl(resume.id)}
                        className={styles.iconButton}
                        aria-label="이력서 다운로드"
                      >
                        <Download size={15} />
                      </a>
                      <button
                        type="button"
                        className={styles.iconButtonDanger}
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

          <section className={styles.panel}>
            <div className={styles.panelHeader}>
              <h2>
                <Bookmark size={17} />
                북마크
              </h2>
              <div className={styles.filterRow}>
                <FilterButton
                  active={bookmarkFilter === "ALL"}
                  onClick={() => setBookmarkFilter("ALL")}
                >
                  전체
                </FilterButton>
                <FilterButton
                  active={bookmarkFilter === "JOB"}
                  onClick={() => setBookmarkFilter("JOB")}
                >
                  공고
                </FilterButton>
                <FilterButton
                  active={bookmarkFilter === "COMPANY"}
                  onClick={() => setBookmarkFilter("COMPANY")}
                >
                  회사
                </FilterButton>
              </div>
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
                        {bm.targetSubtitle} · {formatDate(bm.createdAt)}
                      </div>
                    </Link>
                    <span className={styles.bookmarkType}>
                      {bm.targetType === "JOB" ? "공고" : "회사"}
                    </span>
                    <button
                      type="button"
                      className={styles.iconButtonDanger}
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

          <section className={styles.panel}>
            <div className={styles.panelHeader}>
              <h2>
                <MessageCircle size={17} />내 커뮤니티 활동
              </h2>
              {communityActivityTotal > 5 && (
                <Link href="/mypage/activities" className={styles.textButton}>
                  전체 보기
                </Link>
              )}
            </div>
            {communityActivity.length ? (
              <div className={styles.activityList}>
                {communityActivity.map((activity) => (
                  <Link
                    key={activity.id}
                    href={communityDetailHref(activity.id)}
                    className={styles.activityItem}
                  >
                    <div className={styles.activityTitle}>
                      <span>{boardLabels[activity.boardType]}</span>
                      <span>{activity.title}</span>
                    </div>
                    <div className={styles.activityMeta}>
                      댓글 {activity.commentCount} · 좋아요 {activity.likeCount}{" "}
                      · {formatDate(activity.createdAt)}
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className={styles.empty}>아직 작성한 글이 없습니다.</div>
            )}
          </section>
        </div>
      </main>

      {verificationModalOpen && (
        <div
          className={styles.modalOverlay}
          role="presentation"
          onMouseDown={() => setVerificationModalOpen(false)}
        >
          <div
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="verification-modal-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className={styles.modalClose}
              onClick={() => setVerificationModalOpen(false)}
              aria-label="닫기"
            >
              <X size={18} />
            </button>
            <div className={styles.modalBadge}>
              <VerificationBadge
                status={profile.cpaVerificationStatus}
                size="large"
              />
            </div>
            <h2 id="verification-modal-title" className={styles.modalTitle}>
              CPA 검증 상태
            </h2>
            <div className={styles.statusRows}>
              <InfoRow
                label="현재 상태"
                value={verificationLabels[profile.cpaVerificationStatus]}
              />
              <InfoRow
                label="인증 일자"
                value={
                  profile.verifiedAt ? formatDate(profile.verifiedAt) : "-"
                }
              />
              <InfoRow
                label="수습 상태"
                value={
                  profile.careerStage
                    ? careerStageLabels[profile.careerStage]
                    : "미설정"
                }
              />
              <InfoRow
                label="고용 이력"
                value={employmentLabels[profile.employmentHistoryStatus]}
              />
              <InfoRow
                label="커뮤니티 뱃지"
                value={
                  profile.cpaVerificationStatus === "CPA_VERIFIED"
                    ? "활성"
                    : "비활성"
                }
              />
              <InfoRow
                label="수습 CPA 방"
                value={
                  profile.traineeRoomAccess ? "입장 가능" : "검증 후 입장 가능"
                }
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function VerificationBadge({
  status,
  size = "normal",
}: {
  status: MyProfileResponse["cpaVerificationStatus"];
  size?: "normal" | "large";
}) {
  const toneClass =
    status === "CPA_VERIFIED"
      ? styles.badgeVerified
      : status === "PENDING"
        ? styles.badgePending
        : status === "REJECTED"
          ? styles.badgeRejected
          : styles.badgeUnverified;

  return (
    <span
      className={`${styles.cpaBadge} ${toneClass} ${
        size === "large" ? styles.cpaBadgeLarge : ""
      }`}
    >
      <span className={styles.badgeSeal} aria-hidden="true" />
      <span className={styles.badgeLabel}>{verificationLabels[status]}</span>
    </span>
  );
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.statItem}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.infoRow}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      className={`${styles.filterBtn} ${active ? styles.filterBtnActive : ""}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function calculateMatch(
  profile: MyProfileResponse,
  resumes: ResumeItem[],
  bookmarks: BookmarkItem[],
) {
  let score = 46;
  if (profile.cpaVerificationStatus === "CPA_VERIFIED") score += 22;
  if (profile.cpaVerificationStatus === "PENDING") score += 10;
  if (profile.cpaVerificationStatus === "REJECTED") score -= 6;
  if (profile.careerStage) score += 8;
  if (resumes.length > 0) score += 15;
  if (bookmarks.length > 0) score += Math.min(bookmarks.length * 2, 8);
  if (profile.displayName) score += 4;

  const normalizedScore = Math.max(20, Math.min(96, score));
  if (normalizedScore >= 82) {
    return {
      score: normalizedScore,
      level: "매칭 높음",
      reason: "인증과 지원 자료가 잘 갖춰져 있습니다.",
      likelihood: "높음 · 관심 공고 기준으로 바로 지원해볼 만합니다.",
    };
  }
  if (normalizedScore >= 64) {
    return {
      score: normalizedScore,
      level: "매칭 보통",
      reason: "기본 정보가 충분하고 보강 여지가 있습니다.",
      likelihood: "보통 · 이력서와 CPA 인증 상태가 결과를 더 끌어올립니다.",
    };
  }
  return {
    score: normalizedScore,
    level: "준비 필요",
    reason: "프로필과 이력서 정보가 더 필요합니다.",
    likelihood: "낮음 · 이력서 등록과 CPA 검증을 먼저 채우는 편이 좋습니다.",
  };
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

function formatDate(iso: string) {
  const date = new Date(iso);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}.${month}.${day}`;
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

function validateProfileImage(file: File) {
  const extension = file.name.split(".").pop()?.toLowerCase();
  if (!extension || !PROFILE_IMAGE_EXTENSIONS.has(extension)) {
    return "프로필 사진은 PNG, JPG, WEBP 파일만 업로드할 수 있습니다.";
  }
  if (!PROFILE_IMAGE_TYPES.has(file.type)) {
    return "프로필 사진 파일 형식이 올바르지 않습니다.";
  }
  if (file.size <= 0) {
    return "빈 이미지 파일은 업로드할 수 없습니다.";
  }
  if (file.size > PROFILE_IMAGE_MAX_BYTES) {
    return "프로필 사진은 2MB 이하로 업로드해주세요.";
  }
  return "";
}

function notifyAuthUserChanged() {
  window.dispatchEvent(new Event(AUTH_USER_CHANGED_EVENT));
}
