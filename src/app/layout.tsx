import type { Metadata } from 'next';
import { IconSprite } from '@/components/icon-sprite';
import { Providers } from '@/components/providers';
import '@/styles/portal.css';
import './globals.css';

export const metadata: Metadata = {
  title: 'MOE Counsellor Portal',
  description: 'Morgan Oxford Education — counsellor portal',
  themeColor: '#110F08',
  icons: {
    icon: '/assets/rm/rm-mark-gold@900.png',
    apple: '/assets/rm/rm-mark-gold@900.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="/assets/rm/fonts.css" />
        <link rel="stylesheet" href="/assets/rm/rm-group-tokens.css" />
        <link
          rel="icon"
          href="/assets/rm/rm-mark-gold@900.png"
          type="image/png"
          sizes="900x900"
        />
      </head>
      <body>
        <IconSprite />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
