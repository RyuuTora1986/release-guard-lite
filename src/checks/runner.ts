import { execa } from "execa";
import type { Command } from "../config.js";

export interface CheckResult {
  name: string;
  command: string;
  passed: boolean;
  output: string;
  durationMs: number;
}

/**
 * Run each command sequentially and collect results.
 * A command is "passed" if it exits with code 0.
 * Failed commands do NOT stop execution — all commands run.
 */
/**
 * Run each command sequentially and collect results.
 * A command is "passed" if it exits with code 0.
 * Failed commands do NOT stop execution — all commands run.
 *
 * @param defaultTimeoutMs - Global timeout from config (default 5 min).
 *   Per-command timeoutMs overrides this.
 */
export async function runChecks(
  commands: Command[],
  cwd?: string,
  defaultTimeoutMs: number = 300_000
): Promise<CheckResult[]> {
  const results: CheckResult[] = [];

  for (const cmd of commands) {
    const timeout = cmd.timeoutMs ?? defaultTimeoutMs;
    const start = Date.now();
    try {
      const result = await execa({
        shell: true,
        cwd: cwd ?? process.cwd(),
        reject: false,
        timeout,
      })`${cmd.command}`;

      const durationMs = Date.now() - start;
      const passed = result.exitCode === 0;
      const output = passed
        ? result.stdout
        : [result.stdout, result.stderr].filter(Boolean).join("\n");

      results.push({
        name: cmd.name,
        command: cmd.command,
        passed,
        output,
        durationMs,
      });
    } catch (error) {
      const durationMs = Date.now() - start;
      const isTimeout =
        error instanceof Error && "timedOut" in error && (error as any).timedOut;
      const message = isTimeout
        ? `Timed out after ${timeout}ms`
        : error instanceof Error
          ? error.message
          : String(error);
      results.push({
        name: cmd.name,
        command: cmd.command,
        passed: false,
        output: `Execution error: ${message}`,
        durationMs,
      });
    }
  }

  return results;
}
