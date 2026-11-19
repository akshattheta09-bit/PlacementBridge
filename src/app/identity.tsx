import Link from 'next/link';

export function Brand() {
  return (
    <Link className="wordmark" href="/" aria-label="PlacementBridge home">
      <span>PlacementBridge</span>
    </Link>
  );
}
