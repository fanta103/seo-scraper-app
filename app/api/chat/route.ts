import { google } from "@ai-sdk/google";
import {
  streamText,
  UIMessage,
  convertToModelMessages,
  stepCountIs,
  validateUIMessages,
  createIdGenerator,
  TypeValidationError,
} from "ai";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { auth } from "@clerk/nextjs/server";
import { getMcpTools } from "@/lib/mcp-client";
import {
  captureScreenshotTool,
  filterMcpToolsForModel,
  sanitizeMessagesForStorage,
} from "@/lib/capture-screenshot";
import { auditUiUxTool } from "@/lib/ui-ux-audit";

export const maxDuration = 300;

if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
  throw new Error("NEXT_PUBLIC_CONVEX_URL is not set");
}

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

export async function POST(req: Request) {
  const { userId } = await auth();

  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const body = await req.json();
  const snapshotId: string = body.id;

  if (!snapshotId) {
    return new Response("Report id is required", { status: 400 });
  }

  // Persistence: last message only (new) or full history (legacy fallback)
  let incomingMessage: UIMessage | undefined = body.message;
  if (!incomingMessage && Array.isArray(body.messages) && body.messages.length > 0) {
    incomingMessage = body.messages[body.messages.length - 1] as UIMessage;
  }

  if (!incomingMessage) {
    return new Response("Message is required", { status: 400 });
  }

  let mcpTools = {};
  try {
    mcpTools = await getMcpTools();
  } catch (error) {
    console.error("Failed to load MCP tools:", error);
  }

  let previousMessages: UIMessage[] = [];
  try {
    previousMessages = await convex.query(api.reportChats.getMessages, {
      snapshotId,
      userId,
    });
  } catch (error) {
    console.error("Failed to load chat messages:", error);
  }

  const allMessages: UIMessage[] = [
    ...sanitizeMessagesForStorage(previousMessages as UIMessage[]),
    incomingMessage,
  ];

  const modelTools = {
    capture_screenshot: captureScreenshotTool,
    audit_ui_ux: auditUiUxTool,
    ...filterMcpToolsForModel(mcpTools),
  };

  const validToolNames = new Set(Object.keys(modelTools));
  const preValidatedMessages = allMessages.map(msg => ({
    ...msg,
    parts: msg.parts ? msg.parts.filter((part: any) => {
      if (part.type === 'tool-call' || part.type === 'tool-invocation' || part.type === 'tool-result') {
        return validToolNames.has(part.toolName);
      }
      return true;
    }) : []
  })).filter(msg => msg.parts.length > 0);

  let validatedMessages: UIMessage[];
  try {
    validatedMessages = await validateUIMessages({
      messages: preValidatedMessages,
      tools: modelTools,
    });
  } catch (error) {
    console.error("Chat message validation failed:", error);
    // Fallback safely so the chat doesn't break
    validatedMessages = [incomingMessage];
  }

  let seoReportData = null;

  let systemPrompt = `You are an AI assistant helping users understand their SEO report.
  
  Provide helpful insights and answer questions about the SEO data and recommendations.`;

  try {
    const job = await convex.query(api.scrapingJobs.getJobBySnapshotId, {
      snapshotId,
      userId,
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

Provide specific, data-driven insights based on the actual report data. When referencing metrics, use the exact numbers from the report. Be conversational but informative.`

    } else {
      systemPrompt += `\n\nNote: SEO report with ID "${snapshotId}" was found but analysis may still be in progress or failed. Please check the report status.`;
    }
  } catch (error) {
    console.error("Error fetching SEO report:", error);
    systemPrompt += `\n\nNote: Unable to fetch SEO report data for ID "${snapshotId}". The report may not exist or you may not have access to it.`;
  }

  systemPrompt += `

You are equipped with the Scrapling MCP Server which provides web scraping tools for Technical SEO audits.
If the user asks for a technical SEO audit, you MUST use the 'stealthy_fetch' tool.
TOOL PARAMETERS FOR 'stealthy_fetch':
- url: The full URL to audit (compulsory)
- main_content_only: false (compulsory for SEO audits)
- extraction_type: "html" (compulsory for SEO audits)
Do NOT invent or guess other parameters.

The MCP server automatically refines fetched HTML (strips scripts except JSON-LD, CSS, nav/footer, widgets, hidden markup) before you receive it.

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
After it returns, tell the user the screenshot is displayed below.

UI/UX AUDIT TOOL:
If the user asks for a UI audit, UX review, design feedback, usability analysis, or "audit the design" of a website, call 'audit_ui_ux' with the full URL.
This tool captures a full-page screenshot (entire scrollable page) and returns structured scores and recommendations — use those results to write a clear, friendly summary.
Do NOT call capture_screenshot separately before audit_ui_ux; the audit tool already captures the page.
After it returns, summarize the audit highlights and mention that the screenshot and detailed scores are shown below.`;

  const result = streamText({
    model: google("gemini-2.5-flash"),
    messages: await convertToModelMessages(validatedMessages),
    system: systemPrompt,
    stopWhen: stepCountIs(5),
    tools: {
    //  google_search: google.tools.googleSearch({}),
      ...modelTools,
    },
  });


  result.consumeStream();

  return result.toUIMessageStreamResponse({
    originalMessages: validatedMessages,
    generateMessageId: createIdGenerator({ prefix: "msg", size: 16 }),
    onFinish: async ({ messages, isAborted }) => {
      if (isAborted) return;
      try {
        await convex.mutation(api.reportChats.saveMessages, {
          snapshotId,
          userId,
          messages: sanitizeMessagesForStorage(messages),
        });
      } catch (error) {
        console.error("Failed to save chat messages:", error);
      }
    },
  });
}
