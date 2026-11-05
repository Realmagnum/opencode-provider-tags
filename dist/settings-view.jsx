import { createSignal, createMemo, onMount, For, Show } from "solid-js";
import { validateAllTags } from "./validator.js";
import { formatTag } from "./engine.js";
const DEFAULT_RECOMMENDED_TAGS = {
    antigravity: "[AG]",
    "antigravity-manager": "[AGM]",
    cpamp: "[CPAMP]",
    spiderssense: "[SS]",
    "llama-swap": "[LS]",
    polza_ai: "[Polza]",
    openrouter: "[OR]",
};
export function SettingsView(props) {
    const [loading, setLoading] = createSignal(true);
    const [enabled, setEnabled] = createSignal(true);
    const [originalEnabled, setOriginalEnabled] = createSignal(true);
    const [providers, setProviders] = createSignal([]);
    const [tags, setTags] = createSignal({});
    const [originalTags, setOriginalTags] = createSignal({});
    const [applying, setApplying] = createSignal(false);
    const [resetting, setResetting] = createSignal(false);
    const [message, setMessage] = createSignal(null);
    // Validation
    const validationErrors = createMemo(() => {
        return validateAllTags(tags(), props.t);
    });
    // Dirty check
    const isDirty = createMemo(() => {
        if (enabled() !== originalEnabled())
            return true;
        const orig = originalTags();
        const cur = tags();
        for (const p of providers()) {
            if ((orig[p.id] || "").trim() !== (cur[p.id] || "").trim()) {
                return true;
            }
        }
        return false;
    });
    const hasErrors = createMemo(() => {
        return Object.keys(validationErrors()).length > 0;
    });
    // Dynamic example tag
    const exampleTag = createMemo(() => {
        const curTags = tags();
        if (curTags["antigravity-manager"]) {
            return formatTag(curTags["antigravity-manager"]);
        }
        for (const val of Object.values(curTags)) {
            if (val && val.trim())
                return formatTag(val);
        }
        return "[AGM]";
    });
    async function loadState() {
        setLoading(true);
        try {
            const state = await props.bridge.getState({});
            setEnabled(state.enabled);
            setOriginalEnabled(state.enabled);
            setProviders([...state.providers]);
            setTags({ ...state.tags });
            setOriginalTags({ ...state.tags });
        }
        catch (err) {
            setMessage({ text: err.message || "Failed to load state", error: true });
        }
        finally {
            setLoading(false);
        }
    }
    onMount(() => {
        loadState();
    });
    function handleTagInput(providerId, value) {
        setTags((prev) => ({
            ...prev,
            [providerId]: value,
        }));
    }
    function handleAutofillDefaults() {
        setTags((prev) => {
            const updated = { ...prev };
            for (const p of providers()) {
                if (DEFAULT_RECOMMENDED_TAGS[p.id]) {
                    updated[p.id] = DEFAULT_RECOMMENDED_TAGS[p.id];
                }
            }
            return updated;
        });
        setMessage({ text: props.t("settings.table.btn.defaults") });
        setTimeout(() => setMessage(null), 3000);
    }
    async function handleApply() {
        if (hasErrors() || !isDirty())
            return;
        setApplying(true);
        setMessage(null);
        try {
            const res = await props.bridge.applySettings({
                enabled: enabled(),
                tags: tags(),
            });
            if (res.success) {
                setOriginalEnabled(enabled());
                setOriginalTags({ ...tags() });
                setMessage({ text: res.message, error: false });
            }
            else {
                setMessage({ text: res.message || "Error applying settings", error: true });
            }
        }
        catch (err) {
            setMessage({ text: err.message || "Error", error: true });
        }
        finally {
            setApplying(false);
            setTimeout(() => setMessage(null), 5000);
        }
    }
    async function handleReset() {
        if (!window.confirm(props.t("settings.confirm.reset")))
            return;
        setResetting(true);
        setMessage(null);
        try {
            const res = await props.bridge.resetToCanonical({});
            if (res.success) {
                await loadState();
                setMessage({ text: res.message, error: false });
            }
            else {
                setMessage({ text: res.message || "Error resetting models", error: true });
            }
        }
        catch (err) {
            setMessage({ text: err.message || "Error", error: true });
        }
        finally {
            setResetting(false);
            setTimeout(() => setMessage(null), 5000);
        }
    }
    return (<div style={{
            padding: "24px",
            "max-width": "840px",
            color: "var(--v2-text-text-base, #e6e8ec)",
            "font-family": "var(--font-family, sans-serif)",
        }}>
      {/* 5.3 Badge [Plugin] in header */}
      <div style={{ display: "flex", "align-items": "center", gap: "8px", "margin-bottom": "6px" }}>
        <h1 style={{
            "font-size": "20px",
            "font-weight": "600",
            margin: "0",
            color: "var(--v2-text-text-base, #ffffff)",
        }}>
          {props.t("settings.header.title")}
        </h1>
        <span style={{
            "font-size": "11px",
            "font-weight": "500",
            color: "#b392f0",
            background: "rgba(157, 124, 216, 0.15)",
            border: "1px solid rgba(157, 124, 216, 0.35)",
            "border-radius": "10px",
            padding: "1px 7px",
            "line-height": "1.4",
        }}>
          Plugin
        </span>
      </div>
      <p style={{
            "font-size": "12px",
            color: "var(--v2-text-text-muted, #8a8a8a)",
            margin: "0 0 20px 0",
        }}>
        {props.t("settings.header.desc")}
      </p>

      {/* Alert Notification */}
      <Show when={message()}>
        <div style={{
            padding: "10px 14px",
            "border-radius": "6px",
            "margin-bottom": "18px",
            "font-size": "13px",
            background: message()?.error ? "rgba(239, 68, 68, 0.12)" : "rgba(16, 185, 129, 0.12)",
            border: message()?.error ? "1px solid rgba(239, 68, 68, 0.35)" : "1px solid rgba(16, 185, 129, 0.35)",
            color: message()?.error ? "#f87171" : "#34d399",
        }}>
          {message()?.text}
        </div>
      </Show>

      {/* Example Box (single preview) */}
      <div style={{
            background: "rgba(255, 255, 255, 0.03)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            "border-radius": "8px",
            padding: "12px 16px",
            "margin-bottom": "20px",
        }}>
        <div style={{
            color: "var(--v2-text-text-muted, #8a8a8a)",
            "font-size": "11px",
            "text-transform": "uppercase",
            "font-weight": "600",
            "margin-bottom": "4px",
        }}>
          {props.t("settings.example.title")}
        </div>
        <div style={{ "font-family": "ui-monospace, monospace", "font-size": "13px", color: "#fff" }}>
          Gemini 3.8 Flash (tiered){" "}
          <Show when={enabled() && exampleTag()}>
            <span style={{ color: "#93c5fd", "font-weight": "600" }}>{exampleTag()}</span>
          </Show>
        </div>
      </div>

      {/* Switch: Enable/Disable */}
      <div style={{
            background: "rgba(255, 255, 255, 0.02)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            "border-radius": "8px",
            padding: "14px 16px",
            "margin-bottom": "20px",
            display: "flex",
            "justify-content": "space-between",
            "align-items": "center",
        }}>
        <div>
          <div style={{ "font-size": "14px", "font-weight": "500", color: "#fff" }}>
            {props.t("settings.switch.title")}
          </div>
          <div style={{ "font-size": "12px", color: "var(--v2-text-text-muted, #8a8a8a)", "margin-top": "2px" }}>
            {props.t("settings.switch.desc")}
          </div>
        </div>
        <label style={{
            position: "relative",
            display: "inline-block",
            width: "44px",
            height: "24px",
            "flex-shrink": "0",
            cursor: "pointer",
        }}>
          <input type="checkbox" checked={enabled()} onChange={(e) => setEnabled(e.currentTarget.checked)} style={{ opacity: "0", width: "0", height: "0" }}/>
          <span style={{
            position: "absolute",
            top: "0",
            left: "0",
            right: "0",
            bottom: "0",
            background: enabled() ? "#3b82f6" : "#2b2e3a",
            "border-radius": "24px",
            border: enabled() ? "1px solid #3b82f6" : "1px solid #3c4050",
            transition: "all 0.2s ease",
        }}>
            <span style={{
            position: "absolute",
            width: "16px",
            height: "16px",
            bottom: "3px",
            left: enabled() ? "23px" : "3px",
            background: "#fff",
            "border-radius": "50%",
            transition: "left 0.2s ease",
        }}/>
          </span>
        </label>
      </div>

      {/* Providers Table (3 Columns: Provider, Models, Short tag) */}
      <div style={{
            background: "rgba(255, 255, 255, 0.02)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            "border-radius": "8px",
            "margin-bottom": "20px",
            overflow: "hidden",
        }}>
        <div style={{
            padding: "12px 16px",
            "border-bottom": "1px solid rgba(255, 255, 255, 0.08)",
            display: "flex",
            "justify-content": "space-between",
            "align-items": "center",
        }}>
          <div style={{ "font-size": "13px", "font-weight": "600", color: "#fff" }}>
            {props.t("settings.table.title")}
          </div>
          <button type="button" onClick={handleAutofillDefaults} style={{
            background: "#20222a",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            color: "#e6e8ec",
            "font-size": "11px",
            padding: "4px 10px",
            "border-radius": "4px",
            cursor: "pointer",
        }}>
            {props.t("settings.table.btn.defaults")}
          </button>
        </div>

        <table style={{ width: "100%", "border-collapse": "collapse", "font-size": "13px" }}>
          <thead>
            <tr style={{
            "border-bottom": "1px solid rgba(255, 255, 255, 0.08)",
            color: "var(--v2-text-text-muted, #8a8a8a)",
            "font-size": "12px",
        }}>
              <th style={{ "text-align": "left", padding: "10px 16px" }}>
                {props.t("settings.table.col.provider")}
              </th>
              <th style={{ "text-align": "left", padding: "10px 16px", width: "90px" }}>
                {props.t("settings.table.col.models")}
              </th>
              <th style={{ "text-align": "left", padding: "10px 16px", width: "180px" }}>
                {props.t("settings.table.col.tag")}
              </th>
            </tr>
          </thead>
          <tbody>
            <Show when={!loading()} fallback={<tr>
                  <td colspan="3" style={{ "text-align": "center", padding: "24px", color: "#8a8a8a" }}>
                    {props.t("settings.table.loading")}
                  </td>
                </tr>}>
              <Show when={providers().length > 0} fallback={<tr>
                    <td colspan="3" style={{ "text-align": "center", padding: "24px", color: "#8a8a8a" }}>
                      {props.t("settings.table.empty")}
                    </td>
                  </tr>}>
                <For each={providers()}>
                  {(p) => {
            const err = () => validationErrors()[p.id];
            return (<tr style={{ "border-bottom": "1px solid rgba(255, 255, 255, 0.04)" }}>
                        <td style={{ padding: "10px 16px" }}>
                          <div style={{ "font-weight": "500", color: "#fff" }}>{p.name}</div>
                          <div style={{
                    "font-size": "11px",
                    color: "var(--v2-text-text-dim, #5c606a)",
                    "font-family": "ui-monospace, monospace",
                }}>
                            {p.id}
                          </div>
                        </td>
                        <td style={{ padding: "10px 16px" }}>
                          <span style={{
                    background: "rgba(255, 255, 255, 0.06)",
                    padding: "2px 6px",
                    "border-radius": "4px",
                    "font-size": "11px",
                    color: "#8a8a8a",
                }}>
                            {p.modelsCount}
                          </span>
                        </td>
                        <td style={{ padding: "10px 16px" }}>
                          <input type="text" value={tags()[p.id] || ""} onInput={(e) => handleTagInput(p.id, e.currentTarget.value)} placeholder="[TAG]" maxlength="14" style={{
                    background: err() ? "rgba(239, 68, 68, 0.08)" : "#101114",
                    border: err() ? "1px solid #ef4444" : "1px solid rgba(255, 255, 255, 0.12)",
                    color: "#fff",
                    padding: "6px 10px",
                    "border-radius": "6px",
                    "font-family": "ui-monospace, monospace",
                    "font-size": "13px",
                    width: "130px",
                    outline: "none",
                    transition: "border-color 0.15s ease",
                }}/>
                          <Show when={err()}>
                            <div style={{ color: "#f87171", "font-size": "11px", "margin-top": "3px" }}>
                              {err()}
                            </div>
                          </Show>
                        </td>
                      </tr>);
        }}
                </For>
              </Show>
            </Show>
          </tbody>
        </table>
      </div>

      {/* Action Bar */}
      <div style={{ display: "flex", "justify-content": "space-between", "align-items": "center", "padding-top": "4px" }}>
        <div style={{ "font-size": "12px", color: "var(--v2-text-text-muted, #8a8a8a)", display: "flex", "align-items": "center", gap: "6px" }}>
          <span style={{
            width: "8px",
            height: "8px",
            "border-radius": "50%",
            background: hasErrors() ? "#ef4444" : isDirty() ? "#f59e0b" : "#10b981",
            display: "inline-block",
        }}/>
          <span>
            {hasErrors()
            ? props.t("settings.status.errors")
            : isDirty()
                ? props.t("settings.status.dirty")
                : props.t("settings.status.clean")}
          </span>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <button type="button" disabled={resetting()} onClick={handleReset} style={{
            background: "transparent",
            border: "1px solid rgba(239, 68, 68, 0.5)",
            color: "#f87171",
            "font-size": "13px",
            "font-weight": "500",
            padding: "6px 14px",
            "border-radius": "6px",
            cursor: resetting() ? "not-allowed" : "pointer",
        }}>
            {resetting() ? props.t("settings.btn.resetting") : props.t("settings.btn.reset")}
          </button>
          <button type="button" disabled={!isDirty() || hasErrors() || applying()} onClick={handleApply} style={{
            background: "#3b82f6",
            border: "none",
            color: "#fff",
            "font-size": "13px",
            "font-weight": "500",
            padding: "6px 18px",
            "border-radius": "6px",
            cursor: !isDirty() || hasErrors() || applying() ? "not-allowed" : "pointer",
            opacity: !isDirty() || hasErrors() || applying() ? "0.5" : "1",
            transition: "opacity 0.15s ease",
        }}>
            {applying() ? props.t("settings.btn.applying") : props.t("settings.btn.apply")}
          </button>
        </div>
      </div>

      <div style={{ "margin-top": "14px", "font-size": "12px", color: "var(--v2-text-text-dim, #5c606a)", "line-height": "1.4" }}>
        {props.t("settings.help")}
      </div>
    </div>);
}
