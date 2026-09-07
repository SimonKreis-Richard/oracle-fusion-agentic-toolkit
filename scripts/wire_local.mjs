#!/usr/bin/env node
// Makes this working copy active as a local plugin.
//
//   .claude/skills/<name>  ->  skills/<name>     one link per skill
//
// Skills are linked one by one rather than as a whole folder so that .claude/skills stays a real
// directory. Repository-development skills such as smoke-check live there alongside the links; they
// are versioned and are NOT part of the published plugin.
//
// Run it after cloning, and again after MOVING the folder: a link stores an absolute path, so moving
// the repository leaves the old ones dangling and the skills silently stop being discovered.
//
//   npm run wire
//
// Cross-platform. On Windows this creates NTFS junctions, which need no administrator rights.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE = path.join(ROOT, "skills");
const TARGET = path.join(ROOT, ".claude", "skills");

/** Remove a path that may be a link. Directory links need rmdir on Windows, unlink elsewhere. */
function removeLink(linkPath) {
  let stat;
  try {
    stat = fs.lstatSync(linkPath);
  } catch {
    return; // nothing there
  }
  if (!stat.isSymbolicLink()) {
    // A real directory that is not one of ours: leave it alone.
    return;
  }
  try {
    fs.unlinkSync(linkPath);
  } catch {
    fs.rmdirSync(linkPath);
  }
}

if (!fs.existsSync(SOURCE)) {
  console.error(`Missing source directory: ${SOURCE}`);
  process.exit(1);
}

fs.mkdirSync(TARGET, { recursive: true });

const skills = fs
  .readdirSync(SOURCE, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name);

for (const name of skills) {
  const link = path.join(TARGET, name);
  const target = path.join(SOURCE, name);
  removeLink(link);
  if (fs.existsSync(link)) {
    console.error(`Skipped ${name}: a real directory sits at .claude/skills/${name}`);
    continue;
  }
  fs.symlinkSync(target, link, "junction");
  console.log(`wired .claude/skills/${name} -> skills/${name}`);
}

console.log("");
console.log("Done. Open a NEW Claude Code conversation in this folder: skills are read once at");
console.log("conversation start, so an already running conversation will not see them.");
