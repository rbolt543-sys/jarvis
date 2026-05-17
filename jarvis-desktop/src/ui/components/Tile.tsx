import type { ReactNode } from "react";

export function Tile({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-lg border border-neutral-800 bg-neutral-900/40 p-4">
      <h2 className="text-xs uppercase tracking-wider text-neutral-500 mb-3">{title}</h2>
      {children}
    </section>
  );
}
