import Link from 'next/link';
import { Brand } from './identity';

const publicationSteps = [
  [
    'Draft',
    'A placement officer writes the notice and records its original source.',
  ],
  [
    'Independent review',
    'A second officer checks the notice before it can be published.',
  ],
  [
    'Publication',
    'Students can read the approved notice, see its source, and find any later corrections.',
  ],
];

export default function Home() {
  return (
    <div className="public-site">
      <header className="site-header container">
        <Brand />
        <nav aria-label="Public navigation">
          <a className="desktop-link" href="#process">
            Publication process
          </a>
          <Link className="button outline" href="/login">
            Sign in
          </Link>
        </nav>
      </header>
      <main>
        <div className="hero-band">
          <section className="public-hero container">
            <div className="hero-copy">
              <p className="kicker">University placement communications</p>
              <h1>
                Placement notices
                <br className="large-only" /> you can verify.
              </h1>
              <p className="hero-description">
                Read placement announcements, see who published them, and follow
                corrections back to the original notice.
              </p>
              <div className="hero-actions">
                <Link className="button" href="/login">
                  Open placement workspace
                </Link>
                <a className="text-link" href="#process">
                  How notices are published
                </a>
              </div>
              <p className="prototype-note">
                Independent academic prototype · Synthetic data
              </p>
            </div>
            <figure className="bulletin">
              <figcaption className="bulletin-rail">
                <strong>Notice register</strong>
                <span>Demonstration record</span>
              </figcaption>
              <div className="bulletin-paper">
                <div className="bulletin-top">
                  <span className="status status-published">Published</span>
                  <time dateTime="2026-11-18">18 Nov 2026</time>
                </div>
                <h2>Interview practice session moved</h2>
                <p>The practice session now starts at 2:00 pm IST.</p>
                <dl>
                  <div>
                    <dt>Source reference</dt>
                    <dd>Training memo PB-01 (synthetic)</dd>
                  </div>
                  <div>
                    <dt>Published by</dt>
                    <dd>Jordan Approver, placement officer</dd>
                  </div>
                  <div>
                    <dt>Student action</dt>
                    <dd>Use the revised start time</dd>
                  </div>
                </dl>
              </div>
            </figure>
          </section>
        </div>
        <section className="process" id="process">
          <div className="container process-inner">
            <div>
              <h2>How a notice reaches students</h2>
              <p>Your future deserves facts, not rumours.</p>
            </div>
            <ol>
              {publicationSteps.map(([step, description]) => (
                <li key={step}>
                  <strong>{step}</strong>
                  <span>{description}</span>
                </li>
              ))}
            </ol>
          </div>
        </section>
      </main>
      <footer className="site-footer container">
        <Brand />
        <p>Independent academic prototype. No institutional endorsement.</p>
      </footer>
    </div>
  );
}
