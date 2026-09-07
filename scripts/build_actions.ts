#!/usr/bin/env node
/**
 * Aggregates the per-ticket briefs in output/tickets into three generated files:
 * ────────────────────────────────────────────────────────────────────────────
 *   output/DO-NOW.md    every step the operator runs himself, in order, checkboxes
 *   output/MESSAGES.md  every ready-to-send text, copy and paste, nothing to compose
 *   output/INDEX.md     one row per ticket: root cause, my move, who blocks it
 *
 * The format all three rely on is defined in
 * skills/hcm-debugging/output-format.md. A brief that does not follow it is
 * reported here rather than silently dropped, which is the point of generating
 * these files instead of writing them by hand.
 *
 * The ordering rule everywhere: what he does himself comes before what he sends,
 * and both come before anything he is only waiting on.
 *
 * Usage: node dist/build_actions.js [--out DIR]
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const PLUGIN_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const REQUIRED_FIELDS = [
  "key",
  "summary",
  "status",
  "updated",
  "age_days",
  "family",
  "root_cause",
  "confidence",
  "my_move",
  "status_target",
  "severity",
  "effort_hands_on",
  "eta_elapsed",
  "blocked_on",
  "next_action",
] as const;

const MOVES = ["investigate", "send", "wait"];
const SEVERITY_ORDER = ["P1", "P2", "P3"];

interface Brief {
  file: string;
  meta: Record<string, string>;
  steps: Step[];
  message: string;
}

interface Step {
  key: string;
  index: string;
  action: string;
  where: string;
  done: string;
  time: string;
}

// ── Parsing ──────────────────────────────────────────────────

/** Minimal frontmatter reader: key: value pairs between the leading --- fences. */
function parseFrontmatter(text: string, file: string): Record<string, string> {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) {
    throw new Error(`${file}: no frontmatter block`);
  }
  const meta: Record<string, string> = {};
  for (const line of match[1].split(/\r?\n/)) {
    const separator = line.indexOf(":");
    if (separator === -1) continue;
    const key = line.slice(0, separator).trim();
    let value = line.slice(separator + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    meta[key] = value;
  }
  const missing = REQUIRED_FIELDS.filter((field) => !meta[field]);
  if (missing.length > 0) {
    throw new Error(`${file}: missing frontmatter field(s): ${missing.join(", ")}`);
  }
  if (!MOVES.includes(meta.my_move)) {
    throw new Error(`${file}: my_move is "${meta.my_move}", expected one of ${MOVES.join(", ")}`);
  }
  return meta;
}

/** Returns the body of a "## NAME" section, up to the next "## ". */
function section(text: string, name: string, file: string): string {
  const parts = text.split(new RegExp(`^## ${name}\\s*$`, "m"));
  if (parts.length < 2) {
    throw new Error(`${file}: no "## ${name}" section`);
  }
  return parts[1].split(/^## /m)[0].trim();
}

/**
 * Reads the rows of the DO NOW table. Zero rows is legal and meaningful: it is
 * a ticket whose analysis is finished and which leaves through its message.
 */
function parseSteps(text: string, key: string, file: string): Step[] {
  const body = section(text, "DO NOW", file);
  const steps: Step[] = [];

  for (const line of body.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("|")) continue;
    const cells = trimmed.slice(1, -1).split("|").map((cell) => cell.trim());
    if (cells.length < 5) continue;
    if (/^-+$/.test(cells[0]) || cells[0].toLowerCase() === "#") continue; // header or separator

    steps.push({
      key,
      index: cells[0],
      action: cells[1],
      where: cells[2],
      done: cells[3],
      time: cells[4],
    });
  }
  return steps;
}

/** The MESSAGE section verbatim, or "" when the brief says there is nothing to send. */
function parseMessage(text: string, file: string): string {
  const body = section(text, "MESSAGE", file);
  return /^none\b/i.test(body) ? "" : body;
}

