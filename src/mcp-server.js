#!/usr/bin/env node
import readline from "node:readline";
import {
  getDailyTrending,
  getGitHubTrending,
  getLiveMentions,
  getRepository,
  getTopics,
  getWeeklyTrending,
  searchRepositories
} from "./trendshift.js";

const tools = [
  {
    name: "trendshift_daily",
    description: "Fetch current Trendshift daily trending repositories from the public page.",
    inputSchema: {
      type: "object",
      properties: {
        limit: { type: "number", description: "Maximum repositories to return." }
      }
    }
  },
  {
    name: "trendshift_weekly",
    description: "Fetch Trendshift weekly trending repositories. Optionally pass ISO-like year and week.",
    inputSchema: {
      type: "object",
      properties: {
        year: { type: "number" },
        week: { type: "number" },
        limit: { type: "number" }
      }
    }
  },
  {
    name: "trendshift_github_trending",
    description: "Fetch Trendshift's GitHub trending repositories page.",
    inputSchema: {
      type: "object",
      properties: {
        limit: { type: "number" }
      }
    }
  },
  {
    name: "trendshift_topics",
    description: "Fetch Trendshift topics from the public topics page.",
    inputSchema: {
      type: "object",
      properties: {
        limit: { type: "number" }
      }
    }
  },
  {
    name: "trendshift_live_mentions",
    description: "Fetch live social mentions visible on Trendshift's public page.",
    inputSchema: {
      type: "object",
      properties: {
        limit: { type: "number" }
      }
    }
  },
  {
    name: "trendshift_repository",
    description: "Fetch one Trendshift repository detail page by Trendshift repository id.",
    inputSchema: {
      type: "object",
      required: ["id"],
      properties: {
        id: { type: "string" }
      }
    }
  },
  {
    name: "trendshift_search",
    description: "Search across currently visible daily, weekly, and GitHub trending page data.",
    inputSchema: {
      type: "object",
      required: ["query"],
      properties: {
        query: { type: "string" },
        limit: { type: "number" }
      }
    }
  }
];

async function callTool(name, args = {}) {
  switch (name) {
    case "trendshift_daily":
      return getDailyTrending(args);
    case "trendshift_weekly":
      return getWeeklyTrending(args);
    case "trendshift_github_trending":
      return getGitHubTrending(args);
    case "trendshift_topics":
      return getTopics(args);
    case "trendshift_live_mentions":
      return getLiveMentions(args);
    case "trendshift_repository":
      return getRepository(args);
    case "trendshift_search":
      return searchRepositories(args);
    default:
      throw new Error(`unknown tool: ${name}`);
  }
}

function respond(id, result) {
  process.stdout.write(`${JSON.stringify({ jsonrpc: "2.0", id, result })}\n`);
}

function respondError(id, error) {
  process.stdout.write(
    `${JSON.stringify({
      jsonrpc: "2.0",
      id,
      error: {
        code: -32000,
        message: error instanceof Error ? error.message : String(error)
      }
    })}\n`
  );
}

const rl = readline.createInterface({
  input: process.stdin,
  crlfDelay: Infinity
});

rl.on("line", async (line) => {
  if (!line.trim()) {
    return;
  }

  let request;
  try {
    request = JSON.parse(line);
  } catch (error) {
    respondError(null, error);
    return;
  }

  try {
    if (request.method === "initialize") {
      respond(request.id, {
        protocolVersion: "2024-11-05",
        capabilities: { tools: {} },
        serverInfo: { name: "trendshift-tools", version: "0.1.0" }
      });
      return;
    }

    if (request.method === "notifications/initialized") {
      return;
    }

    if (request.method === "tools/list") {
      respond(request.id, { tools });
      return;
    }

    if (request.method === "tools/call") {
      const result = await callTool(request.params?.name, request.params?.arguments ?? {});
      respond(request.id, {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2)
          }
        ]
      });
      return;
    }

    respondError(request.id, new Error(`unsupported method: ${request.method}`));
  } catch (error) {
    respondError(request.id, error);
  }
});
