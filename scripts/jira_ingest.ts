#!/usr/bin/env node
/**
 * Jira ingestion pipeline for the Oracle HCM AMS triage plugin.
 * ────────────────────────────────────────────────────────────
 * Fetches a Jira issue through the REST API v2, downloads its attachments and
 * rebuilds it as a chronological markdown dossier with screenshots inline.
 *
 * STRICTLY READ-ONLY: every Jira call in this file uses HTTP GET. This tool
 * never posts, edits, transitions or deletes anything in Jira.
 *
 * Usage:
 *   node dist/jira_ingest.js PROJ-1234 [--force] [--out DIR]
 *
 * Credentials come from environment variables only (see readEnvironment).
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { Readable } from "stream";
import { pipeline } from "stream/promises";

// ── Config ───────────────────────────────────────────────────

const DEFAULT_BASE_URL = "";  // no default: JIRA_BASE_URL must be set by the engagement
const REQUEST_TIMEOUT = 30000; // 30.0 seconds
const USER_AGENT = "OracleHcmTriage/0.1 (jira-ingest; read-only)";
const MAX_ATTEMPTS = 3;

/**
 * Wiki headings inside a description or a comment start at this markdown depth.
 * The dossier owns levels 1 to 3 (title, sections, comment authors), so ticket
 * authors writing "h1." land at "####" and the outline stays consistent.
 */
const WIKI_HEADING_BASE = 4;

const ISSUE_FIELDS = [
  "summary",
  "description",
  "attachment",
  "comment",
  "status",
  "resolution",
  "priority",
  "issuetype",
  "labels",
  "components",
  "created",
  "updated",
].join(",");

const PLUGIN_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// ── Types ────────────────────────────────────────────────────

interface JiraConfig {
  baseUrl: string;
  email: string;
  token: string;
}

interface SavedAttachment {
  id: string;
  originalFilename: string;
  savedPath: string; // relative to the ticket directory, forward slashes
  mimeType: string;
  isImage: boolean;
  sizeBytes: number;
}

// ── Environment and credentials ──────────────────────────────

/**
 * Minimal .env reader: KEY=VALUE lines, # comments, optional surrounding quotes.
 * Real environment variables always win over the file.
 */
function loadDotEnvFile(rootDir: string): void {
  const envPath = path.join(rootDir, ".env");
  if (!fs.existsSync(envPath)) return;

  for (const rawLine of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    const quoted =
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"));
    if (quoted) value = value.slice(1, -1);
    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

const CREDENTIALS_HELP = [
  "Missing or invalid Jira credentials.",
  "  1. Create an API token at https://id.atlassian.com/manage-profile/security/api-tokens",
  "  2. Set these environment variables (or put them in a .env file at the plugin root):",
  "       JIRA_BASE_URL=https://your-company.atlassian.net   (required)",
  "       JIRA_EMAIL=your.name@example.com",
  "       JIRA_API_TOKEN=the token you just created",
  "  3. Never commit the token. The .env file is gitignored.",
].join("\n");

function readEnvironment(): JiraConfig {
  loadDotEnvFile(PLUGIN_ROOT);

  const baseUrl = (process.env.JIRA_BASE_URL || DEFAULT_BASE_URL).replace(/\/+$/, "");
  const email = process.env.JIRA_EMAIL || "";
  const token = process.env.JIRA_API_TOKEN || "";

  if (!email || !token) {
    console.error(CREDENTIALS_HELP);
    process.exit(1);
  }
  return { baseUrl, email, token };
}

function authHeaders(config: JiraConfig): Record<string, string> {
  const basic = Buffer.from(`${config.email}:${config.token}`).toString("base64");
  return {
    Authorization: `Basic ${basic}`,
    "User-Agent": USER_AGENT,
  };
}

// ── HTTP (GET only) ──────────────────────────────────────────

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Redact anything that could leak a credential before printing an error. */
function safeMessage(err: unknown): string {
  const raw = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
  return raw.replace(/Basic\s+[A-Za-z0-9+/=]+/g, "Basic [redacted]");
}

/** Single GET with timeout. Returns the raw Response (never consumed here). */
async function getOnce(url: string, config: JiraConfig, accept: string): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
  try {
    return await fetch(url, {
      method: "GET",
      headers: { ...authHeaders(config), Accept: accept },
      signal: controller.signal,
      redirect: "follow",
    });
  } finally {
    clearTimeout(timer);
  }
}

/** GET with retry on 429, 5xx, timeouts and network errors. */
async function getWithRetry(url: string, config: JiraConfig, accept: string): Promise<Response> {
  let lastError: unknown = null;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const response = await getOnce(url, config, accept);
      if (response.status === 401 || response.status === 403) {
        return response; // caller decides, retrying an auth failure is pointless
      }
      if (response.status === 429 || response.status >= 500) {
        throw new Error(`HTTP ${response.status}`);
      }
      return response;
    } catch (err) {
      lastError = err;
      if (attempt === MAX_ATTEMPTS) break;
      const delayMs = attempt === 1 ? 2000 : 4000;
      console.error(
        `  retry ${attempt}/${MAX_ATTEMPTS - 1} after ${safeMessage(err)}, waiting ${delayMs / 1000}s`
      );
      await sleep(delayMs);
    }
  }
  throw new Error(`GET failed after ${MAX_ATTEMPTS} attempts: ${safeMessage(lastError)}`);
}

