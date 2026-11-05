import { Plugin } from "@opencode/plugin";
import { getPluginState } from "./engine";
export default Plugin.define({
    id: "provider-tags",
    async setup(ctx) {
        // Optional: register /provider-tags command in server context
        if (ctx?.command?.transform) {
            try {
                await ctx.command.transform((editor) => {
                    editor.add({
                        name: "provider-tags",
                        description: "Provider Tags: model suffix disambiguation status",
                        execute: async ({ sessionID }) => {
                            const state = getPluginState();
                            const text = [
                                "🏷️ **Provider Tags (plugin)**",
                                "",
                                `• Status: **${state.enabled ? "Enabled" : "Disabled"}**`,
                                `• Configured providers: **${Object.keys(state.tags || {}).length}**`,
                                "",
                                "Open OpenCode Desktop Settings (`Cmd+,` or `Ctrl+,`) to configure provider tags.",
                            ].join("\n");
                            if (ctx.session?.synthetic) {
                                await ctx.session.synthetic({ sessionID, text });
                            }
                        },
                    });
                });
            }
            catch (err) {
                console.warn("[provider-tags] Command registration skipped:", err?.message);
            }
        }
    },
});
