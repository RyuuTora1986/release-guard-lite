---
title: "I Built a CLI That Tells You If Your Release Is Safe to Ship — In 10 Seconds"
published: false
description: "A zero-config pre-release risk checker for solo devs and small teams. Reads git diff, runs checks, classifies risk, generates reports."
tags: devops, node, typescript, productivity
cover_image: 
---

## The Problem

You're about to merge a PR. You _think_ it's safe. But did you check if any migration files changed? Did all the tests pass? Is anyone touching the auth module?

Most teams either:
1. Rely on memory (and forget things)
2. Build complex CI pipelines that take 20 minutes
3. Skip the check entirely and pray

I wanted something in between — a **10-second risk check** that runs locally or in CI.

## What I Built

[Release Guard Lite](https://github.com/RyuuTora1986/release-guard-lite) is a CLI tool that:

1. Reads your `git diff` against the base branch
2. Detects changes to high-risk files (migrations, auth, payments, env files)
3. Runs your configured checks (tests, lint, typecheck)
4. Classifies risk as **LOW** / **MEDIUM** / **HIGH** using deterministic rules
5. Generates a Markdown report and optionally pushes to Discord

```bash
# Try it in any git repo
npx release-guard-lite init
npx release-guard-lite run
```

## How It Works

The risk classification is **not AI guessing** — it's 6 deterministic rules applied in priority order:

| Condition | Risk Level |
|---|---|
| High-risk file changed + check failed | 🔴 HIGH |
| Any check failed | 🟡 MEDIUM |
| High-risk file changed (checks pass) | 🟡 MEDIUM |
| Default | 🟢 LOW |

You define which files are "high risk" in a simple JSON config:

```json
{
  "baseBranch": "main",
  "commands": [
    { "name": "TypeCheck", "command": "npx tsc --noEmit" },
    { "name": "Test", "command": "npm test" }
  ],
  "riskRules": {
    "highRiskFiles": ["**/migration*/**", "**/auth/**", "package.json"],
    "mediumRiskFiles": ["**/config/**", "Dockerfile"]
  }
}
```

## Why I Made This

I use AI coding tools (Copilot, Cursor, Claude) daily. They're fast, but they can silently touch files you didn't expect. I needed a **safety net** — something that takes 10 seconds and tells me "yes, this is safe" or "wait, look at this."

It's also useful for:
- **Solo devs** who don't have a code reviewer
- **Small teams** who want a lightweight release checklist
- **CI pipelines** — it exits with code 1 on medium/high risk, so you can block merges automatically

## CI Integration (30 seconds)

```yaml
# .github/workflows/release-guard.yml
name: Release Guard
on:
  pull_request:
    branches: [main]

jobs:
  check:
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

That's it. Every PR now gets an automatic risk assessment.

## What's Next

This is v0.1.0. The core is stable and tested (31 tests passing). I'm looking for feedback from real users before adding more features.

If you try it, I'd love to hear:
- What worked well?
- What's missing?
- Would you use this in your workflow?

**GitHub**: [RyuuTora1986/release-guard-lite](https://github.com/RyuuTora1986/release-guard-lite)  
**npm**: `npm install -g release-guard-lite`

---

_Built with TypeScript. No dependencies except simple-git, execa, and zod. MIT licensed._
