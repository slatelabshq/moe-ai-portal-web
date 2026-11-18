'use client';

import Link from 'next/link';
import type { LoginResponse } from '@/lib/api-client';

const NAV = [
  ['', 'Home'],
  ['students', 'Students'],
  ['search', 'AI search'],
  ['compare', 'Compare schools'],
  ['proposals', 'Proposals'],
  ['pipeline', 'Pipeline'],
  ['brand', 'My branding'],
] as const;

type Props = {
  user: LoginResponse['user'];
  onSignOut: () => void;
  children: React.ReactNode;
};

export function AppShell({ user, onSignOut, children }: Props) {
  return (
    <div className="app">
      <nav className="side" aria-label="Portal">
        <div className="lg">
          <span className="mono" style={{ width: 32, height: 32, fontSize: 11 }}>
            MO
          </span>
          Morgan Oxford
        </div>
        {NAV.map(([href, label]) => (
          <Link key={href} href={href ? `/app/${href}` : '/app'}>
            <span className="ico" aria-hidden="true" />
            {label}
          </Link>
        ))}
        <div className="me">
          <b style={{ color: 'var(--rm-text)' }}>{user.displayName}</b>
          <br />
          {user.role}
          <br />
          <button
            type="button"
            onClick={onSignOut}
            style={{
              padding: '8px 0 0',
              background: 'none',
              border: 0,
              cursor: 'pointer',
              color: 'inherit',
            }}
          >
            Sign out
          </button>
        </div>
      </nav>
      <main>
        <header className="top">
          <span className="tag">Connected to API</span>
        </header>
        <div className="page">{children}</div>
      </main>
    </div>
  );
}
