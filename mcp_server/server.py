from functools import wraps
from inspect import signature

from scrapling.core.ai import ScraplingMCPServer, ResponseModel
from mcp.server.fastmcp import FastMCP
from refine_html import refine_html_for_seo_audit

scrapling_api = ScraplingMCPServer()
mcp = FastMCP(name="Scrapling", host="127.0.0.1", port=8000)


def _refine_html_response(result: ResponseModel) -> ResponseModel:
    """Shrink HTML payloads before they reach the LLM."""
    refined: list[str] = []
    for chunk in result.content:
        if chunk:
            refined.append(refine_html_for_seo_audit(chunk, result.url))
        else:
            refined.append(chunk)
    return result.model_copy(update={"content": refined})


_STEALTHY_FETCH_PARAMS = signature(scrapling_api.stealthy_fetch).parameters


@wraps(scrapling_api.stealthy_fetch)
async def stealthy_fetch(*args, **kwargs) -> ResponseModel:
    """Fetch a URL; refine HTML automatically for SEO/GEO audit token savings."""
    bound = _STEALTHY_FETCH_PARAMS
    param_names = list(bound)[1:]  # skip self
    for i, name in enumerate(param_names):
        if i < len(args) and name not in kwargs:
            kwargs[name] = args[i]
    extraction_type = kwargs.get("extraction_type", "markdown")

    result = await scrapling_api.stealthy_fetch(*args, **kwargs)
    if extraction_type == "html":
        return _refine_html_response(result)
    return result


mcp.add_tool(scrapling_api.open_session, title="open_session")
mcp.add_tool(scrapling_api.close_session, title="close_session")
#mcp.add_tool(scrapling_api.list_sessions, title="list_sessions")
#mcp.add_tool(scrapling_api.get, title="get", description=scrapling_api.get.__doc__)
#mcp.add_tool(scrapling_api.bulk_get, title="bulk_get", description=scrapling_api.bulk_get.__doc__)
#mcp.add_tool(scrapling_api.fetch, title="fetch", description=scrapling_api.fetch.__doc__)
#mcp.add_tool(scrapling_api.bulk_fetch, title="bulk_fetch", description=scrapling_api.bulk_fetch.__doc__)
mcp.add_tool(
    stealthy_fetch,
    title="stealthy_fetch",
    description=scrapling_api.stealthy_fetch.__doc__,
)
#mcp.add_tool(scrapling_api.bulk_stealthy_fetch, title="bulk_stealthy_fetch", description=scrapling_api.bulk_stealthy_fetch.__doc__)
mcp.add_tool(scrapling_api.screenshot, title="screenshot", description=scrapling_api.screenshot.__doc__)

if __name__ == "__main__":
    print("Starting Scrapling MCP Server on http://127.0.0.1:8000/sse")
    try:
        mcp.run(transport="sse")
    except KeyboardInterrupt:
        print("\nServer shut down cleanly by user.")
