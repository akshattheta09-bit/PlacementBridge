import { demoCorrection, demoNotice } from '@/lib/demo-bulletin';

const calendar = new Intl.DateTimeFormat('en-IN', {
  dateStyle: 'medium',
  timeZone: 'Asia/Kolkata',
});

function SampleRecord({ corrected }: { corrected: boolean }) {
  const record = corrected ? demoCorrection : demoNotice;
  return (
    <article
      className={`sample-record ${corrected ? 'sample-correction' : 'sample-original'}`}
    >
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
  );
}

export function SampleRegister() {
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
      <fieldset className="sample-versions">
        <legend className="sr-only">Notice version</legend>
        <label>
          <input
            className="sr-only"
            type="radio"
            name="sample-version"
            value="correction"
            defaultChecked
          />
          <span>Correction</span>
        </label>
        <label>
          <input
            className="sr-only"
            type="radio"
            name="sample-version"
            value="original"
          />
          <span>Original notice</span>
        </label>
      </fieldset>
      <SampleRecord corrected />
      <SampleRecord corrected={false} />
    </section>
  );
}
