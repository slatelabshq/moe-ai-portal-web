'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { PageHead } from '@/components/page-head';
import { Icon } from '@/components/icon';
import { CoverPicker } from '@/components/cover-picker';
import { CoverId, coverImageUrl } from '@/lib/covers';
import { useAuth } from '@/components/auth-provider';
import { api } from '@/lib/api-client';

export default function BrandingPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['branding'],
    queryFn: () => api.branding(),
  });

  const [title, setTitle] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [agency, setAgency] = useState('');
  const [signOff, setSignOff] = useState('');
  const [cover, setCover] = useState<CoverId>('oxford-spires-dusk');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (data) {
      setTitle(data.title ?? '');
      setWhatsapp(data.whatsapp ?? '');
      setEmail(data.email ?? user?.email ?? '');
      setAgency(data.agency ?? user?.agency ?? '');
      setSignOff(data.signOff ?? '');
      if (data.defaultCover) setCover(data.defaultCover as CoverId);
    } else if (user) {
      setEmail(user.email);
      setAgency(user.agency ?? '');
    }
  }, [data, user]);

  const save = useMutation({
    mutationFn: () =>
      api.updateBranding({
        title,
        whatsapp,
        email,
        agency,
        signOff,
        defaultCover: cover,
      }),
    onSuccess: () => {
      setSaved(true);
      qc.invalidateQueries({ queryKey: ['branding'] });
      setTimeout(() => setSaved(false), 2500);
    },
  });

  const coverUrl = coverImageUrl(cover);
  const displayName = user?.displayName ?? '';

  return (
    <>
      <PageHead
        title="My branding"
        subtitle="Your name, contact, logo and default cover appear on every proposal you send."
        actions={
          <button
            type="button"
            className="btn"
            disabled={save.isPending || isLoading}
            onClick={() => save.mutate()}
          >
            {saved ? 'Saved' : 'Save branding'}
          </button>
        }
      />
      <div className="grid g2">
        <div className="card">
          <div className="f">
            <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
              <div>
                <label>Name on proposals</label>
                <input value={displayName} readOnly />
              </div>
              <div>
                <label>Title</label>
                <input value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
            </div>
            <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
              <div>
                <label>WhatsApp number</label>
                <input
                  type="tel"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="+234 …"
                />
              </div>
              <div>
                <label>Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label>Agency name (agents only)</label>
              <input
                value={agency}
                onChange={(e) => setAgency(e.target.value)}
                placeholder="Leave empty for Morgan Oxford Education"
              />
            </div>
            <div>
              <label>Sign-off</label>
              <input
                value={signOff}
                onChange={(e) => setSignOff(e.target.value)}
                placeholder="Warm regards, …"
              />
            </div>
            <label className="drop" style={{ padding: 18 }}>
              <Icon name="upload" />
              <span className="sm mut">Logo upload uses R2 — coming next</span>
              <input className="sr" type="file" accept="image/*" disabled />
            </label>
            <div>
              <label>Default cover for new proposals</label>
              <CoverPicker value={cover} onChange={setCover} />
            </div>
          </div>
        </div>
        <div>
          <p className="eye" style={{ marginBottom: 10 }}>
            Preview
          </p>
          <div className="pv">
            <div
              className="dk"
              style={{
                background: `linear-gradient(rgba(17,15,8,.62),rgba(17,15,8,.86)), url('${coverUrl}') center/cover`,
                padding: 28,
                borderRadius: 16,
                minHeight: 280,
              }}
            >
              <p className="eye" style={{ color: 'var(--rm-text-on-ink-muted)' }}>
                Morgan Oxford Education
              </p>
              <h1 className="gt">University options for your family</h1>
              <div style={{ marginTop: 16 }}>
                <b>{displayName}</b>
                <p className="sm mut">{title || user?.role}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}