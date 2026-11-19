import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { Prisma } from '@prisma/client';
import { currentUser, signOut } from '@/lib/auth';
import { can } from '@/lib/permissions';
import { db } from '@/lib/db';
import { Brand } from '../identity';
import { change, create } from './actions';

const relations = {
  correction: { select: { id: true, status: true } },
  correctionOf: { select: { id: true, title: true } },
} satisfies Prisma.AnnouncementInclude;

type Notice = Prisma.AnnouncementGetPayload<{ include: typeof relations }>;
type View =
  | 'overview'
  | 'announcements'
  | 'corrections'
  | 'review'
  | 'compose'
  | 'cases'
  | 'accounts'
  | 'profile';
const statuses = {
  DRAFT: 'Draft',
  PENDING_REVIEW: 'Pending review',
  APPROVED: 'Approved',
  PUBLISHED: 'Official announcement',
};
const roleNames = {
  STUDENT: 'Student',
  OFFICER: 'Placement officer',
  REVIEWER: 'Grievance reviewer',
  ADMIN: 'Administrator',
};
const date = new Intl.DateTimeFormat('en-IN', {
  dateStyle: 'medium',
  timeZone: 'Asia/Kolkata',
});
const feedback = {
  created: 'Draft saved.',
  submitted: 'Sent for independent review.',
  approved: 'Notice approved and ready to publish.',
  published: 'Notice published to the student bulletin.',
};

function viewUrl(view: View) {
  return view === 'overview' ? '/portal' : `/portal?view=${view}`;
}

function NoticeCard({
  item,
  officer,
  userId,
  publishedBy,
  view,
}: {
  item: Notice;
  officer: boolean;
  userId: string;
  publishedBy?: string;
  view: View;
}) {
  const superseded = item.correction?.status === 'PUBLISHED';
  const status = superseded
    ? 'Superseded'
    : item.status === 'PUBLISHED' && item.correctionOf
      ? 'Official correction'
      : statuses[item.status];
  const action = !officer
    ? null
    : item.status === 'DRAFT' && item.createdById === userId
      ? ['submit', 'Submit for review']
      : item.status === 'PENDING_REVIEW' && item.createdById !== userId
        ? ['approve', 'Approve']
        : item.status === 'APPROVED'
          ? ['publish', 'Publish']
          : null;
  return (
    <article className="notice" id={`notice-${item.id}`}>
      <div className="notice-top">
        <span
          className={`status status-${superseded ? 'superseded' : item.status.toLowerCase()}`}
        >
          {status}
        </span>
        <time dateTime={(item.publishedAt ?? item.createdAt).toISOString()}>
          {date.format(item.publishedAt ?? item.createdAt)}
        </time>
      </div>
      <h3>{item.title}</h3>
      <p className="notice-summary">{item.summary}</p>
      {item.correctionOf && (
        <dl className="correction-note">
          <div>
            <dt>Corrects</dt>
            <dd>
              <Link
                className="text-link"
                href={`/portal?view=announcements&notice=${item.correctionOf.id}#notice-${item.correctionOf.id}`}
              >
                {item.correctionOf.title}
              </Link>
            </dd>
          </div>
          <div>
            <dt>Reason</dt>
            <dd>{item.changeReason}</dd>
          </div>
          <div>
            <dt>Student action</dt>
            <dd>{item.studentAction}</dd>
          </div>
          {item.effectiveAt && (
            <div>
              <dt>Effective</dt>
              <dd>{date.format(item.effectiveAt)} IST</dd>
            </div>
          )}
        </dl>
      )}
      {superseded && (
        <Link
          className="text-link"
          href={`/portal?view=corrections&notice=${item.correction!.id}#notice-${item.correction!.id}`}
        >
          Read the correction →
        </Link>
      )}
      <details className="notice-details" open={officer}>
        <summary>Full notice and source</summary>
        <p className="notice-content">{item.content}</p>
        <div className="notice-source">
          <div>
            <strong>Source</strong>
            {item.source}
          </div>
          <div>
            <strong>{item.publishedAt ? 'Publication' : 'Author'}</strong>
            {item.publishedAt
              ? `Published by ${item.publisherName ?? publishedBy ?? 'Demonstration officer'} (placement officer) on ${date.format(item.publishedAt)} IST`
              : item.createdById === userId
                ? 'You'
                : 'Another placement officer'}
          </div>
        </div>
      </details>
      {officer && item.status === 'PUBLISHED' && !item.correction && (
        <Link
          className="button outline"
          href={`/portal?view=compose&correction=${item.id}`}
        >
          Draft correction
        </Link>
      )}
      {action && (
        <form action={change} className="notice-action">
          <input type="hidden" name="id" value={item.id} />
          <input type="hidden" name="view" value={view} />
          <button className="button" name="action" value={action[0]}>
            {action[1]}
          </button>
        </form>
      )}
    </article>
  );
}

