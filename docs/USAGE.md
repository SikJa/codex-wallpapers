# Usage preview: what is real

The compact sidebar preview is optional. It reads the already loaded native Codex rate-limit query and scans **this computer's** Codex session logs. It does not authenticate separately, call an account API, or ship anyone's data in the repository.

| Display | Source | Boundary |
| --- | --- | --- |
| Account name and plan | Profile menu and native rate-limit query, when available | If Codex changes those fields, the preview shows “Account” or “Plan unavailable”; it does not substitute the author's name or plan. |
| Profile photo | Native avatar when exposed by Codex, or a photo chosen with the `+` button | The chosen photo is resized and stored in this app's local browser storage. It is not uploaded by this project or included in Git. |
| Remaining percentage and reset time | Native rate-limit query, refreshed while the window is visible | The preview uses the more restrictive available window and hides stale or missing values. Reset time is the corresponding native timestamp, not an estimate. |
| Observed tokens, most in one session, longest task, streaks | Local `.codex/sessions/**/*.jsonl` event counters | Approximate **local** measures. A task duration needs both start and completion events. Deleted/missing/unreadable sessions are absent. |
| Activity map and 12-week history | Daily changes in the same local token counters | Each cell/bar is computed from this computer. The scanner refreshes every five minutes and only reparses changed files. Hover/focus shows values. |
| Top chats and official weekly share by chat | Not available from the stable sources this project reads | The preview omits this breakdown. It does not fabricate chat names, counts or percentages. Open native Usage for the official account view. |

The local history is **not account-wide**: another computer, web/mobile activity and sessions deleted before installation will not appear. It also is not a billing or quota total. The native remaining percentage is a different measure; local token counts cannot be converted into a reliable remaining quota.

The launcher scans session files locally and sends only aggregate dates and numbers to its own Codex window. It does not send prompt text, chat titles, session IDs or paths into the page. No aggregate snapshot is saved in Git. If local scanning fails, Codex and the wallpaper picker continue working and the preview shows that local data is unavailable.
