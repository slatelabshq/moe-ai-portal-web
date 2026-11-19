import Link from 'next/link';
import type { ReactNode } from 'react';
import { Icon } from '@/components/icon';
import { StudentMono, W9 } from '@/lib/portal-helpers';
import { stageLabel } from '@/lib/stages';
import type { StudentRow } from '@/lib/api-client';

export function PartnershipTag({ partnership }: { partnership: string }) {
  const direct = partnership === 'Direct';
  return <span className={`tag ${direct ? 'd' : ''}`}>{partnership || 'Indirect'}</span>;
}

export function StatusChip({ status }: { status: string }) {
  const s = (status || 'Active').toLowerCase();
  const inactive = s === 'inactive';
  const suspended = s === 'suspended';
  return (
    <span
      className={`st-chip${inactive ? ' inactive' : ''}${suspended ? ' suspended' : ''}`}
    >
      {status || 'Active'}
    </span>
  );
}

export type SchoolCheckInput = {
  verifyLink?: string | null;
  feeConfirmedNote?: string | null;
  confidenceScore?: number | null;
  dataConfidence?: string | null;
};

export function schoolDataCheckLabel(s: SchoolCheckInput): string {
  if (s.verifyLink || s.feeConfirmedNote) return 'Verified';
  const cf = s.confidenceScore ?? 70;
  if (cf >= 90) return 'Official';
  if (cf >= 65) return 'Partly confirmed';
  if (cf >= 55) return 'Third party';
  return 'Unverified';
}

export function schoolNeedsConfirmation(s: SchoolCheckInput): boolean {
  if (s.verifyLink || s.feeConfirmedNote) return false;
  return (s.confidenceScore ?? 70) < 90;
}

export function DataCheckTag({ school }: { school: SchoolCheckInput }) {
  const verified = !!(school.verifyLink || school.feeConfirmedNote);
  return (
    <span className={`tag ${verified ? 'd' : ''}`}>{schoolDataCheckLabel(school)}</span>
  );
}

export function SchoolMono({ name }: { name: string }) {
  return <StudentMono name={name} />;
}

export function formatSchoolFee(s: {
  intlFeeHeadline?: string | null;
  feeUsdLo?: number | null;
  feeUsdHi?: number | null;
}): ReactNode {
  if (s.intlFeeHeadline) return s.intlFeeHeadline;
  if (s.feeUsdLo != null) {
    const hi = s.feeUsdHi != null && s.feeUsdHi !== s.feeUsdLo;
    return (
      <>
        ${s.feeUsdLo.toLocaleString()}
        {hi ? `–$${s.feeUsdHi!.toLocaleString()}` : ''}
        <span className="fee2"> USD / year</span>
      </>
    );
  }
  return <span className="mut">Fee not found</span>;
}

export function PipelineBarRow({
  label,
  count,
  total,
}: {
  label: string;
  count: number;
  total: number;
}) {
  const pct = total ? (count / total) * 100 : 0;
  return (
    <div className="row sp sm" style={{ marginTop: 10, flexWrap: 'nowrap' }}>
      <span style={{ width: 150, flex: 'none' }}>{label}</span>
      <div className="bar" style={{ flex: 1 }}>
        <i className="grow" style={{ left: 0, width: `${pct}%` }} />
      </div>
      <b style={{ width: 24, textAlign: 'right' }}>{count}</b>
    </div>
  );
}

export function PipelineW9Grid({
  students,
  studentHref = (id) => `/app/student/${id}`,
}: {
  students: StudentRow[];
  studentHref?: (id: string) => string;
}) {
  return (
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
              {it.slice(0, 5).map((s) => {
                const src = (s as StudentRow & { source?: string }).source;
                return (
                  <Link key={s.id} href={studentHref(s.id)}>
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
                    <span className="row" style={{ gap: 6, flexWrap: 'nowrap' }}>
                      {src === 'CRM' ? <span className="tag">CRM</span> : null}
                      {stages.length > 1 ? (
                        <span className="sm mut">
                          {stageLabel(s.stage).split(' ')[0]}
                        </span>
                      ) : null}
                      <Icon name="right" className="s" />
                    </span>
                  </Link>
                );
              })}
              {!it.length ? <p className="sm mut">Nobody here yet.</p> : null}
              {it.length > 5 ? (
                <p className="sm mut">+{it.length - 5} more</p>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
