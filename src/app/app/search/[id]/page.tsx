'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { PageHead } from '@/components/page-head';
import { RmMarkBand, StudentMono } from '@/lib/portal-helpers';
import { api } from '@/lib/api-client';

const STEPS = [
  'Reading all school records…',
  'Removing schools that cannot take this student…',
  'Scoring fit, fees and data quality…',
  'Ranking the best matches…',
];

export default function SearchStudentPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const { data: student } = useQuery({
    queryKey: ['student', id],
    queryFn: () => api.student(id),
  });
  const [phase, setPhase] = useState<'idle' | 'running' | 'done' | 'error'>('idle');
  const [step, setStep] = useState(0);
  const [result, setResult] = useState<Awaited<ReturnType<typeof api.runSearch>> | null>(null);

  useEffect(() => {
    if (!student?.consultationDone || phase !== 'idle') return;
    setPhase('running');
    let i = 0;
    const tick = setInterval(() => {
      i = Math.min(STEPS.length - 1, i + 1);
      setStep(i);
    }, 700);
    api
      .runSearch(id)
      .then((r) => {
        clearInterval(tick);
        setStep(STEPS.length - 1);
        setResult(r);
        setPhase('done');
        void qc.invalidateQueries({ queryKey: ['student', id] });
      })
      .catch(() => {
        clearInterval(tick);
        setPhase('error');
      });
    return () => clearInterval(tick);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [student?.consultationDone, id]);

  if (!student) return <p className="mut">Loading…</p>;
  if (!student.consultationDone) {
    return (
      <div className="card">
        <p>Consultation must be marked done before search.</p>
        <Link href={`/app/student/${id}`}>Back to student</Link>
      </div>
    );
  }

  const first = student.name.split(' ')[0];

  return (
    <>
      <PageHead title={`Matches for ${student.name}`} subtitle="" />
      {phase === 'running' || phase === 'idle' ? (
        <div className="card ld">
          <SearchLoader first={first} step={step} kb={result?.kbCount ?? '…'} />
        </div>
      ) : null}
      {phase === 'done' && result ? (
        <div>
          <p className="sm mut" style={{ marginBottom: 16 }}>
            {result.pool} scored · {result.dir} direct · {result.ind} indirect ·{' '}
            {result.rem.length} removed
          </p>
          <div className="grid g3">
            {result.res.map((row) => (
              <div key={row.id} className="card gl">
                <div className="row" style={{ gap: 10 }}>
                  <StudentMono name={row.id} />
                  <div>
                    <b>{row.name ?? row.id}</b>
                    <p className="sm mut">
                      {row.score}% · {row.pt}
                    </p>
                  </div>
                </div>
                <ul className="why" style={{ marginTop: 10 }}>
                  {row.why.slice(0, 4).map((w) => (
                    <li key={w} className="sm">
                      {w}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <button
            type="button"
            className="btn"
            style={{ marginTop: 20 }}
            onClick={() => router.push(`/app/student/${id}`)}
          >
            Back to student
          </button>
        </div>
      ) : null}
      {phase === 'error' ? (
        <p className="mut">Search failed. Check the API and school import.</p>
      ) : null}
    </>
  );
}

function SearchLoader({
  first,
  step,
  kb,
}: {
  first: string;
  step: number;
  kb: number | string;
}) {
  return (
    <div className="row" style={{ gap: 22 }}>
      <RmMarkBand />
      <div style={{ flex: 1 }}>
        <h3>Finding schools for {first}</h3>
        <p className="sm mut">{kb} records in the database</p>
        <ul className="steps" style={{ marginTop: 14 }}>
          {STEPS.map((s, i) => (
            <li key={s} className={i <= step ? 'done' : ''}>
              {s}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}