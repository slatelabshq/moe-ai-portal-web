'use client';

import { useState } from 'react';
import { PageHead } from '@/components/page-head';
import { Icon } from '@/components/icon';
import { CoverPicker } from '@/components/cover-picker';
import { CoverId, coverImageUrl } from '@/lib/covers';
import { useAuth } from '@/components/auth-provider';

export default function BrandingPage() {
  const { user } = useAuth();
  const b = {
    name: user?.displayName ?? '',
    title: user?.role ?? '',
    wa: '',
    email: user?.email ?? '',
    agency: user?.agency ?? '',
    sign: '',
    cover: 'oxford-spires-dusk',
  };
  const [cover, setCover] = useState<CoverId>(b.cover as CoverId);
  const coverUrl = coverImageUrl(cover);

  return (
    <>
      <PageHead
        title="My branding"
        subtitle="Your name, contact, logo and default cover appear on every proposal you send."
      />
      <div className="grid g2">
        <div className="card">
          <div className="f">
            <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
              <div>
                <label>Name on proposals</label>
                <input defaultValue={b.name} />
              </div>
              <div>
                <label>Title</label>
                <input defaultValue={b.title} />
              </div>
            </div>
            <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
              <div>
                <label>WhatsApp number</label>
                <input type="tel" defaultValue={b.wa} placeholder="+234 …" />
              </div>
              <div>
                <label>Email</label>
                <input type="email" defaultValue={b.email} />
              </div>
            </div>
            <div>
              <label>Agency name (agents only)</label>
              <input
                defaultValue={b.agency}
                placeholder="Leave empty for Morgan Oxford Education"
              />
            </div>
            <div>
              <label>Sign-off</label>
              <input defaultValue={b.sign} placeholder="Warm regards, …" />
            </div>
            <label className="drop" style={{ padding: 18 }}>
              <Icon name="upload" />
              <span className="sm mut">Square image works best</span>
              <input className="sr" type="file" accept="image/*" />
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
                <b>{user?.displayName}</b>
                <p className="sm mut">{b.title}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
