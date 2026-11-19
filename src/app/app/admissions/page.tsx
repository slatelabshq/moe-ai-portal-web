'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PageHead } from '@/components/page-head';
import { PersonSearch } from '@/components/person-search';
import { PipelineW9Grid } from '@/components/admin-ui';
import { api, type StudentRow } from '@/lib/api-client';

export default function AdmissionsPage() {
  const [agentId, setAgentId] = useState('');
  const [source, setSource] = useState('');

  const { data: students, isLoading } = useQuery({
    queryKey: ['students'],
    queryFn: () => api.students(),
  });
  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: () => api.users(),
  });

  const counsellors = (users?.items ?? []).filter(
    (u) =>
      u.active !== false &&
      ['Counsellor', 'Agent', 'Admin'].includes(u.role),
  );

  const filtered = useMemo(() => {
    let list = (students?.items ?? []) as StudentRow[];
    if (agentId) {
      list = list.filter((s) => s.counsellor?.id === agentId);
    }
    if (source) {
      list = list.filter(
        (s) => (s.source ?? 'Portal').toLowerCase() === source.toLowerCase(),
      );
    }
    return list;
  }, [students?.items, agentId, source]);

  return (
    <>
      <PageHead
        title="Admissions"
        subtitle="Every student across counsellors and agents. Filter by agent or by students who came through the portal."
        actions={
          <span className="sync">
            <i />
            CRM sync · when connected
          </span>
        }
      />
      <div
        className="card"
        style={{ marginBottom: 20, overflow: 'visible', position: 'relative', zIndex: 5 }}
      >
        <div className="grid" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
          <div>
            <label htmlFor="adm-agent">Agent or counsellor</label>
            <PersonSearch
              id="adm-agent"
              people={counsellors}
              value={agentId}
              onChange={setAgentId}
              emptyLabel="Everyone"
            />
          </div>
          <div>
            <label htmlFor="adm-src">Source</label>
            <select
              id="adm-src"
              value={source}
              onChange={(e) => setSource(e.target.value)}
            >
              <option value="">All sources</option>
              <option value="Portal">Portal</option>
              <option value="CRM">CRM</option>
            </select>
          </div>
          <div>
            <label>Students shown</label>
            <p
              style={{
                paddingTop: 8,
                font: '500 22px var(--rm-font-display)',
              }}
            >
              {filtered.length}
            </p>
          </div>
        </div>
      </div>
      {isLoading ? <p className="mut">Loading…</p> : null}
      <PipelineW9Grid students={filtered} studentHref={(id) => `/app/student/${id}`} />
      {!filtered.length && !isLoading ? (
        <p className="mut sm" style={{ marginTop: 16 }}>
          No students match these filters.
        </p>
      ) : null}
    </>
  );
}