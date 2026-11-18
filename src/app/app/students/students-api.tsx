'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';
import { api, StudentRow } from '@/lib/api-client';
import { stageLabel } from '@/lib/stages';

export default function StudentsApiPage() {
  const [q, setQ] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['students', q],
    queryFn: () => api.students(q || undefined),
  });

  const create = useMutation({
    mutationFn: () =>
      api.createStudent({ name: name.trim(), phone: phone.trim() || undefined }),
    onSuccess: () => {
      setName('');
      setPhone('');
      qc.invalidateQueries({ queryKey: ['students'] });
    },
  });

  const items = data?.items ?? [];

  return (
    <>
      <div className="ph">
        <div>
          <h1 className="gtd">Students</h1>
          <p>Your students from first contact to enrolment.</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <h3>New lead</h3>
        <div
          className="grid"
          style={{ gridTemplateColumns: '1fr 1fr auto', marginTop: 12, gap: 12 }}
        >
          <FieldInput label="Name" value={name} onChange={setName} id="sn" />
          <FieldInput label="Phone" value={phone} onChange={setPhone} id="sp" />
          <button
            className="btn"
            type="button"
            disabled={!name.trim() || create.isPending}
            onClick={() => create.mutate()}
            style={{ alignSelf: 'end' }}
          >
            Add student
          </button>
        </div>
      </div>

      <input
        placeholder="Search by name or service"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        style={{ maxWidth: 300, marginBottom: 16, borderRadius: 999 }}
        aria-label="Search students"
      />

      {isLoading ? <p className="mut">Loading…</p> : null}
      <div className="card" style={{ padding: 0 }}>
        <table className="rt">
          <thead>
            <tr>
              <th>Student</th>
              <th>Service</th>
              <th>Stage</th>
            </tr>
          </thead>
          <tbody>
            {items.map((s: StudentRow) => (
              <tr key={s.id} className="hv">
                <td data-l="Student">
                  <Link href={`/app/student/${s.id}`}>
                    <b>{s.name}</b>
                  </Link>
                  <br />
                  <span className="sm mut">{s.phone ?? '—'}</span>
                </td>
                <td data-l="Service">{s.service}</td>
                <td data-l="Stage">
                  <span className="tag">
                    {!s.consultationDone && s.stage >= 1
                      ? 'Needs consultation'
                      : stageLabel(s.stage)}
                  </span>
                </td>
              </tr>
            ))}
            {!items.length && !isLoading ? (
              <tr>
                <td colSpan={3} className="mut">
                  No students yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </>
  );
}

function FieldInput({
  label,
  id,
  value,
  onChange,
}: {
  label: string;
  id: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label htmlFor={id}>{label}</label>
      <input id={id} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
