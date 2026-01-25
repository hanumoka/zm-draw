import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'zm-draw Demo',
  description: 'Figma-like diagram editor for developers',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className="antialiased">{children}</body>
    </html>
  );
}
