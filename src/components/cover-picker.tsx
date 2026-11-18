import Image from 'next/image';
import { Icon } from './icon';
import { COVER_LIBRARY, CoverId } from '@/lib/covers';

type Props = {
  value: CoverId;
  onChange?: (id: CoverId) => void;
};

export function CoverPicker({ value, onChange }: Props) {
  return (
    <div className="covers">
      {COVER_LIBRARY.map(([id, label]) => (
        <button
          key={id}
          type="button"
          className={value === id ? 'on' : ''}
          aria-label={label}
          onClick={() => onChange?.(id)}
        >
          <Image
            src={`/assets/img/${id}-1600.webp`}
            alt=""
            width={160}
            height={100}
            style={{ width: '100%', height: 'auto', display: 'block' }}
          />
        </button>
      ))}
      <label
        className="covers up"
        style={{
          borderRadius: 14,
          cursor: 'pointer',
          aspectRatio: '16/10',
          display: 'grid',
          placeItems: 'center',
        }}
      >
        <Icon name="upload" />
        <span>Upload cover</span>
        <input className="sr" type="file" accept="image/*" />
      </label>
    </div>
  );
}
