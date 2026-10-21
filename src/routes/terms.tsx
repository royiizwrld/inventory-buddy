import { createFileRoute } from "@tanstack/react-router";
import { SimplePage } from "@/components/layout/SimplePage";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of use — Stockroom" },
      { name: "description", content: "Terms for using Stockroom." },
      { property: "og:title", content: "Terms of use — Stockroom" },
      { property: "og:description", content: "Terms for using Stockroom." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <SimplePage title="Terms of use">
      <p>Placeholder terms. Replace with your own terms of use before launch.</p>
    </SimplePage>
  ),
});
