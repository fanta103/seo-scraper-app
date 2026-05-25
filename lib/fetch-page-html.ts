import { getMcpClient } from "@/lib/mcp-client";

type McpTextBlock = { type?: string; text?: string };

function parseStealthyFetchContent(
  content: unknown,
): { html: string; status?: number; url?: string; error?: string } {
  if (!content) {
    return { html: "", error: "Empty MCP response" };
  }

  if (typeof content === "string") {
    try {
      const parsed = JSON.parse(content) as {
        content?: string[];
        status?: number;
        url?: string;
        error?: string;
      };
      if (parsed.error) return { html: "", error: parsed.error };
      const html = (parsed.content ?? []).filter(Boolean).join("\n").trim();
      return { html, status: parsed.status, url: parsed.url };
    } catch {
      return { html: content.trim() };
    }
  }

  if (Array.isArray(content)) {
    const textParts: string[] = [];
    for (const item of content as McpTextBlock[]) {
      if (item?.type === "text" && item.text) {
        textParts.push(item.text);
      }
    }
    const joined = textParts.join("\n").trim();
    if (!joined) return { html: "", error: "No text content in MCP response" };

    try {
      const parsed = JSON.parse(joined) as {
        content?: string[];
        status?: number;
        url?: string;
      };
      const html = (parsed.content ?? []).filter(Boolean).join("\n").trim();
      return { html, status: parsed.status, url: parsed.url };
    } catch {
      return { html: joined };
    }
  }

  if (typeof content === "object" && content !== null) {
    const obj = content as {
      content?: string[];
      status?: number;
      url?: string;
      error?: string;
    };
    if (obj.error) return { html: "", error: String(obj.error) };
    const html = (obj.content ?? []).filter(Boolean).join("\n").trim();
    return { html, status: obj.status, url: obj.url };
  }

  return { html: "", error: "Unrecognized MCP response format" };
}

/** Fetch audit-focused HTML via the Scrapling MCP stealthy_fetch tool. */
export async function fetchPageHtml(url: string): Promise<{
  html: string;
  status?: number;
  finalUrl?: string;
  error?: string;
}> {
  const client = await getMcpClient();
  const result = await client.callTool({
    name: "stealthy_fetch",
    arguments: {
      url,
      extraction_type: "html",
      main_content_only: false,
    },
  });

  if (result.isError) {
    const errText = Array.isArray(result.content)
      ? (result.content as McpTextBlock[])
          .map((c) => c.text)
          .filter(Boolean)
          .join(" ")
      : "MCP stealthy_fetch failed";
    return { html: "", error: errText || "MCP stealthy_fetch failed" };
  }

  return parseStealthyFetchContent(result.content);
}
