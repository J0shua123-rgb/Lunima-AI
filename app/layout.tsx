import './globals.css';
import QueryProvider from '@/components/providers/QueryProvider';

export const metadata = {
  title: 'Lumina AI',
  description: 'AI-Powered Graphic Design Editor',
};

// layout.tsx - Root layout
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <QueryProvider>
          {children}
        </QueryProvider>
      </body>
    </html>
  );
}
