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

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, ready } = useAuth();
  const isAdmin = user?.role === 'Admin';
  const [counsellorView, setCounsellorView] = useState(false);

  useEffect(() => {
    if (!ready) return;
    if (!user) router.replace('/');
  }, [ready, user, router]);

  useEffect(() => {
    if (!isAdmin) return;
    const onAdmin = ADMIN_PREFIXES.some((p) => pathname.startsWith(p));
    setCounsellorView(!onAdmin);
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
      adminView={isAdmin ? !counsellorView : false}
      onToggleAdminView={
        isAdmin ? (admin) => setCounsellorView(!admin) : undefined
      }
    >
      {children}
    </PortalChrome>
  );
}
