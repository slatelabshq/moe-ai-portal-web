import Image from 'next/image';

type Props = {
  size?: number;
  variant?: 'gold' | 'black';
  alt?: string;
  className?: string;
};

export function RmMark({
  size = 32,
  variant = 'gold',
  alt = 'RM Group',
  className,
}: Props) {
  const src =
    variant === 'gold'
      ? '/assets/rm/rm-mark-gold@900.png'
      : '/assets/rm/rm-mark-black@900.png';

  return (
    <Image
      src={src}
      width={size}
      height={size}
      alt={alt}
      className={className}
      style={{ width: size, height: 'auto' }}
      priority={variant === 'gold' && size >= 34}
    />
  );
}
