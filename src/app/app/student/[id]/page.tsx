'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { PageHead } from '@/components/page-head';
import { Icon } from '@/components/icon';
import { StudentMono, Stepper } from '@/lib/portal-helpers';
import { stageLabel } from '@/lib/stages';
import { api } from '@/lib/api-client';

export default function StudentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const [note, setNote] = useState('');
  const { data, isLoading } = useQuery({
    queryKey: ['student', id],
    queryFn: () => api.student(id),
  });

  const addNote = useMutation({
    mutationFn: () => api.addStudentNote(id, note.trim()),
    onSuccess: () => {
      setNote('');
      qc.invalidateQueries({ queryKey: ['student', id] });
    },
  });

  const advanceStage = useMutation({
    mutationFn: () => {
      if (!data) return Promise.resolve();
      const next = Math.min(data.stage + 1, 14);
      return api.updateStage(id, next);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['student', id] }),
  });

  if (isLoading) return <p className="mut">Loading…</p>;
  if (!data) return <p className="mut">Student not found.</p>;

  const matches = data.shortlistSchools ?? [];

  return (
    <>
      <PageHead title={data.name} subtitle={data.service} />
      <div className="card" style={{ marginBottom: 18 }}>
        <div className="row sp">
          <div className="row" style={{ gap: 12 }}>
            <StudentMono name={data.name} />
            <b>{data.name}</b>
          </div>
          <span className="tag k">{stageLabel(data.stage)}</span>
        </div>
        <Stepper stage={data.stage} />
        <p className="sm mut" style={{ marginTop: 8 }}>
          {data.destinations.length
            ? `Destinations: ${data.destinations.join(', ')}`
            : 'Destinations not set yet'}
          {data.budgetUsd ? ` · Budget ~$${data.budgetUsd.toLocaleString('en')}` : null}
        </p>
        <div className="row" style={{ gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
          {data.consultationDone ? (
            <Link className="btn" href={`/app/search/${id}`}>
              {data.searchedAt ? 'Run search again' : 'Run AI search'}{' '}
              <Icon name="sparkle" />
            </Link>
          ) : (
            <Link className="btn o" href={`/app/consult/${id}`}>
              Continue consultation
            </Link>
          )}
          {data.selectedSchoolIds.length ? (
            <button
              type="button"
              className="btn o"
              onClick={async () => {
                const p = (await api.createProposal({ studentId: id })) as { id: string };
                window.location.href = `/app/proposal/${p.id}`;
              }}
            >
              Create proposal
            </button>
          ) : null}
          {data.stage < 14 ? (
            <button
              type="button"
              className="btn o s"
              disabled={advanceStage.isPending}
              onClick={() => advanceStage.mutate()}
            >
              Advance stage
            </button>
          ) : null}
        </div>
      </div>
      {matches.length ? (
        <section>
          <h3 style={{ marginBottom: 12 }}>Shortlist</h3>
          <div className="grid g3">
            {matches.map((m) => (
              <div key={m.id} className="card gl">
                <b>{m.name}</b>
                <p className="sm mut">{m.partnership}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}
      <section style={{ marginTop: 24 }}>
        <h3>Notes</h3>
        <div className="f" style={{ marginTop: 12 }}>
          {data.notes.map((n) => (
            <div key={n.id} className="note">
              <div className="meta">
                <span>{new Date(n.createdAt).toLocaleString('en-GB')}</span>
                <b>{n.author?.displayName ?? ''}</b>
                <span>
                  <Icon name="sync" className="s" /> CRM notified
                </span>
              </div>
              {n.body}
            </div>
          ))}
          {!data.notes.length ? (
            <p className="sm mut">No notes yet.</p>
          ) : null}
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add a note. It is saved with your name and the time."
            rows={3}
          />
          <button
            type="button"
            className="btn o s"
            style={{ width: 'max-content' }}
            disabled={!note.trim() || addNote.isPending}
            onClick={() => addNote.mutate()}
          >
            <Icon name="check" />
            Save note
          </button>
        </div>
      </section>
    </>
  );
}