'use client';

import type { ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PageHead } from '@/components/page-head';
import { PartnershipTag, StatusChip } from '@/components/admin-ui';
import { api } from '@/lib/api-client';

function memberSummary(names: string[]) {
  if (!names.length) return <span className="mut">No schools yet</span>;
  return (
    <>
      {names.length} school{names.length === 1 ? '' : 's'}
    </>
  );
}

export default function PartnersPage() {
  const partners = useQuery({
    queryKey: ['partners'],
    queryFn: () => api.partners(),
  });
  const groups = useQuery({
    queryKey: ['partner-groups'],
    queryFn: () => api.partnerGroups(),
  });
  const memberships = useQuery({
    queryKey: ['memberships'],
    queryFn: () => api.memberships(),
  });

  const pList = partners.data ?? [];
  const gList = groups.data ?? [];
  const mList = memberships.data ?? [];

  return (
    <>
      <PageHead
        title="Partners and groups"
        subtitle="Partner agencies, school groups and memberships."
      />
      <PartnerSection
        title="Partner agencies and platforms"
        blurb="Agencies and platforms MOE works with."
        loading={partners.isLoading}
      >
        <table className="rt">
          <thead>
            <tr>
              <th>Partner</th>
              <th>Type</th>
              <th>Country</th>
              <th>Contact</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {pList.map((p) => (
              <tr key={p.id}>
                <td data-l="Partner">
                  <b>{p.name}</b>
                </td>
                <td data-l="Type" className="sm">
                  {p.partnerType ?? '—'}
                </td>
                <td data-l="Country" className="sm mut">
                  {p.country ?? '–'}
                </td>
                <td data-l="Contact" className="sm">
                  {p.notes ? (
                    <span className="mut">{p.notes}</span>
                  ) : (
                    '–'
                  )}
                </td>
                <td data-l="Status">
                  <StatusChip status={p.status} />
                </td>
              </tr>
            ))}
            {!pList.length && !partners.isLoading ? (
              <tr>
                <td colSpan={5} className="mut">
                  No partners yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </PartnerSection>

      <PartnerSection
        title="School groups"
        blurb="Open a group to add or remove its schools."
        loading={groups.isLoading}
      >
        <table className="rt">
          <thead>
            <tr>
              <th>Group</th>
              <th>Partnership</th>
              <th>Schools</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {gList.map((g) => (
              <tr key={g.id}>
                <td data-l="Group">
                  <b>{g.name}</b>
                  {g.memberNames.length ? (
                    <>
                      <br />
                      <span className="sm mut">
                        {g.memberNames.slice(0, 3).join(', ')}
                        {g.memberNames.length > 3
                          ? ` … +${g.memberNames.length - 3}`
                          : ''}
                      </span>
                    </>
                  ) : null}
                </td>
                <td data-l="Partnership">
                  <PartnershipTag partnership={g.partnership} />
                </td>
                <td data-l="Schools" className="sm">
                  {memberSummary(g.memberNames)}
                  {g.countLabel ? (
                    <>
                      <br />
                      <span className="mut">Expected: {g.countLabel}</span>
                    </>
                  ) : null}
                </td>
                <td data-l="Status">
                  <StatusChip status={g.status} />
                </td>
              </tr>
            ))}
            {!gList.length && !groups.isLoading ? (
              <tr>
                <td colSpan={4} className="mut">
                  No groups yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </PartnerSection>

      <PartnerSection
        title="Memberships"
        blurb="Any member school can be used, with a contract signed per student when needed."
        loading={memberships.isLoading}
        last
      >
        <table className="rt">
          <thead>
            <tr>
              <th>Membership</th>
              <th>Agreement</th>
              <th>Member schools</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {mList.map((m) => (
              <tr key={m.id}>
                <td data-l="Membership">
                  <b>{m.name}</b>
                </td>
                <td data-l="Agreement" className="sm">
                  {m.notes ?? '–'}
                </td>
                <td data-l="Member schools" className="sm">
                  {m.schoolIds.length} linked school
                  {m.schoolIds.length === 1 ? '' : 's'}
                </td>
                <td data-l="Status">
                  <StatusChip status={m.status} />
                </td>
              </tr>
            ))}
            {!mList.length && !memberships.isLoading ? (
              <tr>
                <td colSpan={4} className="mut">
                  No memberships yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </PartnerSection>
    </>
  );
}

function PartnerSection({
  title,
  blurb,
  loading,
  children,
  last,
}: {
  title: string;
  blurb: string;
  loading: boolean;
  children: ReactNode;
  last?: boolean;
}) {
  return (
    <div
      className="card"
      style={{
        marginBottom: last ? 0 : 20,
        padding: 0,
        overflow: 'auto',
      }}
    >
      <div className="row sp" style={{ padding: '20px 20px 8px' }}>
        <div>
          <h3>{title}</h3>
          <p className="sm mut" style={{ marginTop: 4 }}>
            {blurb}
          </p>
        </div>
      </div>
      {loading ? <p className="mut sm" style={{ padding: '0 20px 16px' }}>Loading…</p> : children}
    </div>
  );
}