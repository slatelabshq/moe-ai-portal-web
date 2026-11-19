'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FormEvent, useEffect, useMemo, useState, type ReactNode } from 'react';
import { PageHead } from '@/components/page-head';
import { Icon } from '@/components/icon';
import { ConfirmModal } from '@/components/confirm-modal';
import { PersonSearch } from '@/components/person-search';
import { useAuth } from '@/components/auth-provider';
import {
  api,
  type AccessRequestRow,
  type AuditEventRow,
  type PortalUserRow,
} from '@/lib/api-client';
import {
  formatPermissions,
  PERMISSION_KEYS,
  PERMISSION_LABELS,
} from '@/lib/permission-labels';

const ROLES = ['Agent', 'Counsellor', 'BD', 'Admin'] as const;
const PEOPLE_PAGE_SIZE = 5;
const AUDIT_PAGE_SIZE = 8;

type PendingAction =
  | { kind: 'approve'; id: string; name: string; email: string }
  | { kind: 'decline'; id: string; name: string; email: string }
  | {
      kind: 'revoke';
      id: string;
      name: string;
      email: string;
      active: boolean;
    }
  | {
      kind: 'handoff';
      id: string;
      name: string;
      email: string;
      studentIds: string[];
    };

function formatWhen(iso: string | null | undefined): string {
  if (!iso) return 'Never';
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function Pager({
  page,
  pages,
  onPage,
}: {
  page: number;
  pages: number;
  onPage: (n: number) => void;
}) {
  if (pages <= 1) return null;
  return (
    <div className="row" style={{ padding: '12px 16px', gap: 8 }}>
      <button
        type="button"
        className="btn o s"
        disabled={page <= 1}
        onClick={() => onPage(page - 1)}
      >
        Previous
      </button>
      <span className="sm mut">
        Page {page} of {pages}
      </span>
      <button
        type="button"
        className="btn o s"
        disabled={page >= pages}
        onClick={() => onPage(page + 1)}
      >
        Next
      </button>
    </div>
  );
}

function formatAuditWhen(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function AccessPage() {
  const qc = useQueryClient();
  const { user: me } = useAuth();
  const [pending, setPending] = useState<PendingAction | null>(null);
  const [tempPasswordModal, setTempPasswordModal] = useState<{
    email: string;
    password: string;
    title: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [peopleQ, setPeopleQ] = useState('');
  const [peopleRole, setPeopleRole] = useState('All');
  const [peopleStatus, setPeopleStatus] = useState('All');
  const [peoplePage, setPeoplePage] = useState(1);
  const [auditQ, setAuditQ] = useState('');
  const [auditActor, setAuditActor] = useState('');
  const [auditPage, setAuditPage] = useState(1);
  const [permUser, setPermUser] = useState<PortalUserRow | null>(null);
  const [permDraft, setPermDraft] = useState<string[]>([]);
  const [permErr, setPermErr] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [createErr, setCreateErr] = useState('');
  const [handoffTo, setHandoffTo] = useState('');
  const [handoffErr, setHandoffErr] = useState('');
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    agency: '',
    role: 'Counsellor' as (typeof ROLES)[number],
  });

  const { data, isLoading } = useQuery({
    queryKey: ['access-pending'],
    queryFn: () => api.accessPending(),
  });

  const { data: people, isLoading: loadingPeople } = useQuery({
    queryKey: ['users'],
    queryFn: () => api.users(),
  });

  const { data: audit, isLoading: loadingAudit } = useQuery({
    queryKey: ['audit'],
    queryFn: () => api.auditList(),
  });

  const { data: students, isLoading: loadingStudents } = useQuery({
    queryKey: ['students'],
    queryFn: () => api.students(),
  });

  const approve = useMutation({
    mutationFn: (id: string) => api.accessApprove(id),
    onSuccess: (res) => {
      setPending(null);
      setTempPasswordModal({
        email: res.email,
        password: res.temporaryPassword,
        title: 'Account approved',
      });
      qc.invalidateQueries({ queryKey: ['access-pending'] });
      qc.invalidateQueries({ queryKey: ['users'] });
      qc.invalidateQueries({ queryKey: ['audit'] });
    },
  });

  const decline = useMutation({
    mutationFn: (id: string) => api.accessDecline(id),
    onSuccess: () => {
      setPending(null);
      qc.invalidateQueries({ queryKey: ['access-pending'] });
      qc.invalidateQueries({ queryKey: ['audit'] });
    },
  });

  const createUser = useMutation({
    mutationFn: () =>
      api.createUser({
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        role: form.role,
        agency: form.agency.trim() || undefined,
      }),
    onSuccess: (res) => {
      setCreateOpen(false);
      setCreateErr('');
      setForm({ fullName: '', email: '', agency: '', role: 'Counsellor' });
      setTempPasswordModal({
        email: res.email,
        password: res.temporaryPassword,
        title: 'Account created',
      });
      qc.invalidateQueries({ queryKey: ['users'] });
      qc.invalidateQueries({ queryKey: ['audit'] });
    },
    onError: (e: Error) => setCreateErr(e.message),
  });

  const setActive = useMutation({
    mutationFn: async (
      action: PendingAction & { counsellorId?: string },
    ) => {
      if (action.kind === 'handoff') {
        if (!action.counsellorId) {
          throw new Error('Choose who should take their students.');
        }
        await api.assignStudents(action.studentIds, action.counsellorId);
        return api.updateUser(action.id, { active: false });
      }
      if (action.kind !== 'revoke') throw new Error('Nothing to update.');
      return api.updateUser(action.id, { active: action.active });
    },
    onSuccess: () => {
      setPending(null);
      setHandoffTo('');
      setHandoffErr('');
      qc.invalidateQueries({ queryKey: ['users'] });
      qc.invalidateQueries({ queryKey: ['audit'] });
      qc.invalidateQueries({ queryKey: ['students'] });
    },
    onError: (e: Error) => setHandoffErr(e.message),
  });

  const savePerms = useMutation({
    mutationFn: (permissions: string[]) => {
      if (!permUser) throw new Error('No person selected.');
      return api.updateUser(permUser.id, { permissions });
    },
    onSuccess: () => {
      setPermUser(null);
      setPermErr('');
      qc.invalidateQueries({ queryKey: ['users'] });
      qc.invalidateQueries({ queryKey: ['audit'] });
    },
    onError: (e: Error) => setPermErr(e.message),
  });

  useEffect(() => {
    if (!copied) return;
    const t = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(t);
  }, [copied]);

  const items = data?.items ?? [];
  const users = useMemo(() => people?.items ?? [], [people?.items]);
  const auditItems = useMemo(() => audit?.items ?? [], [audit?.items]);

  const filteredUsers = useMemo(() => {
    const q = peopleQ.trim().toLowerCase();
    return users.filter((a) => {
      const active = a.active !== false;
      if (peopleRole !== 'All' && a.role !== peopleRole) return false;
      if (peopleStatus === 'Active' && !active) return false;
      if (peopleStatus === 'Revoked' && active) return false;
      if (!q) return true;
      return (
        a.displayName.toLowerCase().includes(q) ||
        a.email.toLowerCase().includes(q)
      );
    });
  }, [users, peopleQ, peopleRole, peopleStatus]);

  const peoplePages = Math.max(1, Math.ceil(filteredUsers.length / PEOPLE_PAGE_SIZE));
  const peoplePageSafe = Math.min(peoplePage, peoplePages);
  const peopleSlice = filteredUsers.slice(
    (peoplePageSafe - 1) * PEOPLE_PAGE_SIZE,
    peoplePageSafe * PEOPLE_PAGE_SIZE,
  );

  const filteredAudit = useMemo(() => {
    const q = auditQ.trim().toLowerCase();
    const actor = auditActor.trim().toLowerCase();
    return auditItems.filter((l) => {
      if (q && !l.message.toLowerCase().includes(q)) return false;
      if (actor && !l.actorDisplayName.toLowerCase().includes(actor)) return false;
      return true;
    });
  }, [auditItems, auditQ, auditActor]);

  const auditPages = Math.max(1, Math.ceil(filteredAudit.length / AUDIT_PAGE_SIZE));
  const auditPageSafe = Math.min(auditPage, auditPages);
  const auditSlice = filteredAudit.slice(
    (auditPageSafe - 1) * AUDIT_PAGE_SIZE,
    auditPageSafe * AUDIT_PAGE_SIZE,
  );

  const busy =
    approve.isPending ||
    decline.isPending ||
    createUser.isPending ||
    setActive.isPending ||
    savePerms.isPending;

  function onConfirmPending() {
    if (!pending) return;
    if (pending.kind === 'approve') approve.mutate(pending.id);
    else if (pending.kind === 'decline') decline.mutate(pending.id);
    else if (pending.kind === 'handoff') {
      if (!handoffTo) {
        setHandoffErr('Choose who should take their students.');
        return;
      }
      setActive.mutate({ ...pending, counsellorId: handoffTo });
    } else if (pending.kind === 'revoke') {
      setActive.mutate(pending);
    }
  }

  function onCreateSubmit(e: FormEvent) {
    e.preventDefault();
    setCreateErr('');
    if (!form.fullName.trim()) {
      setCreateErr('Enter their name.');
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) {
      setCreateErr('Enter a valid email address.');
      return;
    }
    createUser.mutate();
  }

  let modalTitle = '';
  let modalBody: ReactNode = null;
  let modalConfirm = 'Confirm';
  let modalDanger = false;

  if (pending?.kind === 'approve') {
    modalTitle = `Approve ${pending.name}?`;
    modalBody = (
      <p className="mut sm">
        This will create a portal account for <b>{pending.email}</b> with a
        temporary password they must change on first sign-in.
      </p>
    );
    modalConfirm = 'Approve';
  } else if (pending?.kind === 'decline') {
    modalTitle = `Decline request from ${pending.name}?`;
    modalBody = (
      <p className="mut sm">
        <b>{pending.email}</b> will not receive an account. You can still add
        them manually later.
      </p>
    );
    modalConfirm = 'Decline';
    modalDanger = true;
  } else if (pending?.kind === 'revoke') {
    const restoring = pending.active;
    modalTitle = restoring
      ? `Restore access for ${pending.name}?`
      : `Revoke access for ${pending.name}?`;
    modalBody = (
      <p className="mut sm">
        {restoring
          ? `${pending.email} will be able to sign in again.`
          : `${pending.email} will not be able to sign in until access is restored.`}
      </p>
    );
    modalConfirm = restoring ? 'Restore access' : 'Revoke access';
    modalDanger = !restoring;
  } else if (pending?.kind === 'handoff') {
    const n = pending.studentIds.length;
    modalTitle = `${pending.name} has ${n} student${n === 1 ? '' : 's'}`;
    modalBody = (
      <div>
        <p className="mut sm">
          Choose who should take them before access is removed.
        </p>
        <div style={{ marginTop: 12 }}>
          <PersonSearch
            people={users.filter(
              (u) =>
                u.id !== pending.id &&
                u.active !== false &&
                ['Counsellor', 'Agent', 'Admin'].includes(u.role),
            )}
            value={handoffTo}
            onChange={(id) => {
              setHandoffTo(id);
              setHandoffErr('');
            }}
            emptyLabel="Choose a person"
            placeholder="Search counsellor, agent, or admin"
          />
        </div>
        {handoffErr ? <p className="er">{handoffErr}</p> : null}
      </div>
    );
    modalConfirm = 'Reassign and revoke';
    modalDanger = true;
  }

  return (
    <>
      <PageHead
        title="Access"
        subtitle="Approve new agents, set roles and choose what each person can open."
        actions={
          <button
            type="button"
            className="btn"
            onClick={() => {
              setCreateErr('');
              setCreateOpen(true);
            }}
          >
            <Icon name="user-plus" />
            Add a person
          </button>
        }
      />

      {items.length ? (
        <div
          className="card"
          style={{ marginBottom: 20, borderColor: 'var(--rm-brand-deep)' }}
        >
          <div className="row sp">
            <h3>Waiting for approval</h3>
            <span className="tag d">{items.length}</span>
          </div>
          {isLoading ? <p className="mut sm">Loading…</p> : null}
          {items.map((r: AccessRequestRow) => (
            <div key={r.id} className="req">
              <div>
                <b>{r.fullName}</b>
                <div className="sm mut">
                  {r.email} · {r.agency ?? 'No agency'} · {r.role} ·{' '}
                  {formatWhen(r.createdAt)}
                </div>
              </div>
              <div className="row">
                <button
                  type="button"
                  className="btn s"
                  disabled={busy}
                  onClick={() =>
                    setPending({
                      kind: 'approve',
                      id: r.id,
                      name: r.fullName,
                      email: r.email,
                    })
                  }
                >
                  <Icon name="circle-check" />
                  Approve
                </button>
                <button
                  type="button"
                  className="btn o s"
                  disabled={busy}
                  onClick={() =>
                    setPending({
                      kind: 'decline',
                      id: r.id,
                      name: r.fullName,
                      email: r.email,
                    })
                  }
                >
                  <Icon name="x" />
                  Decline
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {loadingPeople ? <p className="mut">Loading people…</p> : null}
      <div className="row" style={{ marginBottom: 12, gap: 8, flexWrap: 'wrap' }}>
        <input
          aria-label="Search people"
          placeholder="Search name or email"
          value={peopleQ}
          style={{ maxWidth: 280, borderRadius: 999 }}
          onChange={(e) => {
            setPeopleQ(e.target.value);
            setPeoplePage(1);
          }}
        />
        <select
          aria-label="Role"
          value={peopleRole}
          style={{ width: 'auto', borderRadius: 999 }}
          onChange={(e) => {
            setPeopleRole(e.target.value);
            setPeoplePage(1);
          }}
        >
          <option>All</option>
          {ROLES.map((r) => (
            <option key={r}>{r}</option>
          ))}
        </select>
        <select
          aria-label="Status"
          value={peopleStatus}
          style={{ width: 'auto', borderRadius: 999 }}
          onChange={(e) => {
            setPeopleStatus(e.target.value);
            setPeoplePage(1);
          }}
        >
          <option>All</option>
          <option>Active</option>
          <option>Revoked</option>
        </select>
      </div>
      <div className="card" style={{ padding: 0, overflow: 'auto' }}>
        <table className="rt">
          <thead>
            <tr>
              <th>Person</th>
              <th>Role</th>
              <th>Can open</th>
              <th>Last seen</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {peopleSlice.map((a: PortalUserRow) => {
              const active = a.active !== false;
              const isSelf = me?.id === a.id;
              const permText = formatPermissions(a.permissions);
              return (
                <tr key={a.id}>
                  <td data-l="Person">
                    <b>{a.displayName}</b>
                    <br />
                    <span className="sm mut">{a.email}</span>
                    {a.agency ? (
                      <>
                        <br />
                        <span className="sm mut">{a.agency}</span>
                      </>
                    ) : null}
                  </td>
                  <td data-l="Role">{a.role}</td>
                  <td data-l="Can open" className="sm">
                    {permText || <span className="mut">Nothing</span>}
                  </td>
                  <td data-l="Last seen" className="sm mut">
                    {formatWhen(a.lastSeenAt)}
                  </td>
                  <td data-l="Status">
                    <span className={`tag ${active ? '' : 'rev'}`}>
                      {active ? 'Active' : 'Revoked'}
                    </span>
                  </td>
                  <td className="act" style={{ whiteSpace: 'nowrap' }}>
                    {isSelf ? null : (
                      <button
                        type="button"
                        className="ib w"
                        aria-label={`Edit permissions for ${a.displayName}`}
                        title="Edit permissions"
                        onClick={() => {
                          setPermErr('');
                          setPermUser(a);
                          setPermDraft([...(a.permissions ?? [])]);
                        }}
                      >
                        <Icon name="edit" />
                      </button>
                    )}{' '}
                    {isSelf ? (
                      <span className="mut" aria-hidden>
                        —
                      </span>
                    ) : (
                      <label
                        className="sw"
                        title={active ? 'Active' : 'Revoked'}
                      >
                        <input
                          type="checkbox"
                          checked={active}
                          disabled={busy}
                          aria-label={`Access for ${a.displayName}`}
                          onChange={() => {
                            if (loadingStudents) return;
                            const turningOff = active;
                            const owned = (students?.items ?? []).filter(
                              (s) => s.counsellor?.id === a.id,
                            );
                            setHandoffErr('');
                            setHandoffTo('');
                            if (turningOff && owned.length) {
                              setPending({
                                kind: 'handoff',
                                id: a.id,
                                name: a.displayName,
                                email: a.email,
                                studentIds: owned.map((s) => s.id),
                              });
                              return;
                            }
                            setPending({
                              kind: 'revoke',
                              id: a.id,
                              name: a.displayName,
                              email: a.email,
                              active: !active,
                            });
                          }}
                        />
                        <i />
                      </label>
                    )}
                  </td>
                </tr>
              );
            })}
            {!filteredUsers.length && !loadingPeople ? (
              <tr>
                <td colSpan={6} className="mut">
                  {users.length ? 'No people match.' : 'No accounts yet.'}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
        <Pager page={peoplePageSafe} pages={peoplePages} onPage={setPeoplePage} />
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <h3>Audit log</h3>
        <div className="row" style={{ margin: '12px 0', gap: 8, flexWrap: 'wrap' }}>
          <input
            aria-label="Search audit messages"
            placeholder="Search message"
            value={auditQ}
            style={{ maxWidth: 280, borderRadius: 999 }}
            onChange={(e) => {
              setAuditQ(e.target.value);
              setAuditPage(1);
            }}
          />
          <input
            aria-label="Filter by person"
            placeholder="Who made the change"
            value={auditActor}
            style={{ maxWidth: 220, borderRadius: 999 }}
            onChange={(e) => {
              setAuditActor(e.target.value);
              setAuditPage(1);
            }}
          />
        </div>
        {loadingAudit ? <p className="mut sm">Loading…</p> : null}
        <div style={{ overflow: 'auto' }}>
          <table className="rt">
            <tbody>
              {auditSlice.map((l: AuditEventRow) => (
                <tr key={l.id}>
                  <td
                    data-l="When"
                    className="mut"
                    style={{ width: 140, whiteSpace: 'nowrap' }}
                  >
                    {formatAuditWhen(l.createdAt)}
                  </td>
                  <td data-l="Change">{l.message}</td>
                  <td data-l="By" className="mut">
                    {l.actorDisplayName}
                  </td>
                </tr>
              ))}
              {!filteredAudit.length && !loadingAudit ? (
                <tr>
                  <td colSpan={3} className="mut sm">
                    {auditItems.length ? 'No activity matches.' : 'No activity yet.'}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        <Pager page={auditPageSafe} pages={auditPages} onPage={setAuditPage} />
      </div>

      <ConfirmModal
        open={!!pending}
        title={modalTitle}
        confirmLabel={modalConfirm}
        cancelLabel="Cancel"
        busy={busy}
        danger={modalDanger}
        onConfirm={onConfirmPending}
        onCancel={() => {
          setPending(null);
          setHandoffTo('');
          setHandoffErr('');
        }}
      >
        {modalBody}
      </ConfirmModal>

      <ConfirmModal
        open={!!tempPasswordModal}
        title={tempPasswordModal?.title ?? ''}
        confirmLabel="Done"
        cancelLabel={copied ? 'Copied' : 'Copy details'}
        onConfirm={() => {
          setCopied(false);
          setTempPasswordModal(null);
        }}
        onCancel={() => {
          setCopied(false);
          setTempPasswordModal(null);
        }}
        onSecondary={() => {
          if (!tempPasswordModal) return;
          const text = `Email: ${tempPasswordModal.email}\n\nTemporary Password: ${tempPasswordModal.password}`;
          void navigator.clipboard.writeText(text).then(() => setCopied(true));
        }}
      >
        {tempPasswordModal ? (
          <div>
            <p className="sm" style={{ marginBottom: 12 }}>
              Share these sign-in details securely with{' '}
              <b>{tempPasswordModal.email}</b>.
            </p>
            <p className="sm">
              Temporary password:{' '}
              <code style={{ fontSize: '1.05em' }}>
                {tempPasswordModal.password}
              </code>
            </p>
          </div>
        ) : null}
      </ConfirmModal>

      {permUser ? (
        <>
          <button
            type="button"
            className="ov open"
            aria-label="Close"
            onClick={() => setPermUser(null)}
            style={{ border: 0, padding: 0, cursor: 'pointer' }}
          />
          <aside className="drw open" aria-label="Edit permissions">
            <div className="row sp">
              <span className={`tag ${permUser.active === false ? 'rev' : ''}`}>
                {permUser.active === false ? 'Revoked' : 'Active'}
              </span>
              <button
                type="button"
                className="ib w"
                aria-label="Close"
                onClick={() => setPermUser(null)}
              >
                <Icon name="x" />
              </button>
            </div>
            <h2 style={{ margin: '16px 0 4px' }}>{permUser.displayName}</h2>
            <p className="sm mut">{permUser.email}</p>
            <p className="sm" style={{ marginTop: 12 }}>
              Role: <b>{permUser.role}</b>
            </p>
            <h3 style={{ marginTop: 20 }}>Can open</h3>
            <div className="f" style={{ marginTop: 12 }}>
              {PERMISSION_KEYS.map((key) => {
                const lockSelf = me?.id === permUser.id && key === 'access';
                const on = permDraft.includes(key);
                return (
                  <div key={key} className="row sp" style={{ flexWrap: 'nowrap' }}>
                    <span>{PERMISSION_LABELS[key]}</span>
                    <label className="sw">
                      <input
                        type="checkbox"
                        checked={on || lockSelf}
                        disabled={lockSelf || savePerms.isPending}
                        onChange={() => {
                          setPermDraft((cur) =>
                            cur.includes(key)
                              ? cur.filter((k) => k !== key)
                              : [...cur, key],
                          );
                        }}
                      />
                      <i />
                    </label>
                  </div>
                );
              })}
            </div>
            {permErr ? <p className="er">{permErr}</p> : null}
            <button
              type="button"
              className="btn"
              style={{ marginTop: 16 }}
              disabled={savePerms.isPending}
              onClick={() => {
                setPermErr('');
                const next =
                  me?.id === permUser.id && !permDraft.includes('access')
                    ? [...permDraft, 'access']
                    : permDraft;
                setPermDraft(next);
                savePerms.mutate(next);
              }}
            >
              Save permissions
            </button>
          </aside>
        </>
      ) : null}

      {createOpen ? (
        <>
          <button
            type="button"
            className="ov open"
            aria-label="Close"
            onClick={() => setCreateOpen(false)}
            style={{ border: 0, padding: 0, cursor: 'pointer' }}
          />
          <aside className="drw open" aria-label="Add a person">
            <div className="row sp">
              <span className="tag">New account</span>
              <button
                type="button"
                className="ib w"
                aria-label="Close"
                onClick={() => setCreateOpen(false)}
              >
                <Icon name="x" />
              </button>
            </div>
            <h2 style={{ margin: '16px 0 4px' }}>Add a person</h2>
            <p className="sm mut">
              Creates an account with a temporary password they must change on
              first sign-in.
            </p>
            <form className="f" style={{ marginTop: 20 }} onSubmit={onCreateSubmit}>
              <div>
                <label htmlFor="an_n">Full name</label>
                <input
                  id="an_n"
                  value={form.fullName}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, fullName: e.target.value }))
                  }
                />
              </div>
              <div>
                <label htmlFor="an_e">Email</label>
                <input
                  id="an_e"
                  type="email"
                  value={form.email}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, email: e.target.value }))
                  }
                />
              </div>
              <div>
                <label htmlFor="an_a">Agency (agents only)</label>
                <input
                  id="an_a"
                  placeholder="Optional"
                  value={form.agency}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, agency: e.target.value }))
                  }
                />
              </div>
              <div>
                <label htmlFor="an_r">Role</label>
                <select
                  id="an_r"
                  value={form.role}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      role: e.target.value as (typeof ROLES)[number],
                    }))
                  }
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
              {createErr ? <p className="er">{createErr}</p> : null}
              <button type="submit" className="btn" disabled={createUser.isPending}>
                <Icon name="user-plus" />
                Create account
              </button>
            </form>
          </aside>
        </>
      ) : null}
    </>
  );
}