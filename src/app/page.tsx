'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { Icon } from '@/components/icon';
import { PasswordField } from '@/components/password-field';
import { LandingIllustration } from '@/components/landing-illustration';
import { RmMark } from '@/components/rm-mark';
import { useAuth } from '@/components/auth-provider';
import { ApiError } from '@/lib/api-client';

export default function SignInPage() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const signedIn = await signIn(email, password);
      router.push(signedIn.mustChangePassword ? '/set-password' : '/app');
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'The email or password is not correct.',
      );
    } finally {
      setBusy(false);
    }
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
          Sign in
        </h2>
        <p className="mut">Use your Morgan Oxford email and password.</p>
        <form className="lg2-form" onSubmit={onSubmit}>
          <div>
            <label htmlFor="lem">Email</label>
            <input
              id="lem"
              type="email"
              autoComplete="username"
              placeholder="you@morganoxford.example"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <PasswordField
            label="Password"
            id="lpw"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error ? (
            <p className="er" role="alert">
              {error}
            </p>
          ) : (
            <p className="er" role="alert" aria-live="polite" />
          )}
          <button
            className="btn"
            type="submit"
            disabled={busy}
            style={{ justifyContent: 'center', minHeight: 48 }}
          >
            {busy ? 'Signing in…' : 'Sign in'} <Icon name="arrow" className="ar" />
          </button>
        </form>
        <Link className="sm" href="/request" style={{ textAlign: 'center' }}>
          New agent? Request an account
        </Link>
      </section>
    </div>
  );
}
