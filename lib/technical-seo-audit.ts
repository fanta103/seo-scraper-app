import { tool as aiTool } from "ai";
import { z } from "zod";
import { fetchPageHtml } from "@/lib/fetch-page-html";
import { analyzeHtmlForTechnicalSeo } from "@/lib/html-seo-checks";
import type { TechnicalSeoAudit } from "@/lib/technical-seo-audit-schema";

const auditInputSchema = z.object({
  url: z
    .string()
    .describe(
      "The full URL of the page to audit (must start with http:// or https://)",
    ),
});

export const auditTechnicalSeoTool = aiTool({
  description:
    "Fetch a page with stealthy_fetch, analyze its HTML for technical SEO and GEO signals, " +
    "and return a structured audit card (scores, checks, issues). " +
    "Use when the user asks for a technical SEO audit, GEO audit, or HTML SEO review of a URL.",
  inputSchema: auditInputSchema,
  execute: async (input) => {
    const url = typeof input?.url === "string" ? input.url.trim() : "";

    if (!url || !/^https?:\/\//i.test(url)) {
      return {
        error: "A valid http(s) URL is required. Example: https://example.com",
      };
    }

    console.log(`[audit_technical_seo] Fetching HTML for: ${url}`);
    const fetchResult = await fetchPageHtml(url);

    if (fetchResult.error || !fetchResult.html) {
      return {
        error: fetchResult.error ?? "No HTML returned from fetch.",
      };
    }

    console.log(
      `[audit_technical_seo] Analyzing ${fetchResult.html.length} chars of HTML`,
    );
    const audit: TechnicalSeoAudit = analyzeHtmlForTechnicalSeo(
      fetchResult.html,
      fetchResult.finalUrl ?? url,
    );

    return {
      audit,
      fetch: {
        status: fetchResult.status,
        htmlLength: fetchResult.html.length,
        url: fetchResult.finalUrl ?? url,
      },
    };
  },
} as any);
