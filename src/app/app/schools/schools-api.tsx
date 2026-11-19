'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { PageHead } from '@/components/page-head';
import { Icon } from '@/components/icon';
import { useAuth } from '@/components/auth-provider';
import {
  DataCheckTag,
  PartnershipTag,
  StatusChip,
  SchoolMono,
  formatSchoolFee,
  schoolNeedsConfirmation,
  type SchoolCheckInput,
} from '@/components/admin-ui';
import {
  ApiError,
  api,
  type SchoolDetail,
  type SchoolRow,
  type SchoolWrite,
} from '@/lib/api-client';

const FILTERS = [
  'All',
  'Direct',
  'Indirect',
  'Needs confirmation',
  'Inactive or suspended',
] as const;

const SERVICES = [
  'Summer',
  'K–12',
  'Pathways',
  'Sports Pathways',
  "Bachelor's",
  'Postgraduate',
];
const FACULTIES = [
  'Health & Medicine',
  'Law',
  'Engineering & Computing',
  'Accounting & Finance',
  'Business & Management',
  'Arts, Humanities & Education',
  'Sciences',
];
const CURRICULA = ['A-Levels', 'IB', 'GCSE', 'AP'];
const STATUSES = ['Active', 'Inactive', 'Suspended'];

type Drawer =
  | { mode: 'view' | 'edit'; id: string }
  | { mode: 'create' }
  | null;

type FormState = {
  name: string;
  partnership: string;
  status: string;
  schoolGroup: string;
  countries: string;
  location: string;
  services: string[];
  faculties: string[];
  curricula12: string[];
  courses: string;
  overview: string;
  feeLo: string;
  feeHi: string;
  feeCurrency: string;
  verifyLink: string;
  intake: string;
  deadline: string;
  entryRequirements: string;
  scholarships: string;
  contractSignedAt: string;
  studentsPlaced: string;
};

const blankForm = (): FormState => ({
  name: '',
  partnership: 'Indirect',
  status: 'Active',
  schoolGroup: '',
  countries: '',
  location: '',
  services: [],
  faculties: [],
  curricula12: [],
  courses: '',
  overview: '',
  feeLo: '',
  feeHi: '',
  feeCurrency: 'GBP',
  verifyLink: '',
  intake: '',
  deadline: '',
  entryRequirements: '',
  scholarships: '',
  contractSignedAt: '',
  studentsPlaced: '0',
});

function formFromSchool(s: SchoolDetail): FormState {
  const date = s.contractSignedAt ? s.contractSignedAt.slice(0, 10) : '';
  return {
    name: s.name ?? '',
    partnership: s.partnership || 'Indirect',
    status: s.status || 'Active',
    schoolGroup: s.schoolGroup ?? '',
    countries: (s.countries ?? []).join(', '),
    location: s.location ?? '',
    services: s.services ?? [],
    faculties: s.faculties ?? [],
    curricula12: s.curricula12 ?? [],
    courses: (s.courses ?? []).join('\n'),
    overview: s.overview ?? '',
    feeLo: s.feeLo != null ? String(s.feeLo) : '',
    feeHi: s.feeHi != null ? String(s.feeHi) : '',
    feeCurrency: s.feeCurrency || 'GBP',
    verifyLink: s.verifyLink ?? '',
    intake: s.intake ?? '',
    deadline: s.deadline ?? '',
    entryRequirements: s.entryRequirements ?? '',
    scholarships: s.scholarships ?? '',
    contractSignedAt: date,
    studentsPlaced: String(s.studentsPlaced ?? 0),
  };
}

function toWrite(f: FormState): SchoolWrite {
  const lo = f.feeLo.trim() ? Number(f.feeLo) : undefined;
  const hi = f.feeHi.trim() ? Number(f.feeHi) : lo;
  return {
    name: f.name.trim(),
    partnership: f.partnership,
    status: f.status,
    countries: f.countries
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean),
    location: f.location.trim(),
    schoolGroup: f.schoolGroup.trim(),
    services: f.services,
    faculties: f.faculties,
    curricula12: f.curricula12,
    courses: f.courses
      .split('\n')
      .map((c) => c.trim())
      .filter(Boolean),
    overview: f.overview.trim(),
    feeLo: lo,
    feeHi: hi,
    feeCurrency: f.feeCurrency,
    verifyLink: f.verifyLink.trim(),
    intake: f.intake.trim(),
    deadline: f.deadline.trim(),
    entryRequirements: f.entryRequirements.trim(),
    scholarships: f.scholarships.trim(),
    contractSignedAt: f.contractSignedAt || undefined,
    studentsPlaced: Number(f.studentsPlaced) || 0,
  };
}

