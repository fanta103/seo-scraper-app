import { google } from "@ai-sdk/google";
import { tool as aiTool, generateObject } from "ai";
import { z } from "zod";
import { captureScreenshotInternal } from "@/lib/capture-screenshot";
import { getCachedScreenshot } from "@/lib/screenshot-cache";
import {
  UI_UX_AUDIT_VISION_PROMPT,
  uiUxAuditSchema,
  type UiUxAudit,
} from "@/lib/ui-ux-audit-schema";

const auditInputSchema = z.object({
  url: z
    .string()
    .describe(
      "The full URL of the website to audit (must start with http:// or https://)",
    ),
});

async function runVisionAudit(
  imageBase64: string,
  mimeType: string,
  websiteUrl: string,
): Promise<UiUxAudit> {
  const imageBuffer = Buffer.from(imageBase64, "base64");

  const { object } = await generateObject({
    model: google("gemini-2.5-flash"),
    schema: uiUxAuditSchema,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `${UI_UX_AUDIT_VISION_PROMPT}\n\nWebsite URL: ${websiteUrl}`,
          },
          {
            type: "image",
            image: imageBuffer,
            mediaType: mimeType || "image/png",
          },
        ],
      },
    ],
  });

  return { ...object, websiteUrl };
}

export const auditUiUxTool = aiTool({
  description:
    "Capture a viewport screenshot of a website and perform a structured UI/UX audit. " +
    "Use when the user asks for a UI audit, UX review, design feedback, or usability analysis of a URL. " +
    "Returns scores, issues, and recommendations — not raw image data.",
  inputSchema: auditInputSchema,
  execute: async (input) => {
    const url = typeof input?.url === "string" ? input.url.trim() : "";

    if (!url || !/^https?:\/\//i.test(url)) {
      return {
        error:
          "A valid http(s) URL is required. Example: https://example.com",
      };
    }

    console.log(`[audit_ui_ux] Capturing viewport for: ${url}`);
    const capture = await captureScreenshotInternal(url, { fullPage: false });

    if ("error" in capture) {
      return { error: capture.error };
    }

    const { screenshotId, url: apiUrl, websiteUrl, mimeType } =
      capture.screenshot;

    const cached = getCachedScreenshot(screenshotId);
    if (!cached) {
      return {
        error:
          "Screenshot was captured but is no longer in cache. Please try again.",
      };
    }

    console.log(`[audit_ui_ux] Running vision audit for: ${url}`);
    try {
      const audit = await runVisionAudit(
        cached.data,
        cached.mimeType,
        websiteUrl,
      );

      const { screenshotId: _id, ...screenshot } = capture.screenshot;

      return {
        screenshot: {
          url: apiUrl,
          websiteUrl,
          mimeType,
        },
        audit,
      };
    } catch (err: unknown) {
      console.error("[audit_ui_ux] Vision audit failed:", err);
      const message = err instanceof Error ? err.message : String(err);
      return {
        error: `UI/UX audit failed: ${message}`,
        screenshot: {
          url: apiUrl,
          websiteUrl,
          mimeType,
        },
      };
    }
  },
} as any);
