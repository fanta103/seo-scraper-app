import { google } from "@ai-sdk/google";
import { streamText, UIMessage, convertToModelMessages, stepCountIs, tool as aiTool } from "ai";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { auth } from "@clerk/nextjs/server";
import { getMcpTools, getMcpClient } from "@/lib/mcp-client";
import { z } from "zod";

// Allow streaming responses up to 5 minutes (screenshots can be slow)
export const maxDuration = 300;

if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
  throw new Error("NEXT_PUBLIC_CONVEX_URL is not set");
}

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

/**
 * capture_screenshot — a single tool the model calls with just a URL.
 * Internally handles: open_session → screenshot → close_session.
 * Session management must NOT be delegated to the model — it's infrastructure.
 */
const captureScreenshotTool = aiTool({
  description:
    "Capture a full-page screenshot of any URL and display it inline in the chat. " +
    "Use this whenever the user asks to 'show', 'preview', 'screenshot', or 'take a photo' of a website.",
  parameters: z.object({
    url: z.string().describe("The full URL of the page to capture (must start with http:// or https://)"),
  }),
  execute: async (args: Record<string, any>) => {
    const url = args.url as string;
    const client = await getMcpClient();
    let sessionId: string | null = null;

    try {
      // Step 1: Open a dynamic browser session
      console.log(`[capture_screenshot] Opening session for: ${url}`);
      const sessionResult = await (client as any).callTool({
        name: "open_session",
        arguments: { session_type: "dynamic" },
      });

      // open_session returns a text item containing the SessionCreatedModel JSON
      const sessionTextItem = Array.isArray(sessionResult.content)
        ? sessionResult.content.find((c: any) => c.type === "text")
        : null;

      if (!sessionTextItem?.text) {
        return { error: "Failed to open browser session: no session data returned." };
      }

      const sessionData = JSON.parse(sessionTextItem.text);
      sessionId = sessionData.session_id as string;

      if (!sessionId) {
        return { error: "Failed to open browser session: session_id missing in response." };
      }

      console.log(`[capture_screenshot] Session opened: ${sessionId}`);

      // Step 2: Take the screenshot
      console.log(`[capture_screenshot] Capturing screenshot...`);
      const screenshotResult = await (client as any).callTool({
        name: "screenshot",
        arguments: {
          url,
          session_id: sessionId,
          full_page: true,
          network_idle: true,
          image_type: "png",
          wait: 5000,
        },
      });

      if (screenshotResult.isError) {
        return { error: `Screenshot failed: ${JSON.stringify(screenshotResult.content)}` };
      }

      // Extract the base64 image from the content array
      const imageItem = Array.isArray(screenshotResult.content)
        ? screenshotResult.content.find((c: any) => c.type === "image" && c.data)
        : null;

      if (imageItem) {
        console.log(`[capture_screenshot] Screenshot captured successfully.`);
        return {
          screenshot: {
            data: imageItem.data as string,
            mimeType: (imageItem.mimeType ?? "image/png") as string,
            url,
          },
        };
      }

      // Fallback: look for an error text item in the result
      const errorItem = Array.isArray(screenshotResult.content)
        ? screenshotResult.content.find((c: any) => c.type === "text")
        : null;

      return { error: errorItem?.text ?? "Screenshot returned no image data." };

    } catch (err: any) {
      console.error("[capture_screenshot] Error:", err);
      const message = err?.message ?? String(err);
      if (message.includes("timeout")) {
        return { error: "The page took too long to load. Try a simpler URL." };
      }
      if (message.includes("net::ERR") || message.includes("invalid URL")) {
        return { error: `Invalid or unreachable URL: ${url}` };
      }
      return { error: `Screenshot failed: ${message}` };

    } finally {
      // Always close the session to free resources, even on failure
      if (sessionId) {
        console.log(`[capture_screenshot] Closing session: ${sessionId}`);
        await (client as any)
          .callTool({ name: "close_session", arguments: { session_id: sessionId } })
          .catch((e: any) => console.warn("[capture_screenshot] Failed to close session:", e));
      }
    }
  },
} as any);

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

Use your native google_search tool to answer questions about the SEO report if it will help you answer the question.
IMPORTANT: Whenever you are about to search the web, you MUST start your response with exactly this token on its own line: [SEARCHING_WEB] - then proceed with the search and your answer. Do not skip this token when performing any web search.

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
If the user asks for a technical SEO audit, you MUST use the 'stealthy_fetch' tool.
TOOL PARAMETERS FOR 'stealthy_fetch':
- url: The full URL to audit (compulsory)
- main_content_only: false (compulsory for SEO audits)
- extraction_type: "html" (compulsory for SEO audits)
Do NOT invent or guess other parameters.

When analyzing the fetched HTML for technical SEO, check for:
- Meta tags: <title>, <meta name="description">, and <meta name="robots">.
- Canonical link: <link rel="canonical" href="...">
- Headings: exactly one <h1>, properly nested <h2>s.
- Image accessibility: missing alt attributes.
- Structured data: <script type="application/ld+json">.
Report your findings clearly and concisely.

SCREENSHOT TOOL:
If the user asks to "show", "preview", "screenshot", or "take a photo" of a website, call the 'capture_screenshot' tool with just the URL.
Do NOT call open_session, screenshot, or any session tools directly — capture_screenshot manages the browser session internally.
After it returns, tell the user the screenshot is displayed below.`;

  const result = streamText({
    model: google("gemini-2.5-flash"),
    messages: await convertToModelMessages(messages),
    system: systemPrompt,
    stopWhen: stepCountIs(5),
    tools: {
      //google_search: google.tools.googleSearch({}),
      // Single tool for screenshots — session lifecycle handled inside execute()
      capture_screenshot: captureScreenshotTool,
      // MCP tools for SEO audits — hide raw session/screenshot primitives from the model
      ...Object.fromEntries(
        Object.entries(mcpTools).filter(
          ([name]) => !["open_session", "close_session", "list_sessions", "screenshot"].includes(name)
        )
      ),
    },
  });

  return result.toUIMessageStreamResponse();
}