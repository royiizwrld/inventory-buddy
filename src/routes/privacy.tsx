import { createFileRoute } from "@tanstack/react-router";
import { SimplePage } from "@/components/layout/SimplePage";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy — Stockroom" },
      { name: "description", content: "How Stockroom handles your data." },
      { property: "og:title", content: "Privacy — Stockroom" },
      { property: "og:description", content: "How Stockroom handles your data." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <SimplePage title="Privacy">
      <p>Placeholder privacy notice. Each workspace’s data is visible only to its members, and you can delete your account. Replace with your full policy before launch.</p>
    </SimplePage>
  ),
});