async function getJson(url: string, config: JiraConfig): Promise<any> {
  const response = await getWithRetry(url, config, "application/json");
  if (response.status === 401 || response.status === 403) {
    console.error(`Jira answered HTTP ${response.status} for ${url}`);
    console.error(CREDENTIALS_HELP);
    process.exit(1);
  }
  if (response.status === 404) {
    throw new Error(`Not found (HTTP 404): ${url}`);
  }
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} ${response.statusText} for ${url}`);
  }
  return await response.json();
}

/** Startup self-check against /myself, per spec section 4.1. */
async function selfCheck(config: JiraConfig): Promise<string> {
  const me = await getJson(`${config.baseUrl}/rest/api/2/myself`, config);
  return me.displayName || me.emailAddress || "unknown user";
}

// ── Filename handling ────────────────────────────────────────

/** ASCII slug: accents folded, everything else collapsed to single dashes. */
function slugify(name: string): string {
  const withoutExt = name.replace(/\.[^.]+$/, "");
  const ascii = withoutExt
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\u2018\u2019\u201c\u201d]/g, "");
  const slug = ascii
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return slug || "attachment";
}

function extensionOf(filename: string, mimeType: string): string {
  const match = filename.match(/(\.[A-Za-z0-9]{1,8})$/);
  if (match) return match[1].toLowerCase();
  if (mimeType.startsWith("image/")) return `.${mimeType.split("/")[1].split("+")[0]}`;
  return "";
}

// ── Attachments ──────────────────────────────────────────────

async function downloadAttachments(
  issue: any,
  ticketDir: string,
  config: JiraConfig,
  force: boolean
): Promise<SavedAttachment[]> {
  const attachments: any[] = issue.fields?.attachment || [];
  const saved: SavedAttachment[] = [];

  for (const att of attachments) {
    const mimeType: string = att.mimeType || "application/octet-stream";
    const isImage = mimeType.startsWith("image/");
    const subDir = isImage ? "images" : "files";
    const filename = `${att.id}_${slugify(att.filename || "attachment")}${extensionOf(
      att.filename || "",
      mimeType
    )}`;
    const relPath = `${subDir}/${filename}`;
    const absPath = path.join(ticketDir, subDir, filename);

    fs.mkdirSync(path.dirname(absPath), { recursive: true });

    if (fs.existsSync(absPath) && !force) {
      saved.push({
        id: String(att.id),
        originalFilename: att.filename || filename,
        savedPath: relPath,
        mimeType,
        isImage,
        sizeBytes: fs.statSync(absPath).size,
      });
      console.error(`  attachment cached: ${relPath}`);
      continue;
    }

    const url: string = att.content || `${config.baseUrl}/rest/api/2/attachment/content/${att.id}`;
    const response = await getWithRetry(url, config, "*/*");
    if (!response.ok || !response.body) {
      console.error(
        `  WARNING: could not download attachment ${att.filename} (HTTP ${response.status})`
      );
      continue;
    }
    await pipeline(Readable.fromWeb(response.body as any), fs.createWriteStream(absPath));

    const sizeBytes = fs.statSync(absPath).size;
    saved.push({
      id: String(att.id),
      originalFilename: att.filename || filename,
      savedPath: relPath,
      mimeType,
      isImage,
      sizeBytes,
    });
    console.error(`  downloaded: ${relPath} (${sizeBytes} bytes)`);
    await sleep(120); // stay polite with the Jira attachment endpoint
  }

  return saved;
}

// ── raw.json stripping ───────────────────────────────────────

/**
 * Removes the payload weight that carries no diagnostic value:
 * author/updateAuthor collapse to {displayName}, avatarUrls and self URLs go away.
 * Timestamps and jsdPublic are preserved.
 */
function stripPayload(value: any): any {
  if (Array.isArray(value)) return value.map(stripPayload);
  if (value === null || typeof value !== "object") return value;

  const out: Record<string, any> = {};
  for (const [key, child] of Object.entries(value)) {
    if (key === "avatarUrls" || key === "self") continue;
    if ((key === "author" || key === "updateAuthor") && child && typeof child === "object") {
      out[key] = { displayName: (child as any).displayName ?? null };
      continue;
    }
    out[key] = stripPayload(child);
  }
  return out;
}

// ── Jira wiki markup conversion ──────────────────────────────

interface ConversionContext {
  /** lowercased original filename to saved attachment */
  imagesByName: Map<string, SavedAttachment>;
  /** accountId to display name, harvested from comment authors */
  peopleById: Map<string, string>;
  /** saved paths actually referenced inline somewhere in the dossier */
  referenced: Set<string>;
  warnings: string[];
}

/** Pull {code}/{noformat} blocks out so no other rule can touch their content. */
function extractVerbatimBlocks(text: string): { text: string; blocks: string[] } {
  const blocks: string[] = [];
  const replaced = text.replace(
    /\{(code|noformat)(?::[^}]*)?\}([\s\S]*?)\{\1\}/g,
    (_all: string, _tag: string, body: string) => {
      const trimmed = body.replace(/^\n/, "").replace(/\n$/, "");
      blocks.push("```\n" + trimmed + "\n```");
      return `@@VERBATIM${blocks.length - 1}@@`;
    }
  );
  return { text: replaced, blocks };
}

function restoreVerbatimBlocks(text: string, blocks: string[]): string {
  return text.replace(/@@VERBATIM(\d+)@@/g, (_all, index: string) => blocks[Number(index)]);
}

function convertWikiMarkup(input: string, ctx: ConversionContext, label: string): string {
  if (!input) return "";

  const { text: guarded, blocks } = extractVerbatimBlocks(input.replace(/\r\n/g, "\n"));
  let text = guarded;

  // Inline images and file references: !filename|params! or !filename!
  text = text.replace(/!([^!\n|]+?)(\|[^!\n]*)?!/g, (whole: string, rawName: string) => {
    const name = rawName.trim();
    const hit = ctx.imagesByName.get(name.toLowerCase());
    if (!hit) {
      ctx.warnings.push(`${label}: unresolved reference to "${name}"`);
      return `${whole}\n> WARNING: unresolved image reference "${name}"\n`;
    }
    ctx.referenced.add(hit.savedPath);
    return hit.isImage
      ? `![${hit.originalFilename}](${hit.savedPath})`
      : `[${hit.originalFilename}](${hit.savedPath})`;
  });

  // User mentions
  text = text.replace(/\[~accountid:([^\]]+)\]/g, (_all: string, accountId: string) => {
    const name = ctx.peopleById.get(accountId);
    return name ? `@${name}` : "@mention";
  });

  // Links: [text|url] first, then bare [url]. The bare rule must not fire on a
  // link the previous rule just produced, hence the lookahead on "(".
  text = text.replace(/\[([^\]|\n]+)\|(https?:[^\]\n|]+)(\|[^\]\n]*)?\]/g, "[$1]($2)");
  text = text.replace(/\[(https?:[^\]\n|]+)\](?!\()/g, "<$1>");

  // A link whose text is its own URL renders twice, keep the bare URL.
  text = text.replace(/\[(https?:[^\]\n]+)\]\(\1\)/g, "<$1>");

  // Monospace
  text = text.replace(/\{\{([^}\n]+)\}\}/g, "`$1`");

  // Wiki headings become plain markdown headings first.
  text = text.replace(/^h([1-6])\.\s*/gm, (_all: string, level: string) => `${"#".repeat(Number(level))} `);

  // Then every heading is pushed below the dossier structure, so nothing written
  // inside a comment can outrank the "### author" heading that introduces it.
  // This also catches markdown headings pasted straight into Jira, which the
  // reporters in this corpus do regularly.
  text = text.replace(
    /^(#{1,6})\s+/gm,
    (_all: string, hashes: string) =>
      `${"#".repeat(Math.min(6, WIKI_HEADING_BASE + hashes.length - 1))} `
  );

  // Bold: *text* but never a "* " bullet at line start
  text = text.replace(/(^|[\s(])\*([^\s*][^*\n]*?)\*(?=$|[\s.,;:)])/gm, "$1**$2**");

  // Cosmetic wiki noise with no markdown equivalent
  text = text.replace(/\{color(?::[^}]*)?\}/g, "");

  return restoreVerbatimBlocks(text, blocks).trim();
}

// ── Dossier rendering ────────────────────────────────────────

/**
 * Keeps the offset Jira returned (usually the reporter local time) instead of
 * normalizing to UTC: the timeline is later correlated with business hours,
 * scheduled processes and CAB windows, which are all read in local time.
 */
function formatTimestamp(value: string | undefined): string {
  if (!value) return "unknown";
  const match = value.match(/^(\d{4}-\d\d-\d\d)T(\d\d:\d\d:\d\d)\.\d+([+-]\d{4}|Z)$/);
  if (!match) return value;
  const offset = match[3] === "Z" ? "+0000" : match[3];
  return `${match[1]} ${match[2]} ${offset}`;
}

function humanSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function buildDossier(
  issue: any,
  saved: SavedAttachment[],
  ctx: ConversionContext,
  config: JiraConfig
): string {
  const f = issue.fields || {};
  const lines: string[] = [];

  lines.push(`# ${issue.key}: ${f.summary || "(no summary)"}`);
  lines.push("");
  lines.push("| Field | Value |");
  lines.push("| --- | --- |");
  lines.push(`| Key | ${issue.key} |`);
  lines.push(`| Type | ${f.issuetype?.name || "unknown"} |`);
  lines.push(`| Status | ${f.status?.name || "unknown"} |`);
  lines.push(`| Resolution | ${f.resolution?.name || "Unresolved"} |`);
  lines.push(`| Priority | ${f.priority?.name || "unknown"} |`);
  lines.push(`| Created | ${formatTimestamp(f.created)} |`);
  lines.push(`| Updated | ${formatTimestamp(f.updated)} |`);
  lines.push(
    `| Components | ${(f.components || []).map((c: any) => c.name).join(", ") || "(none)"} |`
  );
  lines.push(`| Labels | ${(f.labels || []).join(", ") || "(none)"} |`);
  lines.push(`| Attachments | ${saved.length} (${saved.filter((a) => a.isImage).length} images) |`);
  lines.push(`| Jira URL | ${config.baseUrl}/browse/${issue.key} |`);
  lines.push("");
  lines.push("## Description");
  lines.push("");
  lines.push(convertWikiMarkup(f.description || "", ctx, "description") || "(empty description)");
  lines.push("");

  const comments: any[] = (f.comment?.comments || []).slice();
  comments.sort((a, b) => new Date(a.created).getTime() - new Date(b.created).getTime());

  lines.push(`## Comments (${comments.length}, chronological)`);
  lines.push("");
  if (comments.length === 0) {
    lines.push("(no comments)");
    lines.push("");
  }
  for (const comment of comments) {
    const author = comment.author?.displayName || "Unknown author";
    const visibility = comment.jsdPublic === false ? " [internal]" : "";
    lines.push(`### ${author} (${formatTimestamp(comment.created)})${visibility}`);
    lines.push("");
    lines.push(
      convertWikiMarkup(comment.body || "", ctx, `comment ${comment.id}`) || "(empty comment)"
    );
    lines.push("");
  }

  const orphans = saved.filter((a) => !ctx.referenced.has(a.savedPath));
  lines.push("## Attachments not referenced inline");
  lines.push("");
  if (orphans.length === 0) {
    lines.push("(none, every attachment is referenced in the text above)");
    lines.push("");
  }
  for (const att of orphans) {
    lines.push(`### ${att.originalFilename} (${humanSize(att.sizeBytes)}, ${att.mimeType})`);
    lines.push("");
    lines.push(
      att.isImage
        ? `![${att.originalFilename}](${att.savedPath})`
        : `[${att.originalFilename}](${att.savedPath})`
    );
    lines.push("");
  }

  if (ctx.warnings.length > 0) {
    lines.push("## Ingestion warnings");
    lines.push("");
    for (const warning of ctx.warnings) lines.push(`- ${warning}`);
    lines.push("");
  }

  return lines.join("\n");
}

