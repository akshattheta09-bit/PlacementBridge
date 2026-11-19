import assert from 'node:assert/strict';
import { load } from 'cheerio';
const target = new URL(process.env.AUTH_URL ?? 'http://localhost:3000');
assert.equal(
  process.env.APP_MODE,
  'development',
  'Smoke test creates synthetic records in development mode',
);
assert.ok(
  ['localhost', '127.0.0.1'].includes(target.hostname),
  'Use a local development server',
);
assert.ok(
  process.env.DEMO_PASSWORD,
  'Configure DEMO_PASSWORD and seed the synthetic accounts first',
);
const base = target.origin;
function session() {
  const cookies = new Map();
  async function request(path, body) {
    const response = await fetch(new URL(path, base), {
      method: body ? 'POST' : 'GET',
      body,
      redirect: 'manual',
      headers: {
        cookie: [...cookies].map(([k, v]) => k + '=' + v).join('; '),
        ...(body ? { origin: base } : {}),
      },
    });
    for (const cookie of response.headers.getSetCookie()) {
      const [key, ...value] = cookie.split(';')[0].split('=');
      cookies.set(key, value.join('='));
    }
    return {
      status: response.status,
      location: response.headers.get('location'),
      html: load(await response.text()),
    };
  }
  async function form(path, select, fields, expectedError) {
    const page = await request(path);
    assert.equal(page.status, 200);
    const form = select(page.html);
    assert.equal(form.length, 1);
    const data = new FormData();
    form
      .find('input[type=hidden][name]')
      .each((_, input) =>
        data.append(input.attribs.name, input.attribs.value ?? ''),
      );
    for (const [key, value] of Object.entries(fields)) data.set(key, value);
    const result = await request(path, data);
    assert.equal(result.status, 303);
    if (expectedError) assert.match(result.location ?? '', expectedError);
    else assert.ok(!result.location?.includes('error'), result.location);
    return result;
  }
  return { request, form };
}
async function login(role, expected) {
  const client = session();
  await client.form('/login', ($) => $('#credentials'), {
    email: role + '@example.test',
    password: process.env.DEMO_PASSWORD,
  });
  const overview = await client.request('/portal');
  assert.equal(
    overview
      .html('#workspace-sidebar nav [aria-current=page]')
      .text()
      .trim()
      .endsWith('Overview'),
    true,
  );
  const view = {
    officer: 'announcements',
    approver: 'review',
    student: 'announcements',
    reviewer: 'cases',
    admin: 'accounts',
  }[role];
  const res = await client.request('/portal?view=' + view);
  assert.equal(
    res.html('#workspace-sidebar nav [aria-current=page]').attr('href'),
    '/portal?view=' + view,
  );
  assert.equal(res.status, 200);
  assert.match(res.html('main').text(), expected);
  return client;
}
const guest = session();
const landing = await guest.request('/');
assert.equal(landing.status, 200);
assert.match(
  landing.html('#sample').text(),
  /Interview practice will be held online/,
);
assert.equal((await guest.request('/portal')).location, '/login');
const officer = await login('officer', /Announcement workspace/);
const approver = await login('approver', /Review queue/);
const student = await login('student', /Official announcements/);
await login('reviewer', /Confidential case workspace/);
const admin = await login('admin', /Platform administration/);
assert.match(
  (await admin.request('/portal?view=accounts')).html('table').text(),
  /Avery Student/,
);
assert.equal(
  (await student.request('/portal?view=accounts')).html('table').length,
  0,
);
assert.equal(
  (await student.request('/portal?view=compose')).html('#create').length,
  0,
);
assert.match(
  (await student.request('/portal?view=profile')).html('main').text(),
  /Avery Student/,
);

