import type { RiskLevel } from "../risk/classifier.js";

const RISK_COLOR = {
  low: 0x2ecc71,    // green
  medium: 0xf39c12,  // yellow
  high: 0xe74c3c,    // red
} as const;

const RISK_EMOJI = {
  low: "🟢",
  medium: "🟡",
  high: "🔴",
} as const;

interface DiscordPayload {
  riskLevel: RiskLevel;
  reasons: string[];
  branch: string;
  baseBranch: string;
  fileCount: number;
  checksPassed: number;
  checksFailed: number;
}

/**
 * Push a risk summary to a Discord webhook.
 * Uses Discord embed format for clean presentation.
 */
export async function pushToDiscord(
  webhookUrl: string,
  payload: DiscordPayload
): Promise<void> {
  if (!webhookUrl) {
    console.log("  ⚠ Discord webhook not configured, skipping push.");
    return;
  }

  const emoji = RISK_EMOJI[payload.riskLevel];
  const color = RISK_COLOR[payload.riskLevel];

  const description = [
    `**Branch:** \`${payload.branch}\` → \`${payload.baseBranch}\``,
    `**Files Changed:** ${payload.fileCount}`,
    `**Checks:** ${payload.checksPassed} passed, ${payload.checksFailed} failed`,
    "",
    "**Reasons:**",
    ...payload.reasons.map((r) => `• ${r}`),
  ].join("\n");

  // Trim to Discord's 4096 char embed description limit
  const trimmedDescription =
    description.length > 4000
      ? description.slice(0, 3997) + "..."
      : description;

  const body = {
    embeds: [
      {
        title: `${emoji} Release Guard: ${payload.riskLevel.toUpperCase()}`,
        description: trimmedDescription,
        color,
        timestamp: new Date().toISOString(),
        footer: {
          text: "Release Guard Lite",
        },
      },
    ],
  };

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const responseText = await response.text().catch(() => "(no body)");
    throw new Error(
      `Discord webhook failed (HTTP ${response.status}): ${responseText}`
    );
  }
}
