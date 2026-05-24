import { tool as aiTool, type UIMessage } from "ai";
import { z } from "zod";
import { getMcpClient } from "@/lib/mcp-client";

type ScreenshotOutput = {
  screenshot?: { data?: string; mimeType?: string; url?: string };
  error?: string;
};

/** Strip base64 image payloads before persisting — keeps Convex docs under size limits. */
export function sanitizeMessagesForStorage(messages: UIMessage[]): UIMessage[] {
  return messages.map((message) => ({
    ...message,
    parts: message.parts.map((part) => {
      if (part.type !== "tool-capture_screenshot") return part;
      if (part.state !== "output-available" || !part.output) return part;

      const output = part.output as ScreenshotOutput;
      if (!output.screenshot?.data) return part;

      return {
        ...part,
        output: {
          ...output,
          screenshot: {
            url: output.screenshot.url,
            mimeType: output.screenshot.mimeType ?? "image/png",
            // Omit `data` — full image only lives in the active client session.
          },
        },
      };
    }),
  }));
}

/**
 * capture_screenshot — single tool the model calls with just a URL.
 * Internally: open_session → screenshot → close_session.
 * Session management must NOT be delegated to the model.
 */
const screenshotInputSchema = z.object({
  url: z
    .string()
    .describe(
      "The full URL of the page to capture (must start with http:// or https://)",
    ),
});

export const captureScreenshotTool = aiTool({
  description:
    "Capture a full-page screenshot of any URL and display it inline in the chat. " +
    "Use this whenever the user asks to 'show', 'preview', 'screenshot', or 'take a photo' of a website.",
  inputSchema: screenshotInputSchema,
  execute: async (input) => {
    const url =
      typeof input?.url === "string" ? input.url.trim() : "";

    if (!url || !/^https?:\/\//i.test(url)) {
      return {
        error:
          "A valid http(s) URL is required. Example: https://example.com",
      };
    }
    const client = await getMcpClient();
    let sessionId: string | null = null;

    try {
      console.log(`[capture_screenshot] Opening session for: ${url}`);
      const sessionResult = await (client as { callTool: (p: unknown) => Promise<{ content?: unknown[]; isError?: boolean }> }).callTool({
        name: "open_session",
        arguments: { session_type: "dynamic" },
      });

      const sessionTextItem = Array.isArray(sessionResult.content)
        ? sessionResult.content.find(
            (c: { type?: string; text?: string }) => c.type === "text",
          )
        : null;

      if (!sessionTextItem?.text) {
        return { error: "Failed to open browser session: no session data returned." };
      }

      const sessionData = JSON.parse(sessionTextItem.text) as {
        session_id?: string;
      };
      sessionId = sessionData.session_id ?? null;

      if (!sessionId) {
        return {
          error: "Failed to open browser session: session_id missing in response.",
        };
      }

      console.log(`[capture_screenshot] Session opened: ${sessionId}`);

      console.log(`[capture_screenshot] Capturing screenshot...`);
      const screenshotResult = await (client as { callTool: (p: unknown) => Promise<{ content?: unknown[]; isError?: boolean }> }).callTool({
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
        return {
          error: `Screenshot failed: ${JSON.stringify(screenshotResult.content)}`,
        };
      }

      const imageItem = Array.isArray(screenshotResult.content)
        ? screenshotResult.content.find(
            (c: { type?: string; data?: string; mimeType?: string }) =>
              c.type === "image" && c.data,
          )
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

      const errorItem = Array.isArray(screenshotResult.content)
        ? screenshotResult.content.find(
            (c: { type?: string; text?: string }) => c.type === "text",
          )
        : null;

      return {
        error: errorItem?.text ?? "Screenshot returned no image data.",
      };
    } catch (err: unknown) {
      console.error("[capture_screenshot] Error:", err);
      const message =
        err instanceof Error ? err.message : String(err);
      if (message.includes("timeout")) {
        return { error: "The page took too long to load. Try a simpler URL." };
      }
      if (message.includes("net::ERR") || message.includes("invalid URL")) {
        return { error: `Invalid or unreachable URL: ${url}` };
      }
      return { error: `Screenshot failed: ${message}` };
    } finally {
      if (sessionId) {
        console.log(`[capture_screenshot] Closing session: ${sessionId}`);
        await (client as { callTool: (p: unknown) => Promise<unknown> })
          .callTool({ name: "close_session", arguments: { session_id: sessionId } })
          .catch((e: unknown) =>
            console.warn("[capture_screenshot] Failed to close session:", e),
          );
      }
    }
  },
} as any);

/** MCP tools exposed to the model — session/screenshot primitives are hidden. */
export const HIDDEN_MCP_TOOL_NAMES = [
  "open_session",
  "close_session",
  "list_sessions",
  "screenshot",
] as const;

export function filterMcpToolsForModel(
  mcpTools: Record<string, unknown>,
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(mcpTools).filter(
      ([name]) => !HIDDEN_MCP_TOOL_NAMES.includes(name as (typeof HIDDEN_MCP_TOOL_NAMES)[number]),
    ),
  );
}
