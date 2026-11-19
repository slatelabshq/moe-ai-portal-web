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
    mustChangePassword?: boolean;
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
  countries?: string[];
  location?: string;
  fee?: string;
  status?: string;
};

export type StudentRow = {
  id: string;
  name: string;
  phone: string | null;
  service: string;
  stage: number;
  consultationDone: boolean;
  source?: 'Portal' | 'CRM' | string;
  counsellor?: { id?: string; displayName: string; email?: string };
  searchedAt?: string | null;
  searchResults?: MatchRow[] | null;
};

export type StudentDetail = StudentRow & {
  destinations: string[];
  budgetUsd: number;
  faculty: string | null;
  selectedSchoolIds: string[];
  searchRemoved: { n: string; r: string }[] | null;
  searchedAt: string | null;
  notes: {
    id: string;
    body: string;
    createdAt: string;
    author?: { displayName: string } | null;
  }[];
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
  me: () => request<LoginResponse['user']>('/api/v1/auth/me'),
  changePassword: (newPassword: string, confirmPassword: string) =>
    request<{ ok: boolean }>('/api/v1/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ newPassword, confirmPassword }),
    }),
  school: (id: string) => request<SchoolDetail>(`/api/v1/schools/${id}`),
  createSchool: (body: SchoolWrite) =>
    request<SchoolDetail>('/api/v1/schools', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  updateSchool: (id: string, body: SchoolWrite) =>
    request<SchoolDetail>(`/api/v1/schools/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
  previewSchoolImport: (text: string) =>
    request<SchoolImportPreview>('/api/v1/schools/import/preview', {
      method: 'POST',
      body: JSON.stringify({ text }),
    }),
  confirmSchoolImport: (text: string) =>
    request<{ upserted: number; skipped: number; totalRows: number }>(
      '/api/v1/schools/import/confirm',
      { method: 'POST', body: JSON.stringify({ text }) },
    ),
  schools: (q?: string, opts?: { take?: number }) => {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (opts?.take) params.set('take', String(opts.take));
    const qs = params.toString();
    return request<{ items: SchoolRow[]; total: number }>(
      `/api/v1/schools${qs ? `?${qs}` : ''}`,
    );
  },
  students: (q?: string) =>
    request<{ items: StudentRow[]; total: number }>(
      `/api/v1/students${q ? `?q=${encodeURIComponent(q)}` : ''}`,
    ),
  student: (id: string) => request<StudentDetail>(`/api/v1/students/${id}`),
  createStudent: (body: {
    name: string;
    phone?: string;
    service?: string;
    destinations?: string[];
    budgetUsd?: number;
    formType?: string;
    application?: Record<string, string>;
  }) =>
    request<StudentRow>('/api/v1/students', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  updateStudent: (
    id: string,
    body: Partial<{
      name: string;
      phone: string;
      service: string;
      faculty: string;
      destinations: string[];
      budgetUsd: number;
      consultationDone: boolean;
      yearGroup: string;
      sport: string;
      formType: string;
      curriculum: string[];
      application: Record<string, string>;
      selectedSchoolIds: string[];
    }>,
  ) =>
    request(`/api/v1/students/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
  assignCounsellor: (studentId: string, counsellorId: string) =>
    request(`/api/v1/students/${studentId}/counsellor`, {
      method: 'PATCH',
      body: JSON.stringify({ counsellorId }),
    }),
  assignStudents: (studentIds: string[], counsellorId: string) =>
    request<{ ok: boolean; count: number; counsellorId: string }>(
      '/api/v1/students/assign',
      {
        method: 'POST',
        body: JSON.stringify({ studentIds, counsellorId }),
      },
    ),
  updateStage: (id: string, stage: number, reason?: string) =>
    request(`/api/v1/students/${id}/stage`, {
      method: 'PATCH',
      body: JSON.stringify({ stage, reason }),
    }),
  addStudentNote: (id: string, body: string) =>
    request(`/api/v1/students/${id}/notes`, {
      method: 'POST',
      body: JSON.stringify({ body }),
    }),
  presignFile: (body: {
    purpose: string;
    mimeType: string;
    sizeBytes: number;
    studentId?: string;
  }) =>
    request<{
      fileId: string;
      uploadUrl: string | null;
      devMode: boolean;
      message?: string;
    }>('/api/v1/files/presign', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  completeFile: (fileId: string, extractedText?: string) =>
    request<{ ok: boolean; intakeJob?: boolean }>(`/api/v1/files/${fileId}/complete`, {
      method: 'POST',
      body: JSON.stringify({ extractedText }),
    }),
  intakeUpload: (body: {
    filename: string;
    mimeType: string;
    contentBase64: string;
    studentId?: string;
    formType?: string;
  }) =>
    request<{
      studentId: string;
      duplicate: boolean;
      student: {
        id: string;
        name: string;
        phone: string | null;
        service: string;
        faculty: string | null;
        destinations: string[];
        budgetUsd: number;
        yearGroup: string | null;
        sport: string | null;
        formType: string;
        curriculum: string[];
        application: Record<string, string> | null;
      };
    }>('/api/v1/files/intake', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  accessPending: () =>
    request<{
      items: AccessRequestRow[];
      total: number;
    }>('/api/v1/access-requests'),
  accessApprove: (id: string) =>
    request<{
      userId: string;
      email: string;
      temporaryPassword: string;
    }>(`/api/v1/access-requests/${id}/approve`, { method: 'POST' }),
  accessDecline: (id: string) =>
    request<{ ok: boolean }>(`/api/v1/access-requests/${id}/decline`, {
      method: 'POST',
    }),
  users: () =>
    request<{ items: PortalUserRow[]; total: number }>('/api/v1/users'),
  createUser: (body: {
    fullName: string;
    email: string;
    role: string;
    agency?: string;
  }) =>
    request<{
      userId: string;
      email: string;
      temporaryPassword: string;
    }>('/api/v1/users', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  updateUser: (
    id: string,
    body: { active?: boolean; permissions?: string[] },
  ) =>
    request<{
      ok: boolean;
      id: string;
      active: boolean;
      permissions: string[];
    }>(`/api/v1/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
  auditList: () =>
    request<{ items: AuditEventRow[]; total: number }>('/api/v1/audit'),
  runSearch: (id: string) =>
    request<{
      res: MatchRow[];
      rem: { n: string; r: string }[];
      pool: number;
      dir: number;
      ind: number;
      selectedSchoolIds: string[];
      kbCount: number;
      ranking?: 'llm' | 'rules';
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
    request<{ id: string }>('/api/v1/proposals', {
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
    body: {
      name: string;
      email?: string;
      phone?: string;
      service?: string;
      formType?: string;
      destinations?: string[];
      application?: Record<string, string>;
    },
  ) =>
    request(`/api/v1/public/apply/${encodeURIComponent(token)}`, {
      method: 'POST',
      body: JSON.stringify(body),
      auth: false,
    }),
  partners: () => request<PartnerRow[]>('/api/v1/partners'),
  partnerGroups: () => request<PartnerGroupRow[]>('/api/v1/partners/groups'),
  memberships: () => request<MembershipRow[]>('/api/v1/partners/memberships'),
};

export type AccessRequestRow = {
  id: string;
  fullName: string;
  email: string;
  agency: string | null;
  role: string;
  status: string;
  createdAt: string;
};

export type PortalUserRow = {
  id: string;
  email: string;
  displayName: string;
  role: string;
  agency: string | null;
  active?: boolean;
  permissions?: string[];
  lastSeenAt?: string | null;
  createdAt?: string;
};

export type AuditEventRow = {
  id: string;
  message: string;
  createdAt: string;
  actorDisplayName: string;
};

export type PartnerRow = {
  id: string;
  name: string;
  partnerType: string | null;
  country: string | null;
  status: string;
  notes?: string | null;
};

export type PartnerGroupRow = {
  id: string;
  name: string;
  partnership: string;
  memberNames: string[];
  countLabel?: string | null;
  status: string;
};

export type MembershipRow = {
  id: string;
  name: string;
  status: string;
  schoolIds: string[];
  notes?: string | null;
};

export type SchoolRow = {
  id: string;
  name: string;
  partnership: string;
  status?: string;
  countries: string[];
  schoolGroup?: string | null;
  location?: string | null;
  overview?: string | null;
  services?: string[];
  faculties?: string[];
  curricula12?: string[];
  courses?: string[];
  level?: string | null;
  feeCurrency?: string | null;
  feeLo?: number | null;
  feeHi?: number | null;
  feeUsdLo: number | null;
  feeUsdHi: number | null;
  intlFeeHeadline?: string | null;
  dataConfidence?: string | null;
  confidenceScore?: number;
  verifyLink?: string | null;
  feeConfirmedNote?: string | null;
  studentsPlaced?: number;
  intake?: string | null;
  deadline?: string | null;
  entryRequirements?: string | null;
  scholarships?: string | null;
  contractSignedAt?: string | null;
};

export type SchoolDetail = SchoolRow & {
  changeLogs?: {
    id: string;
    summary: string;
    detail?: string | null;
    createdAt: string;
    actor?: { displayName: string } | null;
  }[];
};

export type SchoolWrite = {
  name: string;
  partnership?: string;
  status?: string;
  countries?: string[];
  location?: string;
  schoolGroup?: string;
  services?: string[];
  faculties?: string[];
  curricula12?: string[];
  courses?: string[];
  overview?: string;
  level?: string;
  feeLo?: number;
  feeHi?: number;
  feeCurrency?: string;
  verifyLink?: string;
  intake?: string;
  deadline?: string;
  entryRequirements?: string;
  scholarships?: string;
  contractSignedAt?: string;
  studentsPlaced?: number;
};

export type SchoolImportPreview = {
  total: number;
  valid: number;
  rows: {
    line: number;
    name: string;
    country: string;
    fees: string;
    partnership: string;
    error?: string;
  }[];
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