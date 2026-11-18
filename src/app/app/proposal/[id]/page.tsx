'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { PageHead } from '@/components/page-head';
import { api } from '@/lib/api-client';

type ProposalDetail = {
  id: string;
  title: string;
  message: string;
  status: string;
  coverKey: string;
  schoolIds: string[];
  student: { id: string; name: string };
};

export default function ProposalEditorPage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['proposal', id],
    queryFn: () => api.proposal(id) as Promise<ProposalDetail>,
  });

  if (isLoading) return <p className="mut">Loading…</p>;
  if (!data) return <p className="mut">Proposal not found.</p>;

  const familyUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/p/${id}`
      : `/p/${id}`;

  return (
    <>
      <PageHead title="Edit proposal" subtitle={data.student.name} />
      <div className="card afm">
        <h3>{data.title}</h3>
        <p style={{ marginTop: 12, whiteSpace: 'pre-wrap' }}>{data.message}</p>
        <p className="sm mut" style={{ marginTop: 12 }}>
          {data.schoolIds.length} schools · Status {data.status}
        </p>
        <div className="row" style={{ gap: 8, marginTop: 18, flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn"
            onClick={async () => {
              await api.updateProposal(id, { status: 'Sent' });
              void qc.invalidateQueries({ queryKey: ['proposal', id] });
            }}
          >
            Mark sent
          </button>
          <Link className="btn o" href={familyUrl} target="_blank" rel="noopener noreferrer">
            Preview family link
          </Link>
          <Link className="btn o" href={`/app/student/${data.student.id}`}>
            Back to student
          </Link>
        </div>
        <p className="sm mut" style={{ marginTop: 14 }}>
          Family URL: {familyUrl}
        </p>
      </div>
    </>
  );
}