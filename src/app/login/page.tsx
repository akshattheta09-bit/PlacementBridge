import { AuthError } from 'next-auth';
import { headers } from 'next/headers';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { currentUser, signIn } from '@/lib/auth';
import { Brand } from '../identity';

const demoAccounts = [
  ['Student', 'student@example.test'],
  ['Placement officer', 'officer@example.test'],
  ['Second officer', 'approver@example.test'],
  ['Grievance reviewer', 'reviewer@example.test'],
  ['Administrator', 'admin@example.test'],
] as const;

async function localDemoEnabled() {
  if (
    process.env.NODE_ENV === 'production' ||
    process.env.APP_MODE !== 'development' ||
    process.env.ENABLE_LOCAL_DEMO_SIGN_IN !== 'true' ||
    !process.env.DEMO_PASSWORD
  )
    return false;
  const url = URL.canParse(process.env.AUTH_URL ?? '')
    ? new URL(process.env.AUTH_URL!)
    : null;
  return (
    !!url &&
    ['localhost', '127.0.0.1'].includes(url.hostname) &&
    (await headers()).get('host') === url.host
  );
}

async function authenticate(
  email: FormDataEntryValue | null,
  password: FormDataEntryValue | null,
) {
  try {
    await signIn('credentials', { email, password, redirectTo: '/portal' });
  } catch (error) {
    if (error instanceof AuthError) redirect('/login?error=1');
    throw error;
  }
}

export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (await currentUser()) redirect('/portal');
  const { error } = await searchParams;
  return (
    <div className="login-site">
      <header className="site-header container">
        <Brand />
        <Link className="text-link" href="/">
          Back to home
        </Link>
      </header>
      <main className="login-shell" id="main-content">
        <div className="login-context">
          <p className="kicker">Academic prototype</p>
          <h1>Placement workspace</h1>
          <p>
            Use a synthetic account to read placement notices or try the officer
            review workflow.
          </p>
        </div>
        <section className="login-panel">
          <h2>Sign in</h2>
          {error && (
            <p className="feedback error" role="alert">
              Sign-in failed. Check your demo credentials.
            </p>
          )}
          <form
            id="credentials"
            className="form"
            action={async (data) => {
              'use server';
              await authenticate(data.get('email'), data.get('password'));
            }}
          >
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="username"
            />
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
            />
            <button className="button">Sign in</button>
          </form>
          {(await localDemoEnabled()) && (
            <form
              className="demo-picker"
              action={async (data) => {
                'use server';
                if (!(await localDemoEnabled())) redirect('/login');
                const account = demoAccounts.find(
                  ([, email]) => email === data.get('account'),
                );
                if (!account) redirect('/login?error=1');
                await authenticate(account[1], process.env.DEMO_PASSWORD!);
              }}
            >
              <h3>Try a demo account</h3>
              <div>
                {demoAccounts.map(([label, email]) => (
                  <button
                    key={email}
                    className="button outline"
                    name="account"
                    value={email}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </form>
          )}
        </section>
      </main>
    </div>
  );
}
