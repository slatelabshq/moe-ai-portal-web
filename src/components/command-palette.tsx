'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';

type Props = {
  open: boolean;
  onClose: () => void;
  canSchools: boolean;
  canStudents: boolean;
};

export function CommandPalette({ open, onClose, canSchools, canStudents }: Props) {
  const [q, setQ] = useState('');

  const { data: schools } = useQuery({
    queryKey: ['schools', 'pal', q],
    queryFn: () => api.schools(q || undefined),
    enabled: open && canSchools && q.length > 0,
  });

  const { data: students } = useQuery({
    queryKey: ['students', 'pal', q],
    queryFn: () => api.students(q || undefined),
    enabled: open && canStudents && q.length > 0,
  });

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) setQ('');
  }, [open]);

  if (!open) return null;

  const schoolItems = schools?.items?.slice(0, 8) ?? [];
  const studentItems = students?.items?.slice(0, 8) ?? [];

  return (
    <>
      <button
        type="button"
        className="ov open"
        aria-label="Close search"
        onClick={onClose}
        style={{ border: 0, padding: 0, cursor: 'pointer' }}
      />
      <div className="pal open" role="dialog" aria-label="Search">
        <input
          id="pi"
          placeholder={
            canSchools && canStudents
              ? 'Search schools and students'
              : canSchools
                ? 'Search schools'
                : 'Search students'
          }
          aria-label="Search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          autoFocus
        />
        <div id="pr" style={{ maxHeight: '50vh', overflow: 'auto' }}>
          {!q ? (
            <p className="mut sm" style={{ padding: 12 }}>
              Type to search. Use arrow keys in the browser, then open a result.
            </p>
          ) : null}
          {studentItems.length ? (
            <>
              <p className="eye sm" style={{ padding: '8px 12px 4px' }}>
                Students
              </p>
              {studentItems.map((s) => (
                <Link
                  key={s.id}
                  href={`/app/student/${s.id}`}
                  className="pal-item"
                  onClick={onClose}
                  style={{ display: 'block', padding: '10px 12px' }}
                >
                  <b>{s.name}</b>
                  <span className="sm mut"> · {s.service}</span>
                </Link>
              ))}
            </>
          ) : null}
          {schoolItems.length ? (
            <>
              <p className="eye sm" style={{ padding: '8px 12px 4px' }}>
                Schools
              </p>
              {schoolItems.map((s) => (
                <Link
                  key={s.id}
                  href="/app/schools"
                  className="pal-item"
                  onClick={onClose}
                  style={{ display: 'block', padding: '10px 12px' }}
                >
                  <b>{s.name}</b>
                  <span className="sm mut"> · {s.partnership}</span>
                </Link>
              ))}
            </>
          ) : null}
          {q && !schoolItems.length && !studentItems.length ? (
            <p className="mut sm" style={{ padding: 12 }}>
              No matches.
            </p>
          ) : null}
        </div>
      </div>
    </>
  );
}