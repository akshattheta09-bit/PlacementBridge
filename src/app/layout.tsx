import './globals.css';
import './experience.css';
import './bulletin.css';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'PlacementBridge',
  description:
    'A source-attributed placement bulletin for students and placement teams.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
