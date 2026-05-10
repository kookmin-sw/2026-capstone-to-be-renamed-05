const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';

export class ApiError extends Error {
  statusCode: number;
  errorCode?: string;
  details?: unknown;

  constructor(message: string, statusCode: number, errorCode?: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
  }
}

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown;
};

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers = new Headers(options.headers ?? {});
  const hasBody = options.body !== undefined && options.body !== null;

  if (hasBody && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    cache: options.cache ?? 'no-store',
    headers,
    credentials: 'include',
    body: hasBody ? JSON.stringify(options.body) : undefined,
  });

  const raw = await response.text();
  const payload = raw ? tryParseJson(raw) : null;

  if (!response.ok) {
    const message =
      (payload && typeof payload === 'object' && 'message' in payload && payload.message) ||
      response.statusText ||
      'Request failed';
    const statusCode =
      (payload && typeof payload === 'object' && 'statusCode' in payload && payload.statusCode) ||
      response.status;
    const errorCode =
      payload && typeof payload === 'object' && 'errorCode' in payload
        ? String(payload.errorCode)
        : undefined;
    const details =
      payload && typeof payload === 'object' && 'details' in payload ? payload.details : payload;

    throw new ApiError(String(message), Number(statusCode), errorCode, details);
  }

  if (response.status === 204 || !raw) {
    return undefined as T;
  }

  return (payload as T) ?? (raw as T);
}

function tryParseJson(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

export type AuthMe = {
  userId: number;
  login: string;
  email?: string;
  avatarUrl?: string;
};

export type GitHubLoginResponse = {
  state: string;
  redirectUrl: string;
};

export type GitHubRepo = {
  id: number;
  fullName: string;
  owner: string;
  name: string;
  isPrivate: boolean;
  defaultBranch: string;
};

export type GitHubRepoListResponse = {
  items: GitHubRepo[];
  total: number;
};

export type ConnectedRepo = {
  id: number;
  fullName: string;
  owner: string;
  name: string;
  isPrivate: boolean;
  defaultBranch?: string;
  lastSyncedAt?: string;
};

export type ConnectedRepoListResponse = {
  items: ConnectedRepo[];
  total: number;
};

export type SyncRepositoryResponse = {
  repositoryId: number;
  totalFetched: number;
  openCount: number;
  closedCount: number;
  syncedAt: string;
};

export type SyncJobStatus = 'QUEUED' | 'RUNNING' | 'SUCCEEDED' | 'FAILED';

export type SyncJobResponse = {
  jobId: number;
  repositoryId: number;
  status: SyncJobStatus;
  progressPercent?: number;
  totalPages?: number;
  processedPages: number;
  totalFetched: number;
  openCount: number;
  closedCount: number;
  errorMessage?: string;
  startedAt?: string;
  finishedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type RepositoryItem = {
  id: number;
  number: number;
  type: 'ISSUE' | 'PULL_REQUEST';
  state: 'OPEN' | 'CLOSED';
  title: string;
  url: string;
  labels?: string[];
  updatedAtOnGitHub: string;
};

export type RepositoryItemsResponse = {
  items: RepositoryItem[];
  total: number;
  limit?: number;
  offset?: number;
};

export type CloseItemResponse = {
  itemId: number;
  state: 'CLOSED';
  closedAt: string;
};

export type AnalyzeRepositoryResponse = {
  repositoryId: number;
  analyzedItems: number;
  duplicateGroups: number;
  llmUsed: boolean;
  analyzedAt: string;
};

export type DuplicateGroupItem = {
  itemId: number;
  number: number;
  type: string;
  title: string;
  url: string;
};

export type DuplicateGroup = {
  groupId: number;
  similarity: number;
  items: DuplicateGroupItem[];
};

export type DuplicateGroupsResponse = {
  groups: DuplicateGroup[];
  totalGroups: number;
};

export type PriorityItem = {
  itemId: number;
  number: number;
  type: string;
  priority: string;
  reason: string;
  title: string;
};

export type PrioritiesResponse = {
  items: PriorityItem[];
  total: number;
};

export type LabelRecommendation = {
  label: string;
  reason: string;
  score: number;
};

export type LabelRecommendationItem = {
  itemId: number;
  title: string;
  recommendations: LabelRecommendation[];
};

export type LabelRecommendationsResponse = {
  items: LabelRecommendationItem[];
  total: number;
};

export const api = {
  getHealth: () =>
    request<{ status: string; service: string; timestamp: string }>('/health', {
      method: 'GET',
    }),
  getGitHubLoginUrl: () => request<GitHubLoginResponse>('/auth/github/login', { method: 'GET' }),
  getMe: () => request<AuthMe>('/auth/me', { method: 'GET' }),
  logout: () => request<void>('/auth/logout', { method: 'POST' }),
  listGitHubRepos: () => request<GitHubRepoListResponse>('/github/repos', { method: 'GET' }),
  listConnectedRepos: () => request<ConnectedRepoListResponse>('/repos', { method: 'GET' }),
  connectRepo: (fullName: string) =>
    request<ConnectedRepo>('/repos', {
      method: 'POST',
      body: { fullName },
    }),
  disconnectRepo: (id: number) =>
    request<void>(`/repos/${id}`, {
      method: 'DELETE',
    }),
  syncRepo: (id: number) =>
    request<SyncRepositoryResponse>(`/repos/${id}/sync`, {
      method: 'POST',
    }),
  startSyncJob: (id: number) =>
    request<SyncJobResponse>(`/repos/${id}/sync-jobs`, {
      method: 'POST',
    }),
  getLatestSyncJob: (id: number) =>
    request<SyncJobResponse>(`/repos/${id}/sync-jobs/latest`, {
      method: 'GET',
    }),
  getSyncJob: (id: number, jobId: number) =>
    request<SyncJobResponse>(`/repos/${id}/sync-jobs/${jobId}`, {
      method: 'GET',
    }),
  listRepoItems: (
    id: number,
    filters: {
      type?: 'ISSUE' | 'PULL_REQUEST';
      state?: 'OPEN' | 'CLOSED';
      limit?: number;
      offset?: number;
    },
  ) => {
    const params = new URLSearchParams();
    if (filters.type) params.set('type', filters.type);
    if (filters.state) params.set('state', filters.state);
    if (typeof filters.limit === 'number') params.set('limit', String(filters.limit));
    if (typeof filters.offset === 'number') params.set('offset', String(filters.offset));
    const query = params.toString();
    return request<RepositoryItemsResponse>(
      `/repos/${id}/items${query ? `?${query}` : ''}`,
      {
        method: 'GET',
      },
    );
  },
  closeItem: (id: number) =>
    request<CloseItemResponse>(`/items/${id}/close`, {
      method: 'POST',
    }),
  analyzeRepo: (id: number) =>
    request<AnalyzeRepositoryResponse>(`/repos/${id}/analyze`, {
      method: 'POST',
    }),
  getDuplicates: (id: number) =>
    request<DuplicateGroupsResponse>(`/repos/${id}/duplicates`, { method: 'GET' }),
  getPriorities: (id: number) =>
    request<PrioritiesResponse>(`/repos/${id}/priorities`, { method: 'GET' }),
  getLabelRecommendations: (id: number) =>
    request<LabelRecommendationsResponse>(`/repos/${id}/label-recommendations`, {
      method: 'GET',
    }),
};
