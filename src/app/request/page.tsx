'use client';

import Link from 'next/link';
import { useState } from 'react';
import { RmMark } from '@/components/rm-mark';
import { api } from '@/lib/api-client';

export default function RequestAccountPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [agency, setAgency] = useState('');
  const [role, setRole] = useState('Agent');
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState('');

  async function submit() {
    setErr('');
    try {
      await api.accessRequest({ fullName, email, agency: agency || undefined, role });
      setSent(true);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Request failed');
    }
  }

  return (
    <div className="pub">
      <div className="card afm">
        <div
          style={{
            display: 'grid',
            justifyItems: 'center',
            gap: 6,
            marginBottom: 22,
            textAlign: 'center',
          }}
        >
          <RmMark size={40} variant="black" />
          <h2>Request an agent account</h2>
          <p className="mut sm">
            Admins approve every new account before it can sign in.
          </p>
        </div>
        {sent ? (
          <p className="mut">Thanks — an admin will review your request shortly.</p>
        ) : (
          <div className="f">
            <div>
              <label>
                Full name <span className="rq">*</span>
              </label>
              <input value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div>
              <label>
                Work email <span className="rq">*</span>
              </label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <label>Agency</label>
              <input value={agency} onChange={(e) => setAgency(e.target.value)} />
            </div>
            <div>
              <label>Account type</label>
              <select value={role} onChange={(e) => setRole(e.target.value)}>
                <option>Agent</option>
                <option>Counsellor</option>
              </select>
            </div>
            {err ? <p className="mut sm">{err}</p> : null}
            <button className="btn" type="button" style={{ justifyContent: 'center' }} onClick={() => void submit()}>
              Send request
            </button>
            <Link className="sm" href="/" style={{ textAlign: 'center' }}>
              Back to sign in
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}