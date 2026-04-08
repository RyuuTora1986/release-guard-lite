# Hacker News — Show HN

**Title:** Show HN: Release Guard Lite – A 10-second pre-release risk checker CLI

**URL:** https://github.com/RyuuTora1986/release-guard-lite

**Comment (post after submission):**

Hi HN, I built this because I use AI coding tools daily and needed a quick sanity check before merging — something lighter than a full CI pipeline but more reliable than memory.

It reads your git diff, checks for changes to high-risk files (migrations, auth, env), runs your tests/lint, and classifies risk as LOW/MEDIUM/HIGH using deterministic rules (not AI).

The whole thing runs in under 10 seconds. Config is one JSON file. Output is a Markdown report + optional Discord webhook.

```
npx release-guard-lite run
```

It's MIT licensed, ~1000 lines of TypeScript, no heavy dependencies. I'd appreciate any feedback on what's useful vs. what's missing.
