# Usage data sources

The preview reads `account/usage/read` through the official installed Codex app-server. It uses the current user's existing Codex authentication; the extension does not read credentials or request an API key. The short-lived reader runs hidden and exits after each request. It does not restart Codex.

| Display | Account response |
| --- | --- |
| Lifetime tokens | `summary.lifetimeTokens` |
| Peak daily tokens | `summary.peakDailyTokens` (a day, not a chat) |
| Longest task | `summary.longestRunningTurnSec` |
| Current streak | `summary.currentStreakDays` |
| Longest streak | `summary.longestStreakDays` |
| Daily activity | `dailyUsageBuckets[].startDate` and `.tokens` |
| Weekly history | Sum of the supplied daily buckets for each displayed week |

These are account metrics, not estimates from this computer's retained session logs. The history chart is a visualization of token counts, not a historical quota percentage. It covers available account buckets; missing history cannot be reconstructed as official data.

The reader refreshes every five minutes. Server reporting may lag; a successful fetch is not a guarantee of instantaneous completeness. If the official response fails or changes format, the preview displays unavailable metrics rather than substituting local counters. No account usage values, thread details, credentials or personal files are shipped with the repository.

Quota remaining and the reset date continue to use the native `rate-limit-status` query, with their own freshness checks. An avatar selected manually is stored only on that computer.

The account method is experimental and compatibility can change with Codex updates. The old `usage-local.mjs` remains an isolated log-analysis utility; it no longer supplies the preview.
