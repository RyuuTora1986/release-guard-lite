# Release Guard Lite

A pre-release risk checker for small teams and solo developers.

Reads your git diff, runs configured checks, classifies risk, generates a Markdown report, and pushes a summary to Discord.

## Why

- Catch risky changes before they ship
- Get a clear, shareable risk summary for every release
- Make AI-generated code changes more controllable
- Stop relying on memory for pre-release checklists

## Install

```bash
npm install -g release-guard-lite
```

Or use directly with npx:

```bash
npx release-guard-lite init
npx release-guard-lite run
```

## Quick Start

```bash
# 1. Initialize config in your project
release-guard init

# 2. Edit release-guard.config.json to match your project

# 3. Create a feature branch, make changes, then run
release-guard run
```

## What It Does

```
$ release-guard run

Release Guard Lite v0.1.0
────────────────────────────────

[1/5] Reading diff (main...HEAD)
      12 files changed, +340 -87

[2/5] Detecting risk files
      ⚠ package.json (high risk)
      ⚠ src/auth/login.ts (high risk)

[3/5] Running checks
      ✓ TypeCheck    passed (2.1s)
      ✓ Lint         passed (1.3s)
      ✗ Test         FAILED (4.7s)

[4/5] Evaluating risk
      Risk level: 🔴 HIGH
      - High-risk files changed: package.json, src/auth/login.ts
      - Check(s) failed: Test

[5/5] Generating report
      ✓ .release-guard/latest-report.md
      ✓ Discord push succeeded

────────────────────────────────
结论: 🔴 HIGH — 建议修复问题后再发版
```

## Configuration

Create `release-guard.config.json` in your project root (or run `release-guard init`):

```json
{
  "baseBranch": "main",
  "commands": [
    { "name": "TypeCheck", "command": "npx tsc --noEmit" },
    { "name": "Lint", "command": "npx eslint src/" },
    { "name": "Test", "command": "npm test" }
  ],
  "checklist": [
    "Database migration reviewed",
    "Environment variable changes communicated",
    "CHANGELOG updated"
  ],
  "discordWebhook": "https://discord.com/api/webhooks/YOUR_ID/YOUR_TOKEN",
  "riskRules": {
    "highRiskFiles": [
      "**/*.env*",
      "**/migration*/**",
      "**/auth/**",
      "**/payment/**",
      "package.json",
      "package-lock.json"
    ],
    "mediumRiskFiles": [
      "**/config/**",
      "Dockerfile",
      "docker-compose*.yml"
    ]
  }
}
```

## Risk Classification Rules

Risk is determined by **deterministic rules**, not AI guessing:

| Priority | Condition | Level |
|----------|-----------|-------|
| 1 | No changes detected | Exit (nothing to check) |
| 2 | High-risk file changed + check failed | **HIGH** |
| 3 | Any check failed | **MEDIUM** |
| 4 | High-risk file changed (checks pass) | **MEDIUM** |
| 5 | Medium-risk file changed (checks pass) | **MEDIUM** |
| 6 | Default | **LOW** |

## Exit Codes

- `0` — LOW risk
- `1` — MEDIUM or HIGH risk

This makes it easy to use in CI pipelines:

```yaml
- run: npx release-guard-lite run
```

## CI / GitHub Actions

```yaml
name: Release Guard
on:
  pull_request:
    branches: [main]

jobs:
  release-guard:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npx release-guard-lite run
```

## Output

Reports are saved to `.release-guard/latest-report.md` and optionally pushed to Discord as an embed.

## License

MIT
