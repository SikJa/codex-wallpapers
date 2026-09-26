# Security & scope

This project is independent of OpenAI, Steam and Wallpaper Engine. It does not claim contractual permission to modify Codex or guarantee protection from account restrictions or suspension. The MIT license covers this project's code, not the OpenAI application or third-party artwork.

The shortcut enables local Electron debugging. This channel can execute JavaScript in the renderer: **never expose it to the network or share access**. The helper verifies the port owner, official package, loopback address and browser identity. These checks reduce targeting errors; debugging is not a security boundary against another local process running with the same permissions.

The profile indicator reads the existing native usage query and requests a refresh every 30 seconds when the window is visible and the data is old. It does not authenticate separately or store or export the native query. The local history scanner reads session JSONL files but uses only token counters and task boundary timestamps; it sends aggregate dates and numbers to this computer's renderer, not conversation text, titles, IDs or file paths. An optional custom profile photo is saved in local browser storage only. [Data provenance and limits](USAGE.md). Imported files are treated as media; scripts, web pages and Workshop scenes are not executed.

An app update can break selectors or behavior. Bugs can affect readability, performance or controls. If application fails, Codex stays open. No restart loop or changes to the installed Codex package are used for recovery.

Do not publish endpoint files, unchecked logs, conversations, personal paths or protected media in issues. Report the app/mod versions and minimal reproduction steps. For security reports, use a private contact channel offered by the repository maintainer.
