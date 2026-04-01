import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Freeform Pro — Infinite Canvas',
  description: 'A professional infinite canvas for ideas, notes, and creativity.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="h-full">{children}</body>
    </html>
  );
}
