# Testing Rules — 测试重点

## 测试策略

先让功能跑通，再补测试。但以下模块必须有测试覆盖后才能算完成。

## 必须测试的模块（按优先级）

### P0 — 核心逻辑，必须单元测试

1. **配置解析** (`config.ts`)
   - 合法配置能正确解析
   - 缺少必填字段时抛出明确错误
   - 字段类型错误时抛出明确错误
   - 空配置文件时抛出明确错误

2. **风险分级** (`risk/classifier.ts`)
   - 无改动 → 终止
   - 高风险文件 + 检查失败 → HIGH
   - 检查失败（无高风险文件）→ MEDIUM
   - 高风险文件 + 检查全过 → MEDIUM
   - 中风险文件 + 检查全过 → MEDIUM
   - 无风险文件 + 检查全过 → LOW

3. **Markdown 报告生成** (`report/markdown.ts`)
   - 生成的报告包含所有必要段落
   - 风险等级正确显示
   - 改动文件列表完整

### P1 — 重要路径，需要集成测试

4. **Diff 分析** (`git/diff.ts`)
   - 能正确获取改动文件列表
   - baseBranch 不存在时报错

5. **检查命令执行** (`checks/runner.ts`)
   - 成功命令记录为 pass
   - 失败命令记录为 fail + 输出
   - 命令超时处理

### P2 — 可延后

6. **Discord 推送** (`notify/discord.ts`) — 可用 mock webhook 测试
7. **CLI 入口** (`cli.ts`) — 端到端手动验证即可

## 测试工具

- 使用 Node.js 内置 test runner（`node:test`）+ `node:assert`
- 不引入额外测试框架（jest/vitest），除非内置 runner 明确不够用
- 测试文件放在 `src/__tests__/` 下，命名为 `*.test.ts`

## 测试原则

- 测试行为，不测试实现细节
- 一个测试只验证一件事
- 测试数据内联在测试文件中，不建外部 fixture 目录
- 不 mock 内部模块——只 mock 外部边界（git、文件系统、网络）
