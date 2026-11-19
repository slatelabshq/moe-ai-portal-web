export const PERMISSION_KEYS = [
  'students',
  'search',
  'compare',
  'proposals',
  'pipeline',
  'brand',
  'overview',
  'admissions',
  'schools',
  'addschool',
  'partners',
  'assign',
  'access',
] as const;

export const PERMISSION_LABELS: Record<string, string> = {
  students: 'Students and intake',
  search: 'AI search',
  compare: 'Compare schools',
  proposals: 'Proposals and sharing',
  pipeline: 'Admissions pipeline',
  brand: 'My branding',
  schools: 'Edit school details and fees',
  addschool: 'Add schools',
  partners: 'Partners, groups and memberships',
  overview: 'Overview and reach',
  admissions: 'Admissions dashboard (all students)',
  assign: 'Assign counsellors',
  access: 'Manage access and approvals',
};

export function formatPermissions(permissions: string[] | undefined): string {
  if (!permissions?.length) return '';
  return permissions.map((p) => PERMISSION_LABELS[p] ?? p).join(', ');
}