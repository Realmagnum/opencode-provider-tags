# opencode-provider-tags

[![OpenCode Desktop](https://img.shields.io/badge/OpenCode_Desktop-v2.2.0+-blue.svg?logo=electron&logoColor=white)](https://opencode.ai/)
[![OpenCode V2](https://img.shields.io/badge/OpenCode-v2.2.5+-green.svg)](https://opencode.ai/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

> **Disambiguate duplicate model names in OpenCode Desktop model picker by appending short provider tags.**  
> 🌐 *[Документация на русском языке (Russian documentation)](./README_RU.md)*

---

## 📖 Overview

When using multiple custom or local model providers in OpenCode (such as **Antigravity**, **Antigravity Manager**, **llama-swap**, **cpamp**, **OpenRouter**, **Polza.AI**), the OpenCode model selector (`Ctrl+/` or `Cmd+/`) often displays identical model names across different endpoints (e.g., several entries called `Claude Opus 4.6 (thinking)` or `Gemini 3.8 Flash (tiered)`).

**opencode-provider-tags** solves this problem by seamlessly appending short, customizable provider suffixes to model display names:
* `Gemini 3.8 Flash (tiered) [AGM]` *(Antigravity Manager)*
* `Gemini 3.8 Flash (tiered) [AG]` *(Antigravity)*
* `claude-opus-4-6-thinking [CPAMP]` *(CPAMP)*
* `Bonsai 2 27B [LS]` *(llama-swap)*

---

## ✨ Features

- **Native SolidJS Desktop Settings Page:** Integrates directly into OpenCode Desktop settings (`Cmd+,` / `Ctrl+,`) under the dedicated section **`Provider Tags (plugin)`** with an accent icon (`#9d7cd8`) and a `[Plugin]` header badge.
- **Quick Access Gear Button:** Automatically injects a `16px` settings shortcut button in `Extensions` -> `Plugins` before the `Reload` button.
- **Live Preview:** A dynamic example banner updates instantly as you type tags to show how the model name will appear in the model selector.
- **Strict Tag Validation:**
  - Length limit (max 12 characters).
  - Allowed characters: alphanumeric (`a-z`, `A-Z`, `0-9`, `А-Я`, `а-я`), `_`, `-`, space, and brackets `[]`.
  - Balanced brackets validation.
  - Automatic duplicate detection across providers with helpful conflict hints.
- **One-Click Defaults:** Pre-configured short tag presets for popular providers (`[AG]`, `[AGM]`, `[CPAMP]`, `[SS]`, `[LS]`, `[Polza]`, `[OR]`).
- **Safe Manual Application:** Modifications remain in draft mode until you explicitly click **Apply**.
- **One-Click Reset:** Instantly revert all model names to their original, canonical names with a single click.
- **Lossless JSONC Modification:** Powered by Microsoft's `jsonc-parser`, ensuring comments (`//`, `/* */`), indentation, and unrelated configuration blocks are 100% preserved.
- **External Edits & Rename Protection:** Automatically detects external model renames and updates to prevent overwriting user changes.

---

## 📦 Installation

### Option 1: Automatic local installation (Recommended)

Clone the repository into your OpenCode plugins directory:

```bash
git clone https://github.com/Realmagnum/opencode-provider-tags.git ~/.config/opencode/plugins/provider-tags
```

*(On Windows, the path is `%USERPROFILE%\.config\opencode\plugins\provider-tags`)*

OpenCode Desktop V2 automatically discovers local plugins in `~/.config/opencode/plugins/`.

### Option 2: Config registration

Alternatively, add the path to your global `~/.config/opencode/opencode.jsonc`:

```jsonc
{
  "plugin": [
    "opencode-provider-tags"
  ]
}
```

Then reload OpenCode with `Ctrl+R` or `/reload`.

---

## 🛠️ Usage

1. Open OpenCode Desktop settings (`Cmd+,` on macOS, `Ctrl+,` on Windows/Linux) or navigate via `Extensions` -> `Plugins` -> ⚙️ gear icon.
2. Select **Provider Tags (plugin)** from the sidebar.
3. Toggle the master switch **Enable suffixes for model names**.
4. Customize the short tag for each provider in the table, or click **Fill defaults**.
5. Click **Apply**. OpenCode live-reloads the configuration and your model selector immediately reflects the changes!

---

## 🏛️ Architecture & Security

- **Electron CSP / CORS Compliance:** Operates via typed IPC bridges (`Ipc.define` + `Effect Schema`) connecting the renderer window to the Electron `main` process.
- **Automatic Backup:** Before applying or resetting tags, the plugin automatically creates timestamped backups (`opencode.jsonc.bak-before-apply` / `opencode.jsonc.bak-before-reset`).
- **Orphan Pruning:** Tags belonging to removed providers are safely pruned and do not produce phantom duplicate validation errors.

---

## 📜 License

[MIT](./LICENSE) © 2026 [Realmagnum](https://github.com/Realmagnum)
