#!/usr/bin/env node
// ============================================================
// Digital Garden — Audit Engine v2
// ============================================================
// Git 驱动的工程审计系统。
//
// 原则：
//   1. Git 是唯一事实源（SSOT）
//   2. 所有时间来自 git commit timestamp
//   3. 不允许 AI 生成时间 / 推测时间 / 未来时间
//
// 运行：
//   node scripts/audit-engine.mjs          → 检查模式
//   node scripts/audit-engine.mjs --fix    → 自动修复模式
// ============================================================

import { execSync } from "child_process";
import { readFileSync, writeFileSync, readdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const AUTO_FIX = process.argv.includes("--fix");

// ── Colors ─────────────────────────────────────────────

const C = { red: "\x1b[31m", green: "\x1b[32m", yellow: "\x1b[33m", reset: "\x1b[0m", bold: "\x1b[1m" };
const ok = (s) => `${C.green}[OK]${C.reset} ${s}`;
const warn = (s) => `${C.yellow}[WARN]${C.reset} ${s}`;
const err = (s) => `${C.red}[ERROR]${C.reset} ${s}`;
const info = (s) => `${C.bold}[INFO]${C.reset} ${s}`;

// ── 1. Extract Git Log (SSOT) ───────────────────────────

function getGitLog() {
  const raw = execSync(
    'git log --format="%H|%aI|%s" --reverse',
    { cwd: ROOT, encoding: "utf8" }
  ).trim();

  if (!raw) {
    console.log(err("No git history found"));
    process.exit(1);
  }

  return raw.split("\n").map((line) => {
    const [hash, timestamp, ...msgParts] = line.split("|");
    return {
      hash: hash.trim(),
      timestamp: timestamp.trim(),
      date: new Date(timestamp.trim()),
      message: msgParts.join("|").trim(),
    };
  });
}

// ── 2. Check CHANGELOG ─────────────────────────────────

function checkChangelog(commits) {
  console.log(`\n─── CHANGELOG.md ───`);
  const path = join(ROOT, "docs", "CHANGELOG.md");
  if (!existsSync(path)) {
    console.log(err("CHANGELOG.md not found"));
    return { errors: 1, warnings: 0 };
  }

  const content = readFileSync(path, "utf8");
  const errors = [];
  const warnings = [];

  // Extract referenced commit hashes from CHANGELOG
  const refs = [...content.matchAll(/Commit：`([a-f0-9]{7,})`/g)].map((m) => m[1]);
  const gitHashes = new Set(commits.map((c) => c.hash.slice(0, 7)));

  for (const ref of refs) {
    if (!gitHashes.has(ref)) {
      // Check full length
      const fullMatch = commits.some((c) => c.hash.startsWith(ref));
      if (!fullMatch) {
        warnings.push(`CHANGELOG references unknown commit: ${ref}`);
      }
    }
  }

  // Check CHANGELOG entries are in chronological order by git time
  // Extract all commit refs and verify they appear in git order
  const refOrder = [];
  for (const ref of refs) {
    const c = commits.find((c) => c.hash.startsWith(ref));
    if (c) refOrder.push({ ref, date: c.date });
  }

  for (let i = 1; i < refOrder.length; i++) {
    if (refOrder[i].date < refOrder[i - 1].date) {
      errors.push(
        `CHANGELOG order violation: ${refOrder[i].ref} (${refOrder[i].date.toISOString()}) appears after ${refOrder[i - 1].ref} (${refOrder[i - 1].date.toISOString()})`
      );
    }
  }

  // Check for future timestamps
  const now = new Date();
  const futureRefs = refOrder.filter((r) => r.date > now);
  if (futureRefs.length > 0) {
    errors.push(`Future timestamps found: ${futureRefs.map((r) => r.ref).join(", ")}`);
  }

  if (errors.length === 0 && warnings.length === 0) {
    console.log(ok("CHANGELOG aligned with git history"));
  } else {
    warnings.forEach((w) => console.log(warn(w)));
    errors.forEach((e) => console.log(err(e)));
  }

  return { errors: errors.length, warnings: warnings.length };
}

// ── 3. Check Snapshots ─────────────────────────────────

function checkSnapshots(commits) {
  console.log(`\n─── SNAPSHOTS ───`);
  const snapDir = join(ROOT, "snapshots");
  if (!existsSync(snapDir)) {
    console.log(warn("No snapshots directory"));
    return { errors: 0, warnings: 0 };
  }

  const dirs = readdirSync(snapDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  let errors = 0;
  let warnings = 0;

  for (const dir of dirs) {
    const metaPath = join(snapDir, dir, "metadata.json");
    if (!existsSync(metaPath)) {
      console.log(warn(`${dir}: no metadata.json`));
      warnings++;
      continue;
    }

    const meta = JSON.parse(readFileSync(metaPath, "utf8"));
    const snapCommit = meta.commit;
    const snapTimestamp = meta.timestamp;
    const hasSource = !!meta.timestamp_source;

    // Check: commit referenced in metadata exists in git
    if (snapCommit) {
      const gitCommit = commits.find((c) => c.hash.startsWith(snapCommit));
      if (!gitCommit) {
        console.log(err(`${dir}: references unknown commit ${snapCommit}`));
        errors++;
        continue;
      }

      // Check: snapshot timestamp matches git timestamp
      if (snapTimestamp) {
        const snapDate = new Date(snapTimestamp);
        const gitDate = gitCommit.date;
        const diff = Math.abs(snapDate - gitDate) / 1000; // seconds

        if (diff > 300 && !hasSource) {
          // More than 5 minutes off and no explicit source
          console.log(
            warn(
              `${dir}: time mismatch — snapshot=${snapTimestamp}, git=${gitCommit.timestamp} (diff=${Math.round(diff)}s)`
            )
          );
          warnings++;

          if (AUTO_FIX) {
            meta.timestamp = gitCommit.timestamp;
            meta.timestamp_source = "git";
            meta._auto_fixed = true;
            meta._fixed_reason = "git timestamp reconciliation";
            writeFileSync(metaPath, JSON.stringify(meta, null, 2) + "\n");
            console.log(`  ${C.green}→ fixed${C.reset}`);
          }
        }
      }

      // Check: timestamp_source field exists
      if (!hasSource) {
        console.log(warn(`${dir}: missing timestamp_source field`));
        warnings++;

        if (AUTO_FIX) {
          meta.timestamp_source = "git";
          writeFileSync(metaPath, JSON.stringify(meta, null, 2) + "\n");
          console.log(`  ${C.green}→ fixed${C.reset}`);
        }
      }

      // Check: historical_reconstruction flag
      if (meta.historical_reconstruction && meta.recoverable) {
        console.log(warn(`${dir}: cannot be both historical AND recoverable`));
        warnings++;
      }
    } else {
      console.log(warn(`${dir}: no commit field in metadata`));
      warnings++;
    }
  }

  if (errors === 0 && warnings === 0) {
    console.log(ok("All snapshots valid"));
  }

  return { errors, warnings };
}

// ── 4. Check Git itself ────────────────────────────────

function checkGitIntegrity(commits) {
  console.log(`\n─── GIT INTEGRITY ───`);

  // Check: commit timestamps are monotonically increasing
  let timeErrors = 0;
  for (let i = 1; i < commits.length; i++) {
    if (commits[i].date < commits[i - 1].date) {
      console.log(
        err(
          `Time backflow: ${commits[i].hash.slice(0, 7)} (${commits[i].timestamp}) < ${commits[i - 1].hash.slice(0, 7)} (${commits[i - 1].timestamp})`
        )
      );
      timeErrors++;
    }
  }

  // Check: no future commits
  const now = new Date();
  const futureCommits = commits.filter((c) => c.date > now);
  if (futureCommits.length > 0) {
    futureCommits.forEach((c) =>
      console.log(err(`Future commit: ${c.hash.slice(0, 7)} at ${c.timestamp}`))
    );
    timeErrors += futureCommits.length;
  }

  if (timeErrors === 0) {
    console.log(ok(`Git timeline valid: ${commits.length} commits, monotonic, no future timestamps`));
  }

  return { errors: timeErrors, warnings: 0 };
}

// ── Main ───────────────────────────────────────────────

console.log(`${C.bold}=== Digital Garden Audit Engine v2 ===${C.reset}`);
console.log(info(`Mode: ${AUTO_FIX ? "AUTO-FIX" : "CHECK-ONLY"}`));
console.log(info(`Root: ${ROOT}`));

const commits = getGitLog();
console.log(info(`Git log: ${commits.length} commits loaded`));
console.log(info(`Time range: ${commits[0].timestamp} → ${commits[commits.length - 1].timestamp}`));

const r1 = checkGitIntegrity(commits);
const r2 = checkChangelog(commits);
const r3 = checkSnapshots(commits);

// ── Summary ────────────────────────────────────────────

const totalErrors = r1.errors + r2.errors + r3.errors;
const totalWarnings = r1.warnings + r2.warnings + r3.warnings;

console.log(`\n${C.bold}─── AUDIT SUMMARY ───${C.reset}`);
console.log(
  `Errors: ${totalErrors > 0 ? C.red : C.green}${totalErrors}${C.reset} | Warnings: ${totalWarnings > 0 ? C.yellow : C.green}${totalWarnings}${C.reset}`
);

if (totalErrors > 0) {
  console.log(`\n${C.red}❌ AUDIT FAILED — ${totalErrors} error(s) found${C.reset}`);
  process.exit(1);
} else if (totalWarnings > 0) {
  console.log(`\n${C.yellow}⚠️  AUDIT PASSED WITH WARNINGS — ${totalWarnings} warning(s)${C.reset}`);
  if (!AUTO_FIX) {
    console.log(`Run with --fix to auto-resolve warnings`);
  }
} else {
  console.log(`\n${C.green}✅ AUDIT PASSED — system is consistent${C.reset}`);
}
