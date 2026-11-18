'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Icon } from '@/components/icon';
import { api } from '@/lib/api-client';

type School = {
  partnership: string;
  countries: string[];
};

export default function OverviewPage() {
  const schools = useQuery({
    queryKey: ['schools', 'all'],
    queryFn: () => api.schools(),
  });
  const students = useQuery({
    queryKey: ['students'],
    queryFn: () => api.students(),
  });
  const items = (schools.data?.items ?? []) as School[];
  const direct = items.filter((s) => s.partnership === 'Direct').length;
  const countries = new Set(items.flatMap((s) => s.countries ?? [])).size;

  return (
    <>
      <div className="band dk">
        <div className="wave">
          <i />
          <i />
          <i />
        </div>
        <p className="eye" style={{ color: 'var(--rm-text-on-ink-muted)' }}>
          Overview
        </p>
        <h1 className="gt">
          {items.length} schools. {countries} countries.
        </h1>
        <p>
          {direct} direct partners and {items.length - direct} indirect.
        </p>
      </div>
      <div className="grid g4" style={{ marginBottom: 24 }}>
        <div className="card stat gl">
          <span>Students</span>
          <b>{students.data?.total ?? 0}</b>
        </div>
        <div className="card stat gl">
          <span>Schools</span>
          <b>{schools.data?.total ?? 0}</b>
        </div>
      </div>
      <Link className="btn o s" href="/app/admissions">
        <Icon name="grid" /> Open admissions
      </Link>
    </>
  );
}
