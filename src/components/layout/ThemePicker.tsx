import { useEffect, useState } from "react";
import { Check, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const THEMES = [
  { id: "ledger", name: "Ledger", swatch: "bg-theme-ledger" },
  { id: "ocean", name: "Ocean", swatch: "bg-theme-ocean" },
  { id: "rose", name: "Rose", swatch: "bg-theme-rose" },
  { id: "graphite", name: "Graphite", swatch: "bg-theme-graphite" },
  { id: "forest", name: "Forest", swatch: "bg-theme-forest" },
  { id: "amber", name: "Amber", swatch: "bg-theme-amber" },
  { id: "coral", name: "Coral", swatch: "bg-theme-coral" },
  { id: "violet", name: "Violet", swatch: "bg-theme-violet" },
  { id: "cyan", name: "Cyan", swatch: "bg-theme-cyan" },
  { id: "olive", name: "Olive", swatch: "bg-theme-olive" },
] as const;

export function ThemePicker() {
  const [theme, setTheme] = useState("ledger");
  useEffect(() => {
    const stored = localStorage.getItem("stockroom:color-theme");
    const choice = THEMES.some((t) => t.id === stored) ? stored ?? "ledger" : "ledger";
    setTheme(choice);
    document.documentElement.dataset["theme"] = choice;
  }, []);
  const choose = (id: string) => {
    setTheme(id);
    document.documentElement.dataset["theme"] = id;
    localStorage.setItem("stockroom:color-theme", id);
  };
  return <DropdownMenu>
    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" aria-label="Choose color theme" title="Choose color theme"><Palette className="h-4 w-4" /></Button></DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <DropdownMenuLabel>Color theme</DropdownMenuLabel>
      {THEMES.map((t) => <DropdownMenuItem key={t.id} onClick={() => choose(t.id)}><span className={`h-4 w-4 shrink-0 rounded-full ${t.swatch}`} /><span className="flex-1">{t.name}</span>{theme === t.id && <Check className="h-4 w-4" />}</DropdownMenuItem>)}
    </DropdownMenuContent>
  </DropdownMenu>;
}