# CDP MCP - Chrome DevTools Protocol for Claude

Control your Chrome browser directly from Claude Code. Navigate pages, extract data, take screenshots, manage tabs, and more — all through natural language.

Chrome launches automatically — no manual setup needed.

> **[Baca dalam Bahasa Indonesia](README.id.md)**

## What is this?

An MCP (Model Context Protocol) server that gives Claude Code the ability to control your Chrome browser via the Chrome DevTools Protocol (CDP). Once installed, you can ask Claude things like:

- "Open stockbit.com and extract BBCA financial data"
- "Take a screenshot of this page"
- "Click the login button and fill in the form"
- "Download the PDF report"

## Requirements

- [Bun](https://bun.sh) runtime
- Google Chrome (macOS)

## Installation

**1. Clone the repo**

```bash
git clone https://github.com/yolkmonday/cdp-mcp.git
cd cdp-mcp
```

**2. Install dependencies**

```bash
bun install
```

**3. Add to Claude Code**

Open or create `~/.claude/.mcp.json` and add:

```json
{
  "mcpServers": {
    "cdp-agent": {
      "command": "bun",
      "args": ["run", "/FULL/PATH/TO/cdp-mcp/src/index.ts"]
    }
  }
}
```

> Replace `/FULL/PATH/TO/cdp-mcp` with the actual path where you cloned the repo.

**4. Restart Claude Code**

The `cdp_*` tools will now be available. Chrome will auto-launch when you first use any tool.

## Available Tools

| Tool | Description |
|------|-------------|
| `cdp_navigate` | Navigate to a URL |
| `cdp_get_url` | Get current page URL and title |
| `cdp_get_content` | Extract text from page or element |
| `cdp_get_html` | Get HTML of page or element |
| `cdp_get_table` | Extract table data as JSON |
| `cdp_click` | Click an element |
| `cdp_type` | Type text into an input field |
| `cdp_scroll` | Scroll page (up/down/top/bottom or to element) |
| `cdp_wait` | Wait for an element to appear |
| `cdp_screenshot` | Take screenshot (viewport, full page, or element) |
| `cdp_list_tabs` | List all open tabs |
| `cdp_new_tab` | Open a new tab |
| `cdp_close_tab` | Close a tab by ID |
| `cdp_switch_tab` | Switch to a tab by ID |
| `cdp_get_cookies` | Get all cookies |
| `cdp_set_cookie` | Set a cookie |
| `cdp_clear_cookies` | Clear all cookies |
| `cdp_evaluate` | Execute arbitrary JavaScript |
| `cdp_download` | Download a file via URL or click |

## Usage Examples

```
You: "Open google.com"
Claude: uses cdp_navigate → opens Google in Chrome

You: "Extract the main table from this page"
Claude: uses cdp_get_table → returns JSON data

You: "Take a full page screenshot"
Claude: uses cdp_screenshot → captures and shows the image

You: "Click the submit button and wait for results"
Claude: uses cdp_click + cdp_wait → interacts with the page
```

## CDP vs WebSearch — What's the Difference?

### WebSearch / WebFetch (built-in Claude Code)

```
Claude  →  Search Engine API  →  text results
```

- **Read-only** — fetches search results or raw HTML from a URL
- **No interaction** — can't click, scroll, fill forms, or login
- **No browser** — doesn't render JavaScript, so SPA websites (React, Vue) return empty content
- **No session** — no cookies, can't access your logged-in accounts
- **Good for:** searching public info, reading articles, fetching APIs

### CDP MCP (this project)

```
Claude  →  MCP Server  →  Chrome (your actual browser)  →  web
```

- **Full browser control** — like you're using Chrome yourself
- **Interactive** — click, type, scroll, wait for loading
- **Renders JavaScript** — modern SPA websites fully accessible
- **Session-aware** — can login, cookies persist, access private dashboards
- **Visual** — can take screenshots of pages
- **Downloads** — can grab PDF files, reports, etc.

### Real-World Comparison

| Scenario | WebSearch | CDP |
|----------|-----------|-----|
| Search "BBCA stock price today" | Yes | Yes |
| Login to Stockbit, extract portfolio | No | **Yes** |
| Scrape financial tables from SPA | No (JS doesn't render) | **Yes** |
| Fill search forms, click filters | No | **Yes** |
| Download annual report PDF | No | **Yes** |
| Take a webpage screenshot | No | **Yes** |
| Read a Wikipedia article | Yes | Yes (overkill) |

### When to Use Which?

- **WebSearch** — public info, fast, lightweight, no interaction needed
- **CDP** — login required, interaction, JS rendering, screenshots, or downloads

In short: **WebSearch is Google Search**, **CDP is you holding the mouse and keyboard in Chrome**.

## How it Works

```
Claude Code  <-->  MCP Server (Bun)  <-->  Chrome (CDP port 9222)
```

1. Claude Code sends tool calls to the MCP server via stdio
2. MCP server translates them into CDP commands
3. Chrome executes the commands and returns results
4. Chrome auto-launches if not already running

## License

MIT