function Composer({
  target,
}: {
  target: { id: string; title: string } | null;
}) {
  return (
    <section
      className="panel composer"
      id="create"
      aria-label="Announcement form"
    >
      <form action={create} className="form">
        {target && (
          <>
            <p className="feedback">
              Correcting <strong>{target.title}</strong>
            </p>
            <input type="hidden" name="correctionOfId" value={target.id} />
          </>
        )}
        <label htmlFor="title">Title</label>
        <input id="title" name="title" minLength={5} maxLength={160} required />
        <label htmlFor="summary">{target ? 'What changed' : 'Summary'}</label>
        <textarea
          id="summary"
          name="summary"
          minLength={10}
          maxLength={400}
          rows={2}
          required
        />
        <label htmlFor="content">Full content</label>
        <textarea
          id="content"
          name="content"
          minLength={20}
          maxLength={10000}
          rows={6}
          required
        />
        <label htmlFor="source">Source reference</label>
        <input
          id="source"
          name="source"
          minLength={5}
          maxLength={500}
          required
        />
        {target && (
          <>
            <label htmlFor="changeReason">Reason for the correction</label>
            <textarea
              id="changeReason"
              name="changeReason"
              rows={2}
              minLength={10}
              maxLength={1000}
              required
            />
            <label htmlFor="studentAction">What students should do</label>
            <input
              id="studentAction"
              name="studentAction"
              minLength={5}
              maxLength={500}
              required
            />
            <label htmlFor="effectiveDate">Effective date (IST)</label>
            <input
              id="effectiveDate"
              name="effectiveDate"
              type="date"
              required
            />
          </>
        )}
        <div className="form-actions">
          <button className="button">Save draft</button>
          <Link className="button outline" href={viewUrl('announcements')}>
            Cancel
          </Link>
        </div>
      </form>
    </section>
  );
}

