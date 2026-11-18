'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { RmMark } from '@/components/rm-mark';
import { api } from '@/lib/api-client';

export default function FamilyProposalPage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, isError } = useQuery({
    queryKey: ['public-proposal', id],
    queryFn: () => api.publicProposal(id),
    retry: false,
  });

  if (isLoading) return <p className="mut pub">Loading proposal…</p>;
  if (isError || !data) {
    return (
      <div className="pub">
        <div className="card afm">
          <h2>This proposal is no longer available</h2>
          <p className="mut" style={{ marginTop: 8 }}>
            Ask your counsellor for an updated link.
          </p>
        </div>
      </div>
    );
  }

  const { proposal, schools } = data;

  return (
    <div className="pub">
      <div className="card afm">
        <div style={{ display: 'grid', justifyItems: 'center', marginBottom: 18 }}>
          <RmMark size={36} variant="black" />
        </div>
        <h2>{proposal.title}</h2>
        <p className="sm mut" style={{ marginTop: 6 }}>
          From {proposal.author.displayName}
          {proposal.author.agency ? ` · ${proposal.author.agency}` : ''}
        </p>
        <p style={{ marginTop: 18, whiteSpace: 'pre-wrap' }}>{proposal.message}</p>
        <h3 style={{ marginTop: 28, marginBottom: 12 }}>Your options</h3>
        <div className="grid g2">
          {schools.map((s) => (
            <div key={s.id} className="card gl">
              <b>{s.name}</b>
              <p className="sm mut">{s.partnership} · {(s.countries ?? []).join(', ')}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}