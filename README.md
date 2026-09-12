<p align="center">
  <a href="README.md"><img src="docs/assets/language-en.svg" alt="English"></a>
  <a href="README.es.md"><img src="docs/assets/language-es.svg" alt="Español"></a>
  <a href="README.pt-BR.md"><img src="docs/assets/language-pt.svg" alt="Português do Brasil"></a>
</p>

![Codex Wallpapers — Your space. Your Codex.](docs/assets/hero.jpg)

**Make Codex feel like your space.** Pick your own image or video and let the colors follow. Change wallpapers from **Profile → Fondos**, then adjust brightness, transparency and rounded corners.

## One interface. A different mood.

These previews use wallpapers from a personal collection with sample content. The accent, sidebar and composer colors are generated from each wallpaper — look at the palette swatches below the message. Click any image for a closer look.

| Glass Ribbons | MacOS Style |
| :---: | :---: |
| [![Glass Ribbons](docs/assets/gallery-glass-ribbons.jpg)](docs/assets/gallery-glass-ribbons.jpg) | [![MacOS Style](docs/assets/gallery-macos-style.jpg)](docs/assets/gallery-macos-style.jpg) |
| **MacOs M3** | **Mac Baconai** |
| [![MacOs M3](docs/assets/gallery-macos-m3.jpg)](docs/assets/gallery-macos-m3.jpg) | [![Mac Baconai](docs/assets/gallery-mac-baconai.jpg)](docs/assets/gallery-mac-baconai.jpg) |
| **Red Torii** | **CHR0NIC** |
| [![Red Torii](docs/assets/gallery-red-torii.jpg)](docs/assets/gallery-red-torii.jpg) | [![CHR0NIC](docs/assets/gallery-chronic.jpg)](docs/assets/gallery-chronic.jpg) |

The gallery is a showcase, not a bundled collection. [Wallpaper credits](docs/assets/README.md).

## Your collection, one click away

![The wallpaper picker with search, previews and appearance controls](docs/assets/picker.jpg)

- **Your media:** JPG, PNG, WebP, MP4 and WebM. Videos loop silently.
- **Your colors:** automatic palettes or manual colors, with adjustable opacity and corners.
- **Your layout:** fit without stretching, saved preferences and support for additional windows.

## Get started

You need Codex Desktop for Windows, Node.js 22+, and FFmpeg/ffprobe for importing files. From this repository, run:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\windows\install.ps1
```

Open **Codex Wallpapers** from Start when you next open Codex. Pin **that shortcut** to the taskbar: it uses the locally installed official icon and launches the same Codex app with personalization. The original shortcut stays available. [Shortcut details (ES)](docs/WINDOWS.md).

Attach an image or video to your Codex agent and ask:

> Import this wallpaper into codex-wallpapers, preserve the original and check its resolution. Don't restart Codex without asking me.

Then choose it in **Profile → Fondos**. The library starts empty. **Wallpaper Engine on Steam** is a suggested source; use a local image or video you have permission to use. Workshop scenes need an image or a recorded/exported video. [Media guide (ES)](docs/MEDIA.md).

## Safety & status

**Independent, experimental project.** It applies CSS/JavaScript through local Electron debugging. It is not an official plugin or approved by OpenAI; compatibility and freedom from account restrictions are not guaranteed. [Security & scope](docs/SECURITY.en.md).

**Preview:** isolated tests and Windows shortcut checks pass. A clean-install startup still needs manual validation. If personalization fails, Codex stays open; the project never restarts it to recover.

[Agent guide (ES)](docs/AGENT.md) · [Updates (ES)](docs/UPDATES.md) · [Tests (ES)](docs/TESTING.md) · [MIT license for code](LICENSE)
