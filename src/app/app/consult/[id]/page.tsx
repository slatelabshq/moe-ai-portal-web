'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { PageHead } from '@/components/page-head';
import { api } from '@/lib/api-client';

export default function ConsultPage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading } = useQuery({
    queryKey: ['student', id],
    queryFn: () => api.student(id),
  });
  if (isLoading) return <p className="mut">Loading…</p>;
  if (!data) return <p className="mut">Student not found.</p>;
  return (
    <>
      <PageHead title="Consultation" subtitle={data.name} />
      <div className="card">
        <p>
          {data.service}
        </p>
        <Link className="btn" href={`/app/search`} style={{ marginTop: 16 }}>
          Back to search
        </Link>
      </div>
    </>
  );
}
