'use client';

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
  const { data } = useQuery({
    queryKey: ['schools', 'direct'],
    queryFn: () => api.schools(),
  });
  const direct = ((data?.items ?? []) as SchoolRow[])
    .filter((s) => s.partnership === 'Direct')
    .slice(0, 12);

  return (
    <>
      <PageHead
        title="Compare schools"
        subtitle="Search our partner schools and compare up to four side by side."
        actions={<span className="tag">GBP</span>}
      />
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="f">
          <div>
            <label>Service</label>
            <div className="svc">
              {SVC.map(([name, icon]) => (
                <button
                  key={name}
                  type="button"
                  className={name === "Bachelor's" ? 'on' : ''}
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
              <input placeholder="School, country or course" />
            </div>
            <div>
              <label>
                Fees from up to · <b>£16,000</b>
              </label>
              <input type="range" min={5000} max={60000} step={1000} defaultValue={16000} />
            </div>
          </div>
        </div>
      </div>
      <p className="sm mut" style={{ marginBottom: 12 }}>
        {direct.length} direct partners
      </p>
      <div className="grid g3" id="cres">
        {direct.map((sch, k) => (
          <div
            key={sch.id}
            className="card gl"
            style={{ animation: `in .5s ${Math.min(k, 12) * 0.04}s both` }}
          >
            <div className="row sp" style={{ flexWrap: 'nowrap', alignItems: 'flex-start' }}>
              <StudentMono name={sch.name} />
              <label className="sw">
                <input type="checkbox" aria-label={`Compare ${sch.name}`} />
                <i />
              </label>
            </div>
            <h3 style={{ marginTop: 12 }}>{sch.name}</h3>
            <p className="sm mut">{sch.countries?.join(' / ')}</p>
            <p style={{ marginTop: 8 }}>
              <b>{sch.intlFeeHeadline ?? 'Fee to confirm'}</b>
            </p>
            <div className="row" style={{ marginTop: 10, gap: 6 }}>
              <span className="tag d">Direct</span>
              <span className="tag">{"Bachelor's"}</span>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
