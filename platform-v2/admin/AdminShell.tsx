import type { ReactNode } from 'react';

export function AdminShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="h-14 border-b border-border flex items-center px-4">
        <strong>PCM Admin V2</strong>
      </header>
      <main className="p-4">{children}</main>
    </div>
  );
}
