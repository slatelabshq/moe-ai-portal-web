'use client';

import { useState } from 'react';
import { PageHead } from '@/components/page-head';
import { Icon } from '@/components/icon';
import { LinkBox, applyUrl } from '@/lib/portal-helpers';
import { useAuth } from '@/components/auth-provider';

const TABS = [
  ['up', 'Upload documents', 'upload'],
  ['link', 'Share application link', 'link'],
  ['form', 'Fill the application form', 'file'],
] as const;

export default function NewStudentPage() {
  const [tab, setTab] = useState<(typeof TABS)[number][0]>('up');
  const { user } = useAuth();
  const apply = applyUrl(
    user?.applySlug ?? user?.id ?? user?.email.split('@')[0] ?? 'counsellor',
  );

  return (
    <>
      <PageHead
        title="New student"
        subtitle="Upload the profile and consultation form, share your link, or fill the application with the family."
        eyebrow={<span className="tag k">Step 1 of 3</span>}
      />
      <div className="sel3" style={{ marginBottom: 22 }}>
        {TABS.map(([key, label, icon]) => (
          <button
            key={key}
            type="button"
            className={tab === key ? 'on' : ''}
            onClick={() => setTab(key)}
          >
            <Icon name={icon} className="s" />
            {label}
          </button>
        ))}
        <button type="button" className="soon" aria-disabled>
          <Icon name="layers" className="s" />
          Fill a form in the portal · coming soon
        </button>
      </div>
      {tab === 'link' ? (
        <div className="card afm">
          <div className="row" style={{ gap: 16, flexWrap: 'nowrap' }}>
            <span className="ib">
              <Icon name="link" />
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h3>Your application link</h3>
              <p className="sm mut">
                Anyone who fills it is assigned to you and appears in your
                students as Needs consultation.
              </p>
            </div>
          </div>
          <div style={{ marginTop: 14 }}>
            <LinkBox url={apply} />
          </div>
        </div>
      ) : tab === 'form' ? (
        <div className="card afm">
          <p className="mut">Application form screen matches the public /apply flow.</p>
        </div>
      ) : (
        <div className="card" style={{ maxWidth: 900 }}>
          <h3>Student profile and consultation form</h3>
          <p className="sm mut" style={{ margin: '6px 0 18px' }}>
            Upload both documents to build the student’s profile.
          </p>
          <div className="grid g2" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <label className="drop">
              <Icon name="upload" className="l" />
              <h3>Student profile</h3>
              <p className="mut sm">Drop the profile document or select it</p>
            </label>
            <label className="drop">
              <Icon name="upload" className="l" />
              <h3>Consultation form</h3>
              <p className="mut sm">Drop the completed consultation form</p>
            </label>
          </div>
          <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', marginTop: 16 }}>
            <div>
              <label>Form type</label>
              <select defaultValue="Detect from the document">
                <option>Detect from the document</option>
                <option>General</option>
                <option>School fair</option>
                <option>Sports</option>
              </select>
              <p className="helper">
                General, school fair, sports, premium agent or agent form.
              </p>
            </div>
            <div style={{ alignSelf: 'end' }}>
              <button className="btn" type="button" disabled>
                Read documents <Icon name="sparkle" />
              </button>
            </div>
          </div>
          <p className="sm" style={{ marginTop: 14 }}>
            <button type="button" className="sm" style={{ background: 'none', border: 0, cursor: 'pointer', color: 'var(--gg)' }}>
              Use sample documents
            </button>
          </p>
        </div>
      )}
    </>
  );
}
