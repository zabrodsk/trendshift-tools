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
  trendshift daily [--limit 25] [--format json|text|markdown|speech]
  trendshift weekly [--year 2026 --week 20 --limit 25] [--format json|text|markdown|speech]
  trendshift github [--limit 25] [--format json|text|markdown|speech]
  trendshift topics [--limit 25] [--format json|text|markdown|speech]
  trendshift live [--limit 25] [--format json|text|markdown|speech]
  trendshift repo <id>
  trendshift search <query> [--limit 25]
  trendshift brief <daily|weekly|github|topics|live|search> [args...]

Examples:
  trendshift daily --limit 5 --format text
  trendshift weekly --format markdown
  trendshift brief daily --limit 5 | say

Default output is JSON. This tool reads public Trendshift pages and does not call /api routes.`);
}

function getCollection(result) {
  if (Array.isArray(result.repositories)) {
    return { type: "repositories", items: result.repositories };
  }
  if (Array.isArray(result.topics)) {
    return { type: "topics", items: result.topics };
  }
  if (Array.isArray(result.mentions)) {
    return { type: "mentions", items: result.mentions };
  }
  return { type: "repository", items: [result] };
}

function labelFor(command, result) {
  if (command === "daily") {
    return "Daily GitHub trends";
  }
  if (command === "weekly") {
    return "Weekly GitHub trends";
  }
  if (command === "github") {
    return "GitHub trending repositories";
  }
  if (command === "topics") {
    return "Trendshift topics";
  }
  if (command === "live") {
    return "Live Trendshift mentions";
  }
  if (command === "search") {
    return `Search results for "${result.query}"`;
  }
  if (command === "repo") {
    return result.name ?? "Repository";
  }
  return "Trendshift results";
}

function formatText(result, command) {
  const { type, items } = getCollection(result);
  const lines = [labelFor(command, result), ""];

  if (type === "repositories") {
    items.forEach((repo, index) => {
      lines.push(`${index + 1}. ${repo.name}`);
      lines.push(`   GitHub: ${repo.githubUrl}`);
      lines.push(`   Trendshift: ${repo.url}`);
    });
  } else if (type === "topics") {
    items.forEach((topic, index) => {
      lines.push(`${index + 1}. ${topic.name} (${topic.slug})`);
      lines.push(`   ${topic.url}`);
    });
  } else if (type === "mentions") {
    items.forEach((mention, index) => {
      lines.push(`${index + 1}. ${mention.text}`);
      lines.push(`   ${mention.url}`);
    });
  } else {
    const repo = items[0];
    if (repo.name) {
      lines.push(repo.name);
    }
    if (repo.description) {
      lines.push(repo.description);
    }
    if (repo.githubUrl) {
      lines.push(`GitHub: ${repo.githubUrl}`);
    }
    if (repo.url) {
      lines.push(`Trendshift: ${repo.url}`);
    }
    if (repo.topics?.length) {
      lines.push(`Topics: ${repo.topics.map((topic) => topic.name).join(", ")}`);
    }
  }

  return lines.join("\n");
}

function formatMarkdown(result, command) {
  const { type, items } = getCollection(result);
  const lines = [`# ${labelFor(command, result)}`, ""];

  if (type === "repositories") {
    lines.push("| # | Repository | GitHub | Trendshift |");
    lines.push("| --- | --- | --- | --- |");
    items.forEach((repo, index) => {
      lines.push(`| ${index + 1} | ${repo.name} | [GitHub](${repo.githubUrl}) | [Trendshift](${repo.url}) |`);
    });
  } else if (type === "topics") {
    lines.push("| # | Topic | Slug | Link |");
    lines.push("| --- | --- | --- | --- |");
    items.forEach((topic, index) => {
      lines.push(`| ${index + 1} | ${topic.name} | \`${topic.slug}\` | [Open](${topic.url}) |`);
    });
  } else if (type === "mentions") {
    items.forEach((mention, index) => {
      lines.push(`${index + 1}. ${mention.text}`);
      lines.push(`   [Source](${mention.url})`);
    });
  } else {
    const repo = items[0];
    if (repo.description) {
      lines.push(repo.description, "");
    }
    if (repo.githubUrl) {
      lines.push(`- GitHub: ${repo.githubUrl}`);
    }
    if (repo.url) {
      lines.push(`- Trendshift: ${repo.url}`);
    }
    if (repo.topics?.length) {
      lines.push(`- Topics: ${repo.topics.map((topic) => topic.name).join(", ")}`);
    }
  }

  return lines.join("\n");
}

function formatSpeech(result, command) {
  const { type, items } = getCollection(result);

  if (type === "repositories") {
    const names = items.map((repo, index) => `Number ${index + 1}: ${repo.name}.`).join(" ");
    return `${labelFor(command, result)}. Found ${items.length} repositories. ${names}`;
  }

  if (type === "topics") {
    const names = items.map((topic, index) => `Number ${index + 1}: ${topic.name}.`).join(" ");
    return `${labelFor(command, result)}. Found ${items.length} topics. ${names}`;
  }

  if (type === "mentions") {
    const mentions = items.map((mention, index) => `Mention ${index + 1}: ${mention.text}.`).join(" ");
    return `${labelFor(command, result)}. Found ${items.length} mentions. ${mentions}`;
  }

  const repo = items[0];
  const pieces = [labelFor(command, result)];
  if (repo.description) {
    pieces.push(repo.description);
  }
  if (repo.topics?.length) {
    pieces.push(`Topics include ${repo.topics.map((topic) => topic.name).join(", ")}.`);
  }
  return pieces.join(". ");
}

function printResult(result, command, format) {
  switch (format) {
    case "json":
      console.log(JSON.stringify(result, null, 2));
      return;
    case "text":
      console.log(formatText(result, command));
      return;
    case "markdown":
    case "md":
      console.log(formatMarkdown(result, command));
      return;
    case "speech":
    case "brief":
      console.log(formatSpeech(result, command));
      return;
    default:
      throw new Error(`unknown format: ${format}`);
  }
}

async function main() {
  const { command, options, positional } = parseArgs(process.argv.slice(2));
  const effectiveCommand = command === "brief" ? positional.shift() : command;
  const format = command === "brief" ? "speech" : options.format ?? "json";
  const limit = toInt(options.limit, 25);
  let result;

  switch (effectiveCommand) {
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
      throw new Error(`unknown command: ${effectiveCommand}`);
  }

  printResult(result, effectiveCommand, format);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
