'use client';

import { useState } from 'react';
import { demoCorrection, demoNotice } from '@/lib/demo-bulletin';

const calendar = new Intl.DateTimeFormat('en-IN', {
  dateStyle: 'medium',
  timeZone: 'Asia/Kolkata',
});

export function SampleRegister() {
  const [current, setCurrent] = useState<'update' | 'original'>('update');
  const corrected = current === 'update';
  const record = corrected ? demoCorrection : demoNotice;

  return (
    <section
      className="sample-register"
      id="sample"
      aria-labelledby="sample-title"
    >
      <header className="sample-register-header">
        <h2 id="sample-title">Sample bulletin</h2>
        <span>Demo data</span>
      </header>
      <div className="sample-versions" role="group" aria-label="Notice version">
        <button
          type="button"
          aria-pressed={corrected}
          onClick={() => setCurrent('update')}
        >
          Correction
        </button>
        <button
          type="button"
          aria-pressed={!corrected}
          onClick={() => setCurrent('original')}
        >
          Original notice
        </button>
      </div>
      <article className="sample-record" aria-live="polite" aria-atomic="true">
        <div className="sample-record-date">
          <span
            className={corrected ? 'record-kind is-correction' : 'record-kind'}
          >
            {corrected ? 'Venue updated' : 'Superseded'}
          </span>
          <time dateTime={record.publishedAt}>
            {calendar.format(new Date(record.publishedAt))}
          </time>
        </div>
        <h3>{record.title}</h3>
        <p>{record.summary}</p>
        <div className="sample-action">
          <strong>
            {corrected ? 'What to do' : 'This notice was superseded'}
          </strong>
          <p>
            {corrected
              ? demoCorrection.studentAction
              : 'Check the correction for the new venue.'}
          </p>
        </div>
        <dl className="sample-provenance">
          <div>
            <dt>Source</dt>
            <dd>{record.source}</dd>
          </div>
          <div>
            <dt>Published by</dt>
            <dd>Jordan Approver, placement officer</dd>
          </div>
        </dl>
      </article>
    </section>
  );
}
