#!/usr/bin/env node

import { resolve } from "node:path";
import { copyFileSync, existsSync } from "node:fs";
import { loadConfig } from "./config.js";
import { getFileDiff } from "./git/diff.js";
import { runChecks } from "./checks/runner.js";
import { evaluateChecklist } from "./checks/checklist.js";
import { classifyRisk } from "./risk/classifier.js";
import { buildSummary } from "./risk/summarize.js";
import { generateMarkdown, writeReport } from "./report/markdown.js";
import { pushToDiscord } from "./notify/discord.js";

const VERSION = "0.1.0";

interface RunFlags {
  json: boolean;
  noPush: boolean;
}

function parseFlags(args: string[]): RunFlags {
  return {
    json: args.includes("--json"),
    noPush: args.includes("--no-push"),
  };
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === "--help" || command === "-h") {
    printUsage();
    process.exit(0);
  }

  if (command === "--version" || command === "-v") {
    console.log(`release-guard v${VERSION}`);
    process.exit(0);
  }

  if (command === "init") {
    await handleInit();
  } else if (command === "run") {
    const flags = parseFlags(args.slice(1));
    await handleRun(flags);
  } else {
    console.error(`Unknown command: ${command}`);
    printUsage();
    process.exit(1);
  }
}

function printUsage(): void {
  console.log(`
Release Guard Lite v${VERSION}
A pre-release risk checker for small teams.

Usage:
  release-guard init    Create a config file in the current directory
  release-guard run     Run all checks and generate a risk report

Run options:
  --json                Output results as JSON (for CI consumption)
  --no-push             Skip Discord push (local report only)

Options:
  --help, -h            Show this help message
  --version, -v         Show version
`);
}

async function handleInit(): Promise<void> {
  const configPath = resolve(process.cwd(), "release-guard.config.json");

  if (existsSync(configPath)) {
    console.error("✗ release-guard.config.json already exists.");
    console.error("  Delete it first if you want to reinitialize.");
    process.exit(1);
  }

  // Find the template — check common locations
  const templatePaths = [
    resolve(process.cwd(), "templates", "release-guard.config.example.json"),
    resolve(
      import.meta.dirname ?? ".",
      "..",
      "templates",
      "release-guard.config.example.json"
    ),
  ];

  let templatePath: string | undefined;
  for (const tp of templatePaths) {
    if (existsSync(tp)) {
      templatePath = tp;
      break;
    }
  }

  if (templatePath) {
    copyFileSync(templatePath, configPath);
  } else {
    // Write a minimal config inline as fallback
    const { writeFileSync } = await import("node:fs");
    const minimalConfig = {
      baseBranch: "main",
      commands: [],
      checklist: [],
      discordWebhook: "",
      riskRules: {
        highRiskFiles: ["package.json", "**/*.env*"],
        mediumRiskFiles: ["Dockerfile"],
      },
    };
    writeFileSync(configPath, JSON.stringify(minimalConfig, null, 2) + "\n");
  }

  console.log("✓ Created release-guard.config.json");
  console.log("  Edit the config file, then run: release-guard run");
}

