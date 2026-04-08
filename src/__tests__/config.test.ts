import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { loadConfig } from "../config.ts";
import { writeFileSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

function makeTempDir(): string {
  const dir = join(tmpdir(), `rg-test-${Date.now()}`);
  mkdirSync(dir, { recursive: true });
  return dir;
}

function writeConfig(dir: string, content: unknown): void {
  writeFileSync(
    join(dir, "release-guard.config.json"),
    JSON.stringify(content, null, 2)
  );
}

describe("loadConfig", () => {
  it("loads a valid config", () => {
    const dir = makeTempDir();
    try {
      writeConfig(dir, {
        baseBranch: "main",
        commands: [{ name: "Test", command: "npm test" }],
        checklist: ["Check README"],
        discordWebhook: "https://discord.com/api/webhooks/xxx/yyy",
        riskRules: {
          highRiskFiles: ["package.json"],
          mediumRiskFiles: ["Dockerfile"],
        },
      });
      const config = loadConfig(dir);
      assert.equal(config.baseBranch, "main");
      assert.equal(config.commands.length, 1);
      assert.equal(config.commands[0].name, "Test");
      assert.equal(config.checklist.length, 1);
      assert.equal(config.riskRules.highRiskFiles.length, 1);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("applies defaults for optional fields", () => {
    const dir = makeTempDir();
    try {
      writeConfig(dir, { baseBranch: "main" });
      const config = loadConfig(dir);
      assert.equal(config.baseBranch, "main");
      assert.deepEqual(config.commands, []);
      assert.deepEqual(config.checklist, []);
      assert.equal(config.discordWebhook, "");
      assert.deepEqual(config.riskRules.highRiskFiles, []);
      assert.deepEqual(config.riskRules.mediumRiskFiles, []);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("throws when config file is missing", () => {
    const dir = makeTempDir();
    try {
      assert.throws(
        () => loadConfig(dir),
        (error: Error) => {
          assert.match(error.message, /Config file not found/);
          assert.match(error.message, /release-guard init/);
          return true;
        }
      );
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("throws on invalid JSON", () => {
    const dir = makeTempDir();
    try {
      writeFileSync(
        join(dir, "release-guard.config.json"),
        "not valid json {"
      );
      assert.throws(
        () => loadConfig(dir),
        (error: Error) => {
          assert.match(error.message, /Failed to parse/);
          return true;
        }
      );
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("throws when baseBranch is missing", () => {
    const dir = makeTempDir();
    try {
      writeConfig(dir, { commands: [] });
      assert.throws(
        () => loadConfig(dir),
        (error: Error) => {
          assert.match(error.message, /Invalid config/);
          assert.match(error.message, /baseBranch/);
          return true;
        }
      );
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("throws when baseBranch is empty string", () => {
    const dir = makeTempDir();
    try {
      writeConfig(dir, { baseBranch: "" });
      assert.throws(
        () => loadConfig(dir),
        (error: Error) => {
          assert.match(error.message, /Invalid config/);
          return true;
        }
      );
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("throws when command name is empty", () => {
    const dir = makeTempDir();
    try {
      writeConfig(dir, {
        baseBranch: "main",
        commands: [{ name: "", command: "npm test" }],
      });
      assert.throws(
        () => loadConfig(dir),
        (error: Error) => {
          assert.match(error.message, /Invalid config/);
          return true;
        }
      );
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
