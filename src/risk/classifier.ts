export type RiskLevel = "low" | "medium" | "high";

export interface RiskResult {
  level: RiskLevel;
  reasons: string[];
}

export interface ClassifyInput {
  /** List of changed file paths */
  changedFiles: string[];
  /** Check command results: true = passed, false = failed */
  checkResults: { name: string; passed: boolean }[];
  /** Glob patterns for high-risk files */
  highRiskPatterns: string[];
  /** Glob patterns for medium-risk files */
  mediumRiskPatterns: string[];
}

/**
 * Match a file path against a list of glob-like patterns.
 * Supports:
 *  - `**\/` prefix for deep matching
 *  - `*` wildcard within a segment
 *  - Exact file name match
 */
function matchesAny(filePath: string, patterns: string[]): boolean {
  const normalized = filePath.replace(/\\/g, "/");
  for (const pattern of patterns) {
    const p = pattern.replace(/\\/g, "/");
    if (p.includes("*")) {
      const regex = patternToRegex(p);
      if (regex.test(normalized)) return true;
    } else {
      // Exact match: pattern matches full path or just the filename
      if (normalized === p) return true;
      if (normalized.endsWith("/" + p)) return true;
      // Check if filename matches
      const fileName = normalized.split("/").pop() ?? "";
      if (fileName === p) return true;
    }
  }
  return false;
}

function patternToRegex(pattern: string): RegExp {
  let regex = pattern
    .replace(/\\/g, "/")
    .replace(/[.+^${}()|[\]]/g, "\\$&")  // escape regex specials except * and ?
    .replace(/\*\*\//g, "(.+/)?")          // **/ matches any depth
    .replace(/\*\*/g, ".*")               // ** matches anything
    .replace(/\*/g, "[^/]*");             // * matches within segment
  return new RegExp("^" + regex + "$", "i");
}

/**
 * Classify risk level based on deterministic rules.
 *
 * Rules (highest priority first):
 * 1. No changes → null (caller should handle)
 * 2. High-risk files + any check failed → HIGH
 * 3. Any check failed → MEDIUM
 * 4. High-risk files + all checks passed → MEDIUM
 * 5. Medium-risk files + all checks passed → MEDIUM
 * 6. Default → LOW
 */
export function classifyRisk(input: ClassifyInput): RiskResult {
  const { changedFiles, checkResults, highRiskPatterns, mediumRiskPatterns } =
    input;

  const failedChecks = checkResults.filter((c) => !c.passed);
  const hasFailedChecks = failedChecks.length > 0;

  const highRiskFiles = changedFiles.filter((f) =>
    matchesAny(f, highRiskPatterns)
  );
  const hasHighRisk = highRiskFiles.length > 0;

  const mediumRiskFiles = changedFiles.filter((f) =>
    matchesAny(f, mediumRiskPatterns)
  );
  const hasMediumRisk = mediumRiskFiles.length > 0;

  const reasons: string[] = [];

  // Rule 2: high-risk files + check failed → HIGH
  if (hasHighRisk && hasFailedChecks) {
    reasons.push(
      `High-risk files changed: ${highRiskFiles.join(", ")}`
    );
    reasons.push(
      `Check(s) failed: ${failedChecks.map((c) => c.name).join(", ")}`
    );
    return { level: "high", reasons };
  }

  // Rule 3: any check failed → MEDIUM
  if (hasFailedChecks) {
    reasons.push(
      `Check(s) failed: ${failedChecks.map((c) => c.name).join(", ")}`
    );
    return { level: "medium", reasons };
  }

  // Rule 4: high-risk files only → MEDIUM
  if (hasHighRisk) {
    reasons.push(
      `High-risk files changed: ${highRiskFiles.join(", ")}`
    );
    return { level: "medium", reasons };
  }

  // Rule 5: medium-risk files only → MEDIUM
  if (hasMediumRisk) {
    reasons.push(
      `Medium-risk files changed: ${mediumRiskFiles.join(", ")}`
    );
    return { level: "medium", reasons };
  }

  // Rule 6: default → LOW
  reasons.push("No high-risk files detected. All checks passed.");
  return { level: "low", reasons };
}
