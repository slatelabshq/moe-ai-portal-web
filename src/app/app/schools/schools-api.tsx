'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { api, type SchoolRow } from '@/lib/api-client';

export default function SchoolsApiPage() {
  const [q, setQ] = useState('');
  const { data, isLoading, error } = useQuery({
    queryKey: ['schools', q],
    queryFn: () => api.schools(q || undefined),
  });
  const items = (data?.items ?? []) as SchoolRow[];

  return (
    <>
      <div className="ph">
        <div>
          <h1 className="gtd">Schools</h1>
          <p>From universities_main.csv — {data?.total ?? 0} records</p>
        </div>
      </div>
      <input
        placeholder="Search schools"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        style={{ maxWidth: 320, marginBottom: 16, borderRadius: 999 }}
        aria-label="Search schools"
      />
      {isLoading ? <p className="mut">Loading…</p> : null}
      {error ? <p className="er">Could not load schools.</p> : null}
      <div className="card" style={{ padding: 0 }}>
        <table className="rt">
          <thead>
            <tr>
              <th>School</th>
              <th>Partnership</th>
              <th>Countries</th>
              <th>Intl fee</th>
              <th>Confidence</th>
            </tr>
          </thead>
          <tbody>
            {items.map((s) => (
              <tr key={s.id}>
                <td data-l="School">
                  <b>{s.name}</b>
                </td>
                <td data-l="Partnership">{s.partnership}</td>
                <td data-l="Countries" className="sm mut">
                  {s.countries.join(' / ')}
                </td>
                <td data-l="Intl fee" className="sm">
                  {s.intlFeeHeadline ?? '—'}
                </td>
                <td data-l="Confidence" className="sm mut">
                  {s.dataConfidence ?? '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
