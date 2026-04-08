import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { z } from "zod";

const DEFAULT_TIMEOUT_MS = 300_000; // 5 minutes

const CommandSchema = z.object({
  name: z.string().min(1, "command name cannot be empty"),
  command: z.string().min(1, "command string cannot be empty"),
  timeoutMs: z.number().positive().optional(),
});

const RiskRulesSchema = z.object({
  highRiskFiles: z.array(z.string()).default([]),
  mediumRiskFiles: z.array(z.string()).default([]),
});

const ConfigSchema = z.object({
  baseBranch: z.string().min(1, "baseBranch cannot be empty"),
  commands: z.array(CommandSchema).default([]),
  checklist: z.array(z.string()).default([]),
  discordWebhook: z.string().default(""),
  timeoutMs: z.number().positive().default(DEFAULT_TIMEOUT_MS),
  riskRules: RiskRulesSchema.default({
    highRiskFiles: [],
    mediumRiskFiles: [],
  }),
});

export type ReleaseGuardConfig = z.infer<typeof ConfigSchema>;
export type Command = z.infer<typeof CommandSchema>;
export type RiskRules = z.infer<typeof RiskRulesSchema>;

const CONFIG_FILENAME = "release-guard.config.json";

export function loadConfig(cwd?: string): ReleaseGuardConfig {
  const dir = cwd ?? process.cwd();
  const configPath = resolve(dir, CONFIG_FILENAME);

  if (!existsSync(configPath)) {
    throw new Error(
      `Config file not found: ${configPath}\n` +
        `Run "release-guard init" to create one.`
    );
  }

  let raw: unknown;
  try {
    const content = readFileSync(configPath, "utf-8");
    raw = JSON.parse(content);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to parse config file: ${configPath}\n${message}`);
  }

  const result = ConfigSchema.safeParse(raw);
  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    throw new Error(
      `Invalid config in ${configPath}:\n${issues}`
    );
  }

  return result.data;
}
// CI validation test