function toggle(list: string[], value: string) {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

function ChipSet({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string[];
  onChange: (next: string[]) => void;
}) {
  return (
    <div>
      <label>{label}</label>
      <div className="row" style={{ marginTop: 8 }}>
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            className={`tag ${value.includes(opt) ? 'd' : ''}`}
            onClick={() => onChange(toggle(value, opt))}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function SchoolsApiPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const role = user?.role;
  const perms = user?.permissions ?? [];
  const canWrite =
    role === 'Admin' ||
    role === 'BD' ||
    perms.includes('addschool') ||
    perms.includes('schools');
  const canAdd =
    role === 'Admin' || role === 'BD' || perms.includes('addschool');

  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('All');
  const [drawer, setDrawer] = useState<Drawer>(null);
  const [form, setForm] = useState<FormState>(blankForm);
  const [formErr, setFormErr] = useState('');
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [importErr, setImportErr] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['schools', q],
    queryFn: () => api.schools(q || undefined, { take: 2000 }),
  });

  const detailId = drawer && drawer.mode !== 'create' ? drawer.id : null;
  const detail = useQuery({
    queryKey: ['school', detailId],
    queryFn: () => api.school(detailId!),
    enabled: !!detailId,
  });

  const preview = useQuery({
    queryKey: ['school-import-preview', importText],
    queryFn: () => api.previewSchoolImport(importText),
    enabled: importOpen && importText.length > 0,
  });

  const save = useMutation({
    mutationFn: async () => {
      const body = toWrite(form);
      if (!drawer) throw new Error('Nothing to save');
      if (drawer.mode === 'create') return api.createSchool(body);
      return api.updateSchool(drawer.id, body);
    },
    onSuccess: async (saved) => {
      await qc.invalidateQueries({ queryKey: ['schools'] });
      await qc.invalidateQueries({ queryKey: ['school', saved.id] });
      setDrawer({ mode: 'view', id: saved.id });
      setFormErr('');
    },
    onError: (e) => {
      setFormErr(e instanceof ApiError ? e.message : 'Could not save the school.');
    },
  });

  const confirmImport = useMutation({
    mutationFn: () => api.confirmSchoolImport(importText),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['schools'] });
      setImportOpen(false);
      setImportText('');
      setImportErr('');
    },
    onError: (e) => {
      setImportErr(e instanceof ApiError ? e.message : 'Import failed.');
    },
  });

  const raw = (data?.items ?? []) as SchoolRow[];
  const items = raw.filter((s) => {
    if (filter === 'All') return true;
    if (filter === 'Direct') return s.partnership === 'Direct';
    if (filter === 'Indirect') return s.partnership === 'Indirect';
    if (filter === 'Needs confirmation') {
      return schoolNeedsConfirmation(s as SchoolCheckInput);
    }
    if (filter === 'Inactive or suspended') {
      return s.status === 'Inactive' || s.status === 'Suspended';
    }
    return true;
  });

  const school = detail.data;
  const editing = drawer?.mode === 'create' || drawer?.mode === 'edit';

  const shownForm = useMemo(() => form, [form]);

  function openView(id: string) {
    setFormErr('');
    setDrawer({ mode: 'view', id });
  }

  function openCreate() {
    setForm(blankForm());
    setFormErr('');
    setDrawer({ mode: 'create' });
  }

  function openEdit() {
    if (!school) return;
    setForm(formFromSchool(school));
    setFormErr('');
    setDrawer({ mode: 'edit', id: school.id });
  }

  function submitForm() {
    if (!shownForm.name.trim()) {
      setFormErr('Enter the school name.');
      return;
    }
    if (!shownForm.services.length) {
      setFormErr('Choose at least one service.');
      return;
    }
    const lo = shownForm.feeLo.trim() ? Number(shownForm.feeLo) : 0;
    const hi = shownForm.feeHi.trim() ? Number(shownForm.feeHi) : lo;
    if (lo && hi < lo) {
      setFormErr('The upper fee must be at least the lower fee.');
      return;
    }
    setFormErr('');
    save.mutate();
  }

  async function onImportFile(file: File) {
    setImportErr('');
    const lower = file.name.toLowerCase();
    try {
      let text = '';
      if (lower.endsWith('.csv')) {
        text = await file.text();
      } else if (lower.endsWith('.xlsx') || lower.endsWith('.xls')) {
        const XLSX = await import('xlsx');
        const buf = await file.arrayBuffer();
        const book = XLSX.read(buf, { type: 'array' });
        const sheet = book.Sheets[book.SheetNames[0]];
        text = XLSX.utils.sheet_to_csv(sheet);
      } else {
        setImportErr('Use a .csv, .xlsx, or .xls file.');
        return;
      }
      if (!/INSTITUTION/i.test(text.split(/\r?\n/)[0] ?? '')) {
        setImportErr(
          'The first row needs the universities sheet headers, including INSTITUTION.',
        );
        return;
      }
      setImportText(text);
      setImportOpen(true);
    } catch {
      setImportErr('Could not read that file.');
    }
  }

  return (
    <>
      <PageHead
        title="Schools"
        subtitle="Every school, with its partnership, status, data check and fees."
        actions={
          canAdd ? (
            <>
              <label className="btn o" style={{ position: 'relative' }}>
                <Icon name="upload" />
                Import
                <input
                  className="sr"
                  type="file"
                  accept=".csv,.xlsx,.xls,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    e.target.value = '';
                    if (file) void onImportFile(file);
                  }}
                />
              </label>
              <button type="button" className="btn" onClick={openCreate}>
                <Icon name="plus" />
                Add school
              </button>
            </>
          ) : null
        }
      />
      <div className="row" style={{ marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <input
          placeholder="Search schools, countries or groups"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={{ maxWidth: 320, borderRadius: 999 }}
          aria-label="Search schools"
        />
        <div className="seg" role="group" aria-label="Partnership filter">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              className={filter === f ? 'on' : ''}
              onClick={() => setFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>
      </div>
      {importErr && !importOpen ? <p className="er">{importErr}</p> : null}
      {isLoading ? <p className="mut">Loading…</p> : null}
      {error ? <p className="er">Could not load schools.</p> : null}
      <div className="card" style={{ padding: 0, overflow: 'auto' }}>
        <table className="rt">
          <thead>
            <tr>
              <th>School</th>
              <th>Partnership</th>
              <th>Status</th>
              <th>Data check</th>
              <th>Yearly fee</th>
              <th>Contract</th>
            </tr>
          </thead>
          <tbody>
            {items.map((s) => (
              <tr
                key={s.id}
                className="hv"
                style={{ cursor: 'pointer' }}
                onClick={() => openView(s.id)}
              >
                <td data-l="School">
                  <div className="row" style={{ flexWrap: 'nowrap' }}>
                    <SchoolMono name={s.name} />
                    <div style={{ minWidth: 0 }}>
                      <b>{s.name}</b>
                      <br />
                      <span className="sm mut">
                        {(s.countries ?? []).join(' / ')}
                        {s.schoolGroup ? ` · ${s.schoolGroup}` : ''}
                      </span>
                    </div>
                  </div>
                </td>
                <td data-l="Partnership">
                  <PartnershipTag partnership={s.partnership} />
                </td>
                <td data-l="Status">
                  <StatusChip status={s.status ?? 'Active'} />
                </td>
                <td data-l="Data check">
                  <DataCheckTag school={s} />
                </td>
                <td data-l="Yearly fee">{formatSchoolFee(s)}</td>
                <td data-l="Contract" className="sm">
                  {s.partnership === 'Direct' ? (
                    `${s.studentsPlaced ?? 0} of 2 placed`
                  ) : (
                    <span className="mut">–</span>
                  )}
                </td>
              </tr>
            ))}
            {!items.length && !isLoading ? (
              <tr>
                <td colSpan={6} className="mut">
                  No schools match.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {drawer ? (
        <>
          <button
            type="button"
            className="ov open"
            aria-label="Close"
            onClick={() => setDrawer(null)}
            style={{ border: 0, padding: 0, cursor: 'pointer' }}
          />
          <aside className="drw open" aria-label="School">
            {editing ? (
              <>
                <div className="row sp">
                  <div className="row">
                    {drawer.mode === 'create' ? (
                      <span className="tag">New school</span>
                    ) : (
                      <>
                        <PartnershipTag partnership={shownForm.partnership} />
                        <StatusChip status={shownForm.status} />
                      </>
                    )}
                  </div>
                  <button
                    type="button"
                    className="ib w"
                    aria-label="Close"
                    onClick={() => setDrawer(null)}
                  >
                    <Icon name="x" />
                  </button>
                </div>
                <h2 style={{ margin: '16px 0 18px' }}>
                  {drawer.mode === 'create' ? 'Add a school' : shownForm.name || 'Edit school'}
                </h2>
                <div className="f">
                  <div>
                    <label>School name</label>
                    <input
                      value={shownForm.name}
                      onChange={(e) => setForm({ ...shownForm, name: e.target.value })}
                    />
                  </div>
                  <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                    <div>
                      <label>Partnership</label>
                      <select
                        value={shownForm.partnership}
                        onChange={(e) =>
                          setForm({ ...shownForm, partnership: e.target.value })
                        }
                      >
                        <option>Direct</option>
                        <option>Indirect</option>
                      </select>
                    </div>
                    <div>
                      <label>Partner status</label>
                      <select
                        value={shownForm.status}
                        onChange={(e) => setForm({ ...shownForm, status: e.target.value })}
                      >
                        {STATUSES.map((s) => (
                          <option key={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label>School group</label>
                    <input
                      value={shownForm.schoolGroup}
                      onChange={(e) =>
                        setForm({ ...shownForm, schoolGroup: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label>Countries (comma separated)</label>
                    <input
                      value={shownForm.countries}
                      onChange={(e) =>
                        setForm({ ...shownForm, countries: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label>Location</label>
                    <input
                      value={shownForm.location}
                      onChange={(e) => setForm({ ...shownForm, location: e.target.value })}
                    />
                  </div>
                  <ChipSet
                    label="Services"
                    options={SERVICES}
                    value={shownForm.services}
                    onChange={(services) => setForm({ ...shownForm, services })}
                  />
                  <ChipSet
                    label="Faculties"
                    options={FACULTIES}
                    value={shownForm.faculties}
                    onChange={(faculties) => setForm({ ...shownForm, faculties })}
                  />
                  <ChipSet
                    label="K–12 curricula"
                    options={CURRICULA}
                    value={shownForm.curricula12}
                    onChange={(curricula12) => setForm({ ...shownForm, curricula12 })}
                  />
                  <div>
                    <label>Courses (one per line)</label>
                    <textarea
                      value={shownForm.courses}
                      onChange={(e) => setForm({ ...shownForm, courses: e.target.value })}
                    />
                  </div>
                  <div className="grid" style={{ gridTemplateColumns: '1fr 1fr 110px' }}>
                    <div>
                      <label>Yearly fee from</label>
                      <input
                        type="number"
                        value={shownForm.feeLo}
                        onChange={(e) => setForm({ ...shownForm, feeLo: e.target.value })}
                      />
                    </div>
                    <div>
                      <label>Yearly fee to</label>
                      <input
                        type="number"
                        value={shownForm.feeHi}
                        onChange={(e) => setForm({ ...shownForm, feeHi: e.target.value })}
                      />
                    </div>
                    <div>
                      <label>Currency</label>
                      <select
                        value={shownForm.feeCurrency}
                        onChange={(e) =>
                          setForm({ ...shownForm, feeCurrency: e.target.value })
                        }
                      >
                        {['GBP', 'USD', 'EUR', 'CAD'].map((c) => (
                          <option key={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label>Supporting link or note</label>
                    <input
                      value={shownForm.verifyLink}
                      placeholder="Official fees page, or how the fee was confirmed"
                      onChange={(e) =>
                        setForm({ ...shownForm, verifyLink: e.target.value })
                      }
                    />
                  </div>
                  <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                    <div>
                      <label>Intake</label>
                      <input
                        value={shownForm.intake}
                        onChange={(e) => setForm({ ...shownForm, intake: e.target.value })}
                      />
                    </div>
                    <div>
                      <label>Application deadline</label>
                      <input
                        value={shownForm.deadline}
                        onChange={(e) =>
                          setForm({ ...shownForm, deadline: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <div>
                    <label>Entry requirements</label>
                    <input
                      value={shownForm.entryRequirements}
                      onChange={(e) =>
                        setForm({ ...shownForm, entryRequirements: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label>School history</label>
                    <textarea
                      value={shownForm.overview}
                      onChange={(e) =>
                        setForm({ ...shownForm, overview: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label>Scholarships</label>
                    <input
                      value={shownForm.scholarships}
                      onChange={(e) =>
                        setForm({ ...shownForm, scholarships: e.target.value })
                      }
                    />
                  </div>
                  <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                    <div>
                      <label>Contract signed (date)</label>
                      <input
                        type="date"
                        value={shownForm.contractSignedAt}
                        onChange={(e) =>
                          setForm({ ...shownForm, contractSignedAt: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <label>Students placed under contract</label>
                      <input
                        type="number"
                        value={shownForm.studentsPlaced}
                        onChange={(e) =>
                          setForm({ ...shownForm, studentsPlaced: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  {formErr ? <p className="er">{formErr}</p> : null}
                  <button
                    type="button"
                    className="btn"
                    disabled={save.isPending || !canWrite}
                    onClick={submitForm}
                  >
                    <Icon name="check" />
                    {drawer.mode === 'create' ? 'Add school' : 'Save changes'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="row sp">
                  <div className="row">
                    {school ? (
                      <>
                        <PartnershipTag partnership={school.partnership} />
                        {school.status && school.status !== 'Active' ? (
                          <StatusChip status={school.status} />
                        ) : null}
                      </>
                    ) : (
                      <span className="tag">School</span>
                    )}
                  </div>
                  <button
                    type="button"
                    className="ib w"
                    aria-label="Close"
                    onClick={() => setDrawer(null)}
                  >
                    <Icon name="x" />
                  </button>
                </div>
                {detail.isLoading ? <p className="mut">Loading…</p> : null}
                {detail.error ? <p className="er">Could not open this school.</p> : null}
                {school ? (
                  <>
                    <div className="row" style={{ margin: '18px 0', flexWrap: 'nowrap' }}>
                      <SchoolMono name={school.name} />
                      <div style={{ minWidth: 0 }}>
                        <h2>{school.name}</h2>
                        <p className="sm mut">
                          {(school.countries ?? []).join(' / ') || 'Country not set'}
                          {school.location ? ` · ${school.location}` : ''}
                          {school.schoolGroup ? ` · ${school.schoolGroup}` : ''}
                        </p>
                      </div>
                    </div>
                    {school.overview ? <p>{school.overview}</p> : null}
                    <div
                      className="grid"
                      style={{ gridTemplateColumns: '1fr 1fr', margin: '18px 0' }}
                    >
                      <div className="card">
                        <span className="sm mut">Yearly fee</span>
                        <div style={{ font: '500 20px var(--rm-font-display)' }}>
                          {formatSchoolFee(school)}
                        </div>
                      </div>
                      <div className="card">
                        <span className="sm mut">Data check</span>
                        <div style={{ font: '500 20px var(--rm-font-display)' }}>
                          <DataCheckTag school={school} />
                        </div>
                      </div>
                    </div>
                    <div className="row" style={{ marginBottom: 14 }}>
                      {(school.services ?? []).map((s) => (
                        <span key={s} className="tag">
                          {s}
                        </span>
                      ))}
                      {(school.curricula12 ?? []).map((s) => (
                        <span key={s} className="tag d">
                          {s}
                        </span>
                      ))}
                    </div>
                    {school.courses?.length ? (
                      <>
                        <h3>Courses</h3>
                        <ul className="sm" style={{ margin: '8px 0 18px 18px' }}>
                          {school.courses.map((c) => (
                            <li key={c}>{c}</li>
                          ))}
                        </ul>
                      </>
                    ) : null}
                    {canWrite ? (
                      <button type="button" className="btn o s" onClick={openEdit}>
                        <Icon name="edit" />
                        Edit school
                      </button>
                    ) : null}
                    {school.changeLogs?.length ? (
                      <>
                        <p className="sm mut" style={{ marginTop: 24 }}>
                          Change log
                        </p>
                        {school.changeLogs.map((log) => (
                          <div
                            key={log.id}
                            className="row sp sm"
                            style={{
                              padding: '8px 0',
                              borderBottom: '1px solid var(--rm-border-hairline)',
                            }}
                          >
                            <span>{log.summary}</span>
                            <span className="mut">
                              {log.actor?.displayName ?? 'System'} ·{' '}
                              {new Date(log.createdAt).toLocaleDateString('en-GB', {
                                day: 'numeric',
                                month: 'short',
                              })}
                            </span>
                          </div>
                        ))}
                      </>
                    ) : null}
                  </>
                ) : null}
              </>
            )}
          </aside>
        </>
      ) : null}

      {importOpen ? (
        <>
          <button
            type="button"
            className="ov open"
            aria-label="Close import review"
            onClick={() => {
              setImportOpen(false);
              setImportText('');
            }}
            style={{ border: 0, padding: 0, cursor: 'pointer' }}
          />
          <div
            className="mdl open"
            role="dialog"
            aria-label="Review import"
            style={{ width: 'min(920px, 94vw)' }}
          >
            <div className="row sp">
              <h2>Review import</h2>
              <button
                type="button"
                className="ib w"
                aria-label="Close"
                onClick={() => {
                  setImportOpen(false);
                  setImportText('');
                }}
              >
                <Icon name="x" />
              </button>
            </div>
            <p className="sm mut" style={{ margin: '8px 0 14px' }}>
              Nothing is saved until you confirm.
              {preview.data
                ? ` ${preview.data.valid} of ${preview.data.total} rows can be imported.`
                : ''}
            </p>
            {preview.isLoading ? <p className="mut">Reading rows…</p> : null}
            {preview.error ? (
              <p className="er">Could not preview this sheet.</p>
            ) : null}
            {importErr ? <p className="er">{importErr}</p> : null}
            <div style={{ overflow: 'auto', maxHeight: '50vh' }}>
              <table className="rt">
                <thead>
                  <tr>
                    <th>Row</th>
                    <th>School</th>
                    <th>Country</th>
                    <th>Fees</th>
                    <th>Partnership</th>
                  </tr>
                </thead>
                <tbody>
                  {(preview.data?.rows ?? []).map((row) => (
                    <tr
                      key={row.line}
                      style={
                        row.error
                          ? { background: 'rgba(168, 50, 31, 0.08)' }
                          : undefined
                      }
                    >
                      <td className="sm mut">{row.line}</td>
                      <td>
                        <b>{row.name || '—'}</b>
                        {row.error ? (
                          <>
                            <br />
                            <span className="er sm">{row.error}</span>
                          </>
                        ) : null}
                      </td>
                      <td className="sm">{row.country || '—'}</td>
                      <td className="sm">{row.fees || '—'}</td>
                      <td>
                        <PartnershipTag partnership={row.partnership} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="row" style={{ marginTop: 16 }}>
              <button
                type="button"
                className="btn"
                disabled={
                  confirmImport.isPending ||
                  !preview.data ||
                  preview.data.valid === 0
                }
                onClick={() => confirmImport.mutate()}
              >
                Confirm import
              </button>
              <button
                type="button"
                className="btn o"
                onClick={() => {
                  setImportOpen(false);
                  setImportText('');
                  setImportErr('');
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </>
      ) : null}
    </>
  );
}
