'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { PageHead } from '@/components/page-head';
import { RmMarkBand } from '@/lib/portal-helpers';
import { api } from '@/lib/api-client';

export default function SearchHubPage() {
  const { data } = useQuery({
    queryKey: ['students'],
    queryFn: () => api.students(),
  });
  const students = data?.items ?? [];
  const need = students.filter((s) => !s.consultationDone);
  const ready = students.filter((s) => s.consultationDone);

  return (
    <>
      <PageHead title="AI search" subtitle="" />
      <div className="band dk">
        <div className="wave">
          <i />
          <i />
        </div>
        <div className="row" style={{ gap: 22 }}>
          <RmMarkBand onInk />
          <div style={{ minWidth: 0 }}>
            <h2 className="gt">Who are we finding schools for today?</h2>
            <p>Pick a student who has had a consultation.</p>
          </div>
        </div>
      </div>
      {need.length ? (
        <>
          <h3 style={{ marginBottom: 12 }}>Needs consultation first</h3>
          <div className="grid g3" style={{ marginBottom: 26 }}>
            {need.map((s) => (
              <div key={s.id} className="card gl">
                <b>{s.name}</b>
                <p className="sm mut">{s.service}</p>
                <Link className="btn o s" style={{ marginTop: 12 }} href={`/app/student/${s.id}`}>
                  Open student
                </Link>
              </div>
            ))}
          </div>
        </>
      ) : null}
      <h3 style={{ marginBottom: 12 }}>Ready to search</h3>
      <div className="grid g3">
        {ready.map((s) => (
          <div key={s.id} className="card gl">
            <b>{s.name}</b>
            <p className="sm mut">{s.service}</p>
            <Link className="btn s" style={{ marginTop: 12 }} href={`/app/search/${s.id}`}>
              Run search
            </Link>
          </div>
        ))}
        {!ready.length ? <p className="mut">No students are ready to search yet.</p> : null}
      </div>
    </>
  );
}
