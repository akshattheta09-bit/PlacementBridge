import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { Prisma } from '@prisma/client';
import { currentUser, signOutCurrent } from '@/lib/auth';
import { can } from '@/lib/permissions';
import { db } from '@/lib/db';
import {
  isStartPage,
  viewUrl,
  workspaceNavigation,
  type View,
} from '@/lib/workspace';
import { Profile } from './profile';
import { WorkspaceFrame } from './workspace-frame';
import { change, create } from './actions';
import {
  assignRole,
  requestRole,
  reviewRole,
  revokeRole,
} from './role-actions';

const relations = {
  correction: { select: { id: true, status: true, fixtureArchived: true } },
  correctionOf: { select: { id: true, title: true } },
} satisfies Prisma.AnnouncementInclude;

type Notice = Prisma.AnnouncementGetPayload<{ include: typeof relations }>;
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

function noticeStatus(item: Notice) {
  if (
    item.correction?.status === 'PUBLISHED' &&
    !item.correction.fixtureArchived
  )
    return 'Superseded';
  if (item.status === 'PUBLISHED' && item.correctionOf) return 'Correction';
  return statuses[item.status];
}

function BulletinRow({ item }: { item: Notice }) {
  const url = viewUrl(item.correctionOf ? 'corrections' : 'announcements');
  const timestamp = item.publishedAt ?? item.createdAt;
  return (
    <li>
      <Link className="bulletin-row" href={`${url}&notice=${item.id}`}>
        <time dateTime={timestamp.toISOString()}>{date.format(timestamp)}</time>
        <div className="bulletin-row-body">
          <h3>{item.title}</h3>
          <p>{item.summary}</p>
        </div>
        <span
          className={
            item.correctionOf ? 'record-kind is-correction' : 'record-kind'
          }
        >
          {item.correctionOf ? 'Correction' : 'Notice'}
        </span>
        <span className="bulletin-row-arrow" aria-hidden="true">
          →
        </span>
      </Link>
    </li>
  );
}

