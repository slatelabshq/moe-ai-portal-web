'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { PageHead } from '@/components/page-head';
import { api } from '@/lib/api-client';

export default function ProposalsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['proposals'],
    queryFn: () => api.proposals(),
  });
  const items = data?.items ?? [];

  return (
    <>
      <PageHead
        title="Proposals"
        subtitle="Proposals you create and send to families."
      />
      {isLoading ? <p className="mut">Loading…</p> : null}
      {!isLoading && !items.length ? (
        <div className="card">
          <p className="mut">
            No proposals yet. Finish a student search, then create one from their shortlist.
          </p>
        </div>
      ) : null}
      <div className="grid g2">
        {items.map((p) => (
          <Link key={p.id} href={`/app/proposal/${p.id}`} className="card gl">
            <b>{p.title}</b>
            <p className="sm mut">
              {p.student.name} · {p.status}
              {p.openCount ? ` · ${p.openCount} opens` : ''}
            </p>
          </Link>
        ))}
      </div>
    </>
  );
}