// ── Comment pagination safety net ────────────────────────────

/**
 * The issue endpoint caps the embedded comment list. When Jira reports more
 * comments than it returned, pull the full list from the comment endpoint.
 */
async function ensureAllComments(issue: any, config: JiraConfig): Promise<void> {
  const container = issue.fields?.comment;
  if (!container) return;
  const total: number = container.total ?? 0;
  const got: number = (container.comments || []).length;
  if (total <= got) return;

  console.error(`  fetching all ${total} comments (issue endpoint returned ${got})`);
  const all: any[] = [];
  let startAt = 0;
  while (all.length < total) {
    const page = await getJson(
      `${config.baseUrl}/rest/api/2/issue/${issue.key}/comment?startAt=${startAt}&maxResults=100&orderBy=created`,
      config
    );
    const batch: any[] = page.comments || [];
    if (batch.length === 0) break;
    all.push(...batch);
    startAt += batch.length;
    await sleep(250);
  }
  container.comments = all;
  container.maxResults = all.length;
}

// ── Ingestion of one ticket ──────────────────────────────────

async function ingestIssue(
  key: string,
  config: JiraConfig,
  options: { outDir: string; force: boolean }
): Promise<string> {
  console.error(`Ingesting ${key}`);

  const issue = await getJson(
    `${config.baseUrl}/rest/api/2/issue/${key}?fields=${ISSUE_FIELDS}`,
    config
  );
  await ensureAllComments(issue, config);

  const ticketDir = path.join(options.outDir, issue.key);
  fs.mkdirSync(ticketDir, { recursive: true });

  const saved = await downloadAttachments(issue, ticketDir, config, options.force);

  const ctx: ConversionContext = {
    imagesByName: new Map(saved.map((a) => [a.originalFilename.toLowerCase(), a])),
    peopleById: new Map(),
    referenced: new Set(),
    warnings: [],
  };
  for (const comment of issue.fields?.comment?.comments || []) {
    if (comment.author?.accountId && comment.author?.displayName) {
      ctx.peopleById.set(comment.author.accountId, comment.author.displayName);
    }
  }

  const stripped = stripPayload(issue);
  fs.writeFileSync(path.join(ticketDir, "raw.json"), JSON.stringify(stripped, null, 2), "utf8");

  const dossier = buildDossier(issue, saved, ctx, config);
  fs.writeFileSync(path.join(ticketDir, "ticket.md"), dossier, "utf8");

  const commentCount = (issue.fields?.comment?.comments || []).length;
  console.error(
    `  wrote ticket.md (${commentCount} comments, ${saved.length} attachments, ` +
      `${ctx.warnings.length} warnings)`
  );
  return ticketDir;
}

