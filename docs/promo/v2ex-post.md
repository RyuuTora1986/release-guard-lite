# V2EX — 分享创造

**标题:** Release Guard Lite — 一个 10 秒搞定发版风险检查的 CLI 工具

**正文:**

最近做了一个小工具，解决自己发版前总是忘记检查的问题。分享给大家看看有没有用。

**痛点：**
- 用 AI 写代码（Copilot / Cursor / Claude），改了什么文件有时候自己都不清楚
- 小团队没有专门的 code review 流程
- 发版前靠记忆检查，容易漏

**Release Guard Lite 做的事情很简单：**
1. 读 git diff，看改了哪些文件
2. 检测高风险文件（数据库迁移、认证、支付、环境变量）
3. 跑你配置的检查命令（测试、lint、类型检查）
4. 给出风险等级：LOW / MEDIUM / HIGH
5. 生成 Markdown 报告，可选推送到 Discord

```bash
npx release-guard-lite init   # 生成配置
npx release-guard-lite run    # 执行检查
```

风险判断是确定性规则，不是 AI 猜测。配置就一个 JSON 文件，零学习成本。

CI 里也能用，medium/high 时退出码为 1，可以直接阻断合并。

技术栈：Node.js 20 + TypeScript + simple-git + execa + zod，没有重依赖。

MIT 开源：https://github.com/RyuuTora1986/release-guard-lite
npm: `npm install -g release-guard-lite`

欢迎反馈，特别想知道大家觉得还缺什么功能。
