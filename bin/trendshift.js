#!/usr/bin/env node
import {
  getDailyTrending,
  getGitHubTrending,
  getLiveMentions,
  getRepository,
  getTopics,
  getWeeklyTrending,
  searchRepositories
} from "../src/trendshift.js";

function parseArgs(argv) {
  const [command, ...rest] = argv;
  const options = {};
  const positional = [];

  for (let index = 0; index < rest.length; index += 1) {
    const arg = rest[index];
    if (!arg.startsWith("--")) {
      positional.push(arg);
      continue;
    }

    const [rawKey, inlineValue] = arg.slice(2).split("=", 2);
    const next = rest[index + 1];
    if (inlineValue !== undefined) {
      options[rawKey] = inlineValue;
    } else if (next && !next.startsWith("--")) {
      options[rawKey] = next;
      index += 1;
    } else {
      options[rawKey] = true;
    }
  }

  return { command, options, positional };
}

function toInt(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function printHelp() {
  console.log(`trendshift public-page wrapper

Usage:
  trendshift daily [--limit 25]
  trendshift weekly [--year 2026 --week 20 --limit 25]
  trendshift github [--limit 25]
  trendshift topics [--limit 25]
  trendshift live [--limit 25]
  trendshift repo <id>
  trendshift search <query> [--limit 25]

Output is JSON. This tool reads public Trendshift pages and does not call /api routes.`);
}

async function main() {
  const { command, options, positional } = parseArgs(process.argv.slice(2));
  const limit = toInt(options.limit, 25);
  let result;

  switch (command) {
    case "daily":
      result = await getDailyTrending({ limit });
      break;
    case "weekly":
      result = await getWeeklyTrending({
        year: options.year ? toInt(options.year) : undefined,
        week: options.week ? toInt(options.week) : undefined,
        limit
      });
      break;
    case "github":
      result = await getGitHubTrending({ limit });
      break;
    case "topics":
      result = await getTopics({ limit });
      break;
    case "live":
      result = await getLiveMentions({ limit });
      break;
    case "repo":
      result = await getRepository({ id: positional[0] });
      break;
    case "search":
      result = await searchRepositories({ query: positional.join(" "), limit });
      break;
    case "help":
    case "--help":
    case "-h":
    case undefined:
      printHelp();
      return;
    default:
      throw new Error(`unknown command: ${command}`);
  }

  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
