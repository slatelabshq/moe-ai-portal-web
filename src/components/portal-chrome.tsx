'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ReactNode, useEffect, useState } from 'react';
import Image from 'next/image';
import { Icon } from './icon';
import { ADMIN_NAV, COUNSELLOR_NAV, NavItem } from '@/lib/nav';
import { useAuth } from '@/components/auth-provider';
import { CommandPalette } from '@/components/command-palette';

type Props = {
  children: ReactNode;
  /** When true, show counsellor nav; when false, show admin ops nav (Admin role only). */
  counsellorNav?: boolean;
  onNavModeChange?: (counsellorNav: boolean) => void;
};

export function PortalChrome({
  children,
  counsellorNav = false,
  onNavModeChange,
}: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [sideOpen, setSideOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [palOpen, setPalOpen] = useState(false);
  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPalOpen((v) => !v);
      }
    };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, []);

  const allowed = new Set(user?.permissions ?? []);
  const nav: NavItem[] = (counsellorNav ? COUNSELLOR_NAV : ADMIN_NAV).filter(
    (item) => user?.role === 'Admin' || allowed.has(item.perm),
  );

  const hrefFor = (item: NavItem) => item.href;

  const isActive = (item: NavItem) => {
    if (item.href === '/app') return pathname === '/app';
    return pathname.startsWith(item.href);
  };

  const tabPick =
    nav.length <= 5
      ? nav
      : nav.filter((x) =>
          [
            '/app',
            '/app/students',
            '/app/search',
            '/app/pipeline',
            '/app/overview',
            '/app/admissions',
            '/app/schools',
            '/app/partners',
          ].includes(x.href),
        ).slice(0, 4);

  return (
    <>
      <div className="app">
        <nav
          className={`side ${sideOpen ? 'open' : ''}`}
          id="side"
          aria-label="Portal"
        >
          <div className="lg">
            <Image
              src="/assets/rm/rm-mark-black@900.png"
              alt=""
              width={32}
              height={32}
              style={{ width: 32, height: 'auto' }}
            />
            Morgan Oxford
          </div>
          {onNavModeChange ? (
            <div
              className="sel3 side-mode"
              role="group"
              aria-label="Portal mode"
            >
              <button
                type="button"
                className={!counsellorNav ? 'on' : ''}
                onClick={() => {
                  onNavModeChange(false);
                  router.push('/app/overview');
                  setSideOpen(false);
                }}
              >
                <Icon name="chart" className="s" />
                Admin
              </button>
              <button
                type="button"
                className={counsellorNav ? 'on' : ''}
                onClick={() => {
                  onNavModeChange(true);
                  router.push('/app');
                  setSideOpen(false);
                }}
              >
                <Icon name="users" className="s" />
                Counsellor
              </button>
            </div>
          ) : null}
          {nav.map((item) => (
            <Link
              key={item.href}
              href={hrefFor(item)}
              className={isActive(item) ? 'on' : ''}
              data-k={item.href.replace('/app/', '').replace('/app', '')}
              onClick={() => setSideOpen(false)}
            >
              <span className="ico">
                <Icon name={item.icon} />
              </span>
              {item.label}
            </Link>
          ))}
          <div className="me">
            <b style={{ color: 'var(--rm-text)' }}>{user?.displayName ?? '…'}</b>
            <br />
            {user?.role}
            <br />
            <button
              type="button"
              onClick={() => {
                signOut();
                router.push('/');
              }}
              style={{
                padding: '8px 0 0',
                display: 'inline-flex',
                gap: 6,
                background: 'none',
                border: 0,
                cursor: 'pointer',
                color: 'inherit',
                alignItems: 'center',
              }}
            >
              <Icon name="arrow-left" className="s" />
              Sign out
            </button>
          </div>
        </nav>
        <main>
          <header className="top">
            <button
              type="button"
              className="ib w mbtn"
              aria-label="Menu"
              onClick={() => setSideOpen(true)}
            >
              <Icon name="menu" />
            </button>
            <button
              type="button"
              className="sbtn"
              onClick={() => setPalOpen(true)}
            >
              <Icon name="search" />
              <span>Search</span>
              <kbd>⌘K</kbd>
            </button>
            <div className="row" id="topr">
              <button
                type="button"
                className="ib w"
                aria-label="Notifications"
                style={{ position: 'relative' }}
                onClick={() => setBellOpen((v) => !v)}
              >
                <Icon name="bell" />
              </button>
            </div>
            <div className={`card bp ${bellOpen ? 'open' : ''}`} id="bp">
              <p className="mut sm" style={{ padding: 12 }}>
                Nothing new.
              </p>
            </div>
          </header>
          <div id="pg" className="page in">
            {children}
          </div>
        </main>
      </div>
      {sideOpen ? (
        <button
          type="button"
          className="ov open"
          aria-label="Close menu"
          onClick={() => setSideOpen(false)}
          style={{ border: 0, padding: 0, cursor: 'pointer' }}
        />
      ) : null}
      <nav className="tabbar" aria-label="Main">
        {tabPick.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={isActive(item) ? 'on' : ''}
          >
            <span className="ico">
              <Icon name={item.icon} className="s" />
            </span>
            {item.label.split(' ')[0]}
          </Link>
        ))}
        {nav.length > 5 ? (
          <button type="button" onClick={() => setSideOpen(true)}>
            <span className="ico">
              <Icon name="more" className="s" />
            </span>
            More
          </button>
        ) : null}
      </nav>
      <CommandPalette
        open={palOpen}
        onClose={() => setPalOpen(false)}
        canSchools={user?.role === 'Admin' || user?.role === 'BD' || allowed.has('schools')}
        canStudents={allowed.has('students')}
      />
      <aside className="drw" id="drw" aria-label="Details" />
      <div className="mdl" id="mdl" role="dialog" />
      <div id="toast" role="status" aria-live="polite" />
    </>
  );
}
