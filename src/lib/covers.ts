export const COVER_LIBRARY = [
  ['oxford-spires-dusk', 'Oxford at dusk'],
  ['campus-04', 'Campus'],
  ['campus-05', 'Quad'],
] as const;

export type CoverId = (typeof COVER_LIBRARY)[number][0];

export function coverImageUrl(cover?: string | null) {
  const id =
    cover && COVER_LIBRARY.some(([k]) => k === cover)
      ? cover
      : 'oxford-spires-dusk';
  return `/assets/img/${id}-1600.webp`;
}
