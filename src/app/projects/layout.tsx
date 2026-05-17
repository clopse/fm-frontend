import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'JMK Projects',
  description: 'AI-assisted project intelligence',
};

export default function ProjectsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        overflow: 'hidden',
        backgroundColor: '#1a1a1a',
        fontFamily:
          "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        color: '#e5e5e5',
        margin: 0,
        padding: 0,
      }}
    >
      {children}
    </div>
  );
}
