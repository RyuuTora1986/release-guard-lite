# CLAUDE.md — Release Guard Lite

## 产品定位

Release Guard Lite 是一个极窄、可盈利的发版守门员 CLI 工具。
它在合并代码或发版前自动读取改动、执行检查、识别风险、生成 Markdown 简报、推送到 Discord。

**它不是 AI 平台，不是 DevOps 平台，不是测试框架。**

## 核心原则

1. **极窄产品边界** — 只做 CLI + 本地配置 + Markdown 报告 + Discord 推送。不做 Web UI、账号、数据库、多租户。
2. **最小闭环优先** — 先让 `release-guard run` 端到端跑通，再考虑任何扩展。
3. **确定性检查优先** — 风险判断以明确规则为主（文件模式匹配 + 命令执行结果），AI 仅作总结补充，不替代基础判断。
4. **不允许范围膨胀** — 拒绝任何"以后可能需要"的功能。每次新增功能必须回答：这是否在 MVP 5 件事之内？
5. **显式优于隐式** — 配置错误必须明确报错，命令执行失败必须显式输出，不允许静默失败或隐藏魔法。
6. **关键逻辑可测试** — 配置解析、diff 分析、风险分级、报告生成必须可以脱离 CLI 独立测试。

## MVP 范围（只做 5 件事）

1. 读取当前分支相对 baseBranch 的 git diff
2. 检测改动文件与潜在高风险文件
3. 执行配置中的检查命令
4. 生成 Markdown 风险简报到 `.release-guard/latest-report.md`
5. 将简报推送到 Discord webhook

## CLI 命令

只有两个命令：
- `release-guard init` — 生成示例配置
- `release-guard run` — 执行完整检查流程

## 技术栈

- Node.js 20, TypeScript
- simple-git, execa, zod
- Discord webhook（HTTP POST）
- 无其他重依赖

## 开发约束

- 先跑通，再精致
- 一个模块只做一件事
- 少依赖、少抽象、少层级
- 新增依赖必须先说明用途和必要性
- 避免为"看起来专业"而存在的复杂分层

## 输出约束

每次改动后必须输出：
1. 改动文件清单
2. 每个文件改了什么
3. 为什么改
4. 可能影响什么
5. 如何验证

## 细分规则

详见 `.claude/rules/` 目录：
- `scope.md` — 产品边界与反膨胀规则
- `coding.md` — 代码风格与工程策略
- `testing.md` — 测试重点
- `output.md` — 输出格式要求
