import Link from 'next/link';
import { Brand } from './identity';
import { SampleRegister } from './sample-register';

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
            <a className="desktop-link" href="#publication">
              Publication process
            </a>
            <Link className="button outline" href="/login">
              Sign in <span aria-hidden="true">↗</span>
            </Link>
          </nav>
        </div>
      </header>
      <main id="welcome-content">
        <section className="container welcome-hero">
          <div className="welcome-intro">
            <h1>Placement bulletin.</h1>
            <p className="welcome-description">
              Find the latest notice from your placement office. Check its
              source, see what changed, and know what to do next.
            </p>
            <div className="hero-actions">
              <Link className="button" href="/login">
                Open the demo workspace <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
          <SampleRegister />
        </section>
        <section className="publication-notes" id="publication">
          <div className="container publication-grid">
            <h2>How notices are published</h2>
            <div>
              <h3>Written by an officer</h3>
              <p>Every notice includes a source students can check.</p>
            </div>
            <div>
              <h3>Reviewed by a second officer</h3>
              <p>Another officer approves the draft before it can go live.</p>
            </div>
            <div>
              <h3>Corrections keep their history</h3>
              <p>
                Students can open the earlier notice and compare it with the
                update.
              </p>
            </div>
          </div>
        </section>
      </main>
      <footer className="site-footer container">
        <Brand />
        <p>
          Independent academic prototype · All demonstration records are
          synthetic
        </p>
      </footer>
    </div>
  );
}
