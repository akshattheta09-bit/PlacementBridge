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
  await client.form('/login', ($) => $('form'), {
    email: role + '@example.test',
    password: process.env.DEMO_PASSWORD,
  });
  const res = await client.request('/portal');
  assert.equal(res.status, 200);
  assert.match(res.html('main').text(), expected);
  return client;
}
const guest = session();
assert.equal((await guest.request('/')).status, 200);
assert.equal((await guest.request('/portal')).location, '/login');
const officer = await login('officer', /Announcement workspace/);
const approver = await login('approver', /Announcement workspace/);
const student = await login('student', /Official announcements/);
await login('reviewer', /Confidential case workspace/);
await login('admin', /Platform administration/);
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
await officer.form('/portal', ($) => $('#create form'), fields);
async function step(client, name, action) {
  await client.form('/portal', ($) => card($, name).find('form'), { action });
}
async function publish(name) {
  await step(officer, name, 'submit');
  assert.equal(
    card((await officer.request('/portal')).html, name).find(
      'button[value=approve]',
    ).length,
    0,
  );
  assert.equal(card((await student.request('/portal')).html, name).length, 0);
  await step(approver, name, 'approve');
  await step(approver, name, 'publish');
}
await publish(title);
assert.match(
  card((await student.request('/portal')).html, title).text(),
  /Synthetic memo PB-001.*Published by Jordan Approver/,
);
const $ = (await officer.request('/portal')).html;
const path = card($, title).find('a').attr('href').split('#')[0];
await officer.form(path, ($) => $('#create form'), {
  ...fields,
  title: corrected,
  changeReason: 'The fictional timetable changed.',
  studentAction: 'No action required.',
  effectiveDate: '2026-11-21',
});
await publish(corrected);
const feed = (await student.request('/portal')).html;
assert.match(feed('main').text(), /Published corrections/);
assert.match(card(feed, title).text(), /Superseded/);
assert.match(card(feed, corrected).text(), /No action required/);
await student.form('/portal', ($) => $('aside form'), {});
assert.equal((await student.request('/portal')).location, '/login');
console.log(
  'HTTP smoke passed: landing, anonymous denial, all four roles, sign-in/out, independent approval, publication and correction visibility.',
);
