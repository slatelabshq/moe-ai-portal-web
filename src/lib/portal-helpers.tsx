'use client';

import Link from 'next/link';
import { useState, type ReactNode } from 'react';
import { Icon } from '@/components/icon';
import { stageLabel } from '@/lib/stages';

export const STAGE_LABELS = [
  'Lead',
  'Contacted',
  'Consultation booked',
  'Consultation done',
  'Proposal sent',
  'Proposal viewed',
  'Shortlist agreed',
  'Documents requested',
  'Documents received',
  'Application submitted',
  'Admissions',
  'Approved',
  'Qualified',
  'Offer received',
  'Enrolled',
] as const;

export type StudentUi = {
  st: number;
  cons?: boolean;
  app?: boolean;
};

export const W9: [string, number[], string][] = [
  ['New leads', [0, 1], 'user-plus'],
  ['Consultation', [2, 3], 'chat'],
  ['Proposal sent', [4], 'send'],
  ['Proposal viewed', [5], 'eye'],
  ['Shortlist agreed', [6], 'circle-check'],
  ['Documents', [7, 8], 'file'],
  ['Application submitted', [9], 'upload'],
  ['Admissions', [10, 11, 12], 'building'],
  ['Offers and enrolment', [13, 14], 'badge'],
];

export function initials(name: string) {
  return String(name)
    .replace(/^(The|University of)\s+/i, '')
    .split(/\s+/)
    .filter((w) => /^[A-Za-zÀ-ž]/.test(w))
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

export function stLabel(s: StudentUi) {
  return s.app && !s.cons ? 'Needs consultation' : stageLabel(s.st);
}

export function nextTxt(s: StudentUi) {
  if (!s.app) return 'Waiting for the application form';
  if (!s.cons) return 'Application received · continue consultation';
  if (s.st < 4) return 'Ready for a proposal';
  if (s.st === 4) return 'Proposal sent';
  if (s.st === 5) return 'Family opened the proposal';
  if (s.st === 6) return 'Shortlist agreed · request documents';
  if (s.st === 7) return 'Upload documents for admissions';
  return stageLabel(s.st);
}

export function Spark({ values }: { values: number[] }) {
  const m = Math.max(...values, 1);
  const d = values
    .map((v, i) => `${i ? 'L' : 'M'}${i * (200 / (values.length - 1))},${44 - (v / m) * 40}`)
    .join(' ');
  return (
    <svg className="spark" viewBox="0 0 200 46" preserveAspectRatio="none">
      <path d={d} />
    </svg>
  );
}

export function StudentMono({ name }: { name: string }) {
  return <div className="mono">{initials(name)}</div>;
}

export function RmMarkBand({
  onInk,
  className = '',
}: {
  onInk?: boolean;
  className?: string;
}) {
  const src = onInk
    ? '/assets/rm/rm-mark-gold@900.png'
    : '/assets/rm/rm-mark-black@900.png';
  return (
    <div className={`rmk ${onInk ? 'on-ink' : ''} ${className}`.trim()} aria-hidden>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" />
    </div>
  );
}

export function LinkBox({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  const wa = `https://wa.me/?text=${encodeURIComponent(
    'Please fill in this application form for Morgan Oxford Education: ' + url,
  )}`;
  return (
    <div className="row" style={{ gap: 8, flexWrap: 'nowrap' }}>
      <input
        readOnly
        value={url}
        aria-label="Application link"
        style={{ fontSize: 13, minWidth: 0, flex: 1 }}
      />
      <button
        type="button"
        className="btn o s"
        aria-label={copied ? 'Copied' : 'Copy link'}
        onClick={() => {
          void navigator.clipboard.writeText(url).then(() => {
            setCopied(true);
            window.setTimeout(() => setCopied(false), 2000);
          });
        }}
      >
        <Icon name="copy" />
        {copied ? 'Copied' : 'Copy'}
      </button>
      <a
        className="ib"
        target="_blank"
        rel="noopener noreferrer"
        href={wa}
        aria-label="Send on WhatsApp"
      >
        <Icon name="chat" />
      </a>
    </div>
  );
}

export function Stepper({ stage }: { stage: number }) {
  return (
    <div className="stepper" style={{ margin: '14px 0 6px' }}>
      {STAGE_LABELS.map((x, i) => (
        <i key={x} className={i <= stage ? 'on' : ''} title={x} />
      ))}
    </div>
  );
}

export function applyUrl(token: string, origin?: string) {
  const base =
    origin ??
    (typeof window !== 'undefined' ? window.location.origin : '');
  return `${base}/apply/${token}`;
}

export function counsellorHomeForStudent(id: string) {
  return `/app/student/${id}`;
}

export function StudentLink({
  id,
  children,
  className,
}: {
  id: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link href={counsellorHomeForStudent(id)} className={className}>
      {children}
    </Link>
  );
}