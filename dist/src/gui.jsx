import { Plugin, SettingsPage, Style } from "@opencode/plugin/gui";
import { ProviderTagsBridge } from "./contract";
import { I18N_CATALOG } from "./i18n";
import { SettingsView } from "./settings-view";
import { getPluginState, applySettings, resetToCanonical } from "./engine";
/* 5.2 Accent styling & 6 Gear button CSS */
const STYLES_CSS = `
.settings-nav-groups [data-slot="tabs-v2-trigger-wrapper"][data-value="provider-tags"] [data-slot="tabs-v2-trigger"] svg {
  color: #9d7cd8 !important;
}

.plugin-settings-gear-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  padding: 0;
  border-radius: 4px;
  background: transparent;
  border: none;
  color: var(--v2-text-text-muted, #8a8a8a);
  cursor: pointer;
  transition: color 0.15s ease, background-color 0.15s ease;
  flex-shrink: 0;
}
.plugin-settings-gear-btn:hover {
  color: #b392f0 !important;
  background-color: var(--v2-background-bg-layer-02, rgba(255, 255, 255, 0.08));
}
.plugin-settings-gear-btn svg {
  width: 16px;
  height: 16px;
}
`;
/* Section 6: DOM injection of gear button in Extensions -> Plugins */
function setupExtensionSettingsGearInjection(pluginId, pageId) {
    if (typeof document === "undefined")
        return;
    const GEAR_SVG = `<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7.62516 4.46094L5.05225 3.86719L3.86475 5.05469L4.4585 7.6276L2.0835 9.21094V10.7943L4.4585 12.3776L3.86475 14.9505L5.05225 16.138L7.62516 15.5443L9.2085 17.9193H10.7918L12.3752 15.5443L14.9481 16.138L16.1356 14.9505L15.5418 12.3776L17.9168 10.7943V9.21094L15.5418 7.6276L16.1356 5.05469L14.9481 3.86719L12.3752 4.46094L10.7918 2.08594H9.2085L7.62516 4.46094Z" stroke="currentColor"/><path d="M12.5002 10.0026C12.5002 11.3833 11.3809 12.5026 10.0002 12.5026C8.61945 12.5026 7.50016 11.3833 7.50016 10.0026C7.50016 8.62189 8.61945 7.5026 10.0002 7.5026C11.3809 7.5026 12.5002 8.62189 12.5002 10.0026Z" stroke="currentColor"/></svg>`;
    function navigateToSettings() {
        const trigger = document.querySelector(`.settings-nav-groups [data-slot="tabs-v2-trigger-wrapper"][data-value="${pageId}"] button, .settings-nav-groups [data-slot="tabs-v2-trigger-wrapper"][data-value="${pageId}"] [data-slot="tabs-v2-trigger"]`);
        if (trigger) {
            trigger.click();
            return;
        }
        const url = new URL(window.location.href);
        url.searchParams.set("tab", pageId);
        window.history.pushState({}, "", url.toString());
        window.dispatchEvent(new PopStateEvent("popstate"));
    }
    function injectGearButton() {
        const rows = document.querySelectorAll(".settings-extension-row");
        for (const row of Array.from(rows)) {
            const nameEl = row.querySelector(".settings-extension-name");
            if (!nameEl)
                continue;
            const text = nameEl.textContent?.trim() || "";
            if (text.includes(pluginId)) {
                const actions = row.querySelector(".settings-servers-actions");
                if (actions && !actions.querySelector(`.${pageId}-settings-btn`)) {
                    const btn = document.createElement("button");
                    btn.type = "button";
                    btn.className = `plugin-settings-gear-btn ${pageId}-settings-btn`;
                    btn.title = "Open settings";
                    btn.setAttribute("aria-label", "Open settings");
                    btn.innerHTML = GEAR_SVG;
                    btn.addEventListener("click", (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        navigateToSettings();
                    });
                    actions.insertBefore(btn, actions.firstElementChild);
                }
            }
        }
    }
    injectGearButton();
    const observer = new MutationObserver(() => injectGearButton());
    observer.observe(document.body, { childList: true, subtree: true });
}
export default Plugin.define({
    i18n: I18N_CATALOG,
    setup(ctx) {
        const bridge = ctx.main(ProviderTagsBridge);
        // Register Style
        ctx.add(Style, STYLES_CSS);
        // Register SettingsPage via factory function
        ctx.add(SettingsPage, () => ({
            id: "provider-tags",
            icon: "tag",
            title: ctx.t("settings.title"),
            render: () => (<SettingsView bridge={bridge} t={(k, p) => ctx.t(k, p)} locale={() => ctx.locale.locale()}/>),
        }));
        // Inject gear button into Extensions -> Plugins row
        setupExtensionSettingsGearInjection("provider-tags", "provider-tags");
    },
    main(ctx) {
        ctx.provide(ProviderTagsBridge, {
            getState: async () => {
                return getPluginState();
            },
            applySettings: async ({ enabled, tags }) => {
                return applySettings({ enabled, tags });
            },
            resetToCanonical: async () => {
                return resetToCanonical();
            },
        });
    },
});