function readBriefs(ticketsDir: string): { briefs: Brief[]; errors: string[] } {
  const briefs: Brief[] = [];
  const errors: string[] = [];

  const files = fs.existsSync(ticketsDir)
    ? fs.readdirSync(ticketsDir).filter((name) => name.endsWith(".md")).sort()
    : [];

  for (const name of files) {
    const file = path.join(ticketsDir, name);
    const text = fs.readFileSync(file, "utf8");
    try {
      const meta = parseFrontmatter(text, name);
      briefs.push({
        file: name,
        meta,
        steps: parseSteps(text, meta.key, name),
        message: parseMessage(text, name),
      });
    } catch (err) {
      errors.push(err instanceof Error ? err.message : String(err));
    }
  }
  return { briefs, errors };
}

// ── Time arithmetic ──────────────────────────────────────────

/** Minutes from "5m", "20m", "2h", "1d". A day is seven working hours. */
function minutes(value: string): number {
  let total = 0;
  const pattern = /(\d+(?:[.,]\d+)?)\s*([mhd])/gi;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(value)) !== null) {
    const amount = Number(match[1].replace(",", "."));
    const unit = match[2].toLowerCase();
    total += unit === "m" ? amount : unit === "h" ? amount * 60 : amount * 7 * 60;
  }
  return total;
}

/** "95m" reads worse than "1h35". Round to something a human schedules against. */
function humanMinutes(total: number): string {
  if (total === 0) return "0m";
  if (total < 60) return `${Math.round(total)}m`;
  const hours = total / 60;
  if (hours < 8) return `${Number(hours.toFixed(1))}h`;
  return `${Number((hours / 7).toFixed(1))}d`;
}

function ticketMinutes(brief: Brief): number {
  const fromSteps = brief.steps.reduce((sum, step) => sum + minutes(step.time), 0);
  return fromSteps > 0 ? fromSteps : minutes(brief.meta.effort_hands_on);
}

function severityRank(value: string): number {
  const index = SEVERITY_ORDER.indexOf(value.toUpperCase());
  return index === -1 ? SEVERITY_ORDER.length : index;
}

/** Severity first, then cheapest first inside a severity. */
function workOrder(a: Brief, b: Brief): number {
  return severityRank(a.meta.severity) - severityRank(b.meta.severity) || ticketMinutes(a) - ticketMinutes(b);
}

// ── Rendering ────────────────────────────────────────────────

