import { createFileRoute, Link } from "@tanstack/react-router";
import { SimplePage } from "@/components/layout/SimplePage";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Create your account — Stockroom" },
      { name: "description", content: "Create a free Stockroom account and workspace." },
      { property: "og:title", content: "Create your account — Stockroom" },
      { property: "og:description", content: "Create a free Stockroom account and workspace." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <SimplePage title="Create your account">
      <p>Accounts are being set up and will be available shortly.</p><p><Link to="/dashboard" className="text-primary underline">Try the app on this device</Link></p>
    </SimplePage>
  ),
});
