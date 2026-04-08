export interface ChecklistItem {
  text: string;
  triggered: boolean;
}

/**
 * Mark checklist items as "triggered" if any changed file path
 * contains keywords from the checklist item.
 *
 * This is a simple heuristic: if the checklist mentions "migration"
 * and a file path contains "migration", the item is triggered.
 */
export function evaluateChecklist(
  checklist: string[],
  changedFilePaths: string[]
): ChecklistItem[] {
  return checklist.map((text) => {
    const keywords = extractKeywords(text);
    const triggered = keywords.length > 0 && changedFilePaths.some((filePath) => {
      const normalizedPath = filePath.toLowerCase().replace(/\\/g, "/");
      return keywords.some((kw) => normalizedPath.includes(kw));
    });
    return { text, triggered };
  });
}

/**
 * Extract meaningful keywords from a checklist item.
 * Filters out common stop words and short words.
 */
function extractKeywords(text: string): string[] {
  const stopWords = new Set([
    "是否", "已", "需要", "是", "否", "有", "无", "的", "了", "和",
    "has", "have", "is", "are", "the", "a", "an", "been", "was",
    "should", "need", "check", "review", "update", "verify",
  ]);

  return text
    .toLowerCase()
    .replace(/[^\w\u4e00-\u9fff\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stopWords.has(w));
}
