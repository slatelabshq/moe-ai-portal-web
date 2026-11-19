'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Icon } from '@/components/icon';
import {
  PipelineBarRow,
  schoolNeedsConfirmation,
  type SchoolCheckInput,
} from '@/components/admin-ui';
import { api, type SchoolRow, type StudentRow } from '@/lib/api-client';
import { stageLabel } from '@/lib/stages';

const FUNNEL_STAGES = [1, 3, 4, 5, 6, 9, 14];
const SCHOOL_GOAL = 300;

export default function OverviewPage() {
  const schools = useQuery({
    queryKey: ['schools', 'all'],
    queryFn: () => api.schools(undefined, { take: 5000 }),
  });
  const students = useQuery({
    queryKey: ['students'],
    queryFn: () => api.students(),
  });
  const users = useQuery({
    queryKey: ['users'],
    queryFn: () => api.users(),
  });
  const partners = useQuery({
    queryKey: ['partners'],
    queryFn: () => api.partners(),
  });
  const proposals = useQuery({
    queryKey: ['proposals'],
    queryFn: () => api.proposals(),
  });
  const pending = useQuery({
    queryKey: ['access-pending'],
    queryFn: () => api.accessPending(),
  });

  const items = (schools.data?.items ?? []) as SchoolRow[];
  const stu = (students.data?.items ?? []) as StudentRow[];

  const stats = useMemo(() => {
    const direct = items.filter((s) => s.partnership === 'Direct').length;
    const indirect = items.length - direct;
    const cc: Record<string, number> = {};
    items.forEach((k) =>
      (k.countries ?? []).forEach((c) => {
        cc[c] = (cc[c] ?? 0) + 1;
      }),
    );
    const topCountries = Object.entries(cc)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);
    const needConfirm = items.filter((s) =>
      schoolNeedsConfirmation(s as SchoolCheckInput),
    ).length;
    const feeNotFound = items.filter((s) => s.feeUsdLo == null).length;
    const belowContract = items.filter(
      (s) =>
        s.partnership === 'Direct' &&
        (s.studentsPlaced ?? 0) < 2,
    ).length;
    const activePartners =
      (partners.data ?? []).filter((p) => p.status === 'Active').length;
    const co = (users.data?.items ?? []).filter(
      (a) =>
        a.active !== false && ['Counsellor', 'Agent'].includes(a.role),
    );
    const proposalItems = proposals.data?.items ?? [];
    return {
      direct,
      indirect,
      countries: Object.keys(cc).length,
      needConfirm,
      feeNotFound,
      belowContract,
      activePartners,
      topCountries,
      co,
      proposalItems,
      pendingCount: pending.data?.items?.length ?? 0,
    };
  }, [items, students.data, partners.data, users.data, proposals.data, pending.data]);

  const progressPct = items.length
    ? Math.round((items.length / SCHOOL_GOAL) * 100)
    : 0;

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
          {items.length} schools. {stats.countries} countries.
        </h1>
        <p>
          {stats.direct} direct partners and {stats.indirect} indirect, plus{' '}
          {stats.activePartners} partner agencies.
        </p>
        <div
          className="bar"
          style={{
            marginTop: 22,
            height: 10,
            background: 'rgba(250,249,244,.15)',
            maxWidth: 520,
          }}
        >
          <i
            className="grow"
            style={{
              left: 0,
              width: `${Math.min(100, progressPct)}%`,
              background: 'var(--gg)',
            }}
          />
        </div>
        <p className="sm" style={{ marginTop: 8 }}>
          {items.length} of about {SCHOOL_GOAL} · {progressPct}%
        </p>
      </div>
      <div className="grid g4" style={{ marginBottom: 24 }}>
        {[
          ['Students', stu.length],
          ['Fees to confirm with schools', stats.needConfirm],
          ['Fee not found', stats.feeNotFound],
          ['Waiting for approval', stats.pendingCount],
        ].map(([label, n]) => (
          <div key={String(label)} className="card stat gl">
            <span>{label}</span>
            <b>{n}</b>
          </div>
        ))}
      </div>
      <div className="grid g2" style={{ marginBottom: 20 }}>
        <div className="card">
          <h3 style={{ marginBottom: 14 }}>Pipeline</h3>
          {FUNNEL_STAGES.map((stage) => (
            <PipelineBarRow
              key={stage}
              label={stageLabel(stage)}
              count={stu.filter((s) => s.stage >= stage).length}
              total={stu.length || 1}
            />
          ))}
          <Link className="btn o s" href="/app/admissions" style={{ marginTop: 14 }}>
            <Icon name="grid" /> Open admissions
          </Link>
        </div>
        <div className="card">
          <h3 style={{ marginBottom: 6 }}>Counsellors and agents</h3>
          <table className="rt">
            <tbody>
              {stats.co.map((a) => (
                <tr key={a.id}>
                  <td data-l="Name">
                    <b>{a.displayName}</b>
                  </td>
                  <td data-l="Students" className="sm">
                    {stu.filter((s) => s.counsellor?.id === a.id).length} students
                  </td>
                  <td data-l="Proposals" className="sm">
                    {stats.proposalItems.filter((p) =>
                      stu.some(
                        (s) =>
                          s.id === p.student.id && s.counsellor?.id === a.id,
                      ),
                    ).length}{' '}
                    proposals
                  </td>
                </tr>
              ))}
              {!stats.co.length ? (
                <tr>
                  <td colSpan={3} className="mut sm">
                    No counsellors or agents yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
      <div className="grid g2">
        <div className="card">
          <h3 style={{ marginBottom: 10 }}>Schools by country</h3>
          {stats.topCountries.map(([country, count]) => (
            <PipelineBarRow
              key={country}
              label={country}
              count={count}
              total={stats.topCountries[0]?.[1] ?? 1}
            />
          ))}
          {!stats.topCountries.length ? (
            <p className="mut sm">No schools in the directory yet.</p>
          ) : null}
        </div>
        <div className="card">
          <h3>Quarterly refresh</h3>
          <p className="sm mut" style={{ margin: '6px 0' }}>
            MOE sends an updated sheet every 3 months. Import from the schools
            page when a new file arrives.
          </p>
          <div className="bar" style={{ margin: '14px 0', height: 10 }}>
            <i className="grow" style={{ left: 0, width: '12%' }} />
          </div>
          <p className="sm">
            {stats.needConfirm} fees need confirming with the schools.
            {stats.belowContract
              ? ` ${stats.belowContract} direct partners are below the 2-student contract target.`
              : ''}
          </p>
          <div className="row" style={{ marginTop: 12 }}>
            <Link className="btn o s" href="/app/schools">
              Open schools
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}