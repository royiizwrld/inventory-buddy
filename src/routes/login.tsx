import { createFileRoute, Link } from "@tanstack/react-router";
import { SimplePage } from "@/components/layout/SimplePage";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — Stockroom" },
      { name: "description", content: "Sign in to your Stockroom workspace." },
      { property: "og:title", content: "Sign in — Stockroom" },
      { property: "og:description", content: "Sign in to your Stockroom workspace." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <SimplePage title="Sign in">
      <p>Accounts are being set up and will be available shortly.</p><p><Link to="/dashboard" className="text-primary underline">Open the app on this device</Link></p>
    </SimplePage>
  ),
});
