import { readFileSync } from 'fs';
import path from 'path';

/** Inlined sprite (v7 index.html) — external `/file.svg#id` breaks `<use>` in many browsers */
export function IconSprite() {
  const svg = readFileSync(
    path.join(process.cwd(), 'public/icon-symbols.svg'),
    'utf8',
  );
  return (
    <div dangerouslySetInnerHTML={{ __html: svg }} suppressHydrationWarning />
  );
}
