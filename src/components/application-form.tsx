'use client';

import { useState, type ReactNode } from 'react';
import { Icon } from '@/components/icon';
import { RmMark } from '@/components/rm-mark';

const SERVICES = [
  'Summer',
  'K–12',
  'Pathways',
  'Sports Pathways',
  "Bachelor's",
  'Postgraduate',
];

const DEST = [
  'United Kingdom',
  'Canada',
  'United States',
  'Türkiye',
  'United Arab Emirates',
  'Spain',
  'Germany',
  'Hungary',
  'Ireland',
  'Georgia',
  'Not sure yet',
];

const OPT = {
  want: [
    'Study abroad',
    'Change my institution',
    'Get a second opinion on an application',
    'Visa and travel guidance',
  ],
  for: ['Myself', 'My child', 'A relative', 'A student I sponsor'],
  src: ['Instagram', 'Facebook', 'WhatsApp', 'Referral', 'Agent', 'Website', 'School fair', 'Other'],
  post: ['No', 'Yes'],
};

export type AppFields = {
  name: string;
  email: string;
  phone: string;
  dob: string;
  country: string;
  address: string;
  want: string;
  for: string;
  cos: string;
  course: string;
  intake: string;
  prog: string;
  src: string;
  agent: string;
  post: string;
  comment: string;
  parentName: string;
  parentSalutation: string;
  parentRelationship: string;
  parentEmail: string;
  parentPhone: string;
  nationality: string;
  gender: string;
  currentClass: string;
};

const EMPTY: AppFields = {
  name: '',
  email: '',
  phone: '',
  dob: '',
  country: '',
  address: '',
  want: '',
  for: '',
  cos: '',
  course: '',
  intake: '',
  prog: '',
  src: '',
  agent: '',
  post: '',
  comment: '',
  parentName: '',
  parentSalutation: '',
  parentRelationship: '',
  parentEmail: '',
  parentPhone: '',
  nationality: '',
  gender: '',
  currentClass: '',
};

const REQUIRED: (keyof AppFields)[] = [
  'name',
  'email',
  'phone',
  'dob',
  'country',
  'address',
  'want',
  'for',
  'cos',
  'course',
  'prog',
  'src',
  'post',
];

export type ApplicationPayload = {
  name: string;
  phone: string;
  email: string;
  service: string;
  destinations: string[];
  formType: string;
  application: Record<string, string>;
  docNames: string[];
};

