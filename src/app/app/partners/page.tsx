'use client';

import { PageHead } from '@/components/page-head';

export default function PartnersPage() {
  return (
    <>
      <PageHead
        title="Partners and groups"
        subtitle="Partner agencies, school groups and memberships live in the database."
      />
      <div className="card">
        <p className="mut">No partners have been added yet.</p>
      </div>
    </>
  );
}
