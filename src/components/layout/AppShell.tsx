import { useEffect, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Boxes, LayoutDashboard, Moon, Package, ScanLine, Sun, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AssistantPanel } from "@/components/assistant/AssistantPanel";
import { ThemePicker } from "./ThemePicker";
import { ScanDialog } from "@/components/inventory/ScanDialog";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/items", label: "Items", icon: Package },
  { to: "/bulk", label: "Smart Bulk Entry", icon: Wand2 },
] as const;

function ThemeToggle() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const stored = localStorage.getItem("theme");
    const d = stored ? stored === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
    setDark(d);
    document.documentElement.classList.toggle("dark", d);
  }, []);
  const toggle = () => {
    const d = !dark;
    setDark(d);
    document.documentElement.classList.toggle("dark", d);
    localStorage.setItem("theme", d ? "dark" : "light");
  };
  return (
    <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle dark mode" title="Toggle light / dark mode">
      {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [scanOpen, setScanOpen] = useState(false);
  return (
    <div className="min-h-screen pb-24">
      <header className="sticky top-0 z-30 border-b bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-1 px-3 sm:gap-4 sm:px-4">
          <Link to="/" className="flex items-center gap-2 font-display text-lg font-semibold">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground"><Boxes className="h-4 w-4" /></span>
            <span className="hidden sm:inline">Stockroom</span>
          </Link>
          <nav className="flex flex-1 items-center gap-1 overflow-x-auto">
            {NAV.map(({ to, label, icon: Icon }) => (
              <Link key={to} to={to} activeOptions={{ exact: to === "/" }}
                className="flex items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                activeProps={{ className: "bg-accent text-accent-foreground font-medium" }}>
                <Icon className="h-4 w-4" /><span className="hidden md:inline">{label}</span>
              </Link>
            ))}
          </nav>
          <div className="flex shrink-0 items-center">
            <Button variant="ghost" size="icon" aria-label="Scan barcode or QR code" title="Scan barcode or QR code" onClick={() => setScanOpen(true)}><ScanLine className="h-4 w-4" /></Button>
            <ThemePicker />
            <ThemeToggle />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
      <AssistantPanel />
      <ScanDialog open={scanOpen} onOpenChange={setScanOpen} />
    </div>
  );
}
