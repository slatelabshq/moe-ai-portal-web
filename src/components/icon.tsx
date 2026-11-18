type Props = {
  name: string;
  className?: string;
};

export function Icon({ name, className = '' }: Props) {
  return (
    <svg className={`ic ${className}`.trim()} aria-hidden>
      <use href={`#i-${name}`} />
    </svg>
  );
}
