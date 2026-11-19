import Link from 'next/link';

export function Brand() {
  return (
    <Link className="wordmark" href="/" aria-label="PlacementBridge home">
      <span className="monogram" aria-hidden="true">
        PB
      </span>
      <span>PlacementBridge</span>
    </Link>
  );
}