// ── Batch mode ───────────────────────────────────────────────

const SEARCH_PAGE_SIZE = 100;

/**
 * Collects issue keys for a JQL query.
 * Jira Cloud replaced the paginated /search endpoint with /search/jql (cursor
 * based). Older deployments still only expose /search, so both are supported:
 * the cursor endpoint is tried first and the startAt endpoint is the fallback.
 */
async function searchIssueKeys(jql: string, limit: number, config: JiraConfig): Promise<string[]> {
  const keys: string[] = [];
  const encoded = encodeURIComponent(jql);

  // Modern cursor pagination
  let nextPageToken: string | null = null;
  let legacyNeeded = false;
  do {
    const cursor: string = nextPageToken ? `&nextPageToken=${encodeURIComponent(nextPageToken)}` : "";
    const url = `${config.baseUrl}/rest/api/2/search/jql?jql=${encoded}&maxResults=${SEARCH_PAGE_SIZE}&fields=key${cursor}`;
    let page: any;
    try {
      page = await getJson(url, config);
    } catch (err) {
      const message = safeMessage(err);
      if (message.includes("404") || message.includes("410")) {
        legacyNeeded = true;
        break;
      }
      throw err;
    }
    for (const issue of page.issues || []) {
      keys.push(issue.key);
      if (keys.length >= limit) return keys;
    }
    nextPageToken = page.nextPageToken || null;
    if (nextPageToken) await sleep(250);
  } while (nextPageToken);

  if (!legacyNeeded) return keys;

  // Legacy startAt pagination
  console.error("  /search/jql unavailable, falling back to the legacy /search endpoint");
  let startAt = 0;
  let total = Infinity;
  while (keys.length < limit && startAt < total) {
    const url = `${config.baseUrl}/rest/api/2/search?jql=${encoded}&startAt=${startAt}&maxResults=${SEARCH_PAGE_SIZE}&fields=key`;
    const page = await getJson(url, config);
    total = page.total ?? 0;
    const issues: any[] = page.issues || [];
    if (issues.length === 0) break;
    for (const issue of issues) {
      keys.push(issue.key);
      if (keys.length >= limit) return keys;
    }
    startAt += issues.length;
    await sleep(250);
  }
  return keys;
}