function renderDoNow(briefs: Brief[], generatedOn: string): string {
  const investigate = briefs.filter((brief) => brief.meta.my_move === "investigate").sort(workOrder);
  const send = briefs.filter((brief) => brief.meta.my_move === "send").sort(workOrder);
  const wait = briefs.filter((brief) => brief.meta.my_move === "wait").sort(workOrder);

  const stepCount = briefs.reduce((sum, brief) => sum + brief.steps.length, 0);
  const investigateSteps = investigate.reduce((sum, brief) => sum + brief.steps.length, 0);
  const totalTime = briefs.reduce((sum, brief) => sum + ticketMinutes(brief), 0);

  const lines: string[] = [];
  lines.push("# Do now");
  lines.push("");
  lines.push(
    `Latest ticket activity ${generatedOn}. ${stepCount} step(s) to run yourself, ` +
      `${humanMinutes(totalTime)} of keyboard time, ${send.length} message(s) ready to send, ` +
      `${wait.length} ticket(s) waiting on someone else.`
  );
  lines.push("");
  lines.push("Do not edit by hand: edit the briefs in tickets/ and run npm run actions.");
  lines.push("");

  if (send.length > 0) {
    lines.push(`## Send now (${send.length})`);
    lines.push("");
    lines.push(
      "What was asked is ready. Open MESSAGES.md, copy the block, send it. Anything still listed " +
        "under a ticket is yours afterwards, not a reason to hold the message back."
    );
    lines.push("");
    for (const brief of send) {
      const destination = brief.message.split(/\r?\n/)[0].replace(/^\*\*|\*\*$/g, "").trim();
      lines.push(`- [ ] **${brief.meta.key}** ${destination || "see the brief"}`);
      lines.push(`      Says: ${brief.meta.root_cause}`);
      lines.push(
        `      [text](MESSAGES.md#${brief.meta.key.toLowerCase()}) | [brief](tickets/${brief.meta.key}.md)`
      );
      // The message ships as soon as what was asked is ready, so a send ticket can still
      // carry steps. Showing them here rather than dropping them silently.
      if (brief.steps.length > 0) {
        lines.push(
          `      Still yours afterwards, ${brief.steps.length} step(s), ${humanMinutes(ticketMinutes(brief))}:`
        );
        for (const step of brief.steps) {
          lines.push(`      - [ ] ${step.action} (${step.time})`);
          lines.push(`            Where: ${step.where}`);
          lines.push(`            Done when: ${step.done}`);
        }
      }
    }
    lines.push("");
  }

  if (investigate.length > 0) {
    lines.push(`## Investigate (${investigate.length} ticket(s), ${investigateSteps} step(s))`);
    lines.push("");
    lines.push("Severity first, cheapest first inside a severity. Run the steps of one ticket in order.");
    lines.push("");
    for (const brief of investigate) {
      const meta = brief.meta;
      lines.push(
        `### [${meta.key}](tickets/${meta.key}.md) ${meta.severity} | ${humanMinutes(ticketMinutes(brief))} | ${meta.root_cause}`
      );
      lines.push("");
      if (brief.steps.length === 0) {
        lines.push(`- [ ] No step written yet. ${meta.next_action}`);
      }
      for (const step of brief.steps) {
        lines.push(`- [ ] ${step.action} (${step.time})`);
        lines.push(`      Where: ${step.where}`);
        lines.push(`      Done when: ${step.done}`);
      }
      if (brief.message) {
        lines.push(`- [ ] Then send: [text](MESSAGES.md#${meta.key.toLowerCase()})`);
      }
      lines.push("");
    }
  }

  if (wait.length > 0) {
    lines.push(`## Waiting on someone else (${wait.length})`);
    lines.push("");
    lines.push("Nothing to run. Listed so a silent ticket does not become an invisible one.");
    lines.push("");
    for (const brief of wait) {
      const meta = brief.meta;
      lines.push(
        `- [${meta.key}](tickets/${meta.key}.md) ${meta.severity} | waiting on ${meta.blocked_on} | last activity ${meta.updated} | ${meta.next_action}`
      );
      for (const step of brief.steps) {
        lines.push(`  - [ ] ${step.action} (${step.time}) | Where: ${step.where}`);
      }
      if (brief.message) {
        lines.push(`  - [ ] Send: [text](MESSAGES.md#${meta.key.toLowerCase()})`);
      }
    }
    lines.push("");
  }

  return lines.join("\n");
}

function renderMessages(briefs: Brief[], generatedOn: string): string {
  const withMessage = briefs.filter((brief) => brief.message).sort(workOrder);

  const lines: string[] = [];
  lines.push("# Messages to send");
  lines.push("");
  lines.push(
    `Latest ticket activity ${generatedOn}. ${withMessage.length} message(s), written to be pasted ` +
      "with no editing. Do not edit by hand: edit the briefs in tickets/ and run npm run actions."
  );
  lines.push("");

  if (withMessage.length === 0) {
    lines.push("Nothing to send right now.");
    lines.push("");
    return lines.join("\n");
  }

  for (const brief of withMessage) {
    lines.push(`## ${brief.meta.key}`);
    lines.push("");
    lines.push(`${brief.meta.summary}. [Brief](tickets/${brief.meta.key}.md).`);
    lines.push("");
    lines.push(
      `**Jira status to set after sending: ${brief.meta.status_target}** ` +
        `(currently ${brief.meta.status}).`
    );
    lines.push("");
    lines.push(brief.message);
    lines.push("");
  }
  return lines.join("\n");
}

