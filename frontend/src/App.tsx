import { useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import {
  AnalyzeRepositoryResponse,
  ApiError,
  ConnectedRepo,
  DuplicateGroup,
  LabelRecommendation,
  LabelRecommendationItem,
  PriorityItem,
  RepositoryItem,
  SyncJobResponse,
  api,
} from './lib/api';

type ConsolePageName =
  | 'issues'
  | 'pullrequests'
  | 'projects'
  | 'labels'
  | 'summary'
  | 'profile'
  | 'repository';

type ItemPriority = 'HIGH' | 'MEDIUM' | 'LOW' | 'UNASSIGNED';
type BucketPriority = 'high' | 'mid' | 'low';
type ListSort = 'priority-desc' | 'priority-asc' | 'newest' | 'oldest' | 'comments';

type RepoProject = {
  id: string;
  repoId: number;
  name: string;
  description: string;
  createdAt: string;
};

type DashboardItem = RepositoryItem & {
  priority: ItemPriority;
  priorityReason: string;
  recommendedLabels: LabelRecommendation[];
  duplicateMeta?: {
    groupId: number;
    similarity: number;
    siblings: Array<{ itemId: number; number: number; type: string; title: string; url: string }>;
  };
};

const PRIORITY_RANK: Record<ItemPriority, number> = {
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
  UNASSIGNED: 0,
};

const PROJECT_STOPWORDS = new Set([
  'the',
  'and',
  'for',
  'with',
  'from',
  'this',
  'that',
  'project',
  'issue',
  'pull',
  'request',
  '작업',
  '프로젝트',
  '이슈',
  '요청',
  '관련',
]);

const GRADIENTS = [
  'linear-gradient(135deg,#0969da,#8250df)',
  'linear-gradient(135deg,#e63946,#f4a261)',
  'linear-gradient(135deg,#1a7f37,#0969da)',
  'linear-gradient(135deg,#8250df,#1a7f37)',
  'linear-gradient(135deg,#d4a72c,#cf222e)',
  'linear-gradient(135deg,#6e7781,#57606a)',
];

function formatErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return `${error.statusCode}${error.errorCode ? ` (${error.errorCode})` : ''}: ${error.message}`;
  }
  if (error instanceof Error) return error.message;
  return 'Unknown error';
}

function toPriority(value: string | undefined): ItemPriority {
  if (value === 'HIGH' || value === 'MEDIUM' || value === 'LOW') return value;
  return 'UNASSIGNED';
}

function toBucketPriority(priority: ItemPriority): BucketPriority {
  if (priority === 'HIGH') return 'high';
  if (priority === 'MEDIUM') return 'mid';
  return 'low';
}

function formatDateLabel(iso?: string): string {
  if (!iso) return '-';
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function formatRelativeTime(iso?: string): string {
  if (!iso) return '-';
  const ts = new Date(iso).getTime();
  if (Number.isNaN(ts)) return '-';
  const diffMin = Math.max(1, Math.floor((Date.now() - ts) / (1000 * 60)));
  if (diffMin < 60) return `${diffMin}분 전`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}시간 전`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 7) return `${diffDay}일 전`;
  const diffWeek = Math.floor(diffDay / 7);
  if (diffWeek < 5) return `${diffWeek}주 전`;
  return new Date(ts).toLocaleDateString();
}

function tokenizeProjectText(text: string): string[] {
  const normalized = text.toLowerCase();
  const tokens = normalized.match(/[a-z0-9가-힣_+-]+/g) ?? [];
  return Array.from(
    new Set(tokens.filter((token) => token.length >= 2 && !PROJECT_STOPWORDS.has(token))),
  );
}

function projectMatchScore(item: DashboardItem, project: RepoProject): number {
  const text = [
    item.title,
    item.priorityReason,
    item.type,
    item.state,
    ...(item.labels ?? []),
    ...item.recommendedLabels.map((rec) => rec.label),
    ...item.recommendedLabels.map((rec) => rec.reason),
  ]
    .join(' ')
    .toLowerCase();

  const projectName = project.name.trim().toLowerCase();
  const phraseHit = projectName.length >= 2 && text.includes(projectName);
  const tokens = tokenizeProjectText(`${project.name} ${project.description}`);

  if (tokens.length === 0) {
    return phraseHit ? 1 : 0;
  }

  let matched = 0;
  for (const token of tokens) {
    if (text.includes(token)) matched += 1;
  }

  const tokenScore = matched / tokens.length;
  return phraseHit ? Math.max(tokenScore, 0.95) : tokenScore;
}

function pickGradient(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return GRADIENTS[Math.abs(hash) % GRADIENTS.length];
}

function initials(input: string): string {
  const words = input
    .split(/\s+/)
    .map((word) => word.trim())
    .filter(Boolean);
  if (words.length === 0) return 'U';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0] ?? ''}${words[1][0] ?? ''}`.toUpperCase();
}

function normalizeSysLabel(label: string): 'Bugfix' | 'Feature' | 'Release' | 'Version Up' | 'Docs' | null {
  const lower = label.toLowerCase();
  if (lower.includes('bug')) return 'Bugfix';
  if (lower.includes('feature') || lower.includes('enhancement')) return 'Feature';
  if (lower.includes('release')) return 'Release';
  if (lower.includes('version')) return 'Version Up';
  if (lower.includes('doc')) return 'Docs';
  return null;
}

function sysLabelClass(label: string): string {
  if (label === 'Bugfix') return 'sys-bugfix';
  if (label === 'Feature') return 'sys-feature';
  if (label === 'Release') return 'sys-release';
  if (label === 'Version Up') return 'sys-versionup';
  return 'sys-docs';
}

function labelTagClass(label: string): string {
  if (label === 'Bugfix') return 'label-bugfix';
  if (label === 'Feature') return 'label-feature';
  if (label === 'Release') return 'label-release';
  if (label === 'Version Up') return 'label-versionup';
  if (label === 'Docs') return 'label-docs';
  return 'label-custom';
}

function buildListItems(
  items: DashboardItem[],
  options: {
    search: string;
    chips: { high: boolean; mid: boolean; low: boolean };
    reviewerOnly: boolean;
    sort: ListSort;
    labelFilter: string | null;
  },
): DashboardItem[] {
  const search = options.search.trim().toLowerCase();

  const filtered = items.filter((item) => {
    const bucket = toBucketPriority(item.priority);
    if (!options.chips[bucket]) return false;

    if (options.reviewerOnly) return false;

    if (options.labelFilter) {
      const lower = options.labelFilter.toLowerCase();
      const observed = (item.labels ?? []).some((label) => label.toLowerCase() === lower);
      const recommended = item.recommendedLabels.some((label) => label.label.toLowerCase() === lower);
      if (!observed && !recommended) return false;
    }

    if (search) {
      const haystack = [
        item.title,
        item.priorityReason,
        ...(item.labels ?? []),
        ...item.recommendedLabels.map((label) => label.label),
      ]
        .join(' ')
        .toLowerCase();
      if (!haystack.includes(search)) return false;
    }

    return true;
  });

  return filtered.sort((left, right) => {
    if (options.sort === 'priority-desc') {
      const diff = PRIORITY_RANK[right.priority] - PRIORITY_RANK[left.priority];
      if (diff !== 0) return diff;
    }

    if (options.sort === 'priority-asc') {
      const diff = PRIORITY_RANK[left.priority] - PRIORITY_RANK[right.priority];
      if (diff !== 0) return diff;
    }

    const leftTime = new Date(left.updatedAtOnGitHub).getTime();
    const rightTime = new Date(right.updatedAtOnGitHub).getTime();

    if (options.sort === 'newest') {
      if (leftTime !== rightTime) return rightTime - leftTime;
    }

    if (options.sort === 'oldest') {
      if (leftTime !== rightTime) return leftTime - rightTime;
    }

    if (options.sort === 'comments') {
      const leftConv = left.recommendedLabels.length + (left.duplicateMeta?.siblings.length ?? 0);
      const rightConv = right.recommendedLabels.length + (right.duplicateMeta?.siblings.length ?? 0);
      if (leftConv !== rightConv) return rightConv - leftConv;
    }

    return right.number - left.number;
  });
}

