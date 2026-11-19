'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ApplicationForm } from '@/components/application-form';
import { PageHead } from '@/components/page-head';
import { Icon } from '@/components/icon';
import { RmMark } from '@/components/rm-mark';
import { LinkBox, applyUrl } from '@/lib/portal-helpers';
import { useAuth } from '@/components/auth-provider';
import { api } from '@/lib/api-client';

const TABS = [
  ['up', 'Upload documents', 'upload'],
  ['link', 'Share application link', 'link'],
  ['form', 'Fill the application form', 'file'],
] as const;

const FORMS = [
  'Detect from the document',
  'General',
  'School fair',
  'Sports',
  'Premium agent',
  'Agent',
];

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

const READ_STEPS = [
  'Reading the student profile',
  'Reading the consultation form',
  'Working out the service',
  'Building the profile',
];

const READ_LINES = [
  'Opening the student profile…',
  'Reading the consultation form…',
  'Working out the service…',
  'Building the profile…',
];

const APP_LABELS: Record<string, string> = {
  studentEmail: 'Student email',
  dateOfBirth: 'Date of birth',
  nationality: 'Nationality',
  gender: 'Gender',
  currentClass: 'Current class',
  parentName: 'Parent name',
  parentSalutation: 'Salutation',
  parentRelationship: 'Relationship',
  parentEmail: 'Parent email',
  parentPhone: 'Parent phone',
  courseInterest: 'Course interest',
  intake: 'Intended intake',
  additionalInterest: 'Additional interest',
  leadStatus: 'Lead status',
  preferredCountry: 'Preferred country',
  notes: 'Notes',
  address: 'Address',
  want: 'I want to',
  for: 'Consulting for',
  country: 'Country of residence',
  course: 'Preferred course',
  comment: 'Comment',
};

type Tab = (typeof TABS)[number][0];

type Review = {
  id: string;
  duplicate: boolean;
  name: string;
  phone: string;
  service: string;
  faculty: string;
  destinations: string;
  budgetUsd: string;
  yearGroup: string;
  sport: string;
  formType: string;
  curriculum: string;
  application: Record<string, string>;
};

function fileToBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const value = String(reader.result ?? '');
      const comma = value.indexOf(',');
      resolve(comma >= 0 ? value.slice(comma + 1) : value);
    };
    reader.onerror = () => reject(new Error('Could not read the file'));
    reader.readAsDataURL(file);
  });
}

