const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') ?? 'http://localhost:4000';

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export type LoginResponse = {
  accessToken: string;
  user: {
    id: string;
    email: string;
    displayName: string;
    role: string;
    agency: string | null;
    permissions: string[];
    applySlug?: string | null;
  };
};

let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
  if (typeof window !== 'undefined') {
    if (token) sessionStorage.setItem('moe_token', token);
    else sessionStorage.removeItem('moe_token');
  }
}

export function loadStoredToken() {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem('moe_token');
}

async function request<T>(
  path: string,
  init?: RequestInit & { auth?: boolean },
): Promise<T> {
  const url = `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;
  const headers = new Headers(init?.headers);
  headers.set('Content-Type', 'application/json');
  const token = accessToken ?? loadStoredToken();
  if (token && init?.auth !== false) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  const res = await fetch(url, { ...init, headers, credentials: 'include' });
  const text = await res.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }
  if (!res.ok) {
    const msg =
      typeof data === 'object' && data && 'message' in data
        ? String((data as { message: unknown }).message)
        : res.statusText;
    throw new ApiError(msg, res.status, data);
  }
  return data as T;
}

export type MatchRow = {
  id: string;
  name?: string;
  pt: string;
  score: number;
  why: string[];
  inactive: boolean;
};

export type StudentRow = {
  id: string;
  name: string;
  phone: string | null;
  service: string;
  stage: number;
  consultationDone: boolean;
  counsellor?: { displayName: string };
};

export type StudentDetail = StudentRow & {
  destinations: string[];
  budgetUsd: number;
  faculty: string | null;
  selectedSchoolIds: string[];
  searchResults: MatchRow[] | null;
  searchRemoved: { n: string; r: string }[] | null;
  searchedAt: string | null;
  notes: { id: string; body: string; createdAt: string }[];
  stageHistory: { stage: number; label: string; reason: string | null; createdAt: string }[];
  shortlistSchools?: { id: string; name: string; partnership: string }[];
};

export type ProposalRow = {
  id: string;
  title: string;
  status: string;
  openCount: number;
  student: { id: string; name: string; service: string };
};

export const api = {
  health: () => request<{ ok: boolean }>('/health', { auth: false }),
  login: (email: string, password: string) =>
    request<LoginResponse>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
      auth: false,
    }),
  me: () => request<LoginResponse['user'] & { applySlug?: string | null }>('/api/v1/auth/me'),
  schools: (q?: string) =>
    request<{ items: SchoolRow[]; total: number }>(
      `/api/v1/schools${q ? `?q=${encodeURIComponent(q)}` : ''}`,
    ),
  students: (q?: string) =>
    request<{ items: StudentRow[]; total: number }>(
      `/api/v1/students${q ? `?q=${encodeURIComponent(q)}` : ''}`,
    ),
  student: (id: string) => request<StudentDetail>(`/api/v1/students/${id}`),
  createStudent: (body: { name: string; phone?: string; service?: string }) =>
    request<StudentRow>('/api/v1/students', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  addStudentNote: (id: string, body: string) =>
    request(`/api/v1/students/${id}/notes`, {
      method: 'POST',
      body: JSON.stringify({ body }),
    }),
  runSearch: (id: string) =>
    request<{
      res: MatchRow[];
      rem: { n: string; r: string }[];
      pool: number;
      dir: number;
      ind: number;
      selectedSchoolIds: string[];
      kbCount: number;
    }>(`/api/v1/students/${id}/search`, { method: 'POST' }),
  proposals: () =>
    request<{ items: ProposalRow[]; total: number }>('/api/v1/proposals'),
  proposal: (id: string) => request(`/api/v1/proposals/${id}`),
  createProposal: (body: {
    studentId: string;
    title?: string;
    message?: string;
    schoolIds?: string[];
  }) =>
    request('/api/v1/proposals', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  updateProposal: (
    id: string,
    body: Partial<{
      title: string;
      message: string;
      coverKey: string;
      schoolIds: string[];
      status: string;
    }>,
  ) =>
    request(`/api/v1/proposals/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
  branding: () => request<BrandingProfile>('/api/v1/branding/me'),
  updateBranding: (body: Partial<BrandingProfile>) =>
    request('/api/v1/branding/me', {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
  accessRequest: (body: {
    fullName: string;
    email: string;
    agency?: string;
    role?: string;
  }) =>
    request('/api/v1/access-requests', {
      method: 'POST',
      body: JSON.stringify(body),
      auth: false,
    }),
  publicProposal: (id: string) =>
    request<PublicProposalPayload>(`/api/v1/public/proposals/${id}`, {
      auth: false,
    }),
  publicApply: (
    token: string,
    body: { name: string; email?: string; phone?: string; service?: string; comment?: string },
  ) =>
    request(`/api/v1/public/apply/${encodeURIComponent(token)}`, {
      method: 'POST',
      body: JSON.stringify(body),
      auth: false,
    }),
  partners: () => request('/api/v1/partners'),
};

export type SchoolRow = {
  id: string;
  name: string;
  partnership: string;
  status?: string;
  countries: string[];
  feeUsdLo: number | null;
  feeUsdHi: number | null;
  intlFeeHeadline?: string | null;
  dataConfidence?: string | null;
};

export type BrandingProfile = {
  title?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  agency?: string | null;
  signOff?: string | null;
  defaultCover?: string;
};

export type PublicProposalPayload = {
  proposal: {
    id: string;
    title: string;
    message: string;
    coverKey: string;
    schoolIds: string[];
    status: string;
    openCount: number;
    student: { name: string };
    author: {
      displayName: string;
      agency: string | null;
      branding: BrandingProfile | null;
    };
  };
  schools: SchoolRow[];
};