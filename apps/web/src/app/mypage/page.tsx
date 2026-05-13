"use client";

import type {
  BookmarkItem,
  BookmarkTargetType,
  CommunityBoardType,
  JobFitAnalysisItem,
  MyCommunityActivityItem,
  MyProfileResponse,
  NotificationItem,
  PersonalCareerStage,
  ResumeItem,
} from "@cpa/shared";
import {
  Award,
  Bell,
  Bookmark,
  Camera,
  CheckCircle2,
  Download,
  EyeOff,
  FileText,
  KeyRound,
  MessageCircle,
  Sparkles,
  Star,
  TrendingUp,
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
  fetchMyHighFitJobAnalyses,
  fetchMyProfile,
  fetchMyResumes,
  fetchNotifications,
  getMyResumeDownloadUrl,
  setMyPrimaryResume,
  NOTIFICATIONS_CHANGED_EVENT,
  updateMyProfile,
  updateMyPassword,
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
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 128;
const PASSWORD_LENGTH_TEXT = `${PASSWORD_MIN_LENGTH}자 이상 ${PASSWORD_MAX_LENGTH}자 이하`;
const PASSWORD_HELP_TEXT = `새 비밀번호는 ${PASSWORD_LENGTH_TEXT}, 현재 비밀번호와 다르게 입력해주세요.`;

const PROFILE_COMPLETION_HIDDEN_UNTIL_STORAGE_KEY =
  "accountit:mypage-profile-completion:hiddenUntil";
const PROFILE_COMPLETION_SNOOZE_MS = 7 * 24 * 60 * 60 * 1000;
const PROFILE_COMPLETION_NEW_USER_MS = 30 * 24 * 60 * 60 * 1000;

type ProfileCompletionAction =
  | "profileImage"
  | "displayName"
  | "resume"
  | "cpa"
  | "jobs"
  | "community";

type ProfileCompletionStep = {
  id: string;
  label: string;
  description: string;
  points: number;
  earned: number;
  completed: boolean;
  action: ProfileCompletionAction;
  actionLabel: string;
  href?: string;
};

type ProfileCompletion = {
  score: number;
  level: string;
  reason: string;
  nextStep: ProfileCompletionStep | null;
  steps: ProfileCompletionStep[];
};

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
  const [highFitAnalyses, setHighFitAnalyses] = useState<
    JobFitAnalysisItem[]
  >([]);
  const [communityActivity, setCommunityActivity] = useState<
    MyCommunityActivityItem[]
  >([]);
  const [notificationPreview, setNotificationPreview] = useState<
    NotificationItem[]
  >([]);
  const [communityActivityTotal, setCommunityActivityTotal] = useState(0);
  const [notificationUnreadCount, setNotificationUnreadCount] = useState(0);
  const [bookmarkFilter, setBookmarkFilter] = useState<
    BookmarkTargetType | "ALL"
  >("ALL");
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [message, setMessage] = useState("");
  const [uploadingResume, setUploadingResume] = useState(false);
  const [updatingPrimaryResumeId, setUpdatingPrimaryResumeId] = useState("");
  const [updatingProfileImage, setUpdatingProfileImage] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [displayNameInput, setDisplayNameInput] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");
  const [verificationModalOpen, setVerificationModalOpen] = useState(false);
  const [profileCompletionHidden, setProfileCompletionHidden] = useState(false);
  const [profileCompletionModalOpen, setProfileCompletionModalOpen] =
    useState(false);
  const [profileCompletionDismissed, setProfileCompletionDismissed] =
    useState(false);

  const resumeFileInputRef = useRef<HTMLInputElement>(null);
  const profileImageInputRef = useRef<HTMLInputElement>(null);
  const displayNameInputRef = useRef<HTMLInputElement>(null);
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

        const [
          
          profileResult,
         
          bookmarkResult,
         
          resumeResult,
          highFitResult,
         
          activityResult,
          notificationResult,
        ,
        ] = await Promise.allSettled([
          fetchMyProfile(),
          fetchMyBookmarks(),
          fetchMyResumes(),
          fetchMyHighFitJobAnalyses(5),
          fetchMyCommunityActivity(5),
            fetchNotifications({ page: 1, pageSize: 3 }),
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
        setHighFitAnalyses(
          highFitResult.status === "fulfilled" ? highFitResult.value.items : [],
        );
        setCommunityActivity(
          activityResult.status === "fulfilled"
            ? activityResult.value.items
            : [],
        );
        setNotificationPreview(
          notificationResult.status === "fulfilled"
            ? notificationResult.value.items
            : [],
        );
        setCommunityActivityTotal(
          activityResult.status === "fulfilled" ? activityResult.value.total : 0,
        );
        setNotificationUnreadCount(
          notificationResult.status === "fulfilled"
            ? notificationResult.value.unreadCount
            : 0,
        );

        const sideLoadErrors = [
          bookmarkResult.status === "rejected" ? "북마크" : "",
          resumeResult.status === "rejected" ? "이력서" : "",
          highFitResult.status === "rejected" ? "공고 분석" : "",
          activityResult.status === "rejected" ? "커뮤니티 활동" : "",
          notificationResult.status === "rejected" ? "알림" : "",
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

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const hiddenUntil = Number(
          window.localStorage.getItem(
            PROFILE_COMPLETION_HIDDEN_UNTIL_STORAGE_KEY,
          ),
        );
        const shouldHide =
          Number.isFinite(hiddenUntil) && hiddenUntil > Date.now();
        setProfileCompletionHidden(shouldHide);
        if (!shouldHide) {
          window.localStorage.removeItem(
            PROFILE_COMPLETION_HIDDEN_UNTIL_STORAGE_KEY,
          );
        }
      } catch {
        // Browser storage can be unavailable in restricted/private contexts.
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const filteredBookmarks =
    bookmarkFilter === "ALL"
      ? bookmarks
      : bookmarks.filter((bm) => bm.targetType === bookmarkFilter);

  const profileCompletion = profile
    ? calculateProfileCompletion(
        profile,
        resumes.length,
        bookmarks.length,
        communityActivityTotal,
      )
    : null;
  const profileCompletionScore = profileCompletion?.score ?? null;
  const profileCreatedAt = profile?.createdAt ?? null;

  useEffect(() => {
    if (
      !profileCreatedAt ||
      profileCompletionScore === null ||
      profileCompletionHidden ||
      profileCompletionDismissed ||
      profileCompletionModalOpen ||
      profileCompletionScore === 100
    ) {
      return;
    }

    const timer = window.setTimeout(() => {
      const createdAt = new Date(profileCreatedAt).getTime();
      const isNewMember =
        Number.isFinite(createdAt) &&
        Date.now() - createdAt <= PROFILE_COMPLETION_NEW_USER_MS;
      if (isNewMember || profileCompletionScore < 60) {
        setProfileCompletionModalOpen(true);
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, [
    profileCreatedAt,
    profileCompletionScore,
    profileCompletionHidden,
    profileCompletionDismissed,
    profileCompletionModalOpen,
  ]);

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

  async function handlePasswordSave(event: FormEvent) {
    event.preventDefault();
    setMessage("");

    if (!currentPassword) {
      setMessage("현재 비밀번호를 입력해주세요.");
      return;
    }
    if (!newPassword) {
      setMessage("새 비밀번호를 입력해주세요.");
      return;
    }
    if (!newPasswordConfirm) {
      setMessage("새 비밀번호 확인을 입력해주세요.");
      return;
    }
    if (
      newPassword.length < PASSWORD_MIN_LENGTH ||
      newPassword.length > PASSWORD_MAX_LENGTH
    ) {
      setMessage(`새 비밀번호는 ${PASSWORD_LENGTH_TEXT}로 입력해주세요.`);
      return;
    }
    if (newPassword !== newPasswordConfirm) {
      setMessage("새 비밀번호와 확인값이 일치하지 않습니다.");
      return;
    }
    if (currentPassword === newPassword) {
      setMessage("새 비밀번호는 현재 비밀번호와 다르게 입력해 주세요.");
      return;
    }

    setUpdatingPassword(true);
    try {
      await updateMyPassword({ currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setNewPasswordConfirm("");
      setMessage("비밀번호를 변경했습니다.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "비밀번호 변경에 실패했습니다.",
      );
    } finally {
      setUpdatingPassword(false);
    }
  }

  async function handleDeleteBookmark(id: string) {
    setMessage("");
    try {
      await deleteMyBookmark(id);
      setBookmarks((prev) => prev.filter((bm) => bm.id !== id));
      notifyNotificationsChanged();
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

    if (resumes.length >= 5) {
      setMessage("이력서는 최대 5개까지 등록할 수 있습니다.");
      if (resumeFileInputRef.current) resumeFileInputRef.current.value = "";
      return;
    }

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

  async function handleSetPrimaryResume(id: string) {
    if (updatingPrimaryResumeId) return;
    setMessage("");
    setUpdatingPrimaryResumeId(id);
    try {
      const updated = await setMyPrimaryResume(id);
      setResumes((prev) =>
        prev
          .map((resume) => ({
            ...resume,
            isPrimary: resume.id === updated.id,
          }))
          .sort(
            (first, second) =>
              Number(second.isPrimary) - Number(first.isPrimary),
          ),
      );
      setMessage("대표 이력서를 변경했습니다.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "대표 이력서 변경에 실패했습니다.",
      );
    } finally {
      setUpdatingPrimaryResumeId("");
    }
  }

  function handleProfileCompletionAction(action: ProfileCompletionAction) {
    setProfileCompletionModalOpen(false);
    setProfileCompletionDismissed(true);

    if (action === "profileImage") {
      profileImageInputRef.current?.click();
      return;
    }
    if (action === "displayName") {
      displayNameInputRef.current?.focus();
      displayNameInputRef.current?.scrollIntoView({
        block: "center",
        behavior: "smooth",
      });
      return;
    }
    if (action === "resume") {
      if (uploadingResume) return;
      if (resumes.length >= 5) {
        setMessage("이력서는 최대 5개까지 업로드할 수 있습니다.");
        return;
      }
      resumeFileInputRef.current?.click();
      return;
    }
    if (action === "cpa") {
      setVerificationModalOpen(true);
    }
  }

  function hideProfileCompletionForWeek() {
    const hiddenUntil = Date.now() + PROFILE_COMPLETION_SNOOZE_MS;
    setProfileCompletionHidden(true);
    setProfileCompletionModalOpen(false);
    setProfileCompletionDismissed(true);
    try {
      window.localStorage.setItem(
        PROFILE_COMPLETION_HIDDEN_UNTIL_STORAGE_KEY,
        String(hiddenUntil),
      );
    } catch {
      // Ignore storage failures; the in-memory state still hides the card.
    }
  }

  function openProfileCompletionModal() {
    setProfileCompletionHidden(false);
    setProfileCompletionDismissed(false);
    setProfileCompletionModalOpen(true);
    try {
      window.localStorage.removeItem(
        PROFILE_COMPLETION_HIDDEN_UNTIL_STORAGE_KEY,
      );
    } catch {
      // Ignore storage failures; the in-memory state still opens the modal.
    }
  }

  function closeProfileCompletionModal() {
    setProfileCompletionModalOpen(false);
    setProfileCompletionDismissed(true);
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

  if (!profile || !profileCompletion) {
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
  const profileComplete = profileCompletion.score === 100;
  const resumeLimitReached = resumes.length >= 5;
  const resumeUploadButtonLabel = uploadingResume
    ? "업로드 중"
    : resumeLimitReached
      ? "5개 등록 완료"
      : "파일 선택";

  function openVerificationModal() {
    setVerificationModalOpen(true);
  }

  return (
    <>
      <SiteNav />
      <main className={styles.page}>
        <div className={styles.container}>
          <section
            className={`${styles.hero} ${
              profileComplete ? styles.heroComplete : ""
            }`}
          >
            <div className={styles.coverImage} aria-hidden="true" />
            <div className={styles.heroBody}>
              <div className={styles.heroProfile}>
                <button
                  type="button"
                  className={`${styles.avatarButton} ${
                    profileComplete ? styles.avatarButtonComplete : ""
                  }`}
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
                  {profileComplete && (
                    <div className={styles.equippedRewardRow}>
                      <span>골드 포커스 프레임 착용 중</span>
                      <span>완성 프로필 이름표</span>
                    </div>
                  )}
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
                {profileComplete && (
                  <span className={styles.profileCompleteBadge}>
                    <Award size={14} />
                    프로필 완성
                  </span>
                )}
              </div>
            </div>
          </section>

          {message && <div className={styles.message}>{message}</div>}

          <div className={`${styles.summaryGrid} ${styles.summaryGridCompact}`}>
            <section className={styles.panel}>
              <div className={styles.panelHeader}>
                <h2>
                  <CheckCircle2 size={17} />내 상태
                </h2>
              </div>
              <div className={styles.statGrid}>
                <StatItem label="이력서" value={`${resumes.length}/5`} />
                <StatItem label="AI 분석" value={`${highFitAnalyses.length}개`} />
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
              <div className={styles.profileBoostStrip}>
                <div className={styles.profileBoostCopy}>
                  <span>프로필 부스트</span>
                  <strong>
                    {profileCompletion.score}% · {profileCompletion.level}
                  </strong>
                  <p>
                    {profileComplete
                      ? "골드 프레임과 완성 프로필 아이템이 활성화됐습니다."
                      : "초기 세팅은 팝업에서 가볍게 관리하세요."}
                  </p>
                </div>
                <ActionButton
                  type="button"
                  size="sm"
                  variant="outline"
                  iconStart={<Sparkles size={14} />}
                  onClick={openProfileCompletionModal}
                >
                  {profileComplete ? "보상 보기" : "관리"}
                </ActionButton>
              </div>
            </section>

            <section className={styles.panel}>
              <div className={styles.panelHeader}>
                <h2>
                  <Bell size={17} />
                  알림
                </h2>
                <Link href="/mypage/notifications" className={styles.textButton}>
                  전체 보기
                </Link>
              </div>
              <p className={styles.activityPageSummary}>
                읽지 않음 {notificationUnreadCount.toLocaleString("ko-KR")}개
              </p>
              {notificationPreview.length ? (
                <div className={styles.notificationList}>
                  {notificationPreview.map((item) => (
                    <Link
                      key={item.id}
                      href={item.href}
                      className={`${styles.notificationItem} ${
                        item.readAt ? "" : styles.notificationUnread
                      }`}
                    >
                      <div className={styles.notificationMain}>
                        <div className={styles.notificationTitleRow}>
                          {!item.readAt && (
                            <span
                              className={styles.unreadDot}
                              aria-hidden="true"
                            />
                          )}
                          <span>{notificationTypeLabel(item.type)}</span>
                          <strong>{item.title}</strong>
                        </div>
                        <p>{item.body}</p>
                        <time dateTime={item.createdAt}>
                          {formatDate(item.createdAt)}
                        </time>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className={styles.empty}>표시할 알림이 없습니다.</div>
              )}
            </section>
          </div>

          <section className={`${styles.panel} ${styles.highFitPanel}`}>
            <div className={styles.panelHeader}>
              <h2>
                <TrendingUp size={17} />
                합격확률 높은 공고
              </h2>
              <Link href="/jobs" className={styles.textButton}>
                공고 더 보기
              </Link>
            </div>
            {highFitAnalyses.length ? (
              <div className={styles.highFitList}>
                {highFitAnalyses.map((analysis) => (
                  <Link
                    key={analysis.id}
                    href={jobDetailHref(analysis.jobId)}
                    className={styles.highFitItem}
                  >
                    <div className={styles.highFitScore}>
                      <span>{analysis.fitScore}%</span>
                      <small>적합도</small>
                    </div>
                    <div className={styles.highFitBody}>
                      <div className={styles.highFitTitle}>
                        {analysis.jobTitle}
                      </div>
                      <div className={styles.highFitMeta}>
                        {analysis.companyName} · {analysis.resumeFileName} ·{" "}
                        {formatDate(analysis.createdAt)}
                      </div>
                      <p>{analysis.summary}</p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className={styles.empty}>
                아직 합격확률 75% 이상으로 분석된 공고가 없습니다.
              </div>
            )}
          </section>

          <div className={styles.mainGrid}>
            <section className={`${styles.panel} ${styles.mainGridFull}`}>
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
                    ref={displayNameInputRef}
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

              <form
                className={styles.passwordForm}
                onSubmit={handlePasswordSave}
                noValidate
              >
                <div className={styles.subsectionTitle}>
                  <KeyRound size={16} />
                  비밀번호
                </div>
                <p className={styles.passwordHint}>{PASSWORD_HELP_TEXT}</p>
                <label className={styles.field}>
                  <span>현재 비밀번호 <span className={styles.required}>*</span></span>
                  <input
                    className={styles.input}
                    type="password"
                    placeholder="현재 비밀번호를 입력하세요"
                    autoComplete="current-password"
                    value={currentPassword}
                    onChange={(event) => setCurrentPassword(event.target.value)}
                    minLength={PASSWORD_MIN_LENGTH}
                    maxLength={PASSWORD_MAX_LENGTH}
                    required
                    disabled={updatingPassword}
                  />
                </label>
                <label className={styles.field}>
                  <span>새 비밀번호 <span className={styles.required}>*</span></span>
                  <input
                    className={styles.input}
                    type="password"
                    placeholder="새 비밀번호를 입력하세요 (8자 이상)"
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    minLength={PASSWORD_MIN_LENGTH}
                    maxLength={PASSWORD_MAX_LENGTH}
                    required
                    disabled={updatingPassword}
                  />
                </label>
                <label className={styles.field}>
                  <span>새 비밀번호 확인 <span className={styles.required}>*</span></span>
                  <input
                    className={styles.input}
                    type="password"
                    placeholder="새 비밀번호를 다시 입력하세요"
                    autoComplete="new-password"
                    value={newPasswordConfirm}
                    onChange={(event) =>
                      setNewPasswordConfirm(event.target.value)
                    }
                    minLength={PASSWORD_MIN_LENGTH}
                    maxLength={PASSWORD_MAX_LENGTH}
                    required
                    disabled={updatingPassword}
                  />
                </label>
                <div className={styles.formActions}>
                  <ActionButton
                    type="submit"
                    size="sm"
                    variant="outline"
                    disabled={updatingPassword}
                  >
                    {updatingPassword ? "변경 중" : "비밀번호 변경"}
                  </ActionButton>
                </div>
              </form>
            </section>
          </div>

          <section className={styles.panel}>
            <div className={styles.panelHeader}>
              <div className={styles.panelTitleGroup}>
                <h2>
                  <FileText size={17} />
                  이력서
                </h2>
                <p className={styles.resumeLimitText}>
                  {resumes.length}/5개 등록 · 대표 이력서를 선택해 공고 분석에 사용합니다.
                </p>
              </div>
              <ActionButton
                type="button"
                size="sm"
                variant="outline"
                iconStart={<Upload size={14} />}
                onClick={() => {
                  if (uploadingResume) return;
                  if (resumeLimitReached) {
                    setMessage("이력서는 최대 5개까지 업로드할 수 있습니다.");
                    return;
                  }
                  resumeFileInputRef.current?.click();
                }}
                disabled={uploadingResume || resumeLimitReached}
              >
                {resumeUploadButtonLabel}
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
                          {resume.isPrimary && (
                            <span className={styles.primaryResumeBadge}>
                              대표
                            </span>
                          )}
                        </div>
                        <div className={styles.resumeMeta}>
                          {formatFileSize(resume.byteSize)} ·{" "}
                          {formatDate(resume.createdAt)}
                        </div>
                      </div>
                    </div>
                    <div className={styles.itemActions}>
                      <button
                        type="button"
                        className={`${styles.primaryResumeButton} ${
                          resume.isPrimary ? styles.primaryResumeButtonActive : ""
                        }`}
                        onClick={() => void handleSetPrimaryResume(resume.id)}
                        disabled={
                          resume.isPrimary ||
                          updatingPrimaryResumeId === resume.id
                        }
                        aria-label="대표 이력서 선택"
                      >
                        <Star size={15} />
                        <span>{resume.isPrimary ? "대표" : "대표 선택"}</span>
                      </button>
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

          <section className={`${styles.panel} ${styles.mainGridFull}`}>
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

      {profileCompletionModalOpen && (
        <div
          className={styles.completionModalOverlay}
          role="presentation"
          onMouseDown={closeProfileCompletionModal}
        >
          <div
            className={styles.completionModal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="profile-completion-modal-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className={styles.modalClose}
              onClick={closeProfileCompletionModal}
              aria-label="닫기"
            >
              <X size={18} />
            </button>

            <div className={styles.completionModalHero}>
              <div
                className={`${styles.completionAvatarPreview} ${
                  profileComplete ? styles.completionAvatarPreviewComplete : ""
                }`}
              >
                {profile.profileImageUrl ? (
                  <Image
                    src={profile.profileImageUrl}
                    alt={`${displayName} 프로필 사진`}
                    fill
                    sizes="84px"
                    className={styles.completionAvatarImage}
                    unoptimized
                  />
                ) : (
                  <span>{displayName.slice(0, 1).toUpperCase()}</span>
                )}
              </div>
              <div className={styles.completionHeroCopy}>
                <span className={styles.completionEyebrow}>
                  신규 프로필 부스트
                </span>
                <h2 id="profile-completion-modal-title">
                  초반 세팅만 끝내면 프로필이 더 눈에 띄어요
                </h2>
                <p>
                  완성 미터는 필요한 순간에만 보여주고, 완성 후에는 프레임과
                  이름표 아이템으로 남깁니다.
                </p>
              </div>
              <div className={styles.completionScorePill}>
                <strong>{profileCompletion.score}%</strong>
                <span>{profileCompletion.level}</span>
              </div>
            </div>

            <div
              className={styles.scoreTrack}
              aria-label={`프로필 꾸미기 점수 ${profileCompletion.score}%`}
            >
              <span style={{ width: `${profileCompletion.score}%` }} />
            </div>

            {profileCompletion.nextStep && (
              <div className={styles.nextActionBox}>
                <span>다음 추천</span>
                <strong>{profileCompletion.nextStep.label}</strong>
                <p>{profileCompletion.nextStep.description}</p>
                <CompletionAction
                  step={profileCompletion.nextStep}
                  className={styles.nextActionButton}
                  onAction={handleProfileCompletionAction}
                />
              </div>
            )}

            <div className={styles.completionModalGrid}>
              <section className={styles.completionModalSection}>
                <h3>완성 체크리스트</h3>
                <div className={styles.completionChecklist}>
                  {profileCompletion.steps.map((step) => (
                    <div
                      key={step.id}
                      className={`${styles.completionStep} ${
                        step.completed ? styles.completionStepDone : ""
                      }`}
                    >
                      <span className={styles.stepCheck} aria-hidden="true">
                        <CheckCircle2 size={14} />
                      </span>
                      <div className={styles.stepCopy}>
                        <strong>{step.label}</strong>
                        <span>{step.description}</span>
                      </div>
                      <span className={styles.stepPoints}>
                        {step.earned}/{step.points}
                      </span>
                      <CompletionAction
                        step={step}
                        className={styles.stepAction}
                        onAction={handleProfileCompletionAction}
                      />
                    </div>
                  ))}
                </div>
              </section>

              <section className={styles.completionModalSection}>
                <h3>100% 보상 아이템</h3>
                <div className={styles.rewardList}>
                  <div className={styles.rewardItem}>
                    <Award size={17} />
                    <div>
                      <strong>골드 포커스 프레임</strong>
                      <span>프로필 사진 외곽에 완성 전용 프레임을 착용합니다.</span>
                    </div>
                  </div>
                  <div className={styles.rewardItem}>
                    <Sparkles size={17} />
                    <div>
                      <strong>완성 프로필 이름표</strong>
                      <span>마이페이지에서 신뢰 신호를 한눈에 보여줍니다.</span>
                    </div>
                  </div>
                  <div className={styles.rewardItem}>
                    <MessageCircle size={17} />
                    <div>
                      <strong>커뮤니티 이름표 후보</strong>
                      <span>
                        다음 단계에서 글쓴이 옆에 붙일 수 있는 보상으로 확장합니다.
                      </span>
                    </div>
                  </div>
                </div>
              </section>
            </div>

            <div className={styles.completionModalFooter}>
              <button
                type="button"
                className={styles.snoozeButton}
                onClick={hideProfileCompletionForWeek}
              >
                <EyeOff size={14} />
                일주일간 보지 않기
              </button>
              <ActionButton
                type="button"
                size="sm"
                onClick={closeProfileCompletionModal}
              >
                닫기
              </ActionButton>
            </div>
          </div>
        </div>
      )}

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

function CompletionAction({
  step,
  className,
  onAction,
}: {
  step: ProfileCompletionStep;
  className: string;
  onAction: (action: ProfileCompletionAction) => void;
}) {
  if (step.href) {
    return (
      <Link
        href={step.href}
        className={className}
        onClick={() => onAction(step.action)}
      >
        {step.actionLabel}
      </Link>
    );
  }

  return (
    <button
      type="button"
      className={className}
      onClick={() => onAction(step.action)}
    >
      {step.actionLabel}
    </button>
  );
}

function calculateProfileCompletion(
  profile: MyProfileResponse,
  resumeCount: number,
  bookmarkCount: number,
  communityActivityTotal: number,
): ProfileCompletion {
  const bookmarkEarned = Math.min(bookmarkCount * 5, 15);
  const communityEarned = Math.min(communityActivityTotal * 5, 15);
  const cpaEarned =
    profile.cpaVerificationStatus === "CPA_VERIFIED"
      ? 20
      : profile.cpaVerificationStatus === "PENDING"
        ? 10
        : 0;
  const steps: ProfileCompletionStep[] = [
    {
      id: "profile-image",
      label: "프로필 사진 추가",
      description: profile.profileImageUrl
        ? "사진이 있어 프로필 첫인상이 또렷합니다."
        : "사진을 넣으면 마이페이지가 더 개인화되어 보입니다.",
      points: 20,
      earned: profile.profileImageUrl ? 20 : 0,
      completed: Boolean(profile.profileImageUrl),
      action: "profileImage",
      actionLabel: profile.profileImageUrl ? "변경" : "추가",
    },
    {
      id: "display-name",
      label: "표시이름 설정",
      description: profile.displayName
        ? "닉네임이 설정되어 활동 내역을 알아보기 쉽습니다."
        : "표시이름을 정하면 커뮤니티와 프로필에서 더 자연스럽게 보입니다.",
      points: 10,
      earned: profile.displayName ? 10 : 0,
      completed: Boolean(profile.displayName),
      action: "displayName",
      actionLabel: profile.displayName ? "수정" : "입력",
    },
    {
      id: "resume",
      label: "이력서 등록",
      description:
        resumeCount > 0
          ? `이력서 ${resumeCount}개가 등록되어 있습니다.`
          : "이력서를 등록하면 지원 준비 상태를 바로 확인할 수 있습니다.",
      points: 20,
      earned: resumeCount > 0 ? 20 : 0,
      completed: resumeCount > 0,
      action: "resume",
      actionLabel: resumeCount > 0 ? "추가" : "등록",
    },
    {
      id: "cpa-verification",
      label: "CPA 검증 상태 확인",
      description:
        profile.cpaVerificationStatus === "CPA_VERIFIED"
          ? "CPA 검증이 완료되어 신뢰 배지가 활성화되었습니다."
          : profile.cpaVerificationStatus === "PENDING"
            ? "검증 요청이 접수되어 절반의 진행도를 인정합니다."
            : "검증 상태를 확인하면 수습 CPA 방 접근도 준비할 수 있습니다.",
      points: 20,
      earned: cpaEarned,
      completed: profile.cpaVerificationStatus === "CPA_VERIFIED",
      action: "cpa",
      actionLabel:
        profile.cpaVerificationStatus === "CPA_VERIFIED" ? "보기" : "확인",
    },
    {
      id: "bookmarks",
      label: "관심 공고/회사 저장",
      description:
        bookmarkCount >= 3
          ? "관심 항목 3개 이상을 저장했습니다."
          : `관심 항목을 ${Math.max(3 - bookmarkCount, 0)}개 더 저장하면 만점입니다.`,
      points: 15,
      earned: bookmarkEarned,
      completed: bookmarkEarned === 15,
      action: "jobs",
      actionLabel: "찾기",
      href: "/jobs",
    },
    {
      id: "community",
      label: "커뮤니티 활동 남기기",
      description:
        communityActivityTotal >= 3
          ? "커뮤니티 활동 3건 이상으로 활동성이 보입니다."
          : `활동을 ${Math.max(3 - communityActivityTotal, 0)}건 더 남기면 만점입니다.`,
      points: 15,
      earned: communityEarned,
      completed: communityEarned === 15,
      action: "community",
      actionLabel: "이동",
      href: "/community",
    },
  ];
  const score = steps.reduce((total, step) => total + step.earned, 0);

  return {
    score,
    level:
      score === 100
        ? "프로필 완성"
        : score >= 75
          ? "거의 완성"
          : score >= 45
            ? "꾸미는 중"
            : "첫 설정 중",
    reason:
      score === 100
        ? "모든 활용 신호가 채워져 완성 배지를 받았습니다."
        : score >= 75
          ? "마지막 몇 가지 활동만 채우면 완성 배지를 받을 수 있습니다."
          : score >= 45
            ? "기본 정보는 갖춰졌고, 활동 신호를 더하면 점수가 빠르게 오릅니다."
            : "사진, 표시이름, 이력서부터 채우면 마이페이지가 바로 살아납니다.",
    nextStep: steps.find((step) => !step.completed) ?? null,
    steps,
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

function notificationTypeLabel(type: NotificationItem["type"]) {
  if (type === "TAG_NEW_JOB") return "태그";
  return "관심 공고";
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

function notifyNotificationsChanged() {
  window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED_EVENT));
}
