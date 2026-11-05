import { Plugin } from "@opencode/plugin"
import fs from "node:fs"
import path from "node:path"
import os from "node:os"

export default Plugin.define({
  id: "provider-tags",
  async setup(ctx) {
    // Optional /provider-tags command in server context
    if (ctx?.command?.transform) {
      try {
        await ctx.command.transform((editor) => {
          editor.add({
            name: "provider-tags",
            description: "Provider Tags: model suffix disambiguation status",
            execute: async ({ sessionID }) => {
              let enabled = true
              let tagsCount = 0
              try {
                const settingsPath = path.join(
                  os.homedir(),
                  ".config",
                  "opencode",
                  "plugins",
                  "provider-tags",
                  "settings.json"
                )
                if (fs.existsSync(settingsPath)) {
                  const s = JSON.parse(fs.readFileSync(settingsPath, "utf8"))
                  enabled = s.enabled ?? true
                  tagsCount = Object.keys(s.tags || {}).length
                }
              } catch {}

              const text = [
                "🏷️ **Provider Tags (plugin)**",
                "",
                `• Status: **${enabled ? "Enabled" : "Disabled"}**`,
                `• Configured providers: **${tagsCount}**`,
                "",
                "Open OpenCode Desktop Settings (`Cmd+,` or `Ctrl+,`) to configure provider tags.",
              ].join("\n")

              if (ctx.session?.synthetic) {
                await ctx.session.synthetic({ sessionID, text })
              }
            },
          })
        })
      } catch (err: any) {
        console.warn("[provider-tags] Command registration skipped:", err?.message)
      }
    }
  },
})
