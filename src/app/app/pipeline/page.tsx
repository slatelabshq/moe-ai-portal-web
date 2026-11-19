'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { PageHead } from '@/components/page-head';
import { Icon } from '@/components/icon';
import { PipelineW9Grid } from '@/components/admin-ui';
import { api } from '@/lib/api-client';

export default function PipelinePage() {
  const { data, isLoading } = useQuery({
    queryKey: ['students'],
    queryFn: () => api.students(),
  });
  const students = data?.items ?? [];

  return (
    <>
      <PageHead
        title="Pipeline"
        subtitle="Where each of your students is, from first contact to enrolment."
        actions={
          <Link className="btn" href="/app/students">
            <Icon name="plus" />
            Add lead
          </Link>
        }
      />
      {isLoading ? <p className="mut">Loading…</p> : null}
      <PipelineW9Grid
        students={students}
        studentHref={(id) => `/app/students/${id}`}
      />
    </>
  );
}