const profilePath = '/portal?view=profile';
const profileSelector = ($) => $('#account-preferences');
const before = (await student.request(profilePath)).html;
const previousName = before('#preferredName').val() ?? '';
const previousStart = before('#startPage option[selected]').val() ?? 'overview';
try {
  const saved = await student.form(profilePath, profileSelector, {
    preferredName: 'Avery Preview',
    startPage: 'corrections',
  });
  const profile = (await student.request(saved.location)).html;
  assert.match(profile('[role=status]').text(), /preferences were saved/);
  assert.equal(profile('#preferredName').val(), 'Avery Preview');
  assert.equal(profile('#startPage option[selected]').val(), 'corrections');
  assert.match(profile('.account-identity').text(), /student@example.test/);
  const returningStudent = session();
  const loginResult = await returningStudent.form(
    '/login',
    ($) => $('#credentials'),
    {
      email: 'student@example.test',
      password: process.env.DEMO_PASSWORD,
    },
  );
  assert.match(loginResult.location ?? '', /start=1/);
  assert.equal(
    (await returningStudent.request(loginResult.location)).location,
    '/portal?view=corrections',
  );
  assert.match(
    (await returningStudent.request('/portal')).html('.page-heading').text(),
    /Avery Preview/,
  );

  await student.form(
    profilePath,
    profileSelector,
    {
      preferredName: 'Invalid selection',
      startPage: 'accounts',
    },
    /error=profile-input/,
  );
  assert.equal(
    (await student.request(profilePath)).html('#preferredName').val(),
    'Avery Preview',
  );
  assert.doesNotMatch(
    (await officer.request(profilePath)).html('main').text(),
    /Avery Preview/,
  );
} finally {
  await student.form(profilePath, profileSelector, {
    preferredName: previousName,
    startPage: previousStart,
  });
}

const demo = session();
const signIn = await demo.request('/login');
if (signIn.html('.demo-picker').length) {
  await demo.form('/login', ($) => $('.demo-picker'), {
    account: 'student@example.test',
  });
  assert.match(
    (await demo.request(profilePath)).html('.account-identity').text(),
    /Avery Student/,
  );
}
const title = 'Synthetic schedule ' + Date.now();
const corrected = title + ' correction';
const fields = {
  title,
  summary: 'Fictional schedule update for demonstration.',
  content: 'This fictional schedule does not describe an actual event.',
  source: 'Synthetic memo PB-001',
};
const card = ($, name) =>
  $('article').filter((_, el) => $(el).find('h3').text() === name);
const announcements = '/portal?view=announcements';
const review = '/portal?view=review';
await officer.form('/portal?view=compose', ($) => $('#create form'), fields);
async function step(client, name, action) {
  await client.form(
    action === 'submit' ? announcements : review,
    ($) => card($, name).find('form'),
    { action },
  );
}
async function publish(name) {
  await step(officer, name, 'submit');
  assert.equal(
    card((await officer.request(announcements)).html, name).find(
      'button[value=approve]',
    ).length,
    0,
  );
  assert.equal(
    card((await student.request(announcements)).html, name).length,
    0,
  );
  await step(approver, name, 'approve');
  await step(approver, name, 'publish');
}
await publish(title);
assert.match(
  card((await student.request(announcements)).html, title).text(),
  /Synthetic memo PB-001.*Published by Jordan Approver/,
);
const $ = (await officer.request(announcements)).html;
const path = card($, title)
  .find('a')
  .filter((_, el) => $(el).text() === 'Draft correction')
  .attr('href');
await officer.form(path, ($) => $('#create form'), {
  ...fields,
  title: corrected,
  changeReason: 'The fictional timetable changed.',
  studentAction: 'No action required.',
  effectiveDate: '2026-11-21',
});
await publish(corrected);
const search = await student.request(
  announcements + '&q=' + encodeURIComponent(title),
);
assert.equal(card(search.html, title).length, 1);
assert.equal(card(search.html, corrected).length, 1);
assert.match(
  (await student.request(announcements + '&q=impossible-search-term'))
    .html('main')
    .text(),
  /No notices match your search/,
);
const feed = (await student.request(announcements)).html;
const corrections = (await student.request('/portal?view=corrections')).html;
assert.match(corrections('main h1').text(), /Published corrections/);
assert.equal(card(corrections, corrected).length, 1);
assert.equal(card(corrections, title).length, 0);
const detailId = card(corrections, corrected)
  .attr('id')
  .slice('notice-'.length);
const detail = (
  await student.request('/portal?view=corrections&notice=' + detailId)
).html;
assert.equal(detail('main h1').text(), corrected);
assert.match(detail('details[open]').text(), /No action required/);
assert.match(
  detail('details[open] .correction-note a').attr('href'),
  /view=announcements&notice=/,
);

assert.match(card(feed, title).text(), /Superseded/);
assert.match(card(feed, corrected).text(), /No action required/);
await student.form(announcements, ($) => $('#workspace-sidebar form'), {});
assert.equal((await student.request('/portal')).location, '/login');
console.log(
  'HTTP smoke passed: landing, anonymous denial, all four roles, sign-in/out, profile preferences and access checks, independent approval, publication, search and correction visibility.',
);
