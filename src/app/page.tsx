import Image from 'next/image';
import Link from 'next/link';
import { Brand } from './identity';

const publicationSteps = [
  [
    'Draft',
    'A placement officer writes the notice and records its original source.',
  ],
  ['Review', 'A second officer reviews the notice before it can be published.'],
  [
    'Publish',
    'Students see the source and publisher, and can trace later corrections.',
  ],
];

export default function Home() {
  return (
    <div className="welcome-site">
      <a className="skip-link" href="#welcome-content">
        Skip to content
      </a>
      <header className="welcome-header">
        <div className="container site-header">
          <Brand />
          <nav aria-label="Public navigation">
            <a className="desktop-link" href="#how-it-works">
              How it works
            </a>
            <Link className="button outline" href="/login">
              Sign in
            </Link>
          </nav>
        </div>
      </header>
      <main id="welcome-content">
        <section className="container welcome-hero">
          <div className="welcome-intro">
            <p className="kicker welcome-kicker">
              A university placement workspace
            </p>
            <h1>
              Placement updates
              <br className="hero-break" /> you can verify.
            </h1>
            <p className="welcome-description">
              Find the latest placement notices, see who published them, and
              check what changed before you act.
            </p>
            <div className="hero-actions">
              <Link className="button" href="/login">
                Explore the demo <span aria-hidden="true">→</span>
              </Link>
              <a className="text-link" href="#sample-notice">
                View a sample notice
              </a>
            </div>
            <p className="welcome-disclaimer">
              Independent academic prototype · Synthetic data
            </p>
          </div>
          <figure className="welcome-photo">
            <Image
              src="/campus-welcome.webp"
              alt="Students walking toward a university library"
              fill
              unoptimized
              priority
              sizes="(max-width: 760px) 100vw, 46vw"
            />
            <figcaption>Illustrative campus scene</figcaption>
          </figure>
        </section>
        <section className="welcome-explainer" id="how-it-works">
          <div className="container welcome-explainer-grid">
            <div className="welcome-process">
              <h2>From placement office to student</h2>
              <ol>
                {publicationSteps.map(([step, description], index) => (
                  <li key={step}>
                    <span className="step-number" aria-hidden="true">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <div>
                      <h3>{step}</h3>
                      <p>{description}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
            <article className="welcome-sample" id="sample-notice">
              <header>
                <span>Sample notice</span>
                <time dateTime="2026-11-18">18 Nov 2026</time>
              </header>
              <div className="welcome-sample-body">
                <span className="status status-published">Published</span>
                <h2>Interview practice session moved</h2>
                <p>
                  The practice session now starts at 2:00 pm IST. Use the
                  revised start time if you plan to attend.
                </p>
                <details className="notice-details">
                  <summary>Check the source</summary>
                  <dl>
                    <div>
                      <dt>Source reference</dt>
                      <dd>Training memo PB-01 (synthetic)</dd>
                    </div>
                    <div>
                      <dt>Published by</dt>
                      <dd>Jordan Approver, placement officer</dd>
                    </div>
                  </dl>
                </details>
              </div>
            </article>
          </div>
        </section>
      </main>
      <footer className="site-footer container">
        <Brand />
        <p>Your future deserves facts, not rumours.</p>
      </footer>
    </div>
  );
}
