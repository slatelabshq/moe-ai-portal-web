'use client';

import { useParams } from 'next/navigation';
import { useState } from 'react';
import { ApplicationForm } from '@/components/application-form';
import { api } from '@/lib/api-client';

export default function PublicApplyPage() {
  const { token } = useParams<{ token: string }>();
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  if (done) {
    return (
      <div className="pub">
        <div className="card afm" style={{ textAlign: 'center' }}>
          <h2>Thank you</h2>
          <p className="mut" style={{ marginTop: 8 }}>
            Your application has been received. Your counsellor will be in touch.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="pub">
      <ApplicationForm
        busy={busy}
        subtitle="Morgan Oxford Education"
        onSubmit={async (payload) => {
          setBusy(true);
          try {
            await api.publicApply(token, {
              name: payload.name,
              email: payload.email,
              phone: payload.phone,
              service: payload.service,
              formType: payload.formType,
              destinations: payload.destinations,
              application: payload.application,
            });
            setDone(true);
          } finally {
            setBusy(false);
          }
        }}
      />
    </div>
  );
}
