# Bundled documentation MCP server

This directory holds the documentation server the plugin depends on. It is **embedded**, not
fetched: there is no npm install of a separate package, and no sibling repository to clone.

`npm run build` at the plugin root builds it, and [`../.mcp.json`](../.mcp.json) declares it, so
Claude Code starts it on demand.

## Why it exists

It provides `fetch_oracle_page`, which returns a `docs.oracle.com` page as raw markdown.

**That is the only path to a faithful quotation.** Oracle documentation is rendered client side, so
a plain HTTP fetch returns a JavaScript shell with none of the text, and a fetch tool that
summarises the page puts an intermediate model between you and the sentence you intend to quote.
The whole method of this plugin rests on quoting Oracle verbatim with the URL, so this matters.

To **find** a page, use a web search restricted to `docs.oracle.com`. That is not this server's job
and never will be again: `search_oracle_docs`, `list_modules` and a hand-kept index of roughly 410
lines were removed in 4.0.0, because web search finds a page better than an index somebody has to
maintain. Finding is the web's job, quoting faithfully is this server's job.

## Invariants

These come from the server's original repository and still hold.

1. **`stdout` is the JSON-RPC channel. Never write to it.** Every log goes through `console.error`.
   A single `console.log` corrupts the protocol for every client. Check with
   `grep -n "console\.log" src/index.ts`, which must return nothing.
2. **No `export` in `src/index.ts`.** It is an executable, not a module.
3. **No `declaration: true`** in `tsconfig.json`. Nobody consumes types from it.
4. **The `hono` advisory reported by `npm audit` is ignored deliberately.** It is a transitive
   dependency of the MCP SDK, on HTTP paths a stdio server never executes.
5. **The requested URL leaves the machine.** The server reaches the page through Jina Reader, a
   third party. Only ever send it `docs.oracle.com` URLs, and never anything naming a client.

## Known traps

- **The cache is in memory only**, one hour, fifty entries, and it dies with the process. So a page
  that looks stale is fixed by restarting the server, which in practice means a new conversation.
  A disk cache under `~/.cache/oracle-fusion-docs` was removed in 4.0.0: it survived restarts and
  rebuilds, which made it the first cause of "the documentation did not change after my edit". If
  that folder still exists on your machine it is a leftover and can be deleted.
- **`fetch_oracle_page` truncates at 15000 characters.** A page that seems to be missing content is
  truncated, not mis-parsed. Search for `[... truncated`.
- **A page that comes back as site navigation only** was not rendered. Try another release of the
  same page (`.../24d/...`, `.../25b/...`) or a neighbouring guide. This is common and is not a bug.
- **A timeout at 25 seconds** is almost always a corporate proxy or `r.jina.ai` being unavailable,
  not the code.

## Checking it answers

From the plugin root, after `npm run build`:

```bash
printf '%s\n' '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"smoke","version":"1"}}}' '{"jsonrpc":"2.0","method":"notifications/initialized"}' '{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}' | node mcp/dist/index.js 2>/dev/null | grep -o '"name":"[a-z_]*"'
```

One line per exposed tool, with `fetch_oracle_page` present.

## At publication time

`../.mcp.json` carries a **relative** path, which is what works when the repository is opened as a
project. An **installed** plugin resolves paths differently and expects
`"args": ["${CLAUDE_PLUGIN_ROOT}/mcp/dist/index.js"]`. The variable is not substituted outside an
installation, and Node then dies on the literal string, which surfaces as `CONNECTION_CLOSED` with
no further explanation.
