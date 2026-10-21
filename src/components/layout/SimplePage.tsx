import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Logo, SiteFooter } from "./PublicShell";

export function SimplePage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <>
      <header className="border-b"><div className="mx-auto flex h-14 max-w-6xl items-center px-4"><Logo /></div></header>
      <main className="mx-auto min-h-[60vh] max-w-2xl px-4 py-16">
        <h1 className="font-display text-3xl font-semibold">{title}</h1>
        <div className="mt-4 space-y-3 text-muted-foreground">{children}</div>
        <Link to="/" className="mt-8 inline-block text-sm font-medium text-primary underline-offset-4 hover:underline">← Back to home</Link>
      </main>
      <SiteFooter />
    </>
  );
}
