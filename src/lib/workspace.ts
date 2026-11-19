import type { StartPage } from '@prisma/client';
import { can, type Role } from './permissions';

export type View = StartPage | 'compose' | 'profile';

export function viewUrl(view: View) {
  return view === 'overview' ? '/portal' : `/portal?view=${view}`;
}

export function workspaceNavigation(
  roles: Role[],
): { view: View; label: string }[] {
  const links: { view: View; label: string }[] = [
    { view: 'overview', label: 'Overview' },
  ];
  if (can(roles, 'announcement.read')) {
    links.push(
      { view: 'announcements', label: 'Announcements' },
      { view: 'corrections', label: 'Corrections' },
    );
  }
  if (can(roles, 'announcement.review'))
    links.push({ view: 'review', label: 'Review queue' });
  if (can(roles, 'announcement.create'))
    links.push({ view: 'compose', label: 'New announcement' });
  if (can(roles, 'reviewer.enter'))
    links.push({ view: 'cases', label: 'Assigned cases' });
  if (can(roles, 'admin.enter'))
    links.push({ view: 'accounts', label: 'Accounts' });
  links.push({ view: 'profile', label: 'My profile' });
  return links;
}

export function isStartPage(view: View): view is StartPage {
  return view !== 'compose' && view !== 'profile';
}
