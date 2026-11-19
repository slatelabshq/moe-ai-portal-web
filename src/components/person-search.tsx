'use client';

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export type PersonOption = {
  id: string;
  displayName: string;
  role: string;
  email?: string;
};

type Props = {
  id?: string;
  people: PersonOption[];
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
  emptyLabel?: string;
};

export function PersonSearch({
  id,
  people,
  value,
  onChange,
  placeholder = 'Search by name or email',
  emptyLabel = 'Everyone',
}: Props) {
  const selected = people.find((p) => p.id === value);
  const [query, setQuery] = useState(selected?.displayName ?? '');
  const [open, setOpen] = useState(false);
  const [menuBox, setMenuBox] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    setQuery(selected?.displayName ?? '');
  }, [selected?.displayName, value]);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      const target = e.target as Node;
      if (box.current?.contains(target) || listRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      const el = inputRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      setMenuBox({
        top: rect.bottom + 6,
        left: rect.left,
        width: rect.width,
      });
    };
    place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [open, query]);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = !q
      ? people
      : people.filter((p) =>
          `${p.displayName} ${p.email ?? ''} ${p.role}`.toLowerCase().includes(q),
        );
    return list.slice(0, 12);
  }, [people, query]);

  return (
    <div className="person-search" ref={box}>
      <input
        id={id}
        ref={inputRef}
        role="combobox"
        aria-expanded={open}
        aria-autocomplete="list"
        placeholder={placeholder}
        value={query}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          if (!e.target.value) onChange('');
        }}
      />
      {value ? (
        <button
          type="button"
          className="person-search-clear"
          aria-label="Show everyone"
          onClick={() => {
            onChange('');
            setQuery('');
            setOpen(false);
          }}
        >
          ×
        </button>
      ) : null}
      {open && menuBox && typeof document !== 'undefined'
        ? createPortal(
            <ul
              ref={listRef}
              className="person-search-list is-portal"
              role="listbox"
              style={{ top: menuBox.top, left: menuBox.left, width: menuBox.width }}
            >
          <li>
            <button
              type="button"
              className={!value ? 'on' : ''}
              onClick={() => {
                onChange('');
                setQuery('');
                setOpen(false);
              }}
            >
              {emptyLabel}
            </button>
          </li>
          {matches.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                className={p.id === value ? 'on' : ''}
                onClick={() => {
                  onChange(p.id);
                  setQuery(p.displayName);
                  setOpen(false);
                }}
              >
                <b>{p.displayName}</b>
                <span className="sm mut">
                  {p.role}
                  {p.email ? ` · ${p.email}` : ''}
                </span>
              </button>
            </li>
          ))}
          {!matches.length ? (
            <li className="mut sm" style={{ padding: '10px 12px' }}>
              No one matches “{query.trim()}”.
            </li>
          ) : null}
            </ul>,
            document.body,
          )
        : null}
    </div>
  );
}
