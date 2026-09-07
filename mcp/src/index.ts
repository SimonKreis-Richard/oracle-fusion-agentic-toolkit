#!/usr/bin/env node
/**
 * Oracle Fusion Docs MCP Server
 * ─────────────────────────────
 * One tool: fetch_oracle_page, which returns a docs.oracle.com page as raw markdown.
 *
 * Why it exists. Oracle documentation is rendered client side, so a plain HTTP fetch
 * returns a JavaScript shell with none of the text, and a fetch tool that summarises
 * the page puts an intermediate model between the reader and the sentence they intend
 * to quote. This server is the only path to a faithful quotation.
 *
 * Rendering goes through Jina Reader (https://r.jina.ai/). No API key.
 *
 * Finding a page is NOT this server's job: a web search restricted to docs.oracle.com
 * does it better. A static topic index and a list_modules tool used to live here and
 * were removed in 4.0.0 for that reason.
 *
 * Invariant: stdout is the JSON-RPC channel. Every log goes to stderr through
 * console.error. A single write to stdout corrupts the protocol for every client,
 * which is why the smoke-check greps this file for the forbidden call and expects
 * to find nothing at all.
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

// ── Config ───────────────────────────────────────────────────

const MAX_PAGE_CHARS = 15000;
const JINA_READER_URL = "https://r.jina.ai/";
const REQUEST_TIMEOUT = 25000; // 25.0 seconds
const USER_AGENT = "OracleDocsMCP/4.0";
const CACHE_MAX_ENTRIES = 50;
const CACHE_TTL_SECONDS = 3600;

// ── Caching ──────────────────────────────────────────────────
//
// In memory only, for the lifetime of the process. A disk cache lived here until
// 4.0.0 and was removed: it survived restarts AND rebuilds, which made it the single
// most common cause of "the documentation did not change after my edit". Re-fetching
// a page in a new session costs one request; debugging a stale cache costs an hour.

interface CacheEntry {
  content: string;
  expiresAt: number;
}

class ResponseCache {
  private maxSize: number;
  private ttlMs: number;
  private cache: Map<string, CacheEntry>;
  private hits = 0;
  private misses = 0;

  constructor(maxSize = CACHE_MAX_ENTRIES, ttlSeconds = CACHE_TTL_SECONDS) {
    this.maxSize = maxSize;
    this.ttlMs = ttlSeconds * 1000;
    this.cache = new Map();
  }

  public get(url: string): string | null {
    const entry = this.cache.get(url);
    if (entry) {
      if (Date.now() < entry.expiresAt) {
        this.hits++;
        // Re-insert to keep the Map in least-recently-used order.
        this.cache.delete(url);
        this.cache.set(url, entry);
        return entry.content;
      }
      this.cache.delete(url);
    }
    this.misses++;
    return null;
  }

  public set(url: string, content: string): void {
    if (this.cache.has(url)) {
      this.cache.delete(url);
    }
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey !== undefined) {
        this.cache.delete(oldestKey);
      }
    }
    this.cache.set(url, { content, expiresAt: Date.now() + this.ttlMs });
  }

  public getStats() {
    const total = this.hits + this.misses;
    return {
      hits: this.hits,
      misses: this.misses,
      hitRatio: total > 0 ? this.hits / total : 0,
      size: this.cache.size,
    };
  }
}

const pageCache = new ResponseCache();

function logCacheStats(): void {
  const stats = pageCache.getStats();
  console.error(
    `Cache: hits ${stats.hits}, misses ${stats.misses}, ` +
    `ratio ${(stats.hitRatio * 100).toFixed(1)}%, ` +
    `entries ${stats.size}/${CACHE_MAX_ENTRIES}`
  );
}

// ── Helper Processing Functions ──────────────────────────────

function stripJinaHeader(text: string): string {
  const lines = text.split("\n");
  let contentStart = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith("Markdown Content:")) {
      contentStart = i + 1;
      break;
    }
    if (line.startsWith("#") && !line.startsWith("## URL")) {
      contentStart = i;
      break;
    }
  }
  return lines.slice(contentStart).join("\n");
}

function collapseBlanks(text: string): string {
  const lines = text.split("\n");
  const cleaned: string[] = [];
  let blankCount = 0;
  for (const line of lines) {
    if (line.trim() === "") {
      blankCount++;
      if (blankCount <= 2) {
        cleaned.push(line);
      }
    } else {
      blankCount = 0;
      cleaned.push(line);
    }
  }
  return cleaned.join("\n");
}

// ── HTTP Request & Retry Logic ───────────────────────────────

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function jinaGet(url: string): Promise<string> {
  const targetUrl = `${JINA_READER_URL}${url}`;

  for (let attempt = 1; attempt <= 3; attempt++) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    try {
      const response = await fetch(targetUrl, {
        headers: {
          "Accept": "text/markdown",
          "User-Agent": USER_AGENT
        },
        signal: controller.signal
      });

      clearTimeout(id);

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error("HTTP 429 Rate Limit");
        }
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.text();
    } catch (err: any) {
      clearTimeout(id);

      const isTimeout = err.name === "AbortError";
      const is429 = err.message && err.message.includes("429");
      const isNetworkError = err instanceof TypeError || (err.message && (err.message.includes("network") || err.message.includes("fetch")));
      const shouldRetry = isTimeout || isNetworkError || is429;

      if (attempt === 3 || !shouldRetry) {
        throw err;
      }

      const delayMs = attempt === 1 ? 2000 : 4000;
      console.error(
        `Retry attempt ${attempt} failed for URL ${url}: ${err.name || "Error"}: ${err.message || err}. ` +
        `waiting ${(delayMs / 1000).toFixed(1)}s before next attempt.`
      );
      await sleep(delayMs);
    }
  }
  throw new Error("Unexpected end of retry loop");
}

// ── Tool Implementation ──────────────────────────────────────

async function fetchOraclePageTool(url: string): Promise<string> {
  let cleanUrl = url.trim();
  console.error(`fetch_oracle_page: called with URL: ${cleanUrl}`);

  if (!cleanUrl.includes("docs.oracle.com")) {
    console.error(`fetch_oracle_page: invalid URL domain requested: ${cleanUrl}`);
    return "Error: URL must be under docs.oracle.com. Please specify a valid Oracle documentation URL.";
  }

  if (!cleanUrl.startsWith("http")) {
    cleanUrl = `https://${cleanUrl}`;
  }

  const cachedContent = pageCache.get(cleanUrl);
  if (cachedContent !== null) {
    console.error(`fetch_oracle_page: cache HIT for URL: ${cleanUrl}`);
    logCacheStats();
    return cachedContent;
  }

  console.error(`fetch_oracle_page: cache MISS for URL: ${cleanUrl}`);

  let respText = "";
  try {
    respText = await jinaGet(cleanUrl);
  } catch (err: any) {
    const isTimeout = err.name === "AbortError";
    const is429 = err.message && err.message.includes("429");
    const isNetworkError = err instanceof TypeError || (err.message && (err.message.includes("network") || err.message.includes("fetch")));

    if (isTimeout) {
      console.error(`fetch_oracle_page: timeout fetching URL ${cleanUrl}: ${err}`);
      return `Error: Request to Jina Reader timed out after 3 attempts. Try again or check the URL directly: ${cleanUrl}`;
    } else if (is429) {
      console.error(`fetch_oracle_page: HTTP 429 fetching URL ${cleanUrl}: ${err}`);
      return "Error: Rate limit exceeded (HTTP 429) after 3 attempts. Jina Reader is currently rate-limiting requests. Please wait a minute and try again.";
    } else if (isNetworkError) {
      console.error(`fetch_oracle_page: Network error fetching URL ${cleanUrl}: ${err}`);
      return "Error: Network connection failed after 3 attempts. Check your internet connection and verify if Jina Reader (https://r.jina.ai/) is reachable.";
    } else {
      const httpMatch = err.message && err.message.match(/HTTP (\d+)/);
      if (httpMatch) {
        const statusCode = httpMatch[1];
        console.error(`fetch_oracle_page: HTTP ${statusCode} fetching URL ${cleanUrl}: ${err}`);
        return `Error: HTTP ${statusCode} returned. The page may be inaccessible, deleted, or requires login. Verify the URL: ${cleanUrl}`;
      }
      console.error(`fetch_oracle_page: unexpected failure fetching URL ${cleanUrl}: ${err}`);
      return `Error: Unexpected network failure, ${err.name || "Error"}: ${err.message || err}. Please ensure Jina Reader is available and try again.`;
    }
  }

  const text = stripJinaHeader(respText);
  let result = collapseBlanks(text);
  let isTruncated = false;

  if (result.length > MAX_PAGE_CHARS) {
    result = result.slice(0, MAX_PAGE_CHARS) + "\n\n[... truncated, content exceeds 15K chars]";
    isTruncated = true;
  }

  if (result.trim().length < 50) {
    console.error(`fetch_oracle_page: empty or very short content extracted (${result.length} chars) for URL: ${cleanUrl}`);
    return (
      `Warning: Very little content extracted (${result.length} chars). ` +
      `The page was probably not rendered. Try another release of the same page ` +
      `(for example .../24d/... or .../25b/...) or a neighbouring guide. ` +
      `Check the URL directly: ${cleanUrl}`
    );
  }

  pageCache.set(cleanUrl, result);

  if (isTruncated) {
    console.error(`fetch_oracle_page: truncated content fetched for URL ${cleanUrl} (${result.length} chars)`);
  } else {
    console.error(`fetch_oracle_page: successfully fetched URL ${cleanUrl} (${result.length} chars)`);
  }

  logCacheStats();
  return result;
}

// ── MCP Server Setup ─────────────────────────────────────────

const server = new Server(
  {
    name: "oracle-fusion-docs",
    version: "4.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "fetch_oracle_page",
        description:
          "Fetch a docs.oracle.com page and return it as raw markdown, suitable for quoting verbatim. " +
          "Oracle documentation is rendered client side, so an ordinary fetch returns no text. " +
          "To find a page, use a web search restricted to docs.oracle.com, then pass the URL here. " +
          "If a page comes back as navigation only it was not rendered: try another release of the same page.",
        inputSchema: {
          type: "object",
          properties: {
            url: {
              type: "string",
              description: "Full URL of an Oracle documentation page under docs.oracle.com",
              minLength: 20,
              maxLength: 1000,
            },
          },
          required: ["url"],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    if (name === "fetch_oracle_page") {
      const parsed = z.object({
        url: z.string().min(20).max(1000),
      }).parse(args);

      const result = await fetchOraclePageTool(parsed.url);
      return {
        content: [{ type: "text", text: result }],
      };
    }
    throw new Error(`Tool not found: ${name}`);
  } catch (err: any) {
    console.error(`Error executing tool ${name}: ${err}`);
    return {
      content: [{ type: "text", text: `Error: ${err.message || err}` }],
      isError: true,
    };
  }
});

// ── Server Execution ─────────────────────────────────────────

async function run() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Oracle Fusion Docs MCP Server running on stdio");
}

process.on("SIGINT", async () => {
  console.error("Shutting down gracefully (SIGINT)...");
  await server.close();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.error("Shutting down gracefully (SIGTERM)...");
  await server.close();
  process.exit(0);
});

run().catch((err) => {
  console.error("Fatal error running server:", err);
  process.exit(1);
});