export function ApplicationForm({
  busy,
  subtitle = 'Fill and submit for a refined consultation experience',
  onSubmit,
}: {
  busy?: boolean;
  subtitle?: string;
  onSubmit: (payload: ApplicationPayload) => Promise<void>;
}) {
  const [app, setApp] = useState<AppFields>(EMPTY);
  const [fieldErr, setFieldErr] = useState<Partial<Record<keyof AppFields, string>>>({});
  const [docs, setDocs] = useState<File[]>([]);
  const [err, setErr] = useState('');

  function setField(key: keyof AppFields, value: string) {
    setApp((prev) => ({ ...prev, [key]: value }));
    setFieldErr((prev) => ({ ...prev, [key]: undefined }));
  }

  async function submit() {
    const nextErr: Partial<Record<keyof AppFields, string>> = {};
    for (const key of REQUIRED) {
      if (!app[key].trim()) nextErr[key] = 'This field is required';
    }
    if (!docs.length) setErr('Add the supporting documents');
    setFieldErr(nextErr);
    if (Object.keys(nextErr).length || !docs.length) return;

    const application: Record<string, string> = {};
    const put = (key: string, value: string) => {
      const trimmed = value.trim();
      if (trimmed) application[key] = trimmed;
    };
    put('email', app.email);
    put('studentEmail', app.email);
    put('dob', app.dob);
    put('dateOfBirth', app.dob);
    put('country', app.country);
    put('address', app.address);
    put('want', app.want);
    put('for', app.for);
    put('cos', app.cos);
    put('preferredCountry', app.cos);
    put('course', app.course);
    put('courseInterest', app.course);
    put('intake', app.intake);
    put('prog', app.prog);
    put('src', app.src);
    put('agent', app.agent);
    put('post', app.post);
    put('comment', app.comment);
    put('notes', app.comment);
    put('parentName', app.parentName);
    put('parentSalutation', app.parentSalutation);
    put('parentRelationship', app.parentRelationship);
    put('parentEmail', app.parentEmail);
    put('parentPhone', app.parentPhone);
    put('nationality', app.nationality);
    put('gender', app.gender);
    put('currentClass', app.currentClass);
    put('docs', docs.map((d) => d.name).join(', '));

    const country = DEST.includes(app.cos) && app.cos !== 'Not sure yet' ? [app.cos] : [];
    setErr('');
    try {
      await onSubmit({
        name: app.name.trim(),
        phone: app.phone.trim(),
        email: app.email.trim(),
        service: SERVICES.includes(app.prog) ? app.prog : "Bachelor's",
        destinations: country,
        formType: app.src === 'School fair' ? 'School fair' : 'General',
        application,
        docNames: docs.map((d) => d.name),
      });
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not save the application');
    }
  }

  return (
    <div className="card afm">
      <div
        style={{
          display: 'grid',
          justifyItems: 'center',
          gap: 6,
          marginBottom: 24,
          textAlign: 'center',
        }}
      >
        <RmMark size={42} variant="black" alt="Morgan Oxford Education" />
        <h2>Application Form</h2>
        <p className="mut sm">{subtitle}</p>
      </div>
      <div className="f">
        <FormField label="Name" required error={fieldErr.name}>
          <input value={app.name} placeholder="Enter your name" onChange={(e) => setField('name', e.target.value)} />
        </FormField>
        <FormField label="Email" required error={fieldErr.email}>
          <input type="email" value={app.email} placeholder="Enter your email address" onChange={(e) => setField('email', e.target.value)} />
        </FormField>
        <FormField label="Phone" required error={fieldErr.phone}>
          <input type="tel" value={app.phone} placeholder="Enter your phone number" onChange={(e) => setField('phone', e.target.value)} />
        </FormField>
        <FormField label="Date of Birth of Applicant" required error={fieldErr.dob}>
          <input type="date" value={app.dob} onChange={(e) => setField('dob', e.target.value)} />
        </FormField>
        <FormField label="Country of Residence" required error={fieldErr.country}>
          <input value={app.country} placeholder="Enter your country of residence" onChange={(e) => setField('country', e.target.value)} />
        </FormField>
        <FormField label="Address" required error={fieldErr.address}>
          <textarea value={app.address} placeholder="Enter your address" onChange={(e) => setField('address', e.target.value)} />
        </FormField>
        <FormField label="I want to ?" required error={fieldErr.want}>
          <Select value={app.want} placeholder="Select" options={OPT.want} onChange={(v) => setField('want', v)} />
        </FormField>
        <FormField label="I am consulting for?" required error={fieldErr.for}>
          <Select value={app.for} placeholder="Select" options={OPT.for} onChange={(v) => setField('for', v)} />
        </FormField>
        <FormField label="Preferred Country of Study?" required error={fieldErr.cos}>
          <Select value={app.cos} placeholder="Select country" options={DEST} onChange={(v) => setField('cos', v)} />
        </FormField>
        <FormField label="Preferred Course" required error={fieldErr.course}>
          <input value={app.course} placeholder="e.g. Business Administration" onChange={(e) => setField('course', e.target.value)} />
        </FormField>
        <FormField label="Intake Year?">
          <input value={app.intake} placeholder="e.g. September 2027" onChange={(e) => setField('intake', e.target.value)} />
        </FormField>
        <FormField label="Programme" required error={fieldErr.prog}>
          <Select value={app.prog} placeholder="Select programme" options={SERVICES} onChange={(v) => setField('prog', v)} />
        </FormField>
        <FormField label="Source" required error={fieldErr.src}>
          <Select value={app.src} placeholder="How did you hear about us?" options={OPT.src} onChange={(v) => setField('src', v)} />
        </FormField>
        <FormField label="Agent’s Name/Social Media Handle">
          <input value={app.agent} placeholder="If applicable" onChange={(e) => setField('agent', e.target.value)} />
        </FormField>
        <FormField label="Is this a post application case?" required error={fieldErr.post}>
          <Select value={app.post} placeholder="Select" options={OPT.post} onChange={(v) => setField('post', v)} />
        </FormField>
        <FormField label="Comment">
          <textarea value={app.comment} placeholder="Any additional comments" onChange={(e) => setField('comment', e.target.value)} />
        </FormField>
        <FormField label="Parent or guardian name">
          <input value={app.parentName} placeholder="Parent name" onChange={(e) => setField('parentName', e.target.value)} />
        </FormField>
        <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <FormField label="Salutation">
            <input value={app.parentSalutation} placeholder="Mr, Mrs, Dr" onChange={(e) => setField('parentSalutation', e.target.value)} />
          </FormField>
          <FormField label="Relationship">
            <input value={app.parentRelationship} placeholder="Mother, father, guardian" onChange={(e) => setField('parentRelationship', e.target.value)} />
          </FormField>
        </div>
        <FormField label="Parent email">
          <input type="email" value={app.parentEmail} placeholder="Parent email" onChange={(e) => setField('parentEmail', e.target.value)} />
        </FormField>
        <FormField label="Parent phone">
          <input type="tel" value={app.parentPhone} placeholder="Parent phone" onChange={(e) => setField('parentPhone', e.target.value)} />
        </FormField>
        <div className="grid" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
          <FormField label="Nationality">
            <input value={app.nationality} onChange={(e) => setField('nationality', e.target.value)} />
          </FormField>
          <FormField label="Gender">
            <input value={app.gender} onChange={(e) => setField('gender', e.target.value)} />
          </FormField>
          <FormField label="Current class">
            <input value={app.currentClass} onChange={(e) => setField('currentClass', e.target.value)} />
          </FormField>
        </div>
        <FormField label="Supporting Documents" required error={!docs.length ? err : undefined}>
          <label className={`drop ${docs.length ? 'ok' : ''}`}>
            <input
              className="sr"
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.txt,.md"
              onChange={(e) => {
                setDocs((prev) => [...prev, ...Array.from(e.target.files ?? [])]);
                setErr('');
              }}
            />
            <Icon name={docs.length ? 'check' : 'upload'} className="l" />
            <p className="mut sm" style={{ maxWidth: '46ch' }}>
              Upload all relevant documents: passport or ID, academic transcripts, English test
              results, CV, statement of purpose, reference letters. You can select multiple files.
            </p>
          </label>
          {docs.map((d, i) => (
            <div key={`${d.name}-${i}`} className="row sp sm" style={{ padding: '8px 4px', borderBottom: '1px solid var(--rm-border-hairline)', flexWrap: 'nowrap' }}>
              <span className="row" style={{ gap: 8, minWidth: 0 }}>
                <Icon name="file" />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.name}</span>
              </span>
              <button type="button" className="ib w" aria-label={`Remove ${d.name}`} onClick={() => setDocs((prev) => prev.filter((_, j) => j !== i))}>
                <Icon name="x" />
              </button>
            </div>
          ))}
        </FormField>
        {err && docs.length ? <p className="er">{err}</p> : null}
        <button type="button" className="btn" style={{ justifyContent: 'center', minHeight: 48 }} disabled={busy} onClick={() => void submit()}>
          Submit
        </button>
      </div>
    </div>
  );
}

function FormField({ label, required, error, children }: { label: string; required?: boolean; error?: string; children: ReactNode }) {
  return (
    <div>
      <label>
        {label}
        {required ? <span className="rq"> *</span> : null}
      </label>
      {children}
      {error ? (
        <p className="er">
          <Icon name="warning" />
          {error}
        </p>
      ) : null}
    </div>
  );
}

function Select({ value, placeholder, options, onChange }: { value: string; placeholder: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o} value={o}>{o}</option>
      ))}
    </select>
  );
}
