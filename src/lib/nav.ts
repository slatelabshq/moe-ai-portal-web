export type NavItem = {
  href: string;
  label: string;
  icon: string;
  perm: string;
};

export const COUNSELLOR_NAV: NavItem[] = [
  { href: '/app', label: 'Home', icon: 'home', perm: 'students' },
  { href: '/app/students', label: 'Students', icon: 'users', perm: 'students' },
  { href: '/app/new', label: 'New student', icon: 'user-plus', perm: 'students' },
  { href: '/app/search', label: 'AI search', icon: 'sparkle', perm: 'search' },
  { href: '/app/compare', label: 'Compare schools', icon: 'columns', perm: 'compare' },
  { href: '/app/proposals', label: 'Proposals', icon: 'file', perm: 'proposals' },
  { href: '/app/pipeline', label: 'Pipeline', icon: 'grid', perm: 'pipeline' },
  { href: '/app/brand', label: 'My branding', icon: 'brush', perm: 'brand' },
];

export const ADMIN_NAV: NavItem[] = [
  { href: '/app/overview', label: 'Overview', icon: 'chart', perm: 'overview' },
  { href: '/app/admissions', label: 'Admissions', icon: 'grid', perm: 'admissions' },
  { href: '/app/schools', label: 'Schools', icon: 'building', perm: 'schools' },
  { href: '/app/partners', label: 'Partners and groups', icon: 'briefcase', perm: 'partners' },
  { href: '/app/assign', label: 'Assignments', icon: 'users', perm: 'assign' },
  { href: '/app/access', label: 'Access', icon: 'key', perm: 'access' },
];
