import { google } from "@ai-sdk/google";
import { streamText, UIMessage, convertToModelMessages } from "ai";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { auth } from "@clerk/nextjs/server";
import { getMcpTools } from "@/lib/mcp-client";

// Allow streaming responses up to 30 seconds
export const maxDuration = 300;

if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
  throw new Error("NEXT_PUBLIC_CONVEX_URL is not set");
}

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

export async function POST(req: Request) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("User ID is not set");
  }
  const {
    messages,
    id,
  }: {
    messages: UIMessage[];
    id: string;
  } = await req.json();

  let mcpTools = {};
  try {
    mcpTools = await getMcpTools();
  } catch (error) {
    console.error("Failed to load MCP tools:", error);
  }

  // Step 1: Get the SEO report from the database
  let seoReportData = null;

  let systemPrompt = `You are an AI assistant helping users understand their SEO report.
  
  Provide helpful insights and answer questions about the SEO data and recommendations.`;

  if (id) {
    try {
      const job = await convex.query(api.scrapingJobs.getJobBySnapshotId, {
        snapshotId: id,
        userId: userId,
      });
      if (job?.seoReport) {
        seoReportData = job.seoReport;
        systemPrompt = `You are an AI assistant helping users understand their SEO report.
      
      CURRENT SEO REPORT DATA:

          ${JSON.stringify(seoReportData, null, 2)}

You have access to comprehensive SEO analysis data for "${seoReportData.meta?.entity_name || "the entity"}" (${seoReportData.meta?.entity_type || "unknown type"}).

Key areas you can help with:
- Overall SEO performance and confidence score
- Source inventory and domain analysis
- Competitor analysis and market positioning
- Keyword analysis and search visibility
- Backlink profile and authority metrics
- Content gaps and optimization opportunities
- Actionable recommendations for improvement

Use the web_search tool to answer questions about the SEO report if it will help you answer the question.

Provide specific, data-driven insights based on the actual report data. When referencing metrics, use the exact numbers from the report. Be conversational but informative.`;
      } else {
        systemPrompt += `\n\nNote: SEO report with ID "${id}" was found but analysis may still be in progress or failed. Please check the report status.`;
      }

    } catch (error) {
      console.error("Error fetching SEO report:", error);
      systemPrompt += `\n\nNote: Unable to fetch SEO report data for ID "${id}". The report may not exist or you may not have access to it.`;
    }
  }

  systemPrompt += `

You are equipped with the Scrapling MCP Server which provides web scraping tools for Technical SEO audits.
If the user asks for a technical SEO audit, use the 'stealthy_fetch' tool with 'extraction_type="html"'.
When analyzing the fetched HTML for technical SEO, check for:
- Meta tags: <title>, <meta name="description">, and <meta name="robots">.
- Canonical link: <link rel="canonical" href="...">
- Headings: exactly one <h1>, properly nested <h2>s.
- Image accessibility: missing alt attributes.
- Structured data: <script type="application/ld+json">.
Report your findings clearly and concisely.`;

  const result = streamText({
    model: google("gemini-2.5-flash"),
    messages: await convertToModelMessages(messages),
    system: systemPrompt,
    tools: mcpTools,
  });

  return result.toUIMessageStreamResponse();
}