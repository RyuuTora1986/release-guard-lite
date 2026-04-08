# Coding Rules — 代码风格与工程策略

## 语言与运行时

- TypeScript，strict 模式
- Node.js 20，使用 ES modules
- 编译目标 ES2022

## 依赖管理

已批准的依赖（不需要额外说明）：
- `simple-git` — 读取 git diff
- `execa` — 执行检查命令
- `zod` — 配置校验
- `typescript` — 编译

新增任何依赖前必须：
1. 说明用途
2. 说明为什么不能用已有依赖或标准库替代
3. 确认维护状态（最近 6 个月有更新）

## 模块原则

- 一个文件只做一件事
- 函数签名明确：输入类型、输出类型都显式声明
- 不写"通用工具函数"——如果只用一次，就内联
- 不做提前抽象——等到第三次重复再抽

## 命名

- 文件名：kebab-case（如 `classifier.ts`）
- 函数名：camelCase，动词开头（如 `classifyRisk`、`runChecks`）
- 类型名：PascalCase（如 `RiskLevel`、`CheckResult`）
- 常量：UPPER_SNAKE_CASE（如 `HIGH_RISK_PATTERNS`）
- 不缩写：`command` 而非 `cmd`，`config` 而非 `cfg`（除非是行业标准缩写）

## 错误处理

- 配置文件不存在：明确报错 + 提示运行 `release-guard init`
- 配置校验失败：输出 zod 错误详情 + 指出具体字段
- git 命令失败：输出 stderr + 可能的原因
- 检查命令失败：记录为 fail，输出 stdout + stderr，不终止流程
- Discord 推送失败：输出 HTTP 状态码 + 响应体，不终止流程（报告已本地保存）
- **绝不静默吞掉错误**

## 代码风格

- 优先 `async/await`，不用 callback
- 优先 `const`，必要时 `let`，不用 `var`
- 优先提前 return，减少嵌套
- 不写空 catch 块
- 不写 `// TODO` 然后不做——要么现在做，要么不写

## 工程策略

- 先让它跑通，再补测试
- 先写最短路径，再处理边界
- 先硬编码，验证逻辑正确后再提取配置
- 不为"看起来专业"增加复杂度
