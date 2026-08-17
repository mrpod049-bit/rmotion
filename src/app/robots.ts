import type { MetadataRoute } from "next";

// Bots des moteurs IA : explicitement autorisés (on cherche à être cité/référencé).
const AI_BOTS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "anthropic-ai",
  "Claude-Web",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "Applebot-Extended",
  "CCBot",
  "Bytespider",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: "/admin" },
      { userAgent: AI_BOTS, allow: "/", disallow: "/admin" },
    ],
    sitemap: "https://www.rmotion.fr/sitemap.xml",
    host: "https://www.rmotion.fr",
  };
}