export default async function Portal({
  searchParams,
}: {
  searchParams: Promise<{
    view?: string;
    error?: string;
    correction?: string;
    result?: string;
    notice?: string;
  }>;
}) {
  const user = await currentUser();
  if (!user) redirect('/login');
  const params = await searchParams;
  const officer = can(user.roles, 'announcement.create');
  const reader = can(user.roles, 'announcement.read');
  const reviewer = can(user.roles, 'reviewer.enter');
  const admin = can(user.roles, 'admin.enter');
  const nav: { view: View; label: string; mark: string }[] = [
    { view: 'overview', label: 'Overview', mark: '▦' },
  ];
  if (reader)
    nav.push({ view: 'announcements', label: 'Announcements', mark: '≡' });
  if (reader)
    nav.push({ view: 'corrections', label: 'Corrections', mark: '↺' });
  if (officer)
    nav.push(
      { view: 'review', label: 'Review queue', mark: '✓' },
      { view: 'compose', label: 'New announcement', mark: '+' },
    );
  if (reviewer) nav.push({ view: 'cases', label: 'Assigned cases', mark: '□' });
  if (admin) nav.push({ view: 'accounts', label: 'Accounts', mark: '⊞' });
  nav.push({ view: 'profile', label: 'My profile', mark: '○' });

  const view =
    nav.find(
      (entry) =>
        entry.view ===
        (params.view ?? (params.correction ? 'compose' : 'overview')),
    )?.view ?? 'overview';
  const scope = { institutionId: user.institutionId };
  const published = { ...scope, status: 'PUBLISHED' as const };
  const reviewQueue: Prisma.AnnouncementWhereInput = {
    ...scope,
    OR: [
      { status: 'PENDING_REVIEW', createdById: { not: user.id } },
      { status: 'APPROVED' },
    ],
  };
  const where: Prisma.AnnouncementWhereInput =
    view === 'review'
      ? reviewQueue
      : view === 'corrections'
        ? { ...published, correctionOfId: { not: null } }
        : view === 'announcements' && officer
          ? scope
          : published;
  const list =
    reader &&
    ['overview', 'announcements', 'review', 'corrections'].includes(view);
  const [items, counts, target, accounts] = await Promise.all([
    list
      ? db.announcement.findMany({
          where:
            params.notice && view !== 'overview' && view !== 'review'
              ? { ...where, id: params.notice }
              : where,
          include: relations,
          orderBy: [
            { publishedAt: { sort: 'desc', nulls: 'first' } },
            { updatedAt: 'desc' },
          ],
          take: view === 'overview' ? 3 : 50,
        })
      : [],
    reader && view === 'overview'
      ? Promise.all([
          db.announcement.count({ where: published }),
          db.announcement.count({
            where: { ...published, correctionOfId: { not: null } },
          }),
          officer
            ? db.announcement.count({ where: reviewQueue })
            : Promise.resolve(0),
        ])
      : null,
    officer && view === 'compose' && params.correction
      ? db.announcement.findFirst({
          where: { ...published, id: params.correction, correction: null },
          select: { id: true, title: true },
        })
      : null,
    admin && view === 'accounts'
      ? db.user.findMany({
          where: scope,
          orderBy: { name: 'asc' },
          take: 100,
          select: {
            id: true,
            name: true,
            active: true,
            roles: {
              where: {
                revokedAt: null,
                OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
              },
              select: { role: true },
            },
          },
        })
      : [],
  ]);
  const legacyIds = items.flatMap((item) =>
    item.publishedById && !item.publisherName ? [item.publishedById] : [],
  );
  const publishers = legacyIds.length
    ? await db.user.findMany({
        where: { ...scope, id: { in: legacyIds } },
        select: { id: true, name: true },
      })
    : [];
  const role = user.roles.map((role) => roleNames[role]).join(' · ');
  const labels: Record<View, string> = {
    overview: 'Overview',
    announcements: officer
      ? 'Announcement workspace'
      : 'Official announcements',
    corrections: 'Published corrections',
    review: 'Review queue',
    compose: target ? 'Draft correction' : 'New announcement',
    cases: 'Confidential case workspace',
    accounts: 'Platform administration',
    profile: 'My profile',
  };
  const descriptions: Partial<Record<View, string>> = {
    overview: `Signed in as ${user.name}.`,
    announcements: officer
      ? 'Draft, review and publish notices for students.'
      : 'Published notices with their source and publishing officer.',
    review: 'Notices you can review and approved notices ready to publish.',
    compose:
      'Provide a source reference. A second officer must approve the draft.',
    corrections: 'Updates to previously published notices.',
  };
  const message =
    params.result && Object.hasOwn(feedback, params.result)
      ? feedback[params.result as keyof typeof feedback]
      : null;
  const listTitle =
    view === 'overview' ? 'Latest official announcements' : null;

  return (
    <div className="workspace">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <aside className="workspace-sidebar">
        <Brand />
        <div className="sidebar-role">{role}</div>
        <nav className="workspace-nav" aria-label="Workspace">
          {nav.map(({ view: destination, label, mark }) => (
            <Link
              key={destination}
              href={viewUrl(destination)}
              aria-current={view === destination ? 'page' : undefined}
            >
              <span className="nav-mark" aria-hidden="true">
                {mark}
              </span>
              {label}
            </Link>
          ))}
        </nav>
        <div className="sidebar-account">
          <div className="avatar" aria-hidden="true">
            {user.name
              .split(' ')
              .map((part) => part[0])
              .slice(0, 2)
              .join('')}
          </div>
          <div>
            <strong>{user.name}</strong>
            <form
              action={async () => {
                'use server';
                await signOut({ redirectTo: '/' });
              }}
            >
              <button>Sign out</button>
            </form>
          </div>
        </div>
      </aside>
      <div className="workspace-body">
        <div className="workspace-bar">
          <span>
            Workspace <span aria-hidden="true">/</span>{' '}
            <strong>{labels[view]}</strong>
          </span>
          <span className="demo-label">
            <span className="dot" /> Synthetic demo
          </span>
        </div>
        <main className="workspace-main" id="main-content">
          <div className="page-heading">
            <div>
              <h1>{labels[view]}</h1>
              {descriptions[view] && <p>{descriptions[view]}</p>}
            </div>
            {officer && ['overview', 'announcements'].includes(view) && (
              <Link className="button" href={viewUrl('compose')}>
                New announcement <span aria-hidden="true">+</span>
              </Link>
            )}
          </div>
          {message && (
            <p className="feedback" role="status">
              {message}
            </p>
          )}
          {params.error && (
            <p className="feedback error" role="alert">
              The change could not be saved. Check the notice status and try
              again.
            </p>
          )}
          {view === 'overview' && counts && (
            <div className="metrics">
              <Link href={viewUrl('announcements')}>
                <span>Published notices</span>
                <strong>{counts[0]}</strong>
                <span aria-hidden="true">↗</span>
              </Link>
              <Link href={viewUrl('corrections')}>
                <span>Published corrections</span>
                <strong>{counts[1]}</strong>
                <span aria-hidden="true">↗</span>
              </Link>
              {officer && (
                <Link href={viewUrl('review')}>
                  <span>Review queue</span>
                  <strong>{counts[2]}</strong>
                  <span aria-hidden="true">↗</span>
                </Link>
              )}
            </div>
          )}
          {list && (
            <section
              className="notice-list"
              aria-label={listTitle ?? labels[view]}
            >
              {listTitle && (
                <div className="list-heading">
                  <h2>{listTitle}</h2>
                  <Link className="text-link" href={viewUrl('announcements')}>
                    View all →
                  </Link>
                </div>
              )}
              {params.notice && view !== 'overview' && (
                <Link className="text-link" href={viewUrl(view)}>
                  ← Back to{' '}
                  {view === 'corrections' ? 'corrections' : 'announcements'}
                </Link>
              )}
              {items.length === 0 ? (
                <p className="panel empty">
                  {view === 'review'
                    ? 'No notices currently need your review or publication.'
                    : view === 'corrections'
                      ? 'No published corrections found.'
                      : 'No notices found.'}
                </p>
              ) : (
                items.map((item) => (
                  <NoticeCard
                    key={item.id}
                    item={item}
                    officer={officer}
                    userId={user.id}
                    view={view}
                    publishedBy={
                      publishers.find(
                        (publisher) => publisher.id === item.publishedById,
                      )?.name
                    }
                  />
                ))
              )}
            </section>
          )}
          {view === 'compose' &&
            (params.correction && !target ? (
              <div className="panel empty">
                <p>This notice is unavailable for correction.</p>
                <Link className="text-link" href={viewUrl('announcements')}>
                  Back to announcements →
                </Link>
              </div>
            ) : (
              <Composer target={target} />
            ))}
          {(view === 'cases' ||
            (view === 'overview' && !reader && reviewer)) && (
            <section className="panel empty">
              <h2>Confidential case workspace</h2>
              <p>
                Case handling is disabled in this prototype. No confidential
                records are collected.
              </p>
            </section>
          )}
          {view === 'overview' && !reader && admin && (
            <section className="panel empty">
              <h2>Platform administration</h2>
              <p>Review synthetic accounts and their active roles.</p>
              <Link className="text-link" href={viewUrl('accounts')}>
                View accounts →
              </Link>
            </section>
          )}
          {view === 'accounts' && (
            <div className="panel table-wrap">
              <table>
                <caption>Synthetic accounts · showing up to 100</caption>
                <thead>
                  <tr>
                    <th scope="col">Name</th>
                    <th scope="col">Roles</th>
                    <th scope="col">Account status</th>
                  </tr>
                </thead>
                <tbody>
                  {accounts.map((account) => (
                    <tr key={account.id}>
                      <td>{account.name}</td>
                      <td>
                        {account.roles
                          .map(({ role }) => roleNames[role])
                          .join(', ') || 'No active role'}
                      </td>
                      <td>{account.active ? 'Active' : 'Inactive'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {view === 'profile' && (
            <dl className="panel profile">
              <div>
                <dt>Name</dt>
                <dd>{user.name}</dd>
              </div>
              <div>
                <dt>Active roles</dt>
                <dd>{role}</dd>
              </div>
              <div>
                <dt>Environment</dt>
                <dd>Synthetic demonstration</dd>
              </div>
            </dl>
          )}
        </main>
        <footer className="workspace-footer">
          PlacementBridge · Independent academic prototype
        </footer>
      </div>
    </div>
  );
}
