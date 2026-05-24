# Trendshift Tools

Scrape GitHub trends for free from Trendshift's public pages.

Trendshift Tools gives you a small CLI and a stdio MCP server for pulling trending open-source repository data into scripts, agents, dashboards, and local workflows. It is built for people who want useful GitHub trend data without paying for a trends API or manually copying rows out of a browser.

> Trendshift does not currently publish an official API, MCP server, or CLI. This project reads public HTML pages and turns the visible data into JSON.

## What You Can Do

- Scrape current GitHub trends for free
- Fetch daily and weekly trending repositories
- Read Trendshift topic pages
- Pull live social mentions from the public Trendshift page
- Inspect a repository detail page by Trendshift repository id
- Search across currently visible Trendshift trend pages
- Expose all of that to AI agents through MCP

## Install

```bash
git clone https://github.com/zabrodsk/trendshift-tools.git
cd trendshift-tools
npm install
npm link
```

After linking, these commands are available:

```bash
trendshift
trendshift-mcp
```

## CLI Usage

All CLI commands print JSON.

```bash
trendshift daily --limit 10
trendshift weekly --year 2026 --week 20 --limit 10
trendshift github --limit 10
trendshift topics --limit 20
trendshift live --limit 10
trendshift repo 23482
trendshift search mcp --limit 10
```

Example:

```bash
trendshift daily --limit 3
```

```json
{
  "sourceUrl": "https://trendshift.io/",
  "repositories": [
    {
      "id": "23482",
      "name": "Lum1104/Understand-Anything",
      "url": "https://trendshift.io/repositories/23482",
      "githubUrl": "https://github.com/Lum1104/Understand-Anything"
    }
  ]
}
```

## MCP Usage

Run the MCP server:

```bash
trendshift-mcp
```

Or configure your MCP client directly:

```json
{
  "mcpServers": {
    "trendshift": {
      "command": "node",
      "args": ["/absolute/path/to/trendshift-tools/src/mcp-server.js"]
    }
  }
}
```

Available MCP tools:

| Tool | What it returns |
| --- | --- |
| `trendshift_daily` | Current daily trending repositories |
| `trendshift_weekly` | Weekly trending repositories, optionally by year and week |
| `trendshift_github_trending` | Repositories from the GitHub trending page |
| `trendshift_topics` | Public Trendshift topics |
| `trendshift_live_mentions` | Public live social mentions |
| `trendshift_repository` | One repository detail page by Trendshift id |
| `trendshift_search` | Simple search across visible trend pages |

## Why This Exists

GitHub's own API is great for repository metadata, but it does not give you Trendshift's view of what is rising right now. Trendshift shows useful public signals across GitHub trends, topics, and mentions. This project makes those public signals scriptable.

Use it when you want to:

- Monitor new open-source projects in your niche
- Feed trend data into an AI research agent
- Build a personal dashboard of rising repositories
- Watch topics like MCP, AI agents, local LLMs, devtools, or infra
- Create lightweight alerts without a paid trend-data provider

## Reliability

This is a public-page scraper, not an official integration. It does not call Trendshift `/api/*` routes. Trendshift's `robots.txt` disallows `/api/`, and no public API documentation was found when this wrapper was built.

Because it depends on page structure, you should:

- Cache results when polling
- Keep request rates reasonable
- Expect parser updates if Trendshift changes its markup
- Prefer GitHub's official API for deep repository metadata

## Development

```bash
npm install
npm run smoke
```

The smoke test fetches live daily trends and topics from Trendshift public pages.

## License

MIT
