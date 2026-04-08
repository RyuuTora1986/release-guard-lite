import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { classifyRisk, type ClassifyInput } from "../risk/classifier.ts";

const HIGH_PATTERNS = ["package.json", "**/auth/**", "**/*.env*"];
const MED_PATTERNS = ["**/config/**", "Dockerfile"];

function makeInput(
  overrides: Partial<ClassifyInput> = {}
): ClassifyInput {
  return {
    changedFiles: overrides.changedFiles ?? ["src/app.ts"],
    checkResults: overrides.checkResults ?? [
      { name: "Test", passed: true },
    ],
    highRiskPatterns: overrides.highRiskPatterns ?? HIGH_PATTERNS,
    mediumRiskPatterns: overrides.mediumRiskPatterns ?? MED_PATTERNS,
  };
}

describe("classifyRisk", () => {
  it("Rule 2: high-risk files + check failed → HIGH", () => {
    const result = classifyRisk(
      makeInput({
        changedFiles: ["package.json", "src/app.ts"],
        checkResults: [{ name: "Test", passed: false }],
      })
    );
    assert.equal(result.level, "high");
    assert.ok(result.reasons.some((r) => r.includes("package.json")));
    assert.ok(result.reasons.some((r) => r.includes("Test")));
  });

  it("Rule 2: auth directory change + check failed → HIGH", () => {
    const result = classifyRisk(
      makeInput({
        changedFiles: ["src/auth/login.ts"],
        checkResults: [
          { name: "Lint", passed: true },
          { name: "Test", passed: false },
        ],
      })
    );
    assert.equal(result.level, "high");
    assert.ok(result.reasons.some((r) => r.includes("auth")));
  });

  it("Rule 3: check failed without high-risk files → MEDIUM", () => {
    const result = classifyRisk(
      makeInput({
        changedFiles: ["src/utils.ts"],
        checkResults: [{ name: "Lint", passed: false }],
      })
    );
    assert.equal(result.level, "medium");
    assert.ok(result.reasons.some((r) => r.includes("Lint")));
  });

  it("Rule 4: high-risk files + all checks passed → MEDIUM", () => {
    const result = classifyRisk(
      makeInput({
        changedFiles: ["package.json", "src/app.ts"],
        checkResults: [{ name: "Test", passed: true }],
      })
    );
    assert.equal(result.level, "medium");
    assert.ok(result.reasons.some((r) => r.includes("package.json")));
  });

  it("Rule 4: env file change → MEDIUM", () => {
    const result = classifyRisk(
      makeInput({
        changedFiles: [".env.production"],
        checkResults: [{ name: "Test", passed: true }],
      })
    );
    assert.equal(result.level, "medium");
  });

  it("Rule 5: medium-risk files + all checks passed → MEDIUM", () => {
    const result = classifyRisk(
      makeInput({
        changedFiles: ["Dockerfile"],
        checkResults: [{ name: "Test", passed: true }],
      })
    );
    assert.equal(result.level, "medium");
    assert.ok(result.reasons.some((r) => r.includes("Dockerfile")));
  });

  it("Rule 5: config directory change → MEDIUM", () => {
    const result = classifyRisk(
      makeInput({
        changedFiles: ["src/config/database.ts"],
        checkResults: [{ name: "Test", passed: true }],
      })
    );
    assert.equal(result.level, "medium");
  });

  it("Rule 6: no risk files + all checks passed → LOW", () => {
    const result = classifyRisk(
      makeInput({
        changedFiles: ["src/utils.ts", "src/app.ts"],
        checkResults: [
          { name: "Lint", passed: true },
          { name: "Test", passed: true },
        ],
      })
    );
    assert.equal(result.level, "low");
  });

  it("Rule 6: no checks configured + normal files → LOW", () => {
    const result = classifyRisk(
      makeInput({
        changedFiles: ["src/app.ts"],
        checkResults: [],
      })
    );
    assert.equal(result.level, "low");
  });

  it("multiple failed checks are all listed in reasons", () => {
    const result = classifyRisk(
      makeInput({
        changedFiles: ["src/app.ts"],
        checkResults: [
          { name: "Lint", passed: false },
          { name: "Test", passed: false },
        ],
      })
    );
    assert.equal(result.level, "medium");
    assert.ok(result.reasons.some((r) => r.includes("Lint")));
    assert.ok(result.reasons.some((r) => r.includes("Test")));
  });

  it("high-risk takes precedence over medium-risk", () => {
    const result = classifyRisk(
      makeInput({
        changedFiles: ["package.json", "Dockerfile"],
        checkResults: [{ name: "Test", passed: true }],
      })
    );
    // package.json is high-risk → should be MEDIUM (rule 4), not LOW
    assert.equal(result.level, "medium");
    assert.ok(result.reasons.some((r) => r.includes("package.json")));
  });

  // Windows path compatibility
  it("Windows backslash paths match high-risk patterns", () => {
    const result = classifyRisk(
      makeInput({
        changedFiles: ["src\\auth\\login.ts"],
        checkResults: [{ name: "Test", passed: true }],
      })
    );
    assert.equal(result.level, "medium");
    assert.ok(result.reasons.some((r) => r.includes("auth")));
  });

  it("Windows backslash paths match medium-risk patterns", () => {
    const result = classifyRisk(
      makeInput({
        changedFiles: ["src\\config\\database.ts"],
        checkResults: [{ name: "Test", passed: true }],
      })
    );
    assert.equal(result.level, "medium");
  });

  it("Windows backslash env file matches high-risk", () => {
    const result = classifyRisk(
      makeInput({
        changedFiles: ["deploy\\.env.production"],
        checkResults: [{ name: "Test", passed: false }],
      })
    );
    assert.equal(result.level, "high");
  });
});
