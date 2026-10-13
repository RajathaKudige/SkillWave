#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const dist = path.join(root, "dist");

// Explicit allowlist: docs, screenshots, repository metadata, Supabase source,
// and local development files never enter the published frontend.
const frontendFiles = [
  "index.html",
  "dashboard.html",
  "roadmap.html",
  "softskills.html",
  "networking.html",
  "onboarding.html",
  "login.html",
  "signup.html",
  "forgot-password.html",
  "reset-password.html",
  "css/style.css",
  "css/home.css",
  "css/dashboard.css",
  "css/roadmap.css",
  "css/softskills.css",
  "css/networking.css",
  "css/onboarding.css",
  "css/login.css",
  "css/signup.css",
  "js/supabase-config.js",
  "js/account.js",
  "js/account-settings.js",
  "js/app.js",
  "js/auth.js",
  "js/password-recovery.js",
  "js/progress-store.js",
  "js/roadmap-data.js",
  "js/roadmap-progress.js",
  "js/roadmaps.js",
  "js/softskills.js",
  "js/networking.js"
];

function removePreviousOutput() {
  if (!dist.startsWith(`${root}${path.sep}`) || path.dirname(dist) !== root) {
    throw new Error("Refusing to clean an output path outside the repository.");
  }
  if (!fs.existsSync(dist)) return;
  const stats = fs.lstatSync(dist);
  if (stats.isSymbolicLink() || !stats.isDirectory()) {
    throw new Error("Refusing to clean dist/: expected a regular directory, not a symlink or file.");
  }
  fs.rmSync(dist, { recursive: true, force: true });
}

function validateLocalHtmlReferences() {
  const allowed = new Set(frontendFiles);
  const missing = [];
  const referencePattern = /\b(?:src|href)=["']([^"']+)["']/gi;

  for (const file of frontendFiles.filter((candidate) => candidate.endsWith(".html"))) {
    const html = fs.readFileSync(path.join(root, file), "utf8");
    for (const match of html.matchAll(referencePattern)) {
      const reference = match[1];
      if (/^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i.test(reference)) continue;
      const relativePath = decodeURIComponent(reference.split(/[?#]/, 1)[0]);
      if (!relativePath) continue;
      const resolved = path.posix.normalize(path.posix.join(path.posix.dirname(file), relativePath));
      if (!allowed.has(resolved)) {
        missing.push(`${file} references ${reference}, which is not in the deployment allowlist`);
      } else if (!fs.existsSync(path.join(root, resolved))) {
        missing.push(`${file} references missing file ${resolved}`);
      }
    }
  }

  if (missing.length) throw new Error(`Frontend reference check failed:\n- ${missing.join("\n- ")}`);
}

function collectFiles(directory, relative = "") {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const childRelative = path.posix.join(relative, entry.name);
    const childPath = path.join(directory, entry.name);
    if (entry.isSymbolicLink()) throw new Error(`Unexpected symlink in output: ${childRelative}`);
    return entry.isDirectory() ? collectFiles(childPath, childRelative) : [childRelative];
  });
}

function main() {
  validateLocalHtmlReferences();
  for (const file of frontendFiles) {
    const source = path.join(root, file);
    if (!fs.existsSync(source) || !fs.statSync(source).isFile()) {
      throw new Error(`Required frontend file is missing: ${file}`);
    }
  }

  removePreviousOutput();
  fs.mkdirSync(dist, { recursive: true });
  for (const file of frontendFiles) {
    const destination = path.join(dist, file);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.copyFileSync(path.join(root, file), destination);
  }

  const actual = collectFiles(dist).sort();
  const expected = [...frontendFiles].sort();
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error("Generated dist/ contents do not match the frontend allowlist.");
  }
  console.log(`Prepared dist/ with ${actual.length} frontend files.`);
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
