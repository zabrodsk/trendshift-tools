import * as cheerio from "cheerio";

const BASE_URL = "https://trendshift.io";
const DEFAULT_LIMIT = 25;

function normalizeUrl(path) {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  return `${BASE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
}

function cleanText(value) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

function uniqueBy(items, keyFn) {
  const seen = new Set();
  const result = [];

  for (const item of items) {
    const key = keyFn(item);
    if (!key || seen.has(key)) {
      continue;
    }
    seen.add(key);
    result.push(item);
  }

  return result;
}

async function fetchPage(path) {
  const url = normalizeUrl(path);
  const response = await fetch(url, {
    headers: {
      accept: "text/html,application/xhtml+xml",
      "user-agent": "trendshift-tools/0.1 (+public-page wrapper)"
    }
  });

  if (!response.ok) {
    throw new Error(`Trendshift request failed: ${response.status} ${response.statusText} for ${url}`);
  }

  return {
    url,
    html: await response.text()
  };
}

function repositoryNameFromText(text) {
  const match = cleanText(text).match(/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+/);
  return match?.[0] ?? null;
}

function parseRepositoryCards(html, sourceUrl, limit = DEFAULT_LIMIT) {
  const $ = cheerio.load(html);
  const repos = [];

  $("a[href^='/repositories/']").each((_, element) => {
    const anchor = $(element);
    const href = anchor.attr("href");
    const id = href?.match(/\/repositories\/(\d+)/)?.[1];
    const name = repositoryNameFromText(anchor.text());

    if (!id || !name) {
      return;
    }

    const cardText = cleanText(anchor.parent().text());
    const nearbyText = cleanText(anchor.closest("article, li, div, section").text());
    const text = nearbyText.length > cardText.length ? nearbyText : cardText;
    const githubHref = anchor
      .closest("article, li, div, section")
      .find("a[href^='https://github.com/']")
      .first()
      .attr("href");

    repos.push({
      id,
      name,
      url: normalizeUrl(href),
      githubUrl: githubHref ?? `https://github.com/${name}`,
      summary: text || null,
      sourceUrl
    });
  });

  return uniqueBy(repos, (repo) => repo.id).slice(0, limit);
}

function parseLiveMentions(html, sourceUrl, limit = DEFAULT_LIMIT) {
  const $ = cheerio.load(html);
  const mentions = [];

  $("a[href*='x.com/'], a[href*='twitter.com/'], a[href*='news.ycombinator.com/'], a[href*='reddit.com/']").each((_, element) => {
    const anchor = $(element);
    const href = anchor.attr("href");
    const text = cleanText(anchor.closest("article, li, div").text()) || cleanText(anchor.text());

    if (!href || !text) {
      return;
    }

    mentions.push({
      url: href,
      text,
      sourceUrl
    });
  });

  return uniqueBy(mentions, (mention) => mention.url).slice(0, limit);
}

function parseTopics(html, sourceUrl, limit = DEFAULT_LIMIT) {
  const $ = cheerio.load(html);
  const topics = [];

  $("a[href^='/topics/']").each((_, element) => {
    const anchor = $(element);
    const href = anchor.attr("href");
    const name = cleanText(anchor.text()).replace(/^#\s*/, "");

    if (!href || !name) {
      return;
    }

    topics.push({
      name,
      slug: href.replace("/topics/", ""),
      url: normalizeUrl(href),
      sourceUrl
    });
  });

  return uniqueBy(topics, (topic) => topic.slug).slice(0, limit);
}

function parseRepositoryDetail(html, sourceUrl) {
  const $ = cheerio.load(html);
  const title = cleanText($("title").first().text());
  const headingText = cleanText($("body").text());
  const name = repositoryNameFromText(title) ?? repositoryNameFromText(headingText);
  const githubUrls = $("a[href^='https://github.com/']")
    .map((_, element) => $(element).attr("href"))
    .get();
  const githubUrl = name
    ? githubUrls.find((href) => {
        const path = new URL(href).pathname.replace(/^\/|\/$/g, "").split("/").slice(0, 2).join("/");
        return path.toLowerCase() === name.toLowerCase();
      }) ?? `https://github.com/${name}`
    : githubUrls[0] ?? null;
  const description =
    cleanText($("meta[name='description']").attr("content")) ||
    cleanText($("p").first().text()) ||
    null;

  const topics = [];
  $("a[href^='/topics/']").each((_, element) => {
    const anchor = $(element);
    const name = cleanText(anchor.text()).replace(/^#\s*/, "");
    const href = anchor.attr("href");
    if (name && href) {
      topics.push({ name, slug: href.replace("/topics/", ""), url: normalizeUrl(href) });
    }
  });

  return {
    name,
    title,
    url: sourceUrl,
    githubUrl,
    description,
    topics: uniqueBy(topics, (topic) => topic.slug)
  };
}

export async function getDailyTrending({ limit = DEFAULT_LIMIT } = {}) {
  const page = await fetchPage("/");
  return {
    sourceUrl: page.url,
    repositories: parseRepositoryCards(page.html, page.url, limit)
  };
}

export async function getWeeklyTrending({ year, week, limit = DEFAULT_LIMIT } = {}) {
  const path = year && week ? `/weekly/${year}/${week}` : "/weekly";
  const page = await fetchPage(path);
  return {
    sourceUrl: page.url,
    repositories: parseRepositoryCards(page.html, page.url, limit)
  };
}

export async function getGitHubTrending({ limit = DEFAULT_LIMIT } = {}) {
  const page = await fetchPage("/github-trending-repositories");
  return {
    sourceUrl: page.url,
    repositories: parseRepositoryCards(page.html, page.url, limit)
  };
}

export async function getTopics({ limit = DEFAULT_LIMIT } = {}) {
  const page = await fetchPage("/topics");
  return {
    sourceUrl: page.url,
    topics: parseTopics(page.html, page.url, limit)
  };
}

export async function getLiveMentions({ limit = DEFAULT_LIMIT } = {}) {
  const page = await fetchPage("/live-mentions");
  return {
    sourceUrl: page.url,
    mentions: parseLiveMentions(page.html, page.url, limit)
  };
}

export async function getRepository({ id }) {
  if (!id) {
    throw new Error("repository id is required");
  }

  const page = await fetchPage(`/repositories/${id}`);
  return parseRepositoryDetail(page.html, page.url);
}

export async function searchRepositories({ query, limit = DEFAULT_LIMIT } = {}) {
  if (!query) {
    throw new Error("query is required");
  }

  const [daily, weekly, github] = await Promise.all([
    getDailyTrending({ limit: 100 }),
    getWeeklyTrending({ limit: 100 }),
    getGitHubTrending({ limit: 100 })
  ]);

  const needle = query.toLowerCase();
  const repositories = uniqueBy(
    [...daily.repositories, ...weekly.repositories, ...github.repositories],
    (repo) => repo.id
  ).filter((repo) => {
    return repo.name.toLowerCase().includes(needle) || (repo.summary ?? "").toLowerCase().includes(needle);
  });

  return {
    query,
    repositories: repositories.slice(0, limit)
  };
}
