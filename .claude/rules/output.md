# Output Rules — 输出格式要求

## 每次代码改动后必须输出

无论改动大小，每次修改代码后都必须在回复中包含以下栏目：

### 1. 改动文件清单

列出所有被修改、新增、删除的文件路径。

### 2. 每个文件改了什么

用一句话说明每个文件的改动内容。

### 3. 为什么改

说明这次改动的动机——是修 bug、实现新功能、还是重构。

### 4. 可能影响什么

列出可能受影响的上下游模块或行为。如果没有影响，明确说"无影响"。

### 5. 如何验证

给出具体的验证命令或步骤，让人可以立即验证改动是否正确。

## 格式示例

```
## 改动文件清单
- src/risk/classifier.ts（修改）
- src/__tests__/classifier.test.ts（新增）

## 每个文件改了什么
- classifier.ts：新增 `classifyRisk` 函数，实现 6 条风险分级规则
- classifier.test.ts：覆盖 6 条规则的单元测试

## 为什么改
实现 MVP 核心功能——确定性风险分级。

## 可能影响什么
- risk/summarize.ts 需要消费 classifyRisk 的输出类型
- report/markdown.ts 需要展示风险等级和触发原因

## 如何验证
npx tsx --test src/__tests__/classifier.test.ts
```

## CLI 输出规范

- `release-guard run` 的控制台输出使用步骤编号 `[1/5]`...`[5/5]`
- 成功用 `✓`，失败用 `✗`，警告用 `⚠`
- 最终结论行格式：`结论: HIGH — 建议修复后再发版`
- 退出码：0 = low，1 = medium 或 high
