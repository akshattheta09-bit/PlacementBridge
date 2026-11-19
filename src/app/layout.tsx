import './globals.css';
import type { Metadata } from 'next';
export const metadata: Metadata = { title:'PlacementBridge', description:'A more trustworthy way to navigate placement information.' };
export default function RootLayout({children}:{children:React.ReactNode}) { return <html lang="en"><body><div className="banner">ACADEMIC PROTOTYPE · SYNTHETIC DEMONSTRATION DATA · NOT INSTITUTIONALLY ENDORSED</div>{children}</body></html>; }
