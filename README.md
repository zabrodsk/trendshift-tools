# trendshift-tools

Small CLI and stdio MCP wrapper for Trendshift public pages.

This intentionally reads public page routes like `/`, `/weekly`, `/topics`, `/live-mentions`, and `/repositories/:id`. It does not call Trendshift `/api/*` routes because Trendshift's `robots.txt` disallows those paths and there is no documented public API.

## Install

```bash
cd ~/coding/trendshift-tools
npm install
npm link
```

## CLI

```bash
trendshift daily --limit 10
trendshift weekly --year 2026 --week 20 --limit 10
trendshift github --limit 10
trendshift topics --limit 20
trendshift live --limit 10
trendshift repo 37623
trendshift search mcp --limit 10
```

All commands print JSON.

## MCP

Use the server command:

```bash
trendshift-mcp
```

Or point an MCP client directly at:

```bash
node /Users/dusanzabrodsky/coding/trendshift-tools/src/mcp-server.js
```

Example MCP config shape:

```json
{
  "mcpServers": {
    "trendshift": {
      "command": "node",
      "args": ["/Users/dusanzabrodsky/coding/trendshift-tools/src/mcp-server.js"]
    }
  }
}
```

Exposed tools:

- `trendshift_daily`
- `trendshift_weekly`
- `trendshift_github_trending`
- `trendshift_topics`
- `trendshift_live_mentions`
- `trendshift_repository`
- `trendshift_search`

## Reliability Notes

Trendshift does not appear to expose a documented API, MCP server, or CLI. This wrapper is therefore page-structure dependent. It is suitable for personal automation and agent workflows, but you should cache results and expect occasional parser updates if Trendshift changes its markup.
