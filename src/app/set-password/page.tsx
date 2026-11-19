'use client';

import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';
import { Icon } from '@/components/icon';
import { LandingIllustration } from '@/components/landing-illustration';
import { PasswordField } from '@/components/password-field';
import { RmMark } from '@/components/rm-mark';
import { useAuth } from '@/components/auth-provider';
import { api, ApiError } from '@/lib/api-client';

export default function SetPasswordPage() {
  const router = useRouter();
  const { user, ready, refresh, signOut } = useAuth();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!ready) return;
    if (!user) {
      router.replace('/');
      return;
    }
    if (!user.mustChangePassword) {
      router.replace('/app');
    }
  }, [ready, user, router]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setBusy(true);
    try {
      await api.changePassword(password, confirm);
      await refresh();
      router.replace('/app');
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'Could not update password.',
      );
    } finally {
      setBusy(false);
    }
  }

  if (!ready || !user?.mustChangePassword) {
    return (
      <div className="pub" style={{ padding: 48, textAlign: 'center' }}>
        <p className="mut">Loading…</p>
      </div>
    );
  }

  return (
    <div className="lp">
      <section className="dk">
        <div className="wave">
          <i />
          <i />
          <i />
        </div>
        <div className="tt">
          <RmMark size={34} variant="gold" />
          Morgan Oxford Education
        </div>
        <LandingIllustration />
        <div className="tg">
          <h1 className="gt">Every family, the right school.</h1>
          <p>The counsellor portal for Morgan Oxford Education.</p>
        </div>
      </section>
      <section className="lg2">
        <h2 className="gtd" style={{ fontSize: 40 }}>
          Set your password
        </h2>
        <p className="mut">
          Your account used a temporary password. Choose a new one before using
          the portal.
        </p>
        <form className="lg2-form" onSubmit={onSubmit}>
          <PasswordField
            label="New password"
            id="npw"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
          />
          <PasswordField
            label="Confirm new password"
            id="npw2"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            minLength={8}
          />
          {error ? (
            <p className="er" role="alert">
              {error}
            </p>
          ) : null}
          <button
            className="btn"
            type="submit"
            disabled={busy}
            style={{ justifyContent: 'center', minHeight: 48 }}
          >
            {busy ? 'Saving…' : 'Save and continue'}{' '}
            <Icon name="arrow" className="ar" />
          </button>
          <button
            type="button"
            className="sm"
            style={{
              background: 'none',
              border: 0,
              cursor: 'pointer',
              textAlign: 'center',
            }}
            onClick={() => {
              signOut();
              router.push('/');
            }}
          >
            Sign out instead
          </button>
        </form>
      </section>
    </div>
  );
}