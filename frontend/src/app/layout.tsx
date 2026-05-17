import type { Metadata } from 'next';
import { Press_Start_2P } from 'next/font/google';
import './globals.css';
import ExtensionAuthBridge from '../components/ExtensionAuthBridge';

const pixelFont = Press_Start_2P({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-pixel',
});

export const metadata: Metadata = {
  title: 'Codey Village',
  description: 'Code your way to a mansion. Earn coins. Build your village.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" style={{ height: '100%' }}>
      <body className={pixelFont.variable} style={{ margin: 0, padding: 0, height: '100%', overflow: 'hidden' }}>
        <ExtensionAuthBridge />
        {children}
      </body>
    </html>
  );
}