import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { tool as aiTool } from "ai";
import { z } from "zod";

let mcpClient: Client | null = null;
let mcpTransport: SSEClientTransport | null = null;

export async function getMcpClient() {
  const mcpUrl = process.env.SCRAPLING_MCP_URL;
  if (!mcpUrl) {
    throw new Error("SCRAPLING_MCP_URL environment variable is not set");
  }

  // If already connected, return the client
  if (mcpClient) {
    return mcpClient;
  }

  try {
    console.log("Connecting to MCP server at", mcpUrl);
    mcpTransport = new SSEClientTransport(new URL(mcpUrl));
    mcpClient = new Client(
      {
        name: "seo-marketing-saas-client",
        version: "1.0.0",
      },
      {
        capabilities: {},
      }
    );

    await mcpClient.connect(mcpTransport);
    console.log("Connected to MCP server successfully");
    return mcpClient;
  } catch (error) {
    console.error("Failed to connect to MCP server:", error);
    mcpClient = null;
    mcpTransport = null;
    throw error;
  }
}

export async function getMcpTools() {
  const client = await getMcpClient();

  const { tools } = await client.listTools();

  const aiTools: Record<string, any> = {};

  for (const mcpTool of tools) {
    const description = mcpTool.description || `Tool: ${mcpTool.name}`;
    const schemaStr = JSON.stringify(mcpTool.inputSchema);

    aiTools[mcpTool.name] = aiTool({
      description: `${description}\n\nParameters JSON Schema: ${schemaStr}`,
      parameters: z.object({}).passthrough(),
      execute: async (args: Record<string, any>) => {
        console.log(`Executing MCP tool ${mcpTool.name} with args:`, args);
        try {
          const result = await (client as any).callTool({
            name: mcpTool.name,
            arguments: args,
          });

          if (result.isError) {
            console.error(`MCP Tool ${mcpTool.name} returned error:`, result.content);
            return { error: result.content };
          }

          return result.content;
        } catch (error) {
          console.error(`Exception executing MCP tool ${mcpTool.name}:`, error);
          return { error: String(error) };
        }
      },
    } as any);
  }

  return aiTools;
}