/**
 * Reads ticket keys from a text file: one key per line, or separated by commas
 * or whitespace. Blank lines and lines starting with # are ignored, so a list
 * pasted from Jira with headings survives.
 */
function readKeyList(filePath: string): string[] {
  const raw = fs.readFileSync(filePath, "utf8");
  return parseKeyList(
    raw
      .split(/\r?\n/)
      .filter((line) => !line.trim().startsWith("#"))
      .join(",")
  );
}

/** Splits a key list on commas, semicolons or whitespace and normalizes case. */
function parseKeyList(value: string): string[] {
  const seen = new Set<string>();
  const keys: string[] = [];
  for (const token of value.split(/[\s,;]+/)) {
    const key = token.trim().toUpperCase();
    if (!key) continue;
    if (!/^[A-Z][A-Z0-9]+-\d+$/.test(key)) {
      console.error(`  ignoring "${token}", which does not look like a Jira key`);
      continue;
    }
    if (!seen.has(key)) {
      seen.add(key);
      keys.push(key);
    }
  }
  return keys;
}

/**
 * Sequential ingestion of a list of tickets. Idempotent: a ticket directory that
 * already holds a dossier is skipped unless --force is passed.
 */
async function ingestBatch(
  keys: string[],
  config: JiraConfig,
  options: { outDir: string; force: boolean }
): Promise<void> {
  let ingested = 0;
  let skipped = 0;
  const failures: string[] = [];

  for (const [index, key] of keys.entries()) {
    const dossier = path.join(options.outDir, key, "ticket.md");
    if (fs.existsSync(dossier) && !options.force) {
      console.error(`[${index + 1}/${keys.length}] ${key}: already ingested, skipping`);
      skipped++;
      continue;
    }
    console.error(`[${index + 1}/${keys.length}] ${key}`);
    try {
      await ingestIssue(key, config, options);
      ingested++;
    } catch (err) {
      console.error(`  FAILED: ${safeMessage(err)}`);
      failures.push(key);
    }
    await sleep(350); // stay well under Jira rate limits
  }

  console.error(
    `Batch done: ${ingested} ingested, ${skipped} skipped, ${failures.length} failed` +
      (failures.length > 0 ? ` (${failures.join(", ")})` : "")
  );
  if (failures.length > 0) process.exitCode = 1;
}

