import type { RiskResult } from "./classifier.js";
import type { ChangedFile } from "../git/diff.js";

export interface CheckResultSummary {
  name: string;
  command: string;
  passed: boolean;
  output: string;
  durationMs: number;
}

export interface RiskSummary {
  risk: RiskResult;
  changedFiles: ChangedFile[];
  checkResults: CheckResultSummary[];
  checklist: string[];
  branch: string;
  baseBranch: string;
  timestamp: string;
}

export function buildSummary(params: {
  risk: RiskResult;
  changedFiles: ChangedFile[];
  checkResults: CheckResultSummary[];
  checklist: string[];
  branch: string;
  baseBranch: string;
}): RiskSummary {
  return {
    ...params,
    timestamp: new Date().toISOString(),
  };
}
