'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { PageHead } from '@/components/page-head';
import { Icon } from '@/components/icon';
import { api } from '@/lib/api-client';

const SERVICES = [
  'Summer',
  'K–12',
  'Pathways',
  "Bachelor's",
  'Postgraduate',
] as const;

export default function ConsultPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['student', id],
    queryFn: () => api.student(id),
  });

  const [service, setService] = useState("Bachelor's");
  const [faculty, setFaculty] = useState('');
  const [destinations, setDestinations] = useState('');
  const [budget, setBudget] = useState(16000);
  const [note, setNote] = useState('');

  useEffect(() => {
    if (!data) return;
    setService(data.service);
    setFaculty(data.faculty ?? '');
    setDestinations(data.destinations.join(', '));
    setBudget(data.budgetUsd);
  }, [data]);

  const finish = useMutation({
    mutationFn: async () => {
      await api.updateStudent(id, {
        service: service ?? undefined,
        faculty: faculty || undefined,
        destinations: (destinations ?? '')
          .split(',')
          .map((d) => d.trim())
          .filter(Boolean),
        budgetUsd: budget ?? undefined,
        consultationDone: true,
      });
      if (note.trim()) {
        await api.addStudentNote(id, note.trim());
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['student', id] });
      router.push(`/app/search/${id}`);
    },
  });

  if (isLoading) return <p className="mut">Loading…</p>;
  if (!data) return <p className="mut">Student not found.</p>;

  return (
    <>
      <PageHead
        title="Consultation"
        subtitle={`${data.name} · ${data.service}`}
        eyebrow={<span className="tag k">Step 2 of 3</span>}
      />
      <div className="card afm" style={{ maxWidth: 860 }}>
        <div className="f">
          <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div>
              <label>Service</label>
              <select
                value={service ?? data.service}
                onChange={(e) => setService(e.target.value)}
              >
                {SERVICES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label>Faculty / subject</label>
              <input
                value={faculty ?? ''}
                onChange={(e) => setFaculty(e.target.value)}
                placeholder="e.g. Engineering"
              />
            </div>
          </div>
          <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div>
              <label>Destinations (comma separated)</label>
              <input
                value={destinations ?? ''}
                onChange={(e) => setDestinations(e.target.value)}
                placeholder="UK, Canada"
              />
            </div>
            <div>
              <label>Budget (USD)</label>
              <input
                type="number"
                min={5000}
                step={500}
                value={budget ?? data.budgetUsd}
                onChange={(e) => setBudget(Number(e.target.value))}
              />
            </div>
          </div>
          <div>
            <label>Consultation notes</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="What the family told you"
              rows={4}
            />
          </div>
          <div className="row">
            <Link className="btn o" href={`/app/student/${id}`}>
              <Icon name="arrow-left" />
              Back
            </Link>
            <button
              type="button"
              className="btn"
              disabled={finish.isPending}
              onClick={() => finish.mutate()}
            >
              Find schools <Icon name="sparkle" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}