// ── CLI ──────────────────────────────────────────────────────

interface CliOptions {
  keys: string[];
  jql: string | null;
  keyFile: string | null;
  limit: number;
  force: boolean;
  outDir: string;
}

const DEFAULT_BATCH_LIMIT = 50;

const USAGE = [
  "Usage:",
  "  node dist/jira_ingest.js <ISSUE-KEY> [ISSUE-KEY ...] [--force] [--out DIR]",
  "  node dist/jira_ingest.js --keys PROJ-1234,PROJ-1235 [--force] [--out DIR]",
  "  node dist/jira_ingest.js --from-file tickets.txt [--force] [--out DIR]",
  '  node dist/jira_ingest.js --jql "project = PROJ AND updated >= -180d" [--limit N] [--force]',
  "",
  "  <ISSUE-KEY>      one or more Jira keys, for example PROJ-1234",
  "  --keys LIST      keys separated by commas, semicolons or spaces",
  "  --from-file PATH text file holding the keys, one per line, # comments allowed",
  "  --jql QUERY      ingest every ticket matching the JQL query",
  `  --limit N        cap for --jql (default: ${DEFAULT_BATCH_LIMIT})`,
  "  --force          re-ingest tickets already on disk and re-download attachments",
  "  --out DIR        output directory (default: <plugin root>/tickets)",
].join("\n");

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = {
    keys: [],
    jql: null,
    keyFile: null,
    limit: DEFAULT_BATCH_LIMIT,
    force: false,
    outDir: path.join(PLUGIN_ROOT, "engagement", "tickets"),
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--force") {
      options.force = true;
    } else if (arg === "--keys") {
      const value = argv[++i];
      if (!value) {
        console.error("--keys needs a list of ticket keys");
        process.exit(2);
      }
      options.keys.push(...parseKeyList(value));
    } else if (arg === "--from-file") {
      const value = argv[++i];
      if (!value) {
        console.error("--from-file needs a file path");
        process.exit(2);
      }
      options.keyFile = path.resolve(value);
    } else if (arg === "--jql") {
      const value = argv[++i];
      if (!value) {
        console.error("--jql needs a query string");
        process.exit(2);
      }
      options.jql = value;
    } else if (arg === "--limit") {
      const value = Number(argv[++i]);
      if (!Number.isInteger(value) || value < 1) {
        console.error("--limit needs a positive integer");
        process.exit(2);
      }
      options.limit = value;
    } else if (arg === "--out") {
      const value = argv[++i];
      if (!value) {
        console.error("--out needs a directory path");
        process.exit(2);
      }
      options.outDir = path.resolve(value);
    } else if (arg === "-h" || arg === "--help") {
      console.log(USAGE);
      process.exit(0);
    } else if (arg.startsWith("-")) {
      console.error(`Unknown option: ${arg}\n\n${USAGE}`);
      process.exit(2);
    } else {
      options.keys.push(...parseKeyList(arg));
    }
  }
  return options;
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));

  if (options.keyFile) {
    options.keys.push(...readKeyList(options.keyFile));
  }
  if (options.jql && options.keys.length > 0) {
    console.error(`Pass either ticket keys or --jql, not both.\n\n${USAGE}`);
    process.exit(2);
  }
  if (!options.jql && options.keys.length === 0) {
    console.error(USAGE);
    process.exit(2);
  }

  const config = readEnvironment();
  const who = await selfCheck(config);
  console.error(`Authenticated on ${config.baseUrl} as ${who} (read-only)`);

  let keys = options.keys;
  if (options.jql) {
    console.error(`Searching: ${options.jql}`);
    keys = await searchIssueKeys(options.jql, options.limit, config);
    console.error(
      `Matched ${keys.length} ticket(s)` +
        (keys.length >= options.limit ? ` (capped at --limit ${options.limit})` : "")
    );
  }

  if (keys.length === 1 && !options.jql) {
    // Single ticket: always refresh, the operator asked for this one explicitly.
    const ticketDir = await ingestIssue(keys[0], config, options);
    console.log(ticketDir);
    return;
  }

  await ingestBatch(keys, config, options);
  console.log(options.outDir);
}

main().catch((err) => {
  console.error(`Ingestion failed: ${safeMessage(err)}`);
  process.exit(1);
});
