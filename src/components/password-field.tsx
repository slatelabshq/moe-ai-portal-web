'use client';

import { InputHTMLAttributes, useId, useState } from 'react';

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  label: string;
};

export function PasswordField({ label, id: idProp, className, ...rest }: Props) {
  const autoId = useId();
  const id = idProp ?? autoId;
  const [visible, setVisible] = useState(false);

  return (
    <div className="pwd-field">
      <label htmlFor={id}>{label}</label>
      <div className="pwd-wrap">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          className={className}
          {...rest}
        />
        <button
          type="button"
          className="pwd-toggle"
          aria-label={visible ? 'Hide password' : 'Show password'}
          aria-pressed={visible}
          onClick={() => setVisible((v) => !v)}
        >
          {visible ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </div>
    </div>
  );
}

function EyeIcon() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7Z"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M3 3l18 18M10.6 10.6a2 2 0 002.8 2.8M7.1 7.1C5.2 8.4 3.7 10.2 2 12c0 0 4 7 10 7 1.5 0 2.9-.3 4.2-.9M14.5 5.3C13.7 5.1 12.8 5 12 5 6 5 2 12 2 12c.8 1.4 1.9 2.7 3.2 3.8"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}