function NoticeCard({
  item,
  officer,
  userId,
  publishedBy,
  view,
  detail,
}: {
  item: Notice;
  officer: boolean;
  userId: string;
  publishedBy?: string;
  view: View;
  detail: boolean;
}) {
  const status = noticeStatus(item);
  const superseded = status === 'Superseded';
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
      {!detail && <h3>{item.title}</h3>}
      <p className="notice-summary">{item.summary}</p>
      {item.publishedAt && (
        <p className="notice-byline">
          {item.publisherName ?? publishedBy ?? 'Demonstration officer'} ·{' '}
          {item.source}
        </p>
      )}
      {superseded && (
        <Link
          className="text-link"
          href={`/portal?view=corrections&notice=${item.correction!.id}#notice-${item.correction!.id}`}
        >
          Read the correction →
        </Link>
      )}
      <details className="notice-details" open={detail || view === 'review'}>
        <summary>Full notice and source</summary>
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
    start?: string;
    q?: string;
    page?: string;
  }>;
}) {
  const user = await currentUser();
  if (!user) redirect('/login');
  const params = await searchParams;
  const officer = can(user.roles, 'announcement.create');
  const reader = can(user.roles, 'announcement.read');
  const reviewer = can(user.roles, 'reviewer.enter');
  const admin = can(user.roles, 'admin.enter');
  const nav = workspaceNavigation(user.roles);
  const startPages = nav.flatMap(({ view, label }) =>
    isStartPage(view) ? [{ view, label }] : [],
  );
  if (params.start === '1' && !params.view) {
    redirect(
      viewUrl(
        startPages.find(({ view }) => view === user.startPage)?.view ??
          'overview',
      ),
    );
  }
  const displayName = user.preferredName ?? user.name;

  const view =
    nav.find(
      (entry) =>
        entry.view ===
        (params.view ?? (params.correction ? 'compose' : 'overview')),
    )?.view ?? 'overview';
  const scope = { institutionId: user.institutionId };
  const activeNotices = { ...scope, fixtureArchived: false };
  const published = { ...activeNotices, status: 'PUBLISHED' as const };
  const reviewQueue: Prisma.AnnouncementWhereInput = {
    ...activeNotices,
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
          ? activeNotices
          : view === 'overview'
            ? {
                ...published,
                NOT: {
                  correction: {
                    is: { status: 'PUBLISHED', fixtureArchived: false },
                  },
                },
              }
            : published;
  const list =
    reader &&
    ['overview', 'announcements', 'review', 'corrections'].includes(view);
  const noticeId =
    (view === 'announcements' || view === 'corrections') &&
    typeof params.notice === 'string'
      ? params.notice
      : undefined;
  const correctionId =
    typeof params.correction === 'string' ? params.correction : undefined;
  const browsingNotices = list && view !== 'overview' && !noticeId;
  const query =
    browsingNotices && typeof params.q === 'string'
      ? params.q.trim().slice(0, 120)
      : '';
  const pageSize = 15;
  const maxPage = 200;
  const page =
    browsingNotices &&
    typeof params.page === 'string' &&
    /^\d{1,3}$/.test(params.page)
      ? Math.min(maxPage, Math.max(1, Number(params.page)))
      : 1;
  function pageUrl(next: number) {
    const search = new URLSearchParams({ view });
    if (query) search.set('q', query);
    if (next > 1) search.set('page', String(next));
    return `/portal?${search}`;
  }
  const filters: Prisma.AnnouncementWhereInput = query
    ? {
        AND: [
          where,
          {
            OR: [
              { title: { contains: query, mode: 'insensitive' } },
              { summary: { contains: query, mode: 'insensitive' } },
              { source: { contains: query, mode: 'insensitive' } },
            ],
          },
        ],
      }
    : where;
  const [results, reviewCount, target, accounts, requests] = await Promise.all([
    list
      ? db.announcement.findMany({
          where: noticeId ? { ...where, id: noticeId } : filters,
          include: relations,
          orderBy: [
            { publishedAt: { sort: 'desc', nulls: 'first' } },
            { updatedAt: 'desc' },
            { id: 'asc' },
          ],
          skip: browsingNotices ? (page - 1) * pageSize : 0,
          take: browsingNotices ? pageSize + 1 : view === 'overview' ? 5 : 1,
        })
      : [],
    officer && view === 'overview'
      ? db.announcement.count({ where: reviewQueue })
      : null,
    officer && view === 'compose' && correctionId
      ? db.announcement.findFirst({
          where: { ...published, id: correctionId, correction: null },
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
    view === 'accounts' && admin
      ? db.roleRequest.findMany({
          where: {
            status: 'PENDING',
            user: { institutionId: user.institutionId },
          },
          include: { user: { select: { name: true, email: true } } },
          orderBy: { createdAt: 'asc' },
          take: 100,
        })
      : view === 'profile'
        ? db.roleRequest.findMany({
            where: { userId: user.id },
            include: { user: { select: { name: true, email: true } } },
            orderBy: { createdAt: 'desc' },
            take: 20,
          })
        : [],
  ]);
  const hasMore =
    browsingNotices && results.length > pageSize && page < maxPage;
  const items = browsingNotices ? results.slice(0, pageSize) : results;
  const detailTitle = noticeId ? items[0]?.title : undefined;
  const legacyIds =
    view === 'overview'
      ? []
      : items.flatMap((item) =>
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
    profile: 'Review your account details and personalize your workspace.',
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
  const listTitle = view === 'overview' ? 'Latest updates' : null;

  return (
    <WorkspaceFrame
      navigation={nav}
      view={view}
      title={labels[view]}
      displayName={displayName}
      role={role}
      signOutAction={async () => {
        'use server';
        await signOutCurrent();
        redirect('/');
      }}
    >
      <div
        className={
          view === 'overview' ? 'page-heading bulletin-heading' : 'page-heading'
        }
      >
        <div>
          <h1>
            {view === 'overview'
              ? officer
                ? 'Publication desk'
                : reader
                  ? 'Placement bulletin'
                  : 'Overview'
              : (detailTitle ?? labels[view])}
          </h1>
          {view === 'overview' && <p>Signed in as {displayName}</p>}
          {!noticeId && descriptions[view] && <p>{descriptions[view]}</p>}
        </div>
        {officer && ['overview', 'announcements'].includes(view) && (
          <div className="desk-actions">
            {reviewCount !== null && (
              <Link className="button outline" href={viewUrl('review')}>
                Review queue{' '}
                {reviewCount > 0 && (
                  <span className="queue-count">{reviewCount}</span>
                )}
              </Link>
            )}
            <Link className="button" href={viewUrl('compose')}>
              New announcement
            </Link>
          </div>
        )}
      </div>
      {message && (
        <p className="feedback" role="status">
          {message}
        </p>
      )}
      {params.error && view !== 'profile' && (
        <p className="feedback error" role="alert">
          The change could not be saved. Check the notice status and try again.
        </p>
      )}
      {browsingNotices && (
        <form
          className="notice-controls"
          action="/portal"
          role="search"
          key={`${view}:${query}`}
        >
          <input type="hidden" name="view" value={view} />
          <div className="notice-query">
            <label htmlFor="notice-query">Search notices</label>
            <input
              id="notice-query"
              name="q"
              type="search"
              maxLength={120}
              defaultValue={query}
              placeholder="Title, summary, or source"
            />
          </div>
          <button className="button outline">Search</button>
          {query && (
            <Link className="button outline" href={viewUrl(view)}>
              Clear search
            </Link>
          )}
        </form>
      )}
      <div>
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
            {noticeId && (
              <Link className="text-link" href={viewUrl(view)}>
                ← Back to{' '}
                {view === 'corrections' ? 'corrections' : 'announcements'}
              </Link>
            )}
            {items.length === 0 ? (
              <p className="panel empty">
                {query
                  ? 'No notices match your search.'
                  : view === 'review'
                    ? 'No notices currently need your review or publication.'
                    : view === 'corrections'
                      ? 'No published corrections found.'
                      : 'No notices found.'}
              </p>
            ) : view === 'overview' ? (
              <ul className="bulletin-rows">
                {items.map((item) => (
                  <BulletinRow key={item.id} item={item} />
                ))}
              </ul>
            ) : (
              items.map((item) => (
                <NoticeCard
                  key={item.id}
                  item={item}
                  officer={officer}
                  userId={user.id}
                  view={view}
                  detail={Boolean(noticeId)}
                  publishedBy={
                    publishers.find(
                      (publisher) => publisher.id === item.publishedById,
                    )?.name
                  }
                />
              ))
            )}
            {browsingNotices && (page > 1 || hasMore) && (
              <nav className="pagination" aria-label="Notice pages">
                {page > 1 ? (
                  <Link className="text-link" href={pageUrl(page - 1)}>
                    Previous
                  </Link>
                ) : (
                  <span />
                )}
                <span>Page {page}</span>
                {hasMore ? (
                  <Link className="text-link" href={pageUrl(page + 1)}>
                    Next
                  </Link>
                ) : (
                  <span />
                )}
              </nav>
            )}
          </section>
        )}
      </div>
      {view === 'compose' &&
        (correctionId && !target ? (
          <div className="panel empty">
            <p>This notice is unavailable for correction.</p>
            <Link className="text-link" href={viewUrl('announcements')}>
              Back to announcements →
            </Link>
          </div>
        ) : (
          <Composer target={target} />
        ))}
      {(view === 'cases' || (view === 'overview' && !reader && reviewer)) && (
        <section className="panel empty">
          <h2>Confidential case workspace</h2>
          <p>
            Case handling is disabled in this prototype. No confidential records
            are collected.
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
        <section className="panel">
          <h2>Pending role requests</h2>
          {requests.length === 0 ? (
            <p>No pending requests.</p>
          ) : (
            requests.map((request) => (
              <div key={request.id}>
                <p>
                  {request.user.name} ({request.user.email}) requests{' '}
                  {roleNames[request.role]}
                </p>
                <form action={reviewRole}>
                  <input type="hidden" name="id" value={request.id} />
                  <button className="button" name="decision" value="approve">
                    Approve
                  </button>{' '}
                  <button
                    className="button outline"
                    name="decision"
                    value="deny"
                  >
                    Deny
                  </button>
                </form>
              </div>
            ))
          )}
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
                <th scope="col">Actions</th>
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
                  <td>
                    {account.id !== user.id && account.active && (
                      <form action={assignRole}>
                        <input type="hidden" name="userId" value={account.id} />
                        <label htmlFor={`assign-${account.id}`}>
                          Assign role
                        </label>
                        <select
                          id={`assign-${account.id}`}
                          name="role"
                          required
                          defaultValue=""
                        >
                          <option value="">Select role</option>
                          {(['OFFICER', 'REVIEWER', 'ADMIN'] as const)
                            .filter(
                              (role) =>
                                !account.roles.some(
                                  (assignment) => assignment.role === role,
                                ),
                            )
                            .map((role) => (
                              <option key={role} value={role}>
                                {roleNames[role]}
                              </option>
                            ))}
                        </select>
                        <button className="button outline">Assign</button>
                      </form>
                    )}
                    {account.id !== user.id &&
                      account.roles
                        .filter(({ role }) => role !== 'STUDENT')
                        .map(({ role }) => (
                          <form key={role} action={revokeRole}>
                            <input
                              type="hidden"
                              name="userId"
                              value={account.id}
                            />
                            <button name="role" value={role}>
                              Revoke {roleNames[role]}
                            </button>
                          </form>
                        ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {view === 'profile' && (
        <section className="panel">
          <h2>Request a privileged role</h2>
          <p>
            Requests require administrator approval. Your student access remains
            available while you wait.
          </p>
          <form action={requestRole}>
            <label htmlFor="role-request">Role</label>{' '}
            <select id="role-request" name="role" required>
              <option value="">Select a role</option>
              <option value="OFFICER">Placement officer</option>
              <option value="REVIEWER">Grievance reviewer</option>
              <option value="ADMIN">Administrator</option>
            </select>{' '}
            <button className="button">Submit request</button>
          </form>
          {params.result === 'requested' && (
            <p role="status">Request submitted for approval.</p>
          )}
          {params.error === 'role' && (
            <p role="alert">
              Request could not be submitted. It may already be pending or
              assigned.
            </p>
          )}
          {requests.map((request) => (
            <p key={request.id}>
              {roleNames[request.role]} · {request.status.toLowerCase()}
            </p>
          ))}
        </section>
      )}
      {view === 'profile' && (
        <Profile
          account={user}
          role={role}
          pages={startPages}
          saved={params.result === 'profile-saved'}
          error={params.error}
        />
      )}
    </WorkspaceFrame>
  );
}
