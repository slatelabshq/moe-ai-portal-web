'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { PortalChrome } from '@/components/portal-chrome';
import { useAuth } from '@/components/auth-provider';

const ADMIN_PREFIXES = [
  '/app/overview',
  '/app/admissions',
  '/app/schools',
  '/app/partners',
  '/app/assign',
  '/app/access',
];

const COUNSELLOR_PREFIXES = [
  '/app/students',
  '/app/student',
  '/app/new',
  '/app/search',
  '/app/compare',
  '/app/proposals',
  '/app/proposal',
  '/app/pipeline',
  '/app/brand',
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, ready } = useAuth();
  const isAdmin = user?.role === 'Admin';
  const [counsellorNav, setCounsellorNav] = useState(false);

  useEffect(() => {
    if (!ready) return;
    if (!user) {
      router.replace('/');
      return;
    }
    if (user.mustChangePassword) {
      router.replace('/set-password');
    }
  }, [ready, user, router]);

  useEffect(() => {
    if (!isAdmin) return;
    if (ADMIN_PREFIXES.some((p) => pathname.startsWith(p))) {
      setCounsellorNav(false);
      return;
    }
    if (
      pathname === '/app' ||
      COUNSELLOR_PREFIXES.some((p) => pathname.startsWith(p))
    ) {
      setCounsellorNav(true);
    }
  }, [pathname, isAdmin]);

  if (!ready || !user) {
    return (
      <div className="pub" style={{ padding: 48, textAlign: 'center' }}>
        <p className="mut">Loading portal…</p>
      </div>
    );
  }

  return (
    <PortalChrome
      counsellorNav={isAdmin ? counsellorNav : true}
      onNavModeChange={isAdmin ? setCounsellorNav : undefined}
    >
      {children}
    </PortalChrome>
  );
}
