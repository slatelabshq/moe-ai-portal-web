'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Icon } from '@/components/icon';
import { RmMarkBand, Spark } from '@/lib/portal-helpers';
import { api, StudentRow } from '@/lib/api-client';
import { stageLabel } from '@/lib/stages';
import { useAuth } from '@/components/auth-provider';

export default function AppHomePage() {
  const { user } = useAuth();
  const { data } = useQuery({
    queryKey: ['students'],
    queryFn: () => api.students(),
  });
  const { data: proposalsData } = useQuery({
    queryKey: ['proposals'],
    queryFn: () => api.proposals(),
  });
  const students = data?.items ?? [];
  const need = students.filter((s) => !s.consultationDone && s.stage >= 0);
  const proposalItems = proposalsData?.items ?? [];
  const proposalCount = proposalItems.length;
  const openedByFamilies = proposalItems.reduce((n, p) => n + p.openCount, 0);
  const dateStr = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  const first = user?.displayName.split(' ')[0] ?? '';

  return (
    <>
      <div className="band dk">
        <div className="wave">
          <i />
          <i />
          <i />
        </div>
        <div className="row" style={{ gap: 22 }}>
          <RmMarkBand onInk />
          <div style={{ minWidth: 0 }}>
            <p className="eye" style={{ color: 'var(--rm-text-on-ink-muted)' }}>
              {dateStr}
            </p>
            <h1 className="gt">Good morning, {first}.</h1>
            <p>
              {need.length}{' '}
              {need.length === 1 ? 'student needs' : 'students need'} a
              consultation. Proposals will show here once a family opens one.
            </p>
          </div>
        </div>
      </div>
      <div className="grid g4" style={{ marginBottom: 24 }}>
        {[
          ['Your students', students.length],
          ['Need consultation', need.length],
          ['Proposals', proposalCount],
          ['Opened by families', openedByFamilies],
        ].map(([label, n]) => (
          <div key={String(label)} className="card gl stat">
            <span>{label}</span>
            <b>{n}</b>
            <Spark values={[0, 0, 0, Number(n)]} />
          </div>
        ))}
      </div>
      <div className="grid g2">
        <div className="card">
          <div className="row sp" style={{ marginBottom: 8 }}>
            <h3>Needs you today</h3>
            <Link className="btn o s" href="/app/students">
              All students <Icon name="arrow" className="ar" />
            </Link>
          </div>
          <table className="rt">
            <tbody>
              {students
                .filter((s) => s.stage <= 7)
                .sort((a, b) => a.stage - b.stage)
                .slice(0, 6)
                .map((s: StudentRow) => (
                  <tr key={s.id} className="hv">
                    <td data-l="Student">
                      <Link href={`/app/students/${s.id}`}>
                        <b>{s.name}</b>
                      </Link>
                      <br />
                      <span className="sm mut">{s.phone ?? ''}</span>
                    </td>
                    <td data-l="Stage">
                      <span className="tag">{stageLabel(s.stage)}</span>
                    </td>
                  </tr>
                ))}
              {!students.length ? (
                <tr>
                  <td className="mut">No students yet. Add the first one.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        <div className="card">
          <h3>Find schools</h3>
          <p className="sm mut" style={{ margin: '6px 0 12px' }}>
            School records come from the database, not a sample list.
          </p>
          <Link className="btn o s" href="/app/search">
            <Icon name="sparkle" />
            Open AI search
          </Link>
        </div>
      </div>
    </>
  );
}