function ConsolePage() {
  const [health, setHealth] = useState<'ok' | 'down' | 'checking'>('checking');
  const [me, setMe] = useState<{ userId: number; login: string; email?: string; avatarUrl?: string } | null>(
    null,
  );
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  const [githubRepos, setGitHubRepos] = useState<
    Array<{ id: number; fullName: string; isPrivate: boolean; defaultBranch: string }>
  >([]);
  const [connectedRepos, setConnectedRepos] = useState<ConnectedRepo[]>([]);
  const [selectedRepoId, setSelectedRepoId] = useState<number | null>(null);
  const [connectFullName, setConnectFullName] = useState('');
  const [showAddRepoForm, setShowAddRepoForm] = useState(false);

  const [items, setItems] = useState<RepositoryItem[]>([]);
  const [priorities, setPriorities] = useState<PriorityItem[]>([]);
  const [duplicates, setDuplicates] = useState<DuplicateGroup[]>([]);
  const [labelRecommendations, setLabelRecommendations] = useState<LabelRecommendationItem[]>([]);
  const [analysisSummary, setAnalysisSummary] = useState<AnalyzeRepositoryResponse | null>(null);
  const [syncJob, setSyncJob] = useState<SyncJobResponse | null>(null);

  const [repoProjects, setRepoProjects] = useState<RepoProject[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string>('');
  const [projectNameInput, setProjectNameInput] = useState('');
  const [projectDescriptionInput, setProjectDescriptionInput] = useState('');

  const [currentPage, setCurrentPage] = useState<ConsolePageName>('issues');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [detailItemId, setDetailItemId] = useState<number | null>(null);

  const [labelFilter, setLabelFilter] = useState<string | null>(null);

  const [issueSearch, setIssueSearch] = useState('');
  const [prSearch, setPrSearch] = useState('');
  const [issueSort, setIssueSort] = useState<ListSort>('priority-desc');
  const [prSort, setPrSort] = useState<ListSort>('priority-desc');
  const [issueChips, setIssueChips] = useState({ high: true, mid: true, low: true });
  const [prChips, setPrChips] = useState({ high: true, mid: true, low: true });
  const [issueReviewerOnly, setIssueReviewerOnly] = useState(false);
  const [prReviewerOnly, setPrReviewerOnly] = useState(false);

  const syncPollingTimerRef = useRef<number | null>(null);

  const selectedRepo = useMemo(
    () => connectedRepos.find((repo) => repo.id === selectedRepoId) ?? null,
    [connectedRepos, selectedRepoId],
  );

  const selectedRepoProjects = useMemo(() => {
    if (!selectedRepoId) return [];
    return repoProjects
      .filter((project) => project.repoId === selectedRepoId)
      .sort((left, right) => left.name.localeCompare(right.name));
  }, [repoProjects, selectedRepoId]);

  const activeProject = useMemo(
    () => selectedRepoProjects.find((project) => project.id === activeProjectId) ?? null,
    [selectedRepoProjects, activeProjectId],
  );

  useEffect(() => {
    const cachedProjects = window.localStorage.getItem('tidyx:projects');
    if (cachedProjects) {
      try {
        const parsed = JSON.parse(cachedProjects) as RepoProject[];
        if (Array.isArray(parsed)) {
          setRepoProjects(
            parsed.filter(
              (project) =>
                typeof project.id === 'string' &&
                typeof project.repoId === 'number' &&
                typeof project.name === 'string' &&
                typeof project.description === 'string',
            ),
          );
        }
      } catch {
        // noop
      }
    }

    void loadHealth();
    void bootstrap();
  }, []);

  useEffect(() => {
    window.localStorage.setItem('tidyx:projects', JSON.stringify(repoProjects));
  }, [repoProjects]);

  useEffect(() => {
    if (!selectedRepoId) {
      stopSyncPolling();
      setItems([]);
      setPriorities([]);
      setDuplicates([]);
      setLabelRecommendations([]);
      setAnalysisSummary(null);
      setSyncJob(null);
      setDetailItemId(null);
      setLabelFilter(null);
      return;
    }

    setDetailItemId(null);
    void withAction('repo-load', async () => {
      await refreshRepositoryData(selectedRepoId);
      try {
        const latestJob = await api.getLatestSyncJob(selectedRepoId);
        setSyncJob(latestJob);
        if (latestJob.status === 'QUEUED' || latestJob.status === 'RUNNING') {
          stopSyncPolling();
          syncPollingTimerRef.current = window.setTimeout(() => {
            void pollSyncJob(selectedRepoId, latestJob.jobId);
          }, 700);
        }
      } catch (jobError) {
        if (jobError instanceof ApiError && jobError.statusCode === 404) {
          setSyncJob(null);
          return;
        }
        throw jobError;
      }
    });
  }, [selectedRepoId]);

  useEffect(() => {
    return () => {
      stopSyncPolling();
    };
  }, []);

  useEffect(() => {
    if (!selectedRepoId) {
      setActiveProjectId('');
      return;
    }

    const hasActive = repoProjects.some(
      (project) => project.id === activeProjectId && project.repoId === selectedRepoId,
    );
    if (!hasActive) {
      setActiveProjectId('');
    }
  }, [selectedRepoId, activeProjectId, repoProjects]);

  useEffect(() => {
    function onDocumentClick(event: MouseEvent) {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      if (!target.closest('.nav-right')) {
        setDropdownOpen(false);
      }
    }

    document.addEventListener('click', onDocumentClick);
    return () => document.removeEventListener('click', onDocumentClick);
  }, []);

  async function withAction(actionName: string, run: () => Promise<void>) {
    setPendingAction(actionName);
    setError(null);
    try {
      await run();
    } catch (actionError) {
      setError(formatErrorMessage(actionError));
    } finally {
      setPendingAction(null);
    }
  }

  function stopSyncPolling() {
    if (syncPollingTimerRef.current !== null) {
      window.clearTimeout(syncPollingTimerRef.current);
      syncPollingTimerRef.current = null;
    }
  }

  async function pollSyncJob(repoId: number, jobId: number) {
    try {
      const latest = await api.getSyncJob(repoId, jobId);
      setSyncJob(latest);

      if (latest.status === 'QUEUED' || latest.status === 'RUNNING') {
        syncPollingTimerRef.current = window.setTimeout(() => {
          void pollSyncJob(repoId, jobId);
        }, 1500);
        return;
      }

      stopSyncPolling();
      if (latest.status === 'SUCCEEDED') {
        await refreshRepositoryData(repoId);
        await loadConnectedRepos(repoId);
        setNotice(
          `sync 완료: fetched=${latest.totalFetched}, open=${latest.openCount}, closed=${latest.closedCount}`,
        );
      } else if (latest.status === 'FAILED') {
        setError(latest.errorMessage ?? 'Sync job failed');
      }
    } catch (pollError) {
      stopSyncPolling();
      setSyncJob(null);
      setError(formatErrorMessage(pollError));
    }
  }

  async function loadHealth() {
    try {
      await api.getHealth();
      setHealth('ok');
    } catch {
      setHealth('down');
    }
  }

  async function bootstrap() {
    try {
      const currentUser = await api.getMe();
      setMe(currentUser);
      await Promise.all([loadGitHubRepos(), loadConnectedRepos()]);
    } catch (bootstrapError) {
      if (bootstrapError instanceof ApiError && bootstrapError.statusCode === 401) {
        setMe(null);
        return;
      }
      setError(formatErrorMessage(bootstrapError));
    }
  }

  async function refreshRepositoryData(repoId: number) {
    const [itemsResponse, prioritiesResponse, duplicatesResponse, labelsResponse] =
      await Promise.all([
        api.listRepoItems(repoId, {}),
        api.getPriorities(repoId),
        api.getDuplicates(repoId),
        api.getLabelRecommendations(repoId),
      ]);

    setItems(itemsResponse.items);
    setPriorities(prioritiesResponse.items);
    setDuplicates(duplicatesResponse.groups);
    setLabelRecommendations(labelsResponse.items);
  }

  async function loadConnectedRepos(preferredRepoId?: number | null): Promise<number | null> {
    const response = await api.listConnectedRepos();
    setConnectedRepos(response.items);

    const currentId = preferredRepoId ?? selectedRepoId;
    let nextSelected: number | null = null;

    if (response.items.length > 0) {
      if (currentId && response.items.some((repo) => repo.id === currentId)) {
        nextSelected = currentId;
      } else {
        nextSelected = response.items[0].id;
      }
    }

    setSelectedRepoId(nextSelected);
    return nextSelected;
  }

  async function loadGitHubRepos() {
    const response = await api.listGitHubRepos();
    setGitHubRepos(response.items);
  }

  async function startGitHubLogin() {
    await withAction('login', async () => {
      const login = await api.getGitHubLoginUrl();
      window.location.href = login.redirectUrl;
    });
  }

  async function logout() {
    await withAction('logout', async () => {
      stopSyncPolling();
      await api.logout();
      setDropdownOpen(false);
      setMe(null);
      setConnectedRepos([]);
      setGitHubRepos([]);
      setSelectedRepoId(null);
      setItems([]);
      setPriorities([]);
      setDuplicates([]);
      setLabelRecommendations([]);
      setAnalysisSummary(null);
      setSyncJob(null);
      setDetailItemId(null);
      setNotice('로그아웃 완료');
    });
  }

  async function connectRepo(fullName: string) {
    const trimmed = fullName.trim();
    if (!trimmed) return;

    await withAction('connect-repo', async () => {
      const connected = await api.connectRepo(trimmed);
      const nextRepoId = await loadConnectedRepos(connected.id);
      if (nextRepoId) {
        await refreshRepositoryData(nextRepoId);
      }
      setConnectFullName('');
      setShowAddRepoForm(false);
      setNotice(`저장소 연결 완료: ${trimmed}`);
    });
  }

  async function disconnectRepo(repoId: number) {
    await withAction('disconnect-repo', async () => {
      if (selectedRepoId === repoId) {
        stopSyncPolling();
        setSyncJob(null);
      }
      await api.disconnectRepo(repoId);
      const nextRepoId = await loadConnectedRepos(selectedRepoId === repoId ? null : selectedRepoId);
      if (nextRepoId) {
        await refreshRepositoryData(nextRepoId);
      }
      setNotice('저장소 연결 해제 완료');
    });
  }

  async function syncSelectedRepo() {
    if (!selectedRepoId) return;
    await withAction('sync', async () => {
      stopSyncPolling();
      const job = await api.startSyncJob(selectedRepoId);
      setSyncJob(job);
      setNotice('sync job 시작됨. 진행률을 추적합니다.');
      syncPollingTimerRef.current = window.setTimeout(() => {
        void pollSyncJob(selectedRepoId, job.jobId);
      }, 700);
    });
  }

  async function analyzeSelectedRepo() {
    if (!selectedRepoId) return;
    await withAction('analyze', async () => {
      const analyzed = await api.analyzeRepo(selectedRepoId);
      setAnalysisSummary(analyzed);
      await refreshRepositoryData(selectedRepoId);
      setNotice(
        `analyze 완료: analyzedItems=${analyzed.analyzedItems}, duplicateGroups=${analyzed.duplicateGroups}`,
      );
    });
  }

  async function closeItem(itemId: number) {
    await withAction('close-item', async () => {
      await api.closeItem(itemId);
      if (selectedRepoId) {
        await refreshRepositoryData(selectedRepoId);
      }
      setNotice(`item close 완료: ${itemId}`);
      setDetailItemId(null);
    });
  }

  function createProject() {
    if (!selectedRepoId) {
      setError('먼저 Active Repo를 선택하세요.');
      return;
    }

    const name = projectNameInput.trim();
    const description = projectDescriptionInput.trim();
    if (!name) {
      setError('Project 이름을 입력하세요.');
      return;
    }

    const duplicated = repoProjects.some(
      (project) =>
        project.repoId === selectedRepoId &&
        project.name.toLowerCase() === name.toLowerCase(),
    );
    if (duplicated) {
      setError('같은 repository에 동일한 project 이름이 이미 있습니다.');
      return;
    }

    const project: RepoProject = {
      id: `project-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      repoId: selectedRepoId,
      name,
      description,
      createdAt: new Date().toISOString(),
    };

    setRepoProjects((prev) => [...prev, project]);
    setProjectNameInput('');
    setProjectDescriptionInput('');
    setActiveProjectId(project.id);
    setNotice(`Project 생성 완료: ${project.name}`);
  }

  function deleteProject(projectId: string) {
    const project = repoProjects.find((entry) => entry.id === projectId);
    setRepoProjects((prev) => prev.filter((entry) => entry.id !== projectId));
    if (activeProjectId === projectId) {
      setActiveProjectId('');
    }
    if (project) {
      setNotice(`Project 삭제 완료: ${project.name}`);
    }
  }

  const priorityByItemId = useMemo(() => {
    const map = new Map<number, { priority: ItemPriority; reason: string }>();
    priorities.forEach((entry) => {
      map.set(entry.itemId, {
        priority: toPriority(entry.priority),
        reason: entry.reason,
      });
    });
    return map;
  }, [priorities]);

  const recommendationByItemId = useMemo(() => {
    const map = new Map<number, LabelRecommendation[]>();
    labelRecommendations.forEach((entry) => {
      map.set(entry.itemId, entry.recommendations);
    });
    return map;
  }, [labelRecommendations]);

  const duplicateMetaByItemId = useMemo(() => {
    const map = new Map<number, DashboardItem['duplicateMeta']>();
    duplicates.forEach((group) => {
      group.items.forEach((entry) => {
        map.set(entry.itemId, {
          groupId: group.groupId,
          similarity: group.similarity,
          siblings: group.items.filter((sibling) => sibling.itemId !== entry.itemId),
        });
      });
    });
    return map;
  }, [duplicates]);

  const mergedItems = useMemo<DashboardItem[]>(() => {
    return items.map((item) => {
      const priority = priorityByItemId.get(item.id);
      return {
        ...item,
        priority: priority?.priority ?? 'UNASSIGNED',
        priorityReason: priority?.reason ?? '분석 결과가 아직 없습니다.',
        recommendedLabels: recommendationByItemId.get(item.id) ?? [],
        duplicateMeta: duplicateMetaByItemId.get(item.id),
      };
    });
  }, [items, priorityByItemId, recommendationByItemId, duplicateMetaByItemId]);

  const activeProjectScoreByItemId = useMemo(() => {
    const scores = new Map<number, number>();
    if (!activeProject) return scores;
    mergedItems.forEach((item) => {
      scores.set(item.id, projectMatchScore(item, activeProject));
    });
    return scores;
  }, [mergedItems, activeProject]);

  const projectScopedItems = useMemo(() => {
    if (!activeProject) return mergedItems;
    return mergedItems.filter((item) => (activeProjectScoreByItemId.get(item.id) ?? 0) >= 0.2);
  }, [mergedItems, activeProject, activeProjectScoreByItemId]);

  const issueItems = useMemo(
    () => projectScopedItems.filter((item) => item.type === 'ISSUE'),
    [projectScopedItems],
  );

  const prItems = useMemo(
    () => projectScopedItems.filter((item) => item.type === 'PULL_REQUEST'),
    [projectScopedItems],
  );

  const filteredIssues = useMemo(
    () =>
      buildListItems(issueItems, {
        search: issueSearch,
        chips: issueChips,
        reviewerOnly: issueReviewerOnly,
        sort: issueSort,
        labelFilter,
      }),
    [issueItems, issueSearch, issueChips, issueReviewerOnly, issueSort, labelFilter],
  );

  const filteredPrs = useMemo(
    () =>
      buildListItems(prItems, {
        search: prSearch,
        chips: prChips,
        reviewerOnly: prReviewerOnly,
        sort: prSort,
        labelFilter,
      }),
    [prItems, prSearch, prChips, prReviewerOnly, prSort, labelFilter],
  );

  const labelStats = useMemo(() => {
    const map = new Map<string, { label: string; observed: number; recommended: number }>();

    projectScopedItems.forEach((item) => {
      (item.labels ?? []).forEach((label) => {
        const key = label.toLowerCase();
        const prev = map.get(key) ?? { label, observed: 0, recommended: 0 };
        prev.observed += 1;
        map.set(key, prev);
      });

      item.recommendedLabels.forEach((rec) => {
        const key = rec.label.toLowerCase();
        const prev = map.get(key) ?? { label: rec.label, observed: 0, recommended: 0 };
        prev.recommended += 1;
        map.set(key, prev);
      });
    });

    return Array.from(map.values()).sort((left, right) => {
      const leftTotal = left.observed + left.recommended;
      const rightTotal = right.observed + right.recommended;
      if (rightTotal !== leftTotal) return rightTotal - leftTotal;
      return left.label.localeCompare(right.label);
    });
  }, [projectScopedItems]);

  const priorityCounts = useMemo(() => {
    const counts: Record<ItemPriority, number> = {
      HIGH: 0,
      MEDIUM: 0,
      LOW: 0,
      UNASSIGNED: 0,
    };
    projectScopedItems.forEach((item) => {
      counts[item.priority] += 1;
    });
    return counts;
  }, [projectScopedItems]);

  const topPriorityItems = useMemo(() => {
    return [...projectScopedItems]
      .sort((left, right) => {
        const rankDiff = PRIORITY_RANK[right.priority] - PRIORITY_RANK[left.priority];
        if (rankDiff !== 0) return rankDiff;
        return new Date(right.updatedAtOnGitHub).getTime() - new Date(left.updatedAtOnGitHub).getTime();
      })
      .slice(0, 5);
  }, [projectScopedItems]);

  const projectStats = useMemo(() => {
    const stats = new Map<string, { matchedCount: number; topItems: DashboardItem[] }>();

    selectedRepoProjects.forEach((project) => {
      const matched = mergedItems
        .map((item) => ({ item, score: projectMatchScore(item, project) }))
        .filter((entry) => entry.score >= 0.2)
        .sort((left, right) => right.score - left.score);

      stats.set(project.id, {
        matchedCount: matched.length,
        topItems: matched.slice(0, 3).map((entry) => entry.item),
      });
    });

    return stats;
  }, [selectedRepoProjects, mergedItems]);

  const detailItem = useMemo(
    () => mergedItems.find((item) => item.id === detailItemId) ?? null,
    [mergedItems, detailItemId],
  );

  const syncJobRunning = syncJob?.status === 'QUEUED' || syncJob?.status === 'RUNNING';
  const syncProgressUnknown = syncJobRunning && syncJob?.progressPercent === undefined;
  const syncProgressPercent =
    syncJob?.progressPercent ??
    (syncJob?.status === 'SUCCEEDED' ? 100 : syncJob?.status === 'FAILED' ? 0 : 35);

  function toggleChip(ctx: 'issue' | 'pr', key: 'high' | 'mid' | 'low' | 'reviewer') {
    if (key === 'reviewer') {
      if (ctx === 'issue') setIssueReviewerOnly((prev) => !prev);
      else setPrReviewerOnly((prev) => !prev);
      return;
    }

    if (ctx === 'issue') {
      setIssueChips((prev) => ({ ...prev, [key]: !prev[key] }));
      return;
    }

    setPrChips((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function applyProjectFilter(projectId: string) {
    setActiveProjectId(projectId);
    setCurrentPage('issues');
    setNotice('Project 필터를 적용했습니다.');
  }

  function applyLabelFilter(label: string) {
    setLabelFilter(label);
    setCurrentPage('issues');
  }

  function clearLabelFilter() {
    setLabelFilter(null);
  }

  function openDetail(itemId: number) {
    setDetailItemId(itemId);
  }

  const issueCountText = issueItems.length.toLocaleString();
  const prCountText = prItems.length.toLocaleString();

  function renderListItem(item: DashboardItem) {
    const bucket = toBucketPriority(item.priority);
    const rawLabels = item.labels ?? [];
    const sysLabels = rawLabels
      .map((label) => normalizeSysLabel(label))
      .filter((label): label is NonNullable<ReturnType<typeof normalizeSysLabel>> => Boolean(label));
    const customLabels = rawLabels.filter((label) => !normalizeSysLabel(label)).slice(0, 2);

    const authorName = selectedRepo?.owner || me?.login || 'unknown';
    const authorInit = initials(authorName);
    const authorColor = pickGradient(authorName);

    const convCount = item.recommendedLabels.length + (item.duplicateMeta?.siblings.length ?? 0);

    return (
      <div
        key={item.id}
        className={`issue-item ${item.duplicateMeta ? 'dup-group' : ''}`}
        onClick={() => openDetail(item.id)}
      >
        <div className="issue-left">
          <div className="issue-title-row">
            <span className={`priority-dot ${bucket}`} />
            <span className="issue-number">#{item.number}</span>
            <span className="issue-title">{item.title}</span>
            {customLabels.map((label) => (
              <span key={`${item.id}-${label}`} className="label-custom-inline">
                {label}
              </span>
            ))}
            {item.duplicateMeta && <span className="badge-dup-sm">⚠ Duplicate</span>}
          </div>
          <div className="issue-summary">
            {item.priorityReason.length > 180
              ? `${item.priorityReason.slice(0, 180)}...`
              : item.priorityReason}
          </div>
          <div className="issue-meta-row">
            <span>{formatRelativeTime(item.updatedAtOnGitHub)}</span>
            {sysLabels.map((label) => (
              <span key={`${item.id}-${label}`} className={`sys-label ${sysLabelClass(label)}`}>
                {label}
              </span>
            ))}
          </div>
        </div>
        <div className="issue-right">
          <div className="issue-author">
            <div className="author-avatar" style={{ background: authorColor }}>
              {authorInit}
            </div>
            <span>{authorName}</span>
          </div>
          <div className="conv-count">💬 {convCount}</div>
        </div>
      </div>
    );
  }

  function renderIssuesPage() {
    return (
      <div className="page active" id="page-issues">
        <div className="page-header">
          <div className="page-title">Issues</div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              className="btn-sm btn-sm-primary"
              disabled={!selectedRepo || syncJobRunning || Boolean(pendingAction)}
              onClick={() => void syncSelectedRepo()}
            >
              Sync
            </button>
            <button
              className="btn-sm btn-sm-switch"
              disabled={!selectedRepo || Boolean(pendingAction)}
              onClick={() => void analyzeSelectedRepo()}
            >
              Analyze
            </button>
            <button className="btn-add">+ New Issue</button>
          </div>
        </div>

        {labelFilter && (
          <div className="label-filter-notice">
            🏷 <strong>{labelFilter}</strong> 라벨로 필터링 중
            <button className="btn-clear-filter" onClick={clearLabelFilter}>
              ✕ 필터 해제
            </button>
          </div>
        )}

        <div className="filter-bar">
          <div className="search-wrap">
            <input
              className="search-box"
              type="text"
              placeholder="Search all issues…"
              value={issueSearch}
              onChange={(event) => setIssueSearch(event.target.value)}
            />
          </div>
          <div className="gh-filter-box">
            <select
              className="sort-select"
              value={issueSort}
              onChange={(event) => setIssueSort(event.target.value as ListSort)}
            >
              <option value="priority-desc">Sort: Priority ↓</option>
              <option value="priority-asc">Sort: Priority ↑</option>
              <option value="newest">Sort: Newest</option>
              <option value="oldest">Sort: Oldest</option>
              <option value="comments">Sort: Most comments</option>
            </select>
            <button
              className={`gh-dropdown-btn ${issueChips.high ? 'btn-active' : ''}`}
              onClick={() => toggleChip('issue', 'high')}
            >
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#cf222e', display: 'inline-block' }} />
              High <span className="gh-caret">▾</span>
            </button>
            <button
              className={`gh-dropdown-btn ${issueChips.mid ? 'btn-active' : ''}`}
              onClick={() => toggleChip('issue', 'mid')}
            >
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#d4a72c', display: 'inline-block' }} />
              Mid <span className="gh-caret">▾</span>
            </button>
            <button
              className={`gh-dropdown-btn ${issueChips.low ? 'btn-active' : ''}`}
              onClick={() => toggleChip('issue', 'low')}
            >
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#adb5bd', display: 'inline-block' }} />
              Low <span className="gh-caret">▾</span>
            </button>
            <button
              className={`gh-dropdown-btn ${issueReviewerOnly ? 'btn-active' : ''}`}
              onClick={() => toggleChip('issue', 'reviewer')}
            >
              Reviewer <span className="gh-caret">▾</span>
            </button>
          </div>
        </div>

        <div className="issue-list">
          {filteredIssues.map((item) => renderListItem(item))}
          {filteredIssues.length === 0 && (
            <div style={{ padding: '40px 28px', color: 'var(--text3)', fontSize: 13 }}>
              조건에 맞는 항목이 없습니다.
            </div>
          )}
        </div>
      </div>
    );
  }

  function renderPullRequestsPage() {
    return (
      <div className="page active" id="page-pullrequests">
        <div className="page-header">
          <div className="page-title">Pull Requests</div>
          <div style={{ marginLeft: 'auto' }}>
            <button className="btn-add">+ New PR</button>
          </div>
        </div>

        {labelFilter && (
          <div className="label-filter-notice">
            🏷 <strong>{labelFilter}</strong> 라벨로 필터링 중
            <button className="btn-clear-filter" onClick={clearLabelFilter}>
              ✕ 필터 해제
            </button>
          </div>
        )}

        <div className="filter-bar">
          <div className="search-wrap">
            <input
              className="search-box"
              type="text"
              placeholder="Search all pull requests…"
              value={prSearch}
              onChange={(event) => setPrSearch(event.target.value)}
            />
          </div>
          <div className="gh-filter-box">
            <select
              className="sort-select"
              value={prSort}
              onChange={(event) => setPrSort(event.target.value as ListSort)}
            >
              <option value="priority-desc">Sort: Priority ↓</option>
              <option value="priority-asc">Sort: Priority ↑</option>
              <option value="newest">Sort: Newest</option>
              <option value="oldest">Sort: Oldest</option>
              <option value="comments">Sort: Most comments</option>
            </select>
            <button
              className={`gh-dropdown-btn ${prChips.high ? 'btn-active' : ''}`}
              onClick={() => toggleChip('pr', 'high')}
            >
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#cf222e', display: 'inline-block' }} />
              High <span className="gh-caret">▾</span>
            </button>
            <button
              className={`gh-dropdown-btn ${prChips.mid ? 'btn-active' : ''}`}
              onClick={() => toggleChip('pr', 'mid')}
            >
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#d4a72c', display: 'inline-block' }} />
              Mid <span className="gh-caret">▾</span>
            </button>
            <button
              className={`gh-dropdown-btn ${prChips.low ? 'btn-active' : ''}`}
              onClick={() => toggleChip('pr', 'low')}
            >
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#adb5bd', display: 'inline-block' }} />
              Low <span className="gh-caret">▾</span>
            </button>
            <button
              className={`gh-dropdown-btn ${prReviewerOnly ? 'btn-active' : ''}`}
              onClick={() => toggleChip('pr', 'reviewer')}
            >
              Reviewer <span className="gh-caret">▾</span>
            </button>
          </div>
        </div>

        <div className="issue-list">
          {filteredPrs.map((item) => renderListItem(item))}
          {filteredPrs.length === 0 && (
            <div style={{ padding: '40px 28px', color: 'var(--text3)', fontSize: 13 }}>
              조건에 맞는 항목이 없습니다.
            </div>
          )}
        </div>
      </div>
    );
  }

  function renderProjectsPage() {
    return (
      <div className="page active" id="page-projects">
        <div className="page-header">
          <div className="page-title">Projects</div>
          <button className="btn-add" style={{ marginLeft: 'auto' }} onClick={createProject}>
            + New Project
          </button>
        </div>

        <div className="projects-grid">
          {selectedRepo ? (
            <>
              <div className="project-card" style={{ gridColumn: '1 / -1' }}>
                <div className="project-card-desc" style={{ marginBottom: 10 }}>
                  {selectedRepo.fullName} 내부 프로젝트를 정의해 필터로 사용할 수 있습니다.
                </div>
                <div className="project-form-grid">
                  <label className="stack">
                    Project Name
                    <input
                      className="form-input"
                      value={projectNameInput}
                      onChange={(event) => setProjectNameInput(event.target.value)}
                      placeholder="예: Swift on Android"
                    />
                  </label>
                  <label className="stack">
                    Project Description
                    <input
                      className="form-input"
                      value={projectDescriptionInput}
                      onChange={(event) => setProjectDescriptionInput(event.target.value)}
                      placeholder="예: Android ABI/빌드 관련"
                    />
                  </label>
                </div>
              </div>

              {selectedRepoProjects.map((project) => {
                const stat = projectStats.get(project.id);
                return (
                  <div key={project.id} className="project-card" onClick={() => applyProjectFilter(project.id)}>
                    <div className="project-card-header">
                      <div className="project-card-title">{project.name}</div>
                      <div className="project-icon" style={{ background: '#eef4ff' }}>
                        📦
                      </div>
                    </div>
                    <div className="project-card-desc">{project.description || '설명 없음'}</div>
                    <div className="project-stats">
                      <span>⬡ {stat?.matchedCount ?? 0} matched</span>
                      <span>⤴ {stat?.topItems.length ?? 0} top items</span>
                    </div>
                    <div style={{ marginTop: 10, display: 'flex', gap: 6 }}>
                      <button className="btn-sm btn-sm-switch" onClick={() => applyProjectFilter(project.id)}>
                        적용
                      </button>
                      <button className="btn-sm btn-sm-danger" onClick={() => deleteProject(project.id)}>
                        삭제
                      </button>
                    </div>
                  </div>
                );
              })}

              {selectedRepoProjects.length === 0 && (
                <div className="project-card">
                  <div className="project-card-title">등록된 Project가 없습니다</div>
                  <div className="project-card-desc">먼저 프로젝트를 추가해보세요.</div>
                </div>
              )}
            </>
          ) : (
            <div className="project-card">
              <div className="project-card-title">Active Repository를 먼저 선택하세요</div>
              <div className="project-card-desc">Repository 관리 페이지에서 저장소를 선택할 수 있습니다.</div>
            </div>
          )}
        </div>
      </div>
    );
  }

  function renderLabelsPage() {
    return (
      <div className="page active" id="page-labels">
        <div className="page-header">
          <div className="page-title">Labels</div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 13, color: 'var(--text2)' }}>Auto Labeling</span>
            <div className="toggle-switch on">
              <div className="toggle-knob" />
            </div>
            <button className="btn-add">+ New Label</button>
          </div>
        </div>

        <div className="labels-container">
          {labelStats.map((stat) => {
            const sys = normalizeSysLabel(stat.label) ?? 'Docs';
            const swatch =
              sys === 'Bugfix'
                ? '#cf222e'
                : sys === 'Feature'
                  ? '#0550ae'
                  : sys === 'Release'
                    ? '#1a7f37'
                    : sys === 'Version Up'
                      ? '#8250df'
                      : '#9a6700';

            return (
              <div key={stat.label} className="label-row">
                <div className="label-swatch" style={{ background: swatch }} />
                <button className="label-name-btn" onClick={() => applyLabelFilter(stat.label)}>
                  {stat.label}
                </button>
                <div className="label-desc">
                  observed {stat.observed} · recommended {stat.recommended}
                </div>
                <div className="label-actions">
                  <button className="btn-sm btn-sm-danger">편집</button>
                </div>
              </div>
            );
          })}

          {labelStats.length === 0 && (
            <div className="label-row">
              <div className="label-desc">label 데이터가 없습니다. sync/analyze를 먼저 실행하세요.</div>
            </div>
          )}
        </div>
      </div>
    );
  }

  function renderSummaryPage() {
    const maxPriority = Math.max(...Object.values(priorityCounts), 1);
    const topLabels = labelStats.slice(0, 5);
    const maxLabel = Math.max(...topLabels.map((entry) => entry.observed + entry.recommended), 1);

    const highItems = [...projectScopedItems]
      .filter((item) => item.priority === 'HIGH')
      .slice(0, 5);

    const byLabel = (keyword: string) =>
      projectScopedItems
        .filter((item) =>
          (item.labels ?? []).some((label) => label.toLowerCase().includes(keyword.toLowerCase())),
        )
        .slice(0, 5);

    return (
      <div className="page active" id="page-summary">
        <div className="page-header">
          <div className="page-title">Summary</div>
          <div style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text2)' }}>
            {selectedRepo?.fullName ?? 'Repository 미선택'} · 실시간 동기화됨
          </div>
        </div>

        <div className="summary-grid">
          <div className="summary-card">
            <div className="summary-card-title">전체 Issues</div>
            <div className="stat-number">{issueItems.length}</div>
            <div className="stat-label">Open Issues</div>
          </div>

          <div className="summary-card">
            <div className="summary-card-title">전체 Pull Requests</div>
            <div className="stat-number">{prItems.length}</div>
            <div className="stat-label">Open Pull Requests</div>
          </div>

          <div className="summary-card" style={{ gridColumn: 'span 2' }}>
            <div className="summary-card-title">Priority 분포</div>
            <div className="bar-chart">
              {(['HIGH', 'MEDIUM', 'LOW'] as const).map((priority) => {
                const count = priorityCounts[priority];
                const width = `${(count / maxPriority) * 100}%`;
                const color =
                  priority === 'HIGH' ? '#cf222e' : priority === 'MEDIUM' ? '#d4a72c' : '#c4c9d0';
                return (
                  <div key={priority} className="bar-row">
                    <span className="bar-label">
                      {priority === 'HIGH' ? '🔴 High' : priority === 'MEDIUM' ? '🟡 Mid' : '⚪ Low'}
                    </span>
                    <div className="bar-track">
                      <div className="bar-fill" style={{ width, background: color }} />
                    </div>
                    <span className="bar-val">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="summary-card" style={{ gridColumn: 'span 2' }}>
            <div className="summary-card-title">Label 분포</div>
            <div className="bar-chart">
              {topLabels.map((entry) => {
                const total = entry.observed + entry.recommended;
                const width = `${(total / maxLabel) * 100}%`;
                return (
                  <div key={entry.label} className="bar-row">
                    <span className="bar-label">{entry.label}</span>
                    <div className="bar-track">
                      <div className="bar-fill" style={{ width, background: '#0969da' }} />
                    </div>
                    <span className="bar-val">{total}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="summary-card">
            <div className="summary-card-title">🔴 High Priority Top 5</div>
            <div className="top-list">
              {highItems.map((item, index) => (
                <div key={item.id} className="top-item">
                  <span className="top-rank">{index + 1}</span>
                  <span className="top-text">#{item.number} {item.title}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="summary-card">
            <div className="summary-card-title">🐛 Bugfix 상위 5개</div>
            <div className="top-list">
              {byLabel('bug').map((item, index) => (
                <div key={item.id} className="top-item">
                  <span className="top-rank">{index + 1}</span>
                  <span className="top-text">#{item.number} {item.title}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  function renderProfilePage() {
    const avatarLabel = initials(me?.login ?? 'U');

    return (
      <div className="page active" id="page-profile">
        <div className="page-header">
          <div className="page-title">내 프로필</div>
          <button className="nav-btn" style={{ marginLeft: 'auto' }}>
            편집
          </button>
        </div>

        <div className="profile-container">
          <div className="profile-header-card">
            <div className="profile-avatar">{avatarLabel}</div>
            <div>
              <div className="profile-name">{me?.login ?? '-'}</div>
              <div className="profile-handle">@{me?.login ?? '-'}</div>
              <div className="profile-stats">
                <span>
                  <strong>{connectedRepos.length}</strong> Repos
                </span>
                <span>
                  <strong>{projectScopedItems.length}</strong> Items
                </span>
                <span>
                  <strong>{priorities.length}</strong> Reviews
                </span>
              </div>
            </div>
          </div>

          <div className="profile-fields">
            <div className="pf-row">
              <span className="pf-key">이메일</span>
              <span className="pf-val">{me?.email || '-'}</span>
            </div>
            <div className="pf-row">
              <span className="pf-key">GitHub</span>
              <span className="pf-val" style={{ color: 'var(--accent)', fontFamily: 'var(--mono)' }}>
                github.com/{me?.login ?? '-'}
              </span>
            </div>
            <div className="pf-row">
              <span className="pf-key">소속</span>
              <span className="pf-val">TidyX Prototype</span>
            </div>
            <div className="pf-row">
              <span className="pf-key">연결 계정</span>
              <span className="pf-val" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="sys-label sys-release" style={{ fontSize: 12, padding: '2px 10px' }}>
                  GitHub ✓
                </span>
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-sm btn-sm-danger" style={{ padding: '6px 14px', fontSize: 13 }} onClick={() => void logout()}>
              로그아웃
            </button>
            <button className="btn-sm btn-sm-switch" style={{ padding: '6px 14px', fontSize: 13 }} onClick={() => setCurrentPage('repository')}>
              Repository 관리
            </button>
          </div>
        </div>
      </div>
    );
  }

  function renderRepositoryPage() {
    return (
      <div className="page active" id="page-repository">
        <div className="page-header">
          <div className="page-title">Repository 관리</div>
          <button className="btn-add" style={{ marginLeft: 'auto' }} onClick={() => setShowAddRepoForm((prev) => !prev)}>
            + Repository 추가
          </button>
        </div>

        <div className="repo-container">
          <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 14 }}>
            연결된 GitHub Repository를 추가·삭제하고 현재 작업 중인 Repository를 전환할 수 있습니다.
          </div>

          {connectedRepos.map((repo) => (
            <div key={repo.id} className={`repo-card ${selectedRepoId === repo.id ? 'active-repo' : ''}`}>
              {selectedRepoId === repo.id && <div className="repo-active-dot" />}
              <div className="repo-icon">📁</div>
              <div className="repo-info">
                <div className="repo-name">{repo.fullName}</div>
                <div className="repo-desc">
                  {selectedRepoId === repo.id ? '현재 활성 Repository' : `default branch: ${repo.defaultBranch ?? '-'}`}
                </div>
              </div>
              <div className="repo-actions">
                {selectedRepoId === repo.id ? (
                  <button className="btn-sm btn-sm-switch">현재 사용 중</button>
                ) : (
                  <button className="btn-sm btn-sm-primary" onClick={() => setSelectedRepoId(repo.id)}>
                    전환
                  </button>
                )}
                <button className="btn-sm btn-sm-danger" onClick={() => void disconnectRepo(repo.id)}>
                  삭제
                </button>
              </div>
            </div>
          ))}

          {connectedRepos.length === 0 && (
            <div className="repo-card">
              <div className="repo-info">
                <div className="repo-desc">연결된 Repository가 없습니다.</div>
              </div>
            </div>
          )}

          {showAddRepoForm && (
            <div className="add-repo-form" id="add-repo-form">
              <div className="add-repo-title">새 Repository 추가</div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <input
                  className="form-input"
                  type="text"
                  placeholder="예: owner/repository-name"
                  value={connectFullName}
                  onChange={(event) => setConnectFullName(event.target.value)}
                  style={{ flex: 1 }}
                />
              </div>
              <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 10 }}>
                GitHub의 공개 또는 접근 권한이 있는 비공개 Repository를 입력하세요.
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn-sm btn-sm-primary" style={{ padding: '6px 16px', fontSize: 13 }} onClick={() => void connectRepo(connectFullName)}>
                  추가
                </button>
                <button className="btn-sm btn-sm-danger" style={{ padding: '6px 16px', fontSize: 13 }} onClick={() => setShowAddRepoForm(false)}>
                  취소
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  function renderCurrentPage() {
    if (currentPage === 'issues') return renderIssuesPage();
    if (currentPage === 'pullrequests') return renderPullRequestsPage();
    if (currentPage === 'projects') return renderProjectsPage();
    if (currentPage === 'labels') return renderLabelsPage();
    if (currentPage === 'summary') return renderSummaryPage();
    if (currentPage === 'profile') return renderProfilePage();
    return renderRepositoryPage();
  }

  if (!me) {
    return (
      <div id="screen-login" className="screen active">
        <div className="login-grid" />
        <div className="login-card">
          <div className="login-logo">
            <svg width="42" height="42" viewBox="0 0 42 42" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="lg-login" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#0969da" />
                  <stop offset="100%" stopColor="#8250df" />
                </linearGradient>
              </defs>
              <path d="M21 2 L37 11 L37 31 L21 40 L5 31 L5 11 Z" fill="url(#lg-login)" opacity="0.92" />
              <path d="M13 16 L29 16" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M13 21 L25 21" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M13 26 L27 26" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
            <div className="login-logo-wordmark">
              Tidy<span>X</span>
            </div>
          </div>
          <div className="login-tagline">GitHub Issues &amp; Pull Requests, 정돈된 시각으로.</div>

          <div className="form-group">
            <label className="form-label">이메일 / GitHub 사용자명</label>
            <input className="form-input" type="text" placeholder="you@example.com" />
          </div>
          <div className="form-group">
            <label className="form-label">비밀번호</label>
            <input className="form-input" type="password" placeholder="••••••••" />
          </div>

          <button className="btn-primary" onClick={() => void startGitHubLogin()}>
            로그인
          </button>

          <div className="login-divider">또는</div>

          <button className="btn-github" onClick={() => void startGitHubLogin()}>
            GitHub으로 계속하기
          </button>

          {error && <p className="error" style={{ marginTop: 12 }}>{error}</p>}
        </div>
      </div>
    );
  }

  if (detailItem) {
    const bucket = toBucketPriority(detailItem.priority);
    const statusClass = detailItem.state === 'OPEN' ? 'status-open' : 'status-closed';
    const statusText = detailItem.state === 'OPEN' ? 'OPEN' : 'CLOSED';

    const observedLabels = detailItem.labels ?? [];
    const recommendedLabels = detailItem.recommendedLabels.map((label) => label.label);
    const allObserved = observedLabels.length > 0 ? observedLabels : ['needs-triage'];

    const diffLines = [
      { type: 'neutral', text: '--- prototype/diff/unavailable' },
      { type: 'neutral', text: '+++ prototype/diff/unavailable' },
      { type: 'neutral', text: '// 이 항목은 현재 API 범위에서 실제 diff를 제공하지 않습니다.' },
    ];

    return (
      <div id="screen-detail" className="screen active">
        <nav className="detail-topnav">
          <a className="nav-logo" onClick={() => setDetailItemId(null)} style={{ textDecoration: 'none' }}>
            <svg width="26" height="26" viewBox="0 0 42 42" fill="none">
              <defs>
                <linearGradient id="lg-det" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#0969da" />
                  <stop offset="100%" stopColor="#8250df" />
                </linearGradient>
              </defs>
              <path d="M21 2 L37 11 L37 31 L21 40 L5 31 L5 11 Z" fill="url(#lg-det)" opacity="0.92" />
              <path d="M13 16 L29 16M13 21 L25 21M13 26 L27 26" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
            <span className="nav-logo-wordmark">
              Tidy<span>X</span>
            </span>
          </a>
          <div className="nav-divider" />
          <button className="detail-back" onClick={() => setDetailItemId(null)}>
            ← 목록으로 돌아가기
          </button>
        </nav>

        <div className="detail-body">
          <div className="detail-main">
            <div className="detail-title-row">
              <span className={`priority-dot ${bucket}`} style={{ marginTop: 6 }} />
              <div className="detail-title">{detailItem.title}</div>
            </div>

            <div className="detail-meta">
              <span className={`status-badge ${statusClass}`}>● {statusText}</span>
              <span>#{detailItem.number}</span>
              <span>by <strong>{selectedRepo?.owner ?? me.login}</strong></span>
              <span>{formatDateLabel(detailItem.updatedAtOnGitHub)}</span>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {allObserved.map((label) => (
                  <span key={`obs-${label}`} className={`label-tag ${labelTagClass(normalizeSysLabel(label) ?? label)}`}>
                    {label}
                  </span>
                ))}
              </div>
            </div>

            {detailItem.duplicateMeta && (
              <div className="dup-banner">
                <div className="dup-banner-text">
                  ⚠ 이 항목은 duplicate group #{detailItem.duplicateMeta.groupId}로 분류되었습니다.
                </div>
                {detailItem.state === 'OPEN' && (
                  <button className="btn-close-iss" onClick={() => void closeItem(detailItem.id)}>
                    이 항목 Close
                  </button>
                )}
              </div>
            )}

            <div className="detail-body-text">
              {detailItem.priorityReason}
              {'\n\n'}
              본문 전문/코드 diff/대화 수정 기능은 현재 프로토타입 API 범위에서 제한적으로 제공됩니다.
            </div>

            <div className="code-diff">
              <div className="diff-header">📄 Code Diff</div>
              {diffLines.map((line) => (
                <div key={line.text} className={`diff-line ${line.type === 'add' ? 'diff-add' : line.type === 'del' ? 'diff-del' : 'diff-neutral'}`}>
                  {line.text}
                </div>
              ))}
            </div>

            <div>
              <div className="conv-title">Conversations</div>
              <div className="conv-item">
                <div className="conv-avatar" style={{ background: pickGradient(me.login) }}>
                  {initials(me.login)}
                </div>
                <div className="conv-body">
                  <div className="conv-header">
                    <span className="conv-author">{me.login}</span>
                    <span>방금</span>
                  </div>
                  <div className="conv-content">현재 프로토타입에서는 conversation 작성 UI만 제공됩니다.</div>
                </div>
              </div>
              <div className="conv-input-area">
                <div className="conv-avatar" style={{ background: pickGradient(me.login) }}>
                  {initials(me.login)}
                </div>
                <div style={{ flex: 1 }}>
                  <textarea className="conv-textarea" placeholder="댓글을 입력하세요…" />
                  <button className="btn-sm btn-sm-primary" style={{ marginTop: 6, padding: '6px 16px', fontSize: 13 }}>
                    Comment
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="detail-sidebar">
            <div className="ds-section">
              <div className="ds-title">Labels</div>
              <div className="ds-label-wrap">
                {allObserved.map((label) => (
                  <span key={`sidebar-obs-${label}`} className={`label-tag ${labelTagClass(normalizeSysLabel(label) ?? label)}`}>
                    {label}
                  </span>
                ))}
              </div>

              <div className="ds-title" style={{ marginTop: 14 }}>AI 추천 Labels</div>
              <div className="ds-label-wrap">
                {recommendedLabels.length > 0 ? (
                  recommendedLabels.map((label) => (
                    <span key={`sidebar-rec-${label}`} className={`label-tag ${labelTagClass(normalizeSysLabel(label) ?? label)}`}>
                      {label}
                    </span>
                  ))
                ) : (
                  <span className="label-tag label-custom">추천 라벨 없음</span>
                )}
              </div>
              <button className="btn-label-apply">추천 Label 적용</button>
            </div>

            <div className="ds-section">
              <div className="ds-title">Project</div>
              <div style={{ fontSize: 13, color: 'var(--text2)' }}>{activeProject?.name ?? '미지정'}</div>
            </div>

            <div className="ds-section">
              <div className="ds-title">Priority</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                <span className={`priority-dot ${bucket}`} style={{ width: 9, height: 9 }} />
                <span>
                  {detailItem.priority} — {detailItem.priorityReason.slice(0, 24)}
                  {detailItem.priorityReason.length > 24 ? '...' : ''}
                </span>
              </div>
            </div>

            <div className="ds-section" style={{ paddingTop: 14, borderTop: '1px solid var(--border)' }}>
              <a className="btn-github-link" href={detailItem.url} target="_blank" rel="noreferrer">
                GitHub에서 보기 ↗
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="screen-console" className="screen active">
      <nav className="topnav">
        <a className="nav-logo" onClick={() => setCurrentPage('issues')}>
          <svg width="26" height="26" viewBox="0 0 42 42" fill="none">
            <defs>
              <linearGradient id="lg-nav" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#0969da" />
                <stop offset="100%" stopColor="#8250df" />
              </linearGradient>
            </defs>
            <path d="M21 2 L37 11 L37 31 L21 40 L5 31 L5 11 Z" fill="url(#lg-nav)" opacity="0.92" />
            <path d="M13 16 L29 16M13 21 L25 21M13 26 L27 26" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
          <span className="nav-logo-wordmark">
            Tidy<span>X</span>
          </span>
        </a>

        <div className="nav-divider" />

        <button className="nav-repo-selector" onClick={() => setCurrentPage('repository')}>
          {selectedRepo?.fullName ?? 'Repository 선택'} ▾
        </button>

        <div className="nav-tabs">
          <button className={`nav-tab ${currentPage === 'issues' ? 'active' : ''}`} onClick={() => setCurrentPage('issues')}>
            Issues <span className="tab-count">{issueCountText}</span>
          </button>
          <button className={`nav-tab ${currentPage === 'pullrequests' ? 'active' : ''}`} onClick={() => setCurrentPage('pullrequests')}>
            Pull Requests <span className="tab-count">{prCountText}</span>
          </button>
          <button className={`nav-tab ${currentPage === 'projects' ? 'active' : ''}`} onClick={() => setCurrentPage('projects')}>
            Projects
          </button>
          <button className={`nav-tab ${currentPage === 'labels' ? 'active' : ''}`} onClick={() => setCurrentPage('labels')}>
            Labels
          </button>
          <button className={`nav-tab ${currentPage === 'summary' ? 'active' : ''}`} onClick={() => setCurrentPage('summary')}>
            Summary
          </button>
        </div>

        <div className="nav-right">
          <div className="nav-btn">API: {health}</div>
          <div className="nav-avatar" id="nav-avatar" onClick={() => setDropdownOpen((prev) => !prev)}>
            {initials(me.login)}
          </div>

          <div className={`dropdown ${dropdownOpen ? 'open' : ''}`} id="account-dropdown">
            <div className="dropdown-item" onClick={() => { setCurrentPage('profile'); setDropdownOpen(false); }}>
              <span>👤</span>내 프로필
            </div>
            <div className="dropdown-item" onClick={() => { setCurrentPage('repository'); setDropdownOpen(false); }}>
              <span>📁</span>Repository 관리
            </div>
            <div className="dropdown-divider" />
            <div className="dropdown-item" onClick={() => { setCurrentPage('profile'); setDropdownOpen(false); }}>
              <span>🔄</span>계정 전환
            </div>
            <div className="dropdown-item" onClick={() => void logout()}>
              <span>🚪</span>로그아웃
            </div>
          </div>
        </div>
      </nav>

      <div className="content">
        {notice && <p className="notice" style={{ margin: '14px 24px 0' }}>{notice}</p>}
        {error && <p className="error" style={{ margin: '14px 24px 0' }}>{error}</p>}
        {pendingAction && (
          <p className="muted" style={{ margin: '10px 24px 0', fontSize: 12 }}>
            진행 중: {pendingAction}
          </p>
        )}

        {renderCurrentPage()}

        {syncJob && (
          <div style={{ margin: '0 24px 24px' }}>
            <div className="sync-progress-wrap">
              <p className="muted mini-text">
                job #{syncJob.jobId} · {syncJob.status}
                {syncJob.totalPages
                  ? ` · page ${syncJob.processedPages}/${syncJob.totalPages}`
                  : ''}
              </p>
              <div className="sync-progress-track">
                <div
                  className={`sync-progress-fill ${syncJobRunning ? 'running' : ''}`}
                  style={{ width: `${Math.max(4, Math.min(100, syncProgressPercent))}%` }}
                />
              </div>
              <p className="muted mini-text">
                {syncProgressUnknown ? 'estimating…' : `${syncProgressPercent}%`} · fetched=
                {syncJob.totalFetched} · open={syncJob.openCount} · closed={syncJob.closedCount}
              </p>
              {syncJob.errorMessage && <p className="error sync-error">{syncJob.errorMessage}</p>}
              {analysisSummary && (
                <p className="muted mini-text">
                  analyzedItems={analysisSummary.analyzedItems}, duplicateGroups={analysisSummary.duplicateGroups}, llmUsed={String(analysisSummary.llmUsed)}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function App() {
  return (
    <Routes>
      <Route path="/console" element={<ConsolePage />} />
      <Route path="*" element={<Navigate to="/console" replace />} />
    </Routes>
  );
}
