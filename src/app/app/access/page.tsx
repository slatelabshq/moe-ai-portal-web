'use client';

import { PageHead } from '@/components/page-head';

export default function AccessPage() {
  return (
    <>
      <PageHead
        title="Access"
        subtitle="People who can sign in. New agents request an account; an admin approves them."
      />
      <div className="card">
        <p className="mut">No pending requests. Accounts are created in the database, not from a sample list.</p>
      </div>
    </>
  );
}
