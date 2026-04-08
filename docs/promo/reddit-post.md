# Reddit 帖子草稿

## r/node 版本

**Title:** I built a CLI that checks if your release is safe to ship — in 10 seconds

**Body:**

Hey r/node,

I built a small CLI tool called **Release Guard Lite** that reads your git diff, runs your checks (tests, lint, etc.), and gives you a risk level (LOW/MEDIUM/HIGH) before you merge.

It's useful if you:
- Work solo and don't have a code reviewer
- Use AI tools (Copilot/Cursor/Claude) and want to verify what they changed
- Want a lightweight pre-release check without building a full CI pipeline

```bash
npx release-guard-lite init   # creates config
npx release-guard-lite run    # runs the check
```

It exits with code 1 on medium/high risk, so you can plug it into CI to block risky merges.

Tech stack: Node.js 20, TypeScript, simple-git, execa, zod. No heavy deps.

GitHub: https://github.com/RyuuTora1986/release-guard-lite

Would love feedback — what would make this useful for your workflow?

---

## r/devops 版本

**Title:** Release Guard Lite — a 10-second pre-release risk checker for small teams

**Body:**

Sharing a small tool I built for pre-release risk checking. It's a CLI that:

1. Reads git diff against your base branch
2. Flags changes to high-risk files (migrations, auth, env, payments)
3. Runs your configured checks
4. Outputs LOW / MEDIUM / HIGH risk with reasons
5. Optionally pushes a summary to Discord

Risk classification is deterministic (not AI) — 6 rules in priority order. Config is a single JSON file.

Works in CI too — exits 1 on medium/high risk.

```yaml
- run: npx release-guard-lite run
```

Looking for feedback from teams who do frequent releases. What checks would you want?

GitHub: https://github.com/RyuuTora1986/release-guard-lite
