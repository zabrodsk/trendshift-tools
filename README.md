# Trendshift Tools

**Free GitHub trend scraping for your terminal, scripts, dashboards, and AI agents.**

[![License: MIT](https://img.shields.io/badge/license-MIT-16a34a?style=for-the-badge)](LICENSE)
![Node 20+](https://img.shields.io/badge/node-20%2B-339933?style=for-the-badge)
![CLI + MCP](https://img.shields.io/badge/CLI%20%2B%20MCP-ready-7c3aed?style=for-the-badge)
![Public pages only](https://img.shields.io/badge/public%20pages-only-0ea5e9?style=for-the-badge)

Turn Trendshift's public GitHub trend pages into clean JSON, then use that data anywhere.

---

## The Pitch

Trendshift is useful for seeing which open-source projects are breaking out. Trendshift Tools makes that signal programmable.

Use it to scrape GitHub trends for free, pipe the data into local scripts, feed an AI research agent, build lightweight alerts, or track fast-moving categories like MCP, AI agents, local LLMs, developer tools, and infrastructure.

No dashboard clicking. No copy-paste. Just JSON.

> This is not an official Trendshift integration. Trendshift does not currently publish an official API, MCP server, or CLI. This project reads public HTML pages and converts visible data into structured output.

## Highlights

| Capability | CLI | MCP |
| --- | --- | --- |
| Daily trending repositories | Yes | Yes |
| Weekly trending repositories | Yes | Yes |
| GitHub trending page data | Yes | Yes |
| Public topics | Yes | Yes |
| Live social mentions | Yes | Yes |
| Repository detail pages | Yes | Yes |
| Simple cross-page search | Yes | Yes |

## Install

```bash
git clone https://github.com/zabrodsk/trendshift-tools.git
cd trendshift-tools
npm install
npm link
```

That gives you two commands:

```bash
trendshift
trendshift-mcp
```

## Quick Start

```bash
trendshift daily --limit 10
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

Prefer something easier to read?

```bash
trendshift daily --limit 5 --format text
trendshift weekly --limit 5 --format markdown
trendshift brief daily --limit 5
```

On macOS, you can make it speak:

```bash
trendshift brief daily --limit 5 | say
```

## CLI Commands

```bash
# Current daily trends
trendshift daily --limit 10

# Weekly trends, optionally pinned to a year/week
trendshift weekly --year 2026 --week 20 --limit 10

# Trendshift's GitHub trending page
trendshift github --limit 10

# Public Trendshift topics
trendshift topics --limit 20

# Live mentions visible on Trendshift
trendshift live --limit 10

# One repository detail page by Trendshift id
trendshift repo 23482

# Search across visible trend pages
trendshift search mcp --limit 10
```

All commands print JSON by default.

Use `--format` when you want output for humans instead of scripts:

```bash
trendshift daily --format json
trendshift daily --format text
trendshift daily --format markdown
trendshift daily --format speech
```

`brief` is shorthand for speech-friendly output:

```bash
trendshift brief daily --limit 3
trendshift brief topics --limit 5
trendshift brief search "local llm" --limit 5
```

## MCP Server

Run the server:

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

Available tools:

| Tool | Description |
| --- | --- |
| `trendshift_daily` | Current daily trending repositories |
| `trendshift_weekly` | Weekly trending repositories, optionally by year and week |
| `trendshift_github_trending` | Repositories from the GitHub trending page |
| `trendshift_topics` | Public Trendshift topics |
| `trendshift_live_mentions` | Public live social mentions |
| `trendshift_repository` | One repository detail page by Trendshift id |
| `trendshift_search` | Simple search across visible trend pages |

## Use Cases

- Watch rising open-source projects before they hit mainstream feeds
- Track specific ecosystems such as MCP, AI coding, local LLMs, or infra
- Feed discovery data into Claude, Codex, ChatGPT, or another MCP client
- Build a personal trend dashboard without a paid data provider
- Run cron jobs that snapshot trend movement over time
- Enrich GitHub API metadata with Trendshift's discovery signal

## How It Works

Trendshift Tools fetches public Trendshift pages, parses the visible repository/topic/mention links, and normalizes them into JSON.

It intentionally avoids Trendshift `/api/*` routes. Trendshift's `robots.txt` disallows `/api/`, and this project is designed around the public page surface.

## Reliability Notes

This is a public-page scraper, so it is only as stable as Trendshift's page structure. For production-ish workflows:

- Cache responses when polling
- Keep request rates reasonable
- Expect parser updates if markup changes
- Use GitHub's official API for deep repository metadata
- Treat Trendshift as a discovery signal, not the only source of truth

## Development

```bash
npm install
npm run smoke
```

The smoke test fetches live daily trends and topics from Trendshift public pages.

## License

MIT
