'use client';

import { PageHead } from '@/components/page-head';

export default function AssignPage() {
  return (
    <>
      <PageHead
        title="Assignments"
        subtitle="Every student and their counsellor. Only admins can reassign."
      />
      <div className="card">
        <p className="mut">Assignments use the students already in the database. Reassignment controls come next.</p>
      </div>
    </>
  );
}
