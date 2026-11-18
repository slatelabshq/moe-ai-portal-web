'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { PageHead } from '@/components/page-head';
import { Icon } from '@/components/icon';
import { W9 } from '@/lib/portal-helpers';
import { api } from '@/lib/api-client';
import { stageLabel } from '@/lib/stages';

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
      <div className="w9">
        {W9.map(([title, stages, icon]) => {
          const it = students.filter((s) => stages.includes(s.stage));
          return (
            <div key={title} className="card gl">
              <div className="wh">
                <div className="row" style={{ gap: 10, flexWrap: 'nowrap' }}>
                  <span className="ib">
                    <Icon name={icon} />
                  </span>
                  <div>
                    <b>{title}</b>
                    <div className="stg">
                      {stages.map((i) => stageLabel(i)).join(' · ')}
                    </div>
                  </div>
                </div>
                <span className="wn">{it.length}</span>
              </div>
              <div className="wl">
                {it.slice(0, 5).map((s) => (
                  <Link key={s.id} href={`/app/students/${s.id}`}>
                    <span
                      style={{
                        minWidth: 0,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {s.name}
                    </span>
                    <Icon name="right" className="s" />
                  </Link>
                ))}
                {!it.length ? (
                  <p className="sm mut">Nobody here yet.</p>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
