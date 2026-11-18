import { ReactNode } from 'react';

type Props = {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  eyebrow?: ReactNode;
};

export function PageHead({ title, subtitle, actions, eyebrow }: Props) {
  return (
    <div className="ph">
      <div>
        {eyebrow ? <div style={{ marginBottom: 8 }}>{eyebrow}</div> : null}
        <h1 className="gtd">{title}</h1>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>
      {actions ? <div className="row">{actions}</div> : null}
    </div>
  );
}