async function handleRun(flags: RunFlags): Promise<void> {
  const log = flags.json ? (..._args: unknown[]) => {} : console.log;
  const logError = flags.json ? (..._args: unknown[]) => {} : console.error;

  log(`\nRelease Guard Lite v${VERSION}`);
  log("─".repeat(40));

  // Load config
  let config;
  try {
    config = loadConfig();
  } catch (error) {
    // Config errors always print, even in --json mode
    console.error(
      `✗ ${error instanceof Error ? error.message : String(error)}`
    );
    process.exit(1);
  }

  // [1/5] Read diff
  log(`\n[1/5] Reading diff (${config.baseBranch}...HEAD)`);
  let diff;
  try {
    diff = await getFileDiff(config.baseBranch);
  } catch (error) {
    console.error(
      `✗ ${error instanceof Error ? error.message : String(error)}`
    );
    process.exit(1);
  }

  if (diff.files.length === 0) {
    if (flags.json) {
      console.log(JSON.stringify({ status: "no_changes" }));
    } else {
      log("  No changes detected. Nothing to check.");
    }
    process.exit(0);
  }

  const totalIns = diff.files.reduce((s, f) => s + f.insertions, 0);
  const totalDel = diff.files.reduce((s, f) => s + f.deletions, 0);
  log(`  ${diff.files.length} files changed, +${totalIns} -${totalDel}`);

  // [2/5] Detect risk files
  log("\n[2/5] Detecting risk files");
  const changedPaths = diff.files.map((f) => f.path);

  for (const f of changedPaths) {
    const isHigh = matchesPatterns(f, config.riskRules.highRiskFiles);
    const isMed = matchesPatterns(f, config.riskRules.mediumRiskFiles);
    if (isHigh) log(`  ⚠ ${f} (high risk)`);
    else if (isMed) log(`  △ ${f} (medium risk)`);
  }

  // [3/5] Run checks
  log("\n[3/5] Running checks");
  let checkResults: Awaited<ReturnType<typeof runChecks>>;
  if (config.commands.length === 0) {
    log("  No checks configured.");
    checkResults = [];
  } else {
    checkResults = await runChecks(config.commands, undefined, config.timeoutMs);
    for (const result of checkResults) {
      const icon = result.passed ? "✓" : "✗";
      const dur =
        result.durationMs < 1000
          ? `${result.durationMs}ms`
          : `${(result.durationMs / 1000).toFixed(1)}s`;
      log(
        `  ${icon} ${result.name.padEnd(12)} ${result.passed ? "passed" : "FAILED"} (${dur})`
      );
    }
  }

  // [4/5] Evaluate risk
  log("\n[4/5] Evaluating risk");
  const riskResult = classifyRisk({
    changedFiles: changedPaths,
    checkResults: checkResults.map((r) => ({
      name: r.name,
      passed: r.passed,
    })),
    highRiskPatterns: config.riskRules.highRiskFiles,
    mediumRiskPatterns: config.riskRules.mediumRiskFiles,
  });

  const riskEmoji =
    riskResult.level === "high"
      ? "🔴"
      : riskResult.level === "medium"
        ? "🟡"
        : "🟢";
  log(`  Risk level: ${riskEmoji} ${riskResult.level.toUpperCase()}`);
  for (const reason of riskResult.reasons) {
    log(`  - ${reason}`);
  }

  // Evaluate checklist
  const checklistItems = evaluateChecklist(config.checklist, changedPaths);

  // Build summary
  const summary = buildSummary({
    risk: riskResult,
    changedFiles: diff.files,
    checkResults: checkResults.map((r) => ({
      name: r.name,
      command: r.command,
      passed: r.passed,
      output: r.output,
      durationMs: r.durationMs,
    })),
    checklist: config.checklist,
    branch: diff.currentBranch,
    baseBranch: diff.baseBranch,
  });

  // [5/5] Generate report
  log("\n[5/5] Generating report");
  const markdown = generateMarkdown(summary, checklistItems);
  const reportPath = writeReport(markdown);
  log(`  ✓ ${reportPath}`);

  // Push to Discord (skip if --no-push)
  if (flags.noPush) {
    log("  ⚠ Discord push skipped (--no-push)");
  } else {
    try {
      await pushToDiscord(config.discordWebhook, {
        riskLevel: riskResult.level,
        reasons: riskResult.reasons,
        branch: diff.currentBranch,
        baseBranch: diff.baseBranch,
        fileCount: diff.files.length,
        checksPassed: checkResults.filter((r) => r.passed).length,
        checksFailed: checkResults.filter((r) => !r.passed).length,
      });
      if (config.discordWebhook) {
        log("  ✓ Discord push succeeded");
      }
    } catch (error) {
      logError(
        `  ✗ Discord push failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  // JSON output mode
  if (flags.json) {
    const jsonOutput = {
      version: VERSION,
      branch: diff.currentBranch,
      baseBranch: diff.baseBranch,
      timestamp: summary.timestamp,
      riskLevel: riskResult.level,
      reasons: riskResult.reasons,
      filesChanged: diff.files.length,
      insertions: totalIns,
      deletions: totalDel,
      checks: checkResults.map((r) => ({
        name: r.name,
        passed: r.passed,
        durationMs: r.durationMs,
      })),
      checklist: checklistItems.map((item) => ({
        text: item.text,
        triggered: item.triggered,
      })),
      reportPath,
    };
    console.log(JSON.stringify(jsonOutput, null, 2));
  } else {
    // Final summary
    log("\n" + "─".repeat(40));
    const conclusion =
      riskResult.level === "high"
        ? "建议修复问题后再发版"
        : riskResult.level === "medium"
          ? "建议 review 后再决定"
          : "可以发版";
    log(`结论: ${riskEmoji} ${riskResult.level.toUpperCase()} — ${conclusion}`);
  }

  // Exit code: 0 for low, 1 for medium/high
  process.exit(riskResult.level === "low" ? 0 : 1);
}

/**
 * Simple check if a file path matches any pattern (for console display only).
 * The real matching is done in classifier.ts.
 */
function matchesPatterns(filePath: string, patterns: string[]): boolean {
  const normalized = filePath.replace(/\\/g, "/").toLowerCase();
  for (const pattern of patterns) {
    const p = pattern.replace(/\\/g, "/").toLowerCase();
    if (!p.includes("*")) {
      if (normalized === p || normalized.endsWith("/" + p)) return true;
      const fileName = normalized.split("/").pop() ?? "";
      if (fileName === p) return true;
    } else {
      // Very basic glob: just check if the non-wildcard parts appear
      const parts = p.split("*").filter(Boolean);
      if (parts.every((part) => normalized.includes(part))) return true;
    }
  }
  return false;
}

main().catch((error) => {
  console.error("Unexpected error:", error);
  process.exit(1);
});