export default function NewStudentPage() {
  const [tab, setTab] = useState<Tab>('up');
  const { user } = useAuth();
  const router = useRouter();
  const [files, setFiles] = useState<[File | null, File | null]>([null, null]);
  const [formType, setFormType] = useState(FORMS[0]);
  const [busy, setBusy] = useState(false);
  const [reading, setReading] = useState(false);
  const [err, setErr] = useState('');
  const [review, setReview] = useState<Review | null>(null);

  const apply = applyUrl(
    user?.applySlug ?? user?.id ?? user?.email.split('@')[0] ?? 'counsellor',
  );

  function setSlot(index: 0 | 1, list: FileList | null) {
    const file = list?.[0] ?? null;
    setFiles((prev) => {
      const next: [File | null, File | null] = [...prev];
      next[index] = file;
      return next;
    });
    setErr('');
  }

  async function readDocuments() {
    const chosen = files.filter((file): file is File => Boolean(file));
    if (!chosen.length) return;
    setErr('');
    setReading(true);
    setBusy(true);
    const started = Date.now();
    try {
      let studentId: string | undefined;
      let duplicate = false;
      let last: Awaited<ReturnType<typeof api.intakeUpload>>['student'] | null = null;
      for (const file of chosen) {
        const contentBase64 = await fileToBase64(file);
        const result = await api.intakeUpload({
          filename: file.name,
          mimeType: file.type || 'application/octet-stream',
          contentBase64,
          studentId,
          formType,
        });
        studentId = result.studentId;
        duplicate = duplicate || result.duplicate;
        last = result.student;
      }
      if (!last || !studentId) throw new Error('Nothing was extracted');
      const application =
        last.application && typeof last.application === 'object' ? last.application : {};
      const wait = 2800 - (Date.now() - started);
      if (wait > 0) await new Promise((r) => setTimeout(r, wait));
      setReview({
        id: studentId,
        duplicate,
        name: last.name,
        phone: last.phone ?? '',
        service: last.service,
        faculty: last.faculty ?? '',
        destinations: (last.destinations ?? []).join(', '),
        budgetUsd: String(last.budgetUsd ?? ''),
        yearGroup: last.yearGroup ?? '',
        sport: last.sport ?? '',
        formType: last.formType || formType,
        curriculum: (last.curriculum ?? []).join(', '),
        application,
      });
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setBusy(false);
      setReading(false);
    }
  }

  async function saveReview() {
    if (!review) return;
    setBusy(true);
    setErr('');
    try {
      const destinations = review.destinations
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      const curriculum = review.curriculum
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      const budget = Number(review.budgetUsd);
      await api.updateStudent(review.id, {
        name: review.name.trim(),
        phone: review.phone.trim(),
        service: review.service,
        faculty: review.faculty.trim(),
        destinations,
        ...(Number.isFinite(budget) && budget >= 1000 ? { budgetUsd: Math.round(budget) } : {}),
        yearGroup: review.yearGroup.trim(),
        sport: review.sport.trim(),
        formType: review.formType,
        curriculum,
        application: review.application,
      });
      router.push(`/app/consult/${review.id}`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not save');
      setBusy(false);
    }
  }

  return (
    <>
      <PageHead
        title="New student"
        subtitle="Upload the profile and consultation form, share your link, or fill the application with the family."
        eyebrow={<span className="tag k">Step 1 of 3</span>}
      />
      <div className="sel3" style={{ marginBottom: 22 }}>
        {TABS.map(([key, label, icon]) => (
          <button
            key={key}
            type="button"
            className={tab === key ? 'on' : ''}
            onClick={() => setTab(key)}
          >
            <Icon name={icon} className="s" />
            {label}
          </button>
        ))}
        <button type="button" className="soon" aria-disabled="true">
          <Icon name="layers" className="s" />
          Fill a form in the portal · coming soon
        </button>
      </div>

      {tab === 'link' ? (
        <div className="card afm">
          <div className="row" style={{ gap: 16, flexWrap: 'nowrap' }}>
            <span className="ib">
              <Icon name="link" />
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h3>Your application link</h3>
              <p className="sm mut">
                Anyone who fills it is assigned to you and appears in your students as Needs
                consultation.
              </p>
            </div>
          </div>
          <div style={{ marginTop: 14 }}>
            <LinkBox url={apply} />
          </div>
        </div>
      ) : null}

      {tab === 'form' ? (
        <ApplicationForm
          busy={busy}
          onSubmit={async (payload) => {
            setBusy(true);
            setErr('');
            try {
              const created = await api.createStudent({
                name: payload.name,
                phone: payload.phone,
                service: payload.service,
                destinations: payload.destinations,
                formType: payload.formType,
                application: payload.application,
              });
              router.push(`/app/consult/${created.id}`);
            } catch (e) {
              setBusy(false);
              throw e instanceof Error ? e : new Error('Could not save the application');
            }
          }}
        />
      ) : null}

      {tab === 'up' && reading ? <DocumentLoader /> : null}

      {tab === 'up' && !reading && review ? (
        <div className="card" style={{ maxWidth: 900 }}>
          {review.duplicate ? (
            <div className="banner" style={{ marginBottom: 16 }}>
              <b>{review.name || 'This student'} is already on your list.</b>
              <p className="sm">Saving updates that record.</p>
            </div>
          ) : null}
          <div className="row sp" style={{ marginBottom: 6 }}>
            <h3>{review.name || 'New student'}</h3>
            <span className="tag d">
              <Icon name="sparkle" className="s" />
              {review.formType} form · {review.service}
            </span>
          </div>
          <p className="sm mut" style={{ marginBottom: 18 }}>
            Check the details, then find schools.
          </p>
          <div className="f">
            <div className="grid" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
              <Field label="Full name" value={review.name} onChange={(name) => setReview({ ...review, name })} />
              <Field label="Phone" value={review.phone} onChange={(phone) => setReview({ ...review, phone })} />
              <div>
                <label>Counsellor</label>
                <p className="sm" style={{ paddingTop: 10 }}>
                  {user?.displayName ?? 'You'} (you)
                </p>
              </div>
            </div>
            <ProfileFields review={review} onChange={setReview} />
            {err ? <p className="er">{err}</p> : null}
            <div className="row">
              <button
                type="button"
                className="btn o"
                onClick={() => {
                  setReview(null);
                  setFiles([null, null]);
                }}
              >
                <Icon name="arrow-left" />
                Start again
              </button>
              <button type="button" className="btn" disabled={busy || !review.name.trim()} onClick={() => void saveReview()}>
                Save and find schools
                <Icon name="sparkle" />
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {tab === 'up' && !reading && !review ? (
        <div className="card" style={{ maxWidth: 900 }}>
          <h3>Student profile and consultation form</h3>
          <p className="sm mut" style={{ margin: '6px 0 18px' }}>
            Upload the profile, the consultation form, or both.
          </p>
          <div className="grid g2" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <Drop
              title="Student profile"
              hint="Drop the profile document or select it"
              file={files[0]}
              disabled={busy}
              onFile={(list) => setSlot(0, list)}
              onClear={() => setSlot(0, null)}
            />
            <Drop
              title="Consultation form"
              hint="Drop the completed consultation form"
              file={files[1]}
              disabled={busy}
              onFile={(list) => setSlot(1, list)}
              onClear={() => setSlot(1, null)}
            />
          </div>
          <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', marginTop: 16 }}>
            <div>
              <label htmlFor="form-type">Form type</label>
              <select id="form-type" value={formType} onChange={(e) => setFormType(e.target.value)}>
                {FORMS.map((f) => (
                  <option key={f}>{f}</option>
                ))}
              </select>
              <p className="helper">General, school fair, sports, premium agent or agent form.</p>
            </div>
            <div style={{ alignSelf: 'end' }}>
              <button
                type="button"
                className="btn"
                disabled={busy || (!files[0] && !files[1])}
                onClick={() => void readDocuments()}
              >
                Read documents
                <Icon name="sparkle" />
              </button>
            </div>
          </div>
          {err ? <p className="er">{err}</p> : null}
        </div>
      ) : null}
    </>
  );
}

function DocumentLoader() {
  const [step, setStep] = useState(0);
  const [line, setLine] = useState('');

  useEffect(() => {
    const text = READ_LINES[Math.min(step, READ_LINES.length - 1)];
    let n = 0;
    setLine('');
    const typer = window.setInterval(() => {
      n += 1;
      setLine(text.slice(0, n));
      if (n >= text.length) window.clearInterval(typer);
    }, 16);
    return () => window.clearInterval(typer);
  }, [step]);

  useEffect(() => {
    const id = window.setInterval(() => {
      setStep((n) => (n < READ_STEPS.length ? n + 1 : n));
    }, 700);
    return () => window.clearInterval(id);
  }, []);

  const width = `${Math.min(100, ((Math.min(step, READ_STEPS.length) + 0.4) / READ_STEPS.length) * 100)}%`;

  return (
    <div className="ldw">
      <div className="ldb">
        <div className="rmk lg spin" aria-hidden>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/rm/rm-mark-black@900.png" alt="" />
        </div>
        <div className="bub">{line || 'Hello. Give me a moment.'}</div>
      </div>
      <div className="card ld">
        <div className="row sp">
          <h3>Reading the documents</h3>
          <span className="sm mut">
            <span>{Math.min(step, READ_STEPS.length)}</span> of {READ_STEPS.length} records
          </span>
        </div>
        <div className="scan">{READ_STEPS[Math.min(step, READ_STEPS.length - 1)]}</div>
        <div className="prog">
          <i style={{ width }} />
        </div>
        <ul className="steps">
          {READ_STEPS.map((label, i) => (
            <li key={label} className={i < step ? 'done' : i === step ? 'on' : ''}>
              <span className="dot">
                <Icon name="check" />
              </span>
              {label}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function Drop({
  title,
  hint,
  file,
  disabled,
  onFile,
  onClear,
}: {
  title: string;
  hint: string;
  file: File | null;
  disabled: boolean;
  onFile: (list: FileList | null) => void;
  onClear: () => void;
}) {
  return (
    <div className={`drop ${file ? 'ok' : ''}`}>
      <label style={{ display: 'grid', gap: 8, justifyItems: 'center', cursor: 'pointer' }}>
        <input
          className="sr"
          type="file"
          accept=".pdf,.doc,.docx,.txt,.md,.png,.jpg,.jpeg,.webp,.gif"
          disabled={disabled}
          onChange={(e) => {
            onFile(e.target.files);
            e.target.value = '';
          }}
        />
        <Icon name={file ? 'check' : 'upload'} className="l" />
        <h3>{title}</h3>
        <p className="mut sm">{file ? `${file.name} added` : hint}</p>
      </label>
      {file ? (
        <button
          type="button"
          className="btn o s"
          disabled={disabled}
          onClick={onClear}
        >
          Remove
        </button>
      ) : null}
    </div>
  );
}

const PROFILE_SVC: [string, string, string][] = [
  ['Summer', 'sparkle', 'Short courses'],
  ['K–12', 'layers', 'Secondary and sixth form'],
  ['Pathways', 'arrow', 'Foundation routes'],
  ['Sports Pathways', 'activity', 'Athlete routes'],
  ["Bachelor's", 'building', 'Undergraduate'],
  ['Postgraduate', 'badge', 'Masters and MBA'],
];
const YEARS = ['Year 7', 'Year 9', 'Year 10', 'Year 12 (sixth form)', 'Grade 9–12'];
const SUBJ = ['Sciences', 'Arts/Humanities', 'Commercial'];
const CUR = ['A-Levels', 'IB', 'GCSE', 'AP'];
const FAC = [
  'Health & Medicine',
  'Law',
  'Engineering & Computing',
  'Accounting & Finance',
  'Business & Management',
  'Arts, Humanities & Education',
  'Sciences',
];
const FOUND = ['Independent', 'Dependent'];
const SPORT = ['Football', 'Basketball', 'Tennis', 'Athletics', 'Rugby', 'Other'];
const SUMMER = ['Academic', 'English language', 'Sports', 'Leadership'];

function splitList(value: string) {
  return value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function ProfileFields({
  review,
  onChange,
}: {
  review: Review;
  onChange: (next: Review) => void;
}) {
  const svc = PROFILE_SVC.some((s) => s[0] === review.service) ? review.service : "Bachelor's";
  const destinations = splitList(review.destinations);
  const curricula = splitList(review.curriculum);
  const budget = Math.min(60000, Math.max(3000, Number(review.budgetUsd) || 16000));
  const patch = (partial: Partial<Review>) => onChange({ ...review, ...partial });
  const toggle = (list: string[], item: string) =>
    list.includes(item) ? list.filter((x) => x !== item) : [...list, item];

  return (
    <>
      <div>
        <label>Service</label>
        <div className="svc" role="radiogroup" aria-label="Service">
          {PROFILE_SVC.map(([name, icon, blurb]) => (
            <button
              key={name}
              type="button"
              role="radio"
              aria-checked={svc === name}
              className={svc === name ? 'on' : ''}
              onClick={() => patch({ service: name })}
            >
              <span className="ico">
                <Icon name={icon} className="s" />
              </span>
              <b style={{ fontWeight: 500 }}>{name}</b>
              <small>{blurb}</small>
            </button>
          ))}
        </div>
      </div>
      <div className="dyn f">
        {svc === 'K–12' ? (
          <>
            <div className="grid" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
              <SelectField
                label="Year group"
                value={review.yearGroup}
                options={YEARS}
                onChange={(yearGroup) => patch({ yearGroup })}
              />
              <SelectField
                label="Subjects"
                value={review.application.subject ?? ''}
                options={SUBJ}
                onChange={(subject) =>
                  patch({ application: { ...review.application, subject } })
                }
              />
              <SelectField
                label="Boarding"
                value={review.application.boarding ?? ''}
                options={['Boarding', 'Day', 'Either']}
                onChange={(boarding) =>
                  patch({ application: { ...review.application, boarding } })
                }
              />
            </div>
            <ChipRow
              label="Curriculum (choose any)"
              options={CUR}
              selected={curricula}
              onToggle={(item) => patch({ curriculum: toggle(curricula, item).join(', ') })}
            />
          </>
        ) : null}
        {svc === 'Summer' ? (
          <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <SelectField
              label="Programme type"
              value={review.application.summerType ?? ''}
              options={SUMMER}
              onChange={(summerType) =>
                patch({ application: { ...review.application, summerType } })
              }
            />
            <SelectField
              label="Age or year group"
              value={review.yearGroup}
              options={YEARS}
              onChange={(yearGroup) => patch({ yearGroup })}
            />
          </div>
        ) : null}
        {svc === 'Sports Pathways' ? (
          <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <SelectField
              label="Sport"
              value={review.sport}
              options={SPORT}
              onChange={(sport) => patch({ sport })}
            />
            <SelectField
              label="Academic subjects"
              value={review.application.subject ?? ''}
              options={SUBJ}
              onChange={(subject) =>
                patch({ application: { ...review.application, subject } })
              }
            />
          </div>
        ) : null}
        {svc === 'Pathways' ? (
          <>
            <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
              <SelectField
                label="Foundation type"
                value={review.application.foundationType ?? ''}
                options={FOUND}
                onChange={(foundationType) =>
                  patch({ application: { ...review.application, foundationType } })
                }
              />
              <SelectField
                label="Faculty after the foundation"
                value={review.faculty}
                options={FAC}
                onChange={(faculty) => patch({ faculty })}
              />
            </div>
            <p className="helper">
              Independent foundations are run by colleges and pathway providers. Dependent
              foundations are a university’s own foundation year.
            </p>
          </>
        ) : null}
        {svc === "Bachelor's" || svc === 'Postgraduate' ? (
          <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <SelectField
              label="Faculty"
              value={review.faculty}
              options={FAC}
              onChange={(faculty) => patch({ faculty })}
            />
            <div>
              <label>Boarding</label>
              <p className="sm mut" style={{ paddingTop: 10 }}>
                Not asked for {svc === 'Postgraduate' ? 'postgraduate' : 'undergraduate'} applicants.
              </p>
            </div>
          </div>
        ) : null}
        <div>
          <label>
            Yearly budget · <b>${budget.toLocaleString('en')}</b>
          </label>
          <input
            type="range"
            min={3000}
            max={60000}
            step={500}
            value={budget}
            onChange={(e) => patch({ budgetUsd: e.target.value })}
          />
        </div>
        <ChipRow
          label="Destinations"
          options={DEST}
          selected={destinations}
          onToggle={(item) => patch({ destinations: toggle(destinations, item).join(', ') })}
        />
      </div>
    </>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label>{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">Select</option>
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </div>
  );
}

function ChipRow({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string;
  options: string[];
  selected: string[];
  onToggle: (item: string) => void;
}) {
  return (
    <div>
      <label>{label}</label>
      <div className="row">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            className={`tag chip ${selected.includes(option) ? 'on' : ''}`}
            onClick={() => onToggle(option)}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const id = `rv-${label.replace(/\s+/g, '-').toLowerCase()}`;
  return (
    <div>
      <label htmlFor={id}>{label}</label>
      <input id={id} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

