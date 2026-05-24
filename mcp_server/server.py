from scrapling.core.ai import ScraplingMCPServer
from mcp.server.fastmcp import FastMCP
import asyncio

scrapling_api = ScraplingMCPServer()
mcp = FastMCP(name="Scrapling", host="127.0.0.1", port=8000)

mcp.add_tool(scrapling_api.open_session, title="open_session")
mcp.add_tool(scrapling_api.close_session, title="close_session")
#mcp.add_tool(scrapling_api.list_sessions, title="list_sessions")
#mcp.add_tool(scrapling_api.get, title="get", description=scrapling_api.get.__doc__)
#mcp.add_tool(scrapling_api.bulk_get, title="bulk_get", description=scrapling_api.bulk_get.__doc__)
#mcp.add_tool(scrapling_api.fetch, title="fetch", description=scrapling_api.fetch.__doc__)
#mcp.add_tool(scrapling_api.bulk_fetch, title="bulk_fetch", description=scrapling_api.bulk_fetch.__doc__)
mcp.add_tool(scrapling_api.stealthy_fetch, title="stealthy_fetch", description=scrapling_api.stealthy_fetch.__doc__)
#mcp.add_tool(scrapling_api.bulk_stealthy_fetch, title="bulk_stealthy_fetch", description=scrapling_api.bulk_stealthy_fetch.__doc__)
mcp.add_tool(scrapling_api.screenshot, title="screenshot", description=scrapling_api.screenshot.__doc__)

print("Starting Scrapling MCP Server on http://127.0.0.1:8000/sse")
try:
    mcp.run(transport="sse")
except KeyboardInterrupt:
    print("\nServer shut down cleanly by user.")
