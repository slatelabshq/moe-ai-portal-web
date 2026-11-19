'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Icon } from '@/components/icon';
import { api, StudentRow } from '@/lib/api-client';
import { stageLabel } from '@/lib/stages';
import { useAuth } from '@/components/auth-provider';

const PAGE = 8;
const STAGE_FILTER = ['All', 'Needs consultation', ...Array.from({ length: 15 }, (_, i) => stageLabel(i))];

export default function StudentsApiPage() {
  const { user } = useAuth();
  const [q, setQ] = useState('');
  const [stageFilter, setStageFilter] = useState('All');
  const [serviceFilter, setServiceFilter] = useState('All');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['students'],
    queryFn: () => api.students(),
  });

  const services = useMemo(() => {
    const set = new Set<string>();
    for (const s of data?.items ?? []) {
      if (s.service) set.add(s.service);
    }
    return [...set].sort();
  }, [data?.items]);

  useEffect(() => {
    setPage(1);
  }, [q, stageFilter, serviceFilter]);

  const items = useMemo(() => {
    const raw = data?.items ?? [];
    const query = q.trim().toLowerCase();
    return raw.filter((s) => {
      if (query && !s.name.toLowerCase().includes(query)) return false;
      if (serviceFilter !== 'All' && s.service !== serviceFilter) return false;
      if (stageFilter === 'All') return true;
      if (stageFilter === 'Needs consultation') {
        return !s.consultationDone && s.stage >= 1;
      }
      const idx = STAGE_FILTER.indexOf(stageFilter) - 2;
      return idx >= 0 && s.stage === idx;
    });
  }, [data?.items, q, stageFilter, serviceFilter]);

  const pages = Math.max(1, Math.ceil(items.length / PAGE));
  const pageSafe = Math.min(page, pages);
  const slice = items.slice((pageSafe - 1) * PAGE, pageSafe * PAGE);

  return (
    <>
      <div className="ph">
        <div>
          <h1 className="gtd">Students</h1>
          <p>Your students from first contact to enrolment.</p>
        </div>
        <Link className="btn" href="/app/new">
          <Icon name="user-plus" />
          New student
        </Link>
      </div>

      <div className="row" style={{ marginBottom: 16, gap: 12, flexWrap: 'wrap' }}>
        <input
          placeholder="Search by name"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={{ maxWidth: 300, borderRadius: 999 }}
          aria-label="Search students by name"
        />
        <select
          value={stageFilter}
          onChange={(e) => setStageFilter(e.target.value)}
          style={{ width: 'auto', borderRadius: 999 }}
          aria-label="Stage"
        >
          {STAGE_FILTER.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        {services.length ? (
          <select
            value={serviceFilter}
            onChange={(e) => setServiceFilter(e.target.value)}
            style={{ width: 'auto', borderRadius: 999 }}
            aria-label="Service"
          >
            <option>All</option>
            {services.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        ) : null}
      </div>

      {isLoading ? <p className="mut">Loading…</p> : null}
      <div className="card" style={{ padding: 0 }}>
        <table className="rt">
          <thead>
            <tr>
              <th>Student</th>
              <th>Service</th>
              <th>Stage</th>
              {user?.role === 'Admin' ? <th>Counsellor</th> : null}
              <th>Next</th>
            </tr>
          </thead>
          <tbody>
            {slice.map((s: StudentRow) => (
              <tr key={s.id} className="hv">
                <td data-l="Student">
                  <Link href={`/app/student/${s.id}`}>
                    <b>{s.name}</b>
                  </Link>
                  <br />
                  <span className="sm mut">{s.phone ?? '—'}</span>
                </td>
                <td data-l="Service">{s.service}</td>
                <td data-l="Stage">
                  <span className="tag">
                    {!s.consultationDone && s.stage >= 1
                      ? 'Needs consultation'
                      : stageLabel(s.stage)}
                  </span>
                </td>
                {user?.role === 'Admin' ? (
                  <td data-l="Counsellor">{s.counsellor?.displayName ?? '—'}</td>
                ) : null}
                <td data-l="Next">
                  {!s.consultationDone ? (
                    <Link className="sm" href={`/app/consult/${s.id}`}>
                      Consult
                    </Link>
                  ) : !s.stage ? (
                    <Link className="sm" href={`/app/search/${s.id}`}>
                      Search
                    </Link>
                  ) : (
                    <Link className="sm" href={`/app/student/${s.id}`}>
                      Open
                    </Link>
                  )}
                </td>
              </tr>
            ))}
            {!slice.length && !isLoading ? (
              <tr>
                <td colSpan={user?.role === 'Admin' ? 5 : 4} className="mut">
                  No students match.
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
    </>
  );
}
