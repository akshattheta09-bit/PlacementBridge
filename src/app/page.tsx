import Link from 'next/link';
import { Brand } from './identity';

export default function Home() {
  return (
    <div className="public-site">
      <header className="site-header container">
        <Brand />
        <nav aria-label="Public navigation">
          <a className="desktop-link" href="#process">
            How it works
          </a>
          <Link className="button outline" href="/login">
            Sign in <span aria-hidden="true">↗</span>
          </Link>
        </nav>
      </header>
      <main>
        <section className="public-hero container">
          <div className="hero-copy">
            <p className="kicker">
              <span className="dot" /> Independent academic prototype
            </p>
            <h1>
              Your future deserves
              <br className="large-only" /> facts, <em>not rumours.</em>
            </h1>
            <p className="hero-description">
              A placement bulletin that tells you who published an update, where
              it came from, and what to do if it changes.
            </p>
            <div className="hero-actions">
              <Link className="button" href="/login">
                Open the workspace <span aria-hidden="true">↗</span>
              </Link>
              <a className="text-link" href="#process">
                See how notices are reviewed <span aria-hidden="true">↓</span>
              </a>
            </div>
          </div>
          <figure className="bulletin">
            <div className="bulletin-rail">
              <span>PLACEMENT BULLETIN</span>
              <span>SAMPLE NOTICE</span>
            </div>
            <div className="bulletin-paper">
              <div className="bulletin-top">
                <span className="kicker">Schedule change</span>
                <span>18 NOV</span>
              </div>
              <h2>Interview practice session moved</h2>
              <p>
                The demo practice session now starts at 2:00 pm. Students who
                planned to attend can use the updated time.
              </p>
              <dl>
                <div>
                  <dt>Source</dt>
                  <dd>Synthetic training memo PB-01</dd>
                </div>
                <div>
                  <dt>Published by</dt>
                  <dd>Jordan Approver · Placement officer</dd>
                </div>
              </dl>
              <figcaption>Illustration using synthetic data.</figcaption>
            </div>
          </figure>
        </section>
        <section className="process" id="process">
          <div className="container process-inner">
            <div>
              <p className="kicker">Publication process</p>
              <h2>How a notice reaches students</h2>
            </div>
            <ol>
              <li>
                <strong>Draft</strong>
                <span>
                  A placement officer writes a notice and records its source.
                </span>
              </li>
              <li>
                <strong>Review</strong>
                <span>
                  A second officer reviews the notice before it can be
                  published.
                </span>
              </li>
              <li>
                <strong>Publish</strong>
                <span>
                  Students see the notice, its publisher, and any later
                  correction.
                </span>
              </li>
            </ol>
          </div>
        </section>
      </main>
      <footer className="site-footer container">
        <Brand />
        <p>
          Independent academic prototype. Synthetic data only. No institutional
          endorsement.
        </p>
      </footer>
    </div>
  );
}
