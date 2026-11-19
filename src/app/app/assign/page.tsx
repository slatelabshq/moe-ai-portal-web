'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { ConfirmModal } from '@/components/confirm-modal';
import { PageHead } from '@/components/page-head';
import { PersonSearch } from '@/components/person-search';
import { api, type StudentRow } from '@/lib/api-client';
import { STAGE_LABELS, stageLabel } from '@/lib/stages';

const PAGE_SIZE = 8;
const UNASSIGNED = '__unassigned__';

type Staged = {
  studentId: string;
  studentName: string;
  toId: string;
  toName: string;
};

export default function AssignPage() {
  const qc = useQueryClient();
  const [q, setQ] = useState('');
  const [stage, setStage] = useState('All');
  const [counsellorFilter, setCounsellorFilter] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);
  const [bulkTo, setBulkTo] = useState('');
  const [staged, setStaged] = useState<Staged | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [err, setErr] = useState('');

  const { data: students, isLoading: sl } = useQuery({
    queryKey: ['students'],
    queryFn: () => api.students(),
  });
  const { data: users, isLoading: ul } = useQuery({
    queryKey: ['users'],
    queryFn: () => api.users(),
  });

  const assign = useMutation({
    mutationFn: ({
      studentIds,
      counsellorId,
    }: {
      studentIds: string[];
      counsellorId: string;
    }) => api.assignStudents(studentIds, counsellorId),
    onSuccess: () => {
      setStaged(null);
      setBulkOpen(false);
      setBulkTo('');
      setSelected([]);
      setErr('');
      qc.invalidateQueries({ queryKey: ['students'] });
      qc.invalidateQueries({ queryKey: ['audit'] });
    },
    onError: (e: Error) => setErr(e.message),
  });

  const counsellors = (users?.items ?? []).filter(
    (u) =>
      u.active !== false &&
      ['Counsellor', 'Agent', 'Admin'].includes(u.role),
  );

  const filterPeople = useMemo(
    () => [
      { id: UNASSIGNED, displayName: 'Unassigned', role: 'No counsellor' },
      ...counsellors,
    ],
    [counsellors],
  );

  const items = useMemo(() => {
    const query = q.trim().toLowerCase();
    let list = [...(students?.items ?? [])] as StudentRow[];
    if (query) {
      list = list.filter((s) => s.name.toLowerCase().includes(query));
    }
    if (stage !== 'All') {
      list = list.filter((s) => stageLabel(s.stage) === stage);
    }
    if (counsellorFilter === UNASSIGNED) {
      list = list.filter((s) => !s.counsellor?.id);
    } else if (counsellorFilter) {
      list = list.filter((s) => s.counsellor?.id === counsellorFilter);
    }
    list.sort((a, b) => Number(!!b.counsellor?.id) - Number(!!a.counsellor?.id));
    return list;
  }, [students?.items, q, stage, counsellorFilter]);

  const pages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const pageSafe = Math.min(page, pages);
  const slice = items.slice((pageSafe - 1) * PAGE_SIZE, pageSafe * PAGE_SIZE);
  const pageIds = slice.map((s) => s.id);
  const allOnPage = pageIds.length > 0 && pageIds.every((id) => selected.includes(id));

  useEffect(() => {
    if (page > pages) setPage(pages);
  }, [page, pages]);

  function resetPage() {
    setPage(1);
  }

  const bulkPerson = counsellors.find((c) => c.id === bulkTo);
  const stagedPerson = counsellors.find((c) => c.id === staged?.toId);

  return (
    <>
      <PageHead
        title="Assignments"
        subtitle="Every student and their counsellor or agent. Only admins can assign or reassign."
      />
      {sl || ul ? <p className="mut">Loading…</p> : null}
      <div className="row" style={{ marginBottom: 12, gap: 8, flexWrap: 'wrap' }}>
        <input
          aria-label="Search student name"
          placeholder="Search student name"
          value={q}
          style={{ maxWidth: 280, borderRadius: 999 }}
          onChange={(e) => {
            setQ(e.target.value);
            resetPage();
          }}
        />
        <select
          aria-label="Stage"
          value={stage}
          style={{ width: 'auto', borderRadius: 999 }}
          onChange={(e) => {
            setStage(e.target.value);
            resetPage();
          }}
        >
          <option>All</option>
          {STAGE_LABELS.map((label) => (
            <option key={label}>{label}</option>
          ))}
        </select>
        <div style={{ minWidth: 240, flex: '1 1 240px', maxWidth: 360 }}>
          <PersonSearch
            people={filterPeople}
            value={counsellorFilter}
            onChange={(id) => {
              setCounsellorFilter(id);
              resetPage();
            }}
            emptyLabel="Everyone"
            placeholder="Counsellor"
          />
        </div>
      </div>
      {selected.length > 0 ? (
        <div
          className="card"
          style={{
            marginBottom: 16,
            overflow: 'visible',
            display: 'flex',
            gap: 12,
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          <b>{selected.length} selected</b>
          <div style={{ minWidth: 240, flex: '1 1 240px', maxWidth: 360 }}>
            <PersonSearch
              people={counsellors}
              value={bulkTo}
              onChange={setBulkTo}
              emptyLabel="Choose a counsellor"
              placeholder="Reassign to"
            />
          </div>
          <button
            type="button"
            className="btn"
            disabled={assign.isPending}
            onClick={() => {
              setErr('');
              setBulkOpen(true);
            }}
          >
            Reassign
          </button>
        </div>
      ) : null}
      <div className="card" style={{ padding: 0, overflow: 'auto' }}>
        <table className="rt">
          <thead>
            <tr>
              <th style={{ width: 36 }}>
                <input
                  type="checkbox"
                  aria-label="Select all on this page"
                  checked={allOnPage}
                  onChange={() => {
                    setSelected((cur) =>
                      allOnPage
                        ? cur.filter((id) => !pageIds.includes(id))
                        : [...new Set([...cur, ...pageIds])],
                    );
                  }}
                />
              </th>
              <th>Student</th>
              <th>Stage</th>
              <th>Source</th>
              <th>Counsellor</th>
            </tr>
          </thead>
          <tbody>
            {slice.map((s: StudentRow) => {
              const current = s.counsellor?.id ?? '';
              const shown = staged?.studentId === s.id ? staged.toId : current;
              return (
                <tr key={s.id}>
                  <td data-l="">
                    <input
                      type="checkbox"
                      aria-label={`Select ${s.name}`}
                      checked={selected.includes(s.id)}
                      onChange={() => {
                        setSelected((cur) =>
                          cur.includes(s.id)
                            ? cur.filter((id) => id !== s.id)
                            : [...cur, s.id],
                        );
                      }}
                    />
                  </td>
                  <td data-l="Student">
                    <b>{s.name}</b>
                    {s.phone ? (
                      <>
                        <br />
                        <span className="sm mut">{s.phone}</span>
                      </>
                    ) : null}
                  </td>
                  <td data-l="Stage">
                    <span className="tag">{stageLabel(s.stage)}</span>
                  </td>
                  <td data-l="Source" className="sm mut">
                    {s.source ?? 'Portal'}
                  </td>
                  <td data-l="Counsellor">
                    <select
                      aria-label={`Counsellor for ${s.name}`}
                      value={shown}
                      disabled={assign.isPending}
                      style={{
                        minWidth: 170,
                        borderColor: current ? undefined : '#A8321F',
                      }}
                      onChange={(e) => {
                        const cid = e.target.value;
                        if (!cid || cid === current) {
                          if (staged?.studentId === s.id) setStaged(null);
                          return;
                        }
                        const person = counsellors.find((c) => c.id === cid);
                        if (!person) return;
                        setErr('');
                        setStaged({
                          studentId: s.id,
                          studentName: s.name,
                          toId: cid,
                          toName: person.displayName,
                        });
                      }}
                    >
                      <option value="">Unassigned</option>
                      {counsellors.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.displayName}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              );
            })}
            {!slice.length && !sl ? (
              <tr>
                <td colSpan={5} className="mut">
                  {items.length ? 'No students on this page.' : 'No students match.'}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
        {pages > 1 ? (
          <div className="row" style={{ padding: '12px 16px', gap: 8 }}>
            <button
              type="button"
              className="btn o s"
              disabled={pageSafe <= 1}
              onClick={() => setPage(pageSafe - 1)}
            >
              Previous
            </button>
            <span className="sm mut">
              Page {pageSafe} of {pages}
            </span>
            <button
              type="button"
              className="btn o s"
              disabled={pageSafe >= pages}
              onClick={() => setPage(pageSafe + 1)}
            >
              Next
            </button>
          </div>
        ) : null}
      </div>

      <ConfirmModal
        open={!!staged}
        title={staged ? `Reassign ${staged.studentName}` : ''}
        confirmLabel="Reassign"
        cancelLabel="Cancel"
        busy={assign.isPending}
        onConfirm={() => {
          if (!staged) return;
          assign.mutate({
            studentIds: [staged.studentId],
            counsellorId: staged.toId,
          });
        }}
        onCancel={() => setStaged(null)}
      >
        {staged ? (
          <div>
            <p className="mut sm">This student will move to the person below.</p>
            <div className="person-picked">
              <b>{staged.toName}</b>
              {stagedPerson?.role ? (
                <span className="sm mut">{stagedPerson.role}</span>
              ) : null}
            </div>
            {err ? <p className="er">{err}</p> : null}
          </div>
        ) : null}
      </ConfirmModal>

      <ConfirmModal
        open={bulkOpen}
        title={`Reassign ${selected.length} student${selected.length === 1 ? '' : 's'}`}
        confirmLabel="Reassign"
        cancelLabel="Cancel"
        busy={assign.isPending}
        confirmDisabled={!bulkTo}
        onConfirm={() => {
          if (!bulkTo || !selected.length) return;
          assign.mutate({ studentIds: selected, counsellorId: bulkTo });
        }}
        onCancel={() => setBulkOpen(false)}
      >
        <div>
          <p className="mut sm">
            {bulkPerson
              ? 'These students will move to the person below.'
              : 'Choose who should take these students.'}
          </p>
          <div style={{ marginTop: 12 }}>
            {bulkPerson ? (
              <div className="person-picked" style={{ marginTop: 0 }}>
                <b>{bulkPerson.displayName}</b>
                <span className="sm mut">{bulkPerson.role}</span>
              </div>
            ) : (
              <PersonSearch
                people={counsellors}
                value={bulkTo}
                onChange={setBulkTo}
                emptyLabel="Choose a person"
                placeholder="Search counsellor, agent, or admin"
              />
            )}
          </div>
          {err && bulkOpen ? <p className="er">{err}</p> : null}
        </div>
      </ConfirmModal>
    </>
  );
}
