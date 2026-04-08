import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { generateMarkdown } from "../report/markdown.ts";
import type { RiskSummary } from "../risk/summarize.ts";
import type { ChecklistItem } from "../checks/checklist.ts";

function makeSummary(
  overrides: Partial<RiskSummary> = {}
): RiskSummary {
  return {
    risk: overrides.risk ?? { level: "low", reasons: ["All clear."] },
    changedFiles: overrides.changedFiles ?? [
      { path: "src/app.ts", insertions: 10, deletions: 2, binary: false },
    ],
    checkResults: overrides.checkResults ?? [
      {
        name: "Test",
        command: "npm test",
        passed: true,
        output: "ok",
        durationMs: 1200,
      },
    ],
    checklist: overrides.checklist ?? ["Check README"],
    branch: overrides.branch ?? "feature/foo",
    baseBranch: overrides.baseBranch ?? "main",
    timestamp: overrides.timestamp ?? "2026-04-08T12:00:00.000Z",
  };
}

describe("generateMarkdown", () => {
  it("contains all required sections", () => {
    const md = generateMarkdown(makeSummary(), [
      { text: "Check README", triggered: false },
    ]);
    assert.ok(md.includes("# Release Guard Report"));
    assert.ok(md.includes("## Overview"));
    assert.ok(md.includes("## Changed Files"));
    assert.ok(md.includes("## Check Results"));
    assert.ok(md.includes("## Risk Analysis"));
    assert.ok(md.includes("## Checklist"));
  });

  it("shows correct branch info in overview", () => {
    const md = generateMarkdown(
      makeSummary({ branch: "feat/login", baseBranch: "main" }),
      []
    );
    assert.ok(md.includes("`feat/login`"));
    assert.ok(md.includes("`main`"));
  });

  it("shows file changes with correct stats", () => {
    const md = generateMarkdown(
      makeSummary({
        changedFiles: [
          { path: "src/index.ts", insertions: 50, deletions: 10, binary: false },
          { path: "logo.png", insertions: 0, deletions: 0, binary: true },
        ],
      }),
      []
    );
    assert.ok(md.includes("`src/index.ts`"));
    assert.ok(md.includes("+50 -10"));
    assert.ok(md.includes("`logo.png`"));
    assert.ok(md.includes("binary"));
  });

  it("shows passed checks with checkmark", () => {
    const md = generateMarkdown(makeSummary(), []);
    assert.ok(md.includes("Test"));
    assert.ok(md.includes("Passed"));
  });

  it("shows failed checks with details", () => {
    const md = generateMarkdown(
      makeSummary({
        checkResults: [
          {
            name: "Lint",
            command: "npx eslint .",
            passed: false,
            output: "Error: unused variable",
            durationMs: 800,
          },
        ],
      }),
      []
    );
    assert.ok(md.includes("Failed"));
    assert.ok(md.includes("Failed Check Details"));
    assert.ok(md.includes("npx eslint ."));
    assert.ok(md.includes("unused variable"));
  });

  it("shows correct risk level with emoji", () => {
    const mdHigh = generateMarkdown(
      makeSummary({
        risk: { level: "high", reasons: ["package.json changed"] },
      }),
      []
    );
    assert.ok(mdHigh.includes("HIGH"));
    assert.ok(mdHigh.includes("package.json changed"));

    const mdLow = generateMarkdown(
      makeSummary({
        risk: { level: "low", reasons: ["All good"] },
      }),
      []
    );
    assert.ok(mdLow.includes("LOW"));
  });

  it("shows checklist items with triggered marker", () => {
    const items: ChecklistItem[] = [
      { text: "Migration reviewed", triggered: true },
      { text: "CHANGELOG updated", triggered: false },
    ];
    const md = generateMarkdown(makeSummary(), items);
    assert.ok(md.includes("Migration reviewed"));
    assert.ok(md.includes("CHANGELOG updated"));
  });

  it("handles empty changed files", () => {
    const md = generateMarkdown(
      makeSummary({ changedFiles: [] }),
      []
    );
    assert.ok(md.includes("No files changed"));
  });

  it("handles no checks configured", () => {
    const md = generateMarkdown(
      makeSummary({ checkResults: [] }),
      []
    );
    assert.ok(md.includes("No checks configured"));
  });

  it("includes footer", () => {
    const md = generateMarkdown(makeSummary(), []);
    assert.ok(md.includes("Release Guard Lite"));
  });
});