function renderIndex(briefs: Brief[], generatedOn: string): string {
  const lines: string[] = [];
  lines.push("# Ticket index");
  lines.push("");
  lines.push(
    `Latest ticket activity ${generatedOn}. Severity first, then cheapest first. Do not edit by hand.`
  );
  lines.push("");
  lines.push(
    "| Sev | Ticket | Root cause | Conf | My move | Hands-on | Elapsed | Blocked on | Next action |"
  );
  lines.push(
    "| --- | ------ | ---------- | ---- | ------- | -------- | ------- | ---------- | ----------- |"
  );

  for (const brief of [...briefs].sort(workOrder)) {
    const meta = brief.meta;
    lines.push(
      `| ${meta.severity} | [${meta.key}](tickets/${meta.key}.md) | ${meta.root_cause} | ${meta.confidence}% | ${meta.my_move} | ${humanMinutes(ticketMinutes(brief))} | ${meta.eta_elapsed} | ${meta.blocked_on} | ${meta.next_action} |`
    );
  }
  lines.push("");

  lines.push("## Where the queue stands");
  lines.push("");
  for (const move of MOVES) {
    const rows = briefs.filter((brief) => brief.meta.my_move === move);
    if (rows.length === 0) continue;
    const time = rows.reduce((sum, brief) => sum + ticketMinutes(brief), 0);
    lines.push(`- **${move}**: ${rows.length} ticket(s), ${humanMinutes(time)} of your time`);
    for (const brief of rows.sort(workOrder)) {
      lines.push(`  - ${brief.meta.key} ${brief.meta.summary}`);
    }
  }
  lines.push("");

  lines.push("## Ticket detail");
  lines.push("");
  lines.push("| Ticket | Summary | Status | Age | Family |");
  lines.push("| ------ | ------- | ------ | --- | ------ |");
  for (const { meta } of [...briefs].sort(workOrder)) {
    lines.push(
      `| [${meta.key}](tickets/${meta.key}.md) | ${meta.summary} | ${meta.status} | ${meta.age_days}d | ${meta.family} |`
    );
  }
  lines.push("");
  return lines.join("\n");
}

// ── Main ─────────────────────────────────────────────────────

function main(): void {
  const argv = process.argv.slice(2);
  let outDir = path.join(PLUGIN_ROOT, "engagement", "output");
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--out") {
      const value = argv[++i];
      if (!value) {
        console.error("--out needs a directory path");
        process.exit(2);
      }
      outDir = path.resolve(value);
    } else {
      console.error(`Unknown option: ${argv[i]}\n\nUsage: node dist/build_actions.js [--out DIR]`);
      process.exit(2);
    }
  }

  const ticketsDir = path.join(outDir, "tickets");
  const { briefs, errors } = readBriefs(ticketsDir);

  for (const error of errors) {
    console.error(`FORMAT ERROR ${error}`);
  }
  if (briefs.length === 0) {
    console.error(`No usable brief found in ${ticketsDir}`);
    process.exit(1);
  }

  // The date comes from the newest brief rather than from the clock, so
  // regenerating without changing anything produces an identical file.
  const generatedOn = briefs
    .map((brief) => brief.meta.updated)
    .sort()
    .slice(-1)[0];

  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, "DO-NOW.md"), renderDoNow(briefs, generatedOn), "utf8");
  fs.writeFileSync(path.join(outDir, "MESSAGES.md"), renderMessages(briefs, generatedOn), "utf8");
  fs.writeFileSync(path.join(outDir, "INDEX.md"), renderIndex(briefs, generatedOn), "utf8");

  // ACTIONS.md was the previous shape of DO-NOW.md. Leaving it behind would
  // hand the operator a stale to-do list that still looks authoritative.
  const stale = path.join(outDir, "ACTIONS.md");
  if (fs.existsSync(stale)) fs.rmSync(stale);

  const stepCount = briefs.reduce((total, brief) => total + brief.steps.length, 0);
  const messageCount = briefs.filter((brief) => brief.message).length;
  console.error(
    `Wrote DO-NOW.md, MESSAGES.md and INDEX.md from ${briefs.length} brief(s): ` +
      `${stepCount} step(s), ${messageCount} message(s)` +
      (errors.length > 0 ? `, ${errors.length} brief(s) rejected` : "")
  );
  if (errors.length > 0) process.exitCode = 1;
}

main();
