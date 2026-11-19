'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { PageHead } from '@/components/page-head';
import { Icon } from '@/components/icon';
import { RmMarkBand } from '@/lib/portal-helpers';
import { api, type StudentRow } from '@/lib/api-client';

function when(iso?: string | null) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function topMatch(s: StudentRow) {
  const name = s.searchResults?.[0]?.name;
  return name ? name.slice(0, 34) : 'saved results';
}

export default function SearchHubPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['students'],
    queryFn: () => api.students(),
  });
  const students = data?.items ?? [];
  const need = students.filter((s) => !s.consultationDone && s.stage >= 1);
  const searched = students.filter((s) => s.consultationDone && s.searchedAt);
  const ready = students.filter((s) => s.consultationDone && !s.searchedAt);

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
            <p>Pick a student below, or open an earlier search.</p>
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
                <Link
                  className="btn o s"
                  style={{ marginTop: 12 }}
                  href={`/app/consult/${s.id}`}
                >
                  Continue consultation
                </Link>
              </div>
            ))}
          </div>
        </>
      ) : null}

      <h3 style={{ marginBottom: 12 }}>Searched before</h3>
      <div className="grid g3" style={{ marginBottom: 26 }}>
        {searched.map((s) => (
          <div key={s.id} className="card gl">
            <div className="row sp">
              <b>{s.name}</b>
              <span className="tag">{s.service}</span>
            </div>
            <p className="sm mut" style={{ margin: '6px 0 12px' }}>
              {when(s.searchedAt)} · top match {topMatch(s)}
            </p>
            <div className="row">
              <Link className="btn o s" href={`/app/search/${s.id}`}>
                <Icon name="eye" /> Open
              </Link>
              <Link className="btn s" href={`/app/search/${s.id}?run=1`}>
                <Icon name="refresh" /> Search again
              </Link>
            </div>
          </div>
        ))}
        {!searched.length && !isLoading ? (
          <p className="mut">No searches yet.</p>
        ) : null}
      </div>

      <h3 style={{ marginBottom: 12 }}>Ready to search</h3>
      <div className="grid g3">
        {ready.map((s) => (
          <div key={s.id} className="card gl">
            <b>{s.name}</b>
            <p className="sm mut">Consultation done · {s.service}</p>
            <Link
              className="btn s"
              style={{ marginTop: 12 }}
              href={`/app/search/${s.id}?run=1`}
            >
              <Icon name="sparkle" /> Search
            </Link>
          </div>
        ))}
        {!ready.length && !isLoading ? (
          <p className="mut">No students are waiting for a first search.</p>
        ) : null}
      </div>
    </>
  );
}
