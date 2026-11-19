'use client';

import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { PageHead } from '@/components/page-head';
import { Icon } from '@/components/icon';
import { RmMarkBand, StudentMono } from '@/lib/portal-helpers';
import { api, type MatchRow, type StudentDetail } from '@/lib/api-client';

const STEPS = [
  'Reading the school records',
  'Removing schools that cannot take this student',
  'Scoring fit, fees and data quality',
  'Ranking the best matches',
];

type SearchPayload = {
  res: MatchRow[];
  rem: { n: string; r: string }[];
  pool: number;
  dir: number;
  ind: number;
  selectedSchoolIds: string[];
  kbCount: number;
  ranking?: 'llm' | 'rules';
};

function fromSaved(student: StudentDetail): SearchPayload {
  const res = student.searchResults ?? [];
  return {
    res,
    rem: student.searchRemoved ?? [],
    pool: res.length,
    dir: res.filter((r) => r.pt === 'Direct').length,
    ind: res.filter((r) => r.pt !== 'Direct').length,
    selectedSchoolIds: student.selectedSchoolIds ?? [],
    kbCount: res.length,
  };
}

export default function SearchStudentPage() {
  return (
    <Suspense fallback={<p className="mut">Loading…</p>}>
      <SearchStudentInner />
    </Suspense>
  );
}

function SearchStudentInner() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const qc = useQueryClient();
  const { data: student } = useQuery({
    queryKey: ['student', id],
    queryFn: () => api.student(id),
  });
  const [phase, setPhase] = useState<'idle' | 'running' | 'done' | 'error'>('idle');
  const [step, setStep] = useState(0);
  const [result, setResult] = useState<SearchPayload | null>(null);
  const [picked, setPicked] = useState<string[]>([]);
  const [openWhy, setOpenWhy] = useState<string | null>(null);
  const [showRemoved, setShowRemoved] = useState(false);
  const [making, setMaking] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    if (!student?.consultationDone) return;
    setPicked(student.selectedSchoolIds ?? []);
    const shouldRun =
      searchParams.get('run') === '1' || !(student.searchResults?.length);
    if (!shouldRun) {
      setResult(fromSaved(student));
      setPhase('done');
      return;
    }
    if (started.current) return;
    started.current = true;
    void run();
    // run is stable enough for the first decision; Search again calls it directly.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [student?.id, student?.consultationDone, student?.searchedAt, searchParams]);

  async function run() {
    setPhase('running');
    setStep(0);
    setShowRemoved(false);
    let i = 0;
    const tick = setInterval(() => {
      i = Math.min(STEPS.length - 1, i + 1);
      setStep(i);
    }, 700);
    const minRead = new Promise((resolve) => setTimeout(resolve, 1600));
    try {
      const [r] = await Promise.all([api.runSearch(id), minRead]);
      setResult(r);
      setPicked(r.selectedSchoolIds ?? []);
      setPhase('done');
      void qc.invalidateQueries({ queryKey: ['student', id] });
      void qc.invalidateQueries({ queryKey: ['students'] });
    } catch {
      setPhase('error');
    } finally {
      clearInterval(tick);
    }
  }

  async function togglePick(schoolId: string, on: boolean) {
    const next = on
      ? [...picked, schoolId]
      : picked.filter((x) => x !== schoolId);
    setPicked(next);
    try {
      await api.updateStudent(id, { selectedSchoolIds: next });
    } catch {
      setPicked(picked);
    }
  }

  async function makeProposal() {
    setMaking(true);
    try {
      await api.updateStudent(id, { selectedSchoolIds: picked });
      const proposal = await api.createProposal({ studentId: id, schoolIds: picked });
      router.push(`/app/proposal/${proposal.id}`);
    } catch {
      setMaking(false);
    }
  }

  if (!student) return <p className="mut">Loading…</p>;
  if (!student.consultationDone) {
    return (
      <>
        <PageHead title="AI search" subtitle={student.name} />
        <div className="card">
          <b>Consultation comes first</b>
          <p className="sm mut" style={{ margin: '8px 0 14px' }}>
            Finish the consultation so the search uses this student’s service, destinations and budget.
          </p>
          <Link className="btn" href={`/app/consult/${id}`}>
            Continue consultation
          </Link>
        </div>
      </>
    );
  }

  const rows = result?.res ?? [];
  const direct = rows.filter((r) => r.pt === 'Direct');
  const indirect = rows.filter((r) => r.pt !== 'Direct');
  const directPicked = picked.filter((sid) =>
    rows.some((r) => r.id === sid && r.pt === 'Direct'),
  ).length;
  const dest =
    student.destinations?.length > 0
      ? student.destinations.join(', ')
      : 'Everywhere';

  return (
    <>
      <PageHead
        title={phase === 'done' ? `Matches for ${student.name}` : 'AI search'}
        subtitle={
          phase === 'done' ? 'Shortlist the schools you want in the proposal.' : student.name
        }
        actions={
          <Link className="btn o" href="/app/search">
            <Icon name="arrow-left" /> All searches
          </Link>
        }
      />

      {phase === 'running' || phase === 'idle' ? (
        <SearchLoader first={student.name.split(' ')[0]} step={step} />
      ) : null}

      {phase === 'error' ? (
        <div className="card">
          <p>Search failed. Check the API and that schools are imported.</p>
          <button type="button" className="btn" style={{ marginTop: 12 }} onClick={() => void run()}>
            Try again
          </button>
        </div>
      ) : null}

      {phase === 'done' && result ? (
        <>
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="row sp">
              <div>
                <span className="tag">{student.service}</span>
                <p className="sm mut" style={{ marginTop: 8 }}>
                  {dest}
                  {student.faculty ? ` · ${student.faculty}` : ''} · budget{' '}
                  {student.budgetUsd.toLocaleString('en-GB')} USD
                </p>
              </div>
              <div className="row">
                <Link className="btn o s" href={`/app/consult/${id}`}>
                  Adjust consultation
                </Link>
                <button type="button" className="btn" onClick={() => void run()}>
                  Search again <Icon name="sparkle" />
                </button>
              </div>
            </div>
          </div>

          <p className="sm mut" style={{ marginBottom: 14 }}>
            {result.pool} shown · {result.dir} direct · {result.ind} indirect · {result.rem.length}{' '}
            removed.
            {result.ranking === 'rules'
              ? ' Ranking used the rules engine.'
              : result.ranking === 'llm'
                ? ' Ranked by AI from the rules shortlist.'
                : ''}{' '}
            <button
              type="button"
              className="btn o s"
              onClick={() => setShowRemoved((v) => !v)}
            >
              Why were some left out?
            </button>
          </p>
          {showRemoved ? (
            <ul className="sm" style={{ margin: '0 0 16px 18px' }}>
              {result.rem.slice(0, 40).map((r) => (
                <li key={`${r.n}-${r.r}`}>
                  {r.n} {r.r}
                </li>
              ))}
              {!result.rem.length ? <li>Nothing was removed.</li> : null}
            </ul>
          ) : null}

          <svg width="0" height="0" aria-hidden>
            <defs>
              <linearGradient id="rg">
                <stop offset="0" stopColor="#110F08" />
                <stop offset="1" stopColor="#B38A1E" />
              </linearGradient>
            </defs>
          </svg>
          <h3 style={{ margin: '8px 0 12px' }}>Direct partners</h3>
          <div className="grid">
            {direct.length ? (
              direct.map((row, k) => (
                <ResultCard
                  key={row.id}
                  row={row}
                  rank={k + 1}
                  on={picked.includes(row.id)}
                  whyOpen={openWhy === row.id}
                  onWhy={() => setOpenWhy((cur) => (cur === row.id ? null : row.id))}
                  onPick={(on) => void togglePick(row.id, on)}
                />
              ))
            ) : (
              <p className="mut">No direct partners fit. Try a wider budget or more destinations.</p>
            )}
          </div>

          <h3 style={{ margin: '26px 0 12px' }}>Indirect partners</h3>
          <div className="grid">
            {indirect.length ? (
              indirect.map((row, k) => (
                <ResultCard
                  key={row.id}
                  row={row}
                  rank={direct.length + k + 1}
                  on={picked.includes(row.id)}
                  whyOpen={openWhy === row.id}
                  onWhy={() => setOpenWhy((cur) => (cur === row.id ? null : row.id))}
                  onPick={(on) => void togglePick(row.id, on)}
                />
              ))
            ) : (
              <p className="mut">No indirect partners fit.</p>
            )}
          </div>

          {picked.length ? (
            <div className="bd-bar">
              <span>
                {picked.length} shortlisted · {directPicked} direct + {picked.length - directPicked}{' '}
                indirect
              </span>
              <div className="row">
                <Link className="btn o s" href="/app/compare">
                  Compare
                </Link>
                <button
                  type="button"
                  className="btn g s"
                  disabled={making}
                  onClick={() => void makeProposal()}
                >
                  <Icon name="file" /> {making ? 'Creating…' : 'Create proposal'}
                </button>
              </div>
            </div>
          ) : null}
        </>
      ) : null}
    </>
  );
}

