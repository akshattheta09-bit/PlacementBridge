import type { StartPage } from '@prisma/client';
import { savePreferences } from './profile-actions';
import { SaveButton } from './save-button';

export function Profile({
  account,
  role,
  pages,
  saved,
  error,
}: {
  account: {
    name: string;
    email: string;
    preferredName: string | null;
    startPage: StartPage;
  };
  role: string;
  pages: { view: StartPage; label: string }[];
  saved: boolean;
  error?: string;
}) {
  const defaultPage = pages.some(({ view }) => view === account.startPage)
    ? account.startPage
    : 'overview';
  return (
    <div className="profile-grid">
      <section className="panel account-preferences">
        <h2>Workspace preferences</h2>
        {saved && (
          <p className="feedback" role="status">
            Your preferences were saved.
          </p>
        )}
        {error && (
          <p className="feedback error" role="alert">
            {error === 'profile-input'
              ? 'Use a display name of up to 60 characters and choose an available start page.'
              : 'Your changes could not be saved. Try again.'}
          </p>
        )}
        <form
          className="form"
          action={savePreferences}
          id="account-preferences"
        >
          <label htmlFor="preferredName">
            Display name <span className="optional">Optional</span>
          </label>
          <input
            id="preferredName"
            name="preferredName"
            maxLength={60}
            defaultValue={account.preferredName ?? ''}
            placeholder={account.name}
            aria-describedby="preferred-name-help"
          />
          <p className="field-help" id="preferred-name-help">
            Used in your workspace. Official notices retain the registered
            publisher name.
          </p>
          <label htmlFor="startPage">Start page</label>
          <select
            id="startPage"
            name="startPage"
            defaultValue={defaultPage}
            aria-describedby="start-page-help"
          >
            {pages.map(({ view, label }) => (
              <option key={view} value={view}>
                {label}
              </option>
            ))}
          </select>
          <p className="field-help" id="start-page-help">
            The page you’ll open after signing in.
          </p>
          <SaveButton />
        </form>
      </section>
      <section
        className="panel account-identity"
        aria-labelledby="account-identity"
      >
        <h2 id="account-identity">Account details</h2>
        <dl>
          <div>
            <dt>Registered name</dt>
            <dd>{account.name}</dd>
          </div>
          <div>
            <dt>Sign-in email</dt>
            <dd>{account.email}</dd>
          </div>
          <div>
            <dt>Active roles</dt>
            <dd>{role}</dd>
          </div>
        </dl>
        <p className="field-help">
          These details are configured for the local demo.
        </p>
      </section>
    </div>
  );
}
