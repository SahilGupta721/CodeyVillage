import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title:       'Codey Village',
  description: 'Code your way to a mansion. Earn coins. Build your village.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" style={{ height: '100%' }}>
      <body style={{ margin: 0, padding: 0, height: '100%', overflow: 'hidden' }}>
        {children}
      </body>
    </html>
  );
}
