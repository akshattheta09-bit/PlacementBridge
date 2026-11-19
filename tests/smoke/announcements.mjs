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
  async function form(path, select, fields) {
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
    assert.ok(!result.location?.includes('error'), result.location);
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
    overview.html('nav [aria-current=page]').text().trim().endsWith('Overview'),
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
    res.html('nav [aria-current=page]').attr('href'),
    '/portal?view=' + view,
  );
  assert.equal(res.status, 200);
  assert.match(res.html('main').text(), expected);
  return client;
}
const guest = session();
assert.equal((await guest.request('/')).status, 200);
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

const demo = session();
const signIn = await demo.request('/login');
if (signIn.html('.demo-picker').length) {
  await demo.form('/login', ($) => $('.demo-picker'), {
    account: 'student@example.test',
  });
  assert.match(
    (await demo.request('/portal')).html('main').text(),
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
const feed = (await student.request(announcements)).html;
const corrections = (await student.request('/portal?view=corrections')).html;
assert.match(corrections('main h1').text(), /Published corrections/);
assert.equal(card(corrections, corrected).length, 1);
assert.equal(card(corrections, title).length, 0);
assert.match(card(feed, title).text(), /Superseded/);
assert.match(card(feed, corrected).text(), /No action required/);
await student.form(announcements, ($) => $('aside form'), {});
assert.equal((await student.request('/portal')).location, '/login');
console.log(
  'HTTP smoke passed: landing, anonymous denial, all four roles, sign-in/out, independent approval, publication and correction visibility.',
);
