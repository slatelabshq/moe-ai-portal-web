'use client';

import { useParams } from 'next/navigation';
import { useState } from 'react';
import { RmMark } from '@/components/rm-mark';
import { api } from '@/lib/api-client';

export default function PublicApplyPage() {
  const { token } = useParams<{ token: string }>();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [done, setDone] = useState(false);
  const [err, setErr] = useState('');

  async function submit() {
    setErr('');
    try {
      await api.publicApply(token, { name, email, phone });
      setDone(true);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Submit failed');
    }
  }

  return (
    <div className="pub">
      <div className="card afm">
        <div
          style={{
            display: 'grid',
            justifyItems: 'center',
            gap: 8,
            marginBottom: 22,
            textAlign: 'center',
          }}
        >
          <RmMark size={40} variant="black" />
          <h2>Application form</h2>
          <p className="sm mut">Morgan Oxford Education</p>
        </div>
        {done ? (
          <p>Thank you. Your counsellor will be in touch.</p>
        ) : (
          <div className="f">
            <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
              <div>
                <label>Full name</label>
                <input value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div>
                <label>Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
            </div>
            <div>
              <label>Phone</label>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            {err ? <p className="mut sm">{err}</p> : null}
            <button className="btn" type="button" style={{ justifyContent: 'center' }} onClick={() => void submit()}>
              Submit application
            </button>
          </div>
        )}
      </div>
    </div>
  );
}