function ResultCard({
  row,
  rank,
  on,
  whyOpen,
  onWhy,
  onPick,
}: {
  row: MatchRow;
  rank: number;
  on: boolean;
  whyOpen: boolean;
  onWhy: () => void;
  onPick: (on: boolean) => void;
}) {
  const place = [row.countries?.join(' / '), row.location].filter(Boolean).join(' · ');
  return (
    <div className="card res gl" style={{ animationDelay: `${Math.min(rank, 12) * 0.08}s` }}>
      <div className="rk">{rank}</div>
      <StudentMono name={row.name ?? row.id} />
      <div style={{ minWidth: 0 }}>
        <h3>{row.name ?? row.id}</h3>
        {place ? <p className="sm mut">{place}</p> : null}
        <p style={{ marginTop: 6 }}>
          {row.fee ? <b>{row.fee}</b> : null}{' '}
          <span className={`tag ${row.pt === 'Direct' ? 'd' : ''}`}>{row.pt}</span>
          {row.status && row.status !== 'Active' ? (
            <span className="tag">{row.status}</span>
          ) : null}
        </p>
        <p className="sm" style={{ marginTop: 8 }}>
          <button type="button" className="btn o s" onClick={onWhy}>
            Why this match
          </button>
          {row.score < 60 ? (
            <>
              {' '}
              · <b>Borderline</b>
            </>
          ) : null}
        </p>
      </div>
      <ScoreRing score={row.score} />
      <div className="row">
        <label className="sw" title="Shortlist">
          <input
            type="checkbox"
            checked={on}
            aria-label={`Shortlist ${row.name ?? row.id}`}
            onChange={(e) => onPick(e.target.checked)}
          />
          <i />
        </label>
      </div>
      <ul className={`why${whyOpen ? ' open' : ''}`}>
        {row.why.map((w) => (
          <li key={w}>{w}</li>
        ))}
      </ul>
    </div>
  );
}

function ScoreRing({ score }: { score: number }) {
  const c = 2 * Math.PI * 26;
  const offset = c * (1 - Math.max(0, Math.min(100, score)) / 100);
  return (
    <div className="rn">
      <svg className="ring" viewBox="0 0 64 64">
        <circle className="b" cx="32" cy="32" r="26" />
        <circle className="v" cx="32" cy="32" r="26" strokeDasharray={c} strokeDashoffset={offset} />
      </svg>
      <span>{score}</span>
    </div>
  );
}

function SearchLoader({ first, step }: { first: string; step: number }) {
  const pct = Math.round(((step + 1) / STEPS.length) * 100);
  return (
    <div className="ldw">
      <div className="ldb">
        <RmMarkBand className="lg spin" />
        <div className="bub">Reading the records for {first}.</div>
      </div>
      <div className="card ld">
        <div className="row sp">
          <h3>Searching schools</h3>
        </div>
        <div className="scan">{STEPS[step]}</div>
        <div className="prog">
          <i style={{ width: `${pct}%` }} />
        </div>
        <ul className="steps">
          {STEPS.map((s, i) => (
            <li key={s} className={i < step ? 'done' : i === step ? 'on' : ''}>
              <span className="dot">
                <Icon name="check" />
              </span>
              {s}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
