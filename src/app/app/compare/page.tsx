'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PageHead } from '@/components/page-head';
import { Icon } from '@/components/icon';
import { StudentMono } from '@/lib/portal-helpers';
import { api, type SchoolRow } from '@/lib/api-client';

const SVC = [
  ['Summer', 'sparkle'],
  ['K–12', 'layers'],
  ['Pathways', 'arrow'],
  ["Bachelor's", 'building'],
  ['Postgraduate', 'badge'],
] as const;

export default function ComparePage() {
  const [svc, setSvc] = useState<string>("Bachelor's");
  const [q, setQ] = useState('');
  const [budget, setBudget] = useState(60000);
  const [picked, setPicked] = useState<string[]>([]);

  const { data, isLoading } = useQuery({
    queryKey: ['schools', q],
    queryFn: () => api.schools(q || undefined),
  });

  const schools = useMemo(() => {
    const items = (data?.items ?? []) as SchoolRow[];
    return items
      .filter((s) => {
        const lo = s.feeUsdLo ?? 0;
        const hi = s.feeUsdHi ?? 999999;
        const mid = hi > 0 ? (lo + hi) / 2 : lo;
        return mid <= budget || budget >= 60000;
      })
      .slice(0, 48);
  }, [data, budget]);

  const compareList = schools.filter((s) => picked.includes(s.id)).slice(0, 4);

  function toggle(id: string) {
    setPicked((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 4) return prev;
      return [...prev, id];
    });
  }

  return (
    <>
      <PageHead
        title="Compare schools"
        subtitle="Search partner schools and compare up to four side by side."
        actions={<span className="tag">USD fees</span>}
      />
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="f">
          <div>
            <label>Service (filter label)</label>
            <div className="svc">
              {SVC.map(([name, icon]) => (
                <button
                  key={name}
                  type="button"
                  className={name === svc ? 'on' : ''}
                  onClick={() => setSvc(name)}
                >
                  <span className="ico">
                    <Icon name={icon} className="s" />
                  </span>
                  <b style={{ fontWeight: 500 }}>{name}</b>
                </button>
              ))}
            </div>
          </div>
          <div className="grid" style={{ gridTemplateColumns: '1.4fr 1fr' }}>
            <div>
              <label>Search</label>
              <input
                placeholder="School, country or course"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
            <div>
              <label>
                Fees up to ·{' '}
                <b>{budget >= 60000 ? 'Any' : `$${budget.toLocaleString('en')}`}</b>
              </label>
              <input
                type="range"
                min={5000}
                max={60000}
                step={1000}
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value))}
              />
            </div>
          </div>
        </div>
      </div>

      {compareList.length >= 2 ? (
        <div style={{ marginBottom: 26 }}>
          <h2 style={{ marginBottom: 12 }}>Comparison</h2>
          <div className="grid" style={{ gridTemplateColumns: `repeat(${compareList.length}, 1fr)` }}>
            {compareList.map((sch) => (
              <div key={sch.id} className="card gl">
                <b>{sch.name}</b>
                <p className="sm mut">{sch.countries?.join(' / ')}</p>
                <p>{sch.intlFeeHeadline ?? 'Fee to confirm'}</p>
                <span className="tag d">{sch.partnership}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <p className="sm mut" style={{ marginBottom: 12 }}>
        {isLoading ? 'Loading…' : `${schools.length} schools · ${picked.length}/4 selected`}
      </p>
      <div className="grid g3" id="cres">
        {schools.map((sch, k) => (
          <div
            key={sch.id}
            className="card gl"
            style={{ animation: `in .5s ${Math.min(k, 12) * 0.04}s both` }}
          >
            <div className="row sp" style={{ flexWrap: 'nowrap', alignItems: 'flex-start' }}>
              <StudentMono name={sch.name} />
              <label className="sw">
                <input
                  type="checkbox"
                  checked={picked.includes(sch.id)}
                  onChange={() => toggle(sch.id)}
                  aria-label={`Compare ${sch.name}`}
                />
                <i />
              </label>
            </div>
            <h3 style={{ marginTop: 12 }}>{sch.name}</h3>
            <p className="sm mut">{sch.countries?.join(' / ')}</p>
            <p style={{ marginTop: 8 }}>
              <b>{sch.intlFeeHeadline ?? 'Fee to confirm'}</b>
            </p>
            <div className="row" style={{ marginTop: 10, gap: 6 }}>
              <span className="tag d">{sch.partnership}</span>
              <span className="tag">{svc}</span>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}