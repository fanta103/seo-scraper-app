import { tool as aiTool, type UIMessage } from "ai";
import { z } from "zod";
import { getMcpClient } from "@/lib/mcp-client";
import { cacheScreenshot } from "@/lib/screenshot-cache";

type ScreenshotOutput = {
  screenshot?: {
    data?: string;
    mimeType?: string;
    url?: string;
    websiteUrl?: string;
  };
  error?: string;
};

export type CaptureScreenshotResult =
  | {
      screenshot: {
        url: string;
        websiteUrl: string;
        mimeType: string;
        screenshotId: string;
      };
    }
  | { error: string };

/** Strip temporary payloads before persisting — keeps Convex docs under size limits. */
export function sanitizeMessagesForStorage(messages: UIMessage[]): UIMessage[] {
  const toolTypes = ["tool-capture_screenshot", "tool-audit_ui_ux"] as const;

  return messages.map((message) => ({
    ...message,
    parts: message.parts.map((part) => {
      const p = part as {
        type: string;
        state?: string;
        output?: ScreenshotOutput & { audit?: unknown };
      };
      if (!toolTypes.includes(p.type as (typeof toolTypes)[number])) return part;
      if (p.state !== "output-available" || !p.output) return part;

      const output = p.output;
      if (!output.screenshot?.url && !output.screenshot?.data) return part;

      const sanitized: Record<string, unknown> = { ...output };
      sanitized.screenshot = {
        url: output.screenshot.websiteUrl || output.screenshot.url,
        mimeType: output.screenshot.mimeType ?? "image/png",
      };
      return { ...part, output: sanitized } as typeof part;
    }),
  })) as UIMessage[];
}

/**
 * Capture via MCP (open_session → screenshot → close_session).
 * Viewport-only by default to keep vision token cost reasonable.
 */
export async function captureScreenshotInternal(
  url: string,
  options?: { fullPage?: boolean },
): Promise<CaptureScreenshotResult> {
  const fullPage = options?.fullPage ?? false;

  if (!url || !/^https?:\/\//i.test(url)) {
    return {
      error:
        "A valid http(s) URL is required. Example: https://example.com",
    };
  }

  const client = await getMcpClient();
  let sessionId: string | null = null;

  try {
    const sessionResult = await (
      client as {
        callTool: (p: unknown) => Promise<{
          content?: unknown[];
          isError?: boolean;
        }>;
      }
    ).callTool({
      name: "open_session",
      arguments: { session_type: "dynamic" },
    });

    const sessionTextItem = Array.isArray(sessionResult.content)
      ? sessionResult.content.find(
          (c: { type?: string; text?: string }) => c.type === "text",
        )
      : null;

    if (!sessionTextItem?.text) {
      return {
        error: "Failed to open browser session: no session data returned.",
      };
    }

    const sessionData = JSON.parse(sessionTextItem.text) as {
      session_id?: string;
    };
    sessionId = sessionData.session_id ?? null;

    if (!sessionId) {
      return {
        error:
          "Failed to open browser session: session_id missing in response.",
      };
    }

    const screenshotResult = await (
      client as {
        callTool: (p: unknown) => Promise<{
          content?: unknown[];
          isError?: boolean;
        }>;
      }
    ).callTool({
      name: "screenshot",
      arguments: {
        url,
        session_id: sessionId,
        full_page: fullPage,
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

    if (!imageItem?.data) {
      const errorItem = Array.isArray(screenshotResult.content)
        ? screenshotResult.content.find(
            (c: { type?: string; text?: string }) => c.type === "text",
          )
        : null;
      return {
        error: errorItem?.text ?? "Screenshot returned no image data.",
      };
    }

    const mimeType = (imageItem.mimeType ?? "image/png") as string;
    const { id, apiUrl } = cacheScreenshot(imageItem.data as string, mimeType);

    return {
      screenshot: {
        url: apiUrl,
        websiteUrl: url,
        mimeType,
        screenshotId: id,
      },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes("timeout")) {
      return { error: "The page took too long to load. Try a simpler URL." };
    }
    if (message.includes("net::ERR") || message.includes("invalid URL")) {
      return { error: `Invalid or unreachable URL: ${url}` };
    }
    return { error: `Screenshot failed: ${message}` };
  } finally {
    if (sessionId) {
      await (client as { callTool: (p: unknown) => Promise<unknown> })
        .callTool({ name: "close_session", arguments: { session_id: sessionId } })
        .catch((e: unknown) =>
          console.warn("[capture_screenshot] Failed to close session:", e),
        );
    }
  }
}

const screenshotInputSchema = z.object({
  url: z
    .string()
    .describe(
      "The full URL of the page to capture (must start with http:// or https://)",
    ),
});

export const captureScreenshotTool = aiTool({
  description:
    "Capture a viewport screenshot of any URL and display it inline in the chat. " +
    "Use when the user only wants a preview, not a full UI/UX audit.",
  inputSchema: screenshotInputSchema,
  execute: async (input) => {
    const url = typeof input?.url === "string" ? input.url.trim() : "";
    const result = await captureScreenshotInternal(url, { fullPage: false });
    if ("error" in result) return { error: result.error };
    const { screenshotId: _id, ...screenshot } = result.screenshot;
    return { screenshot };
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
      ([name]) =>
        !HIDDEN_MCP_TOOL_NAMES.includes(
          name as (typeof HIDDEN_MCP_TOOL_NAMES)[number],
        ),
    ),
  );
}
