import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import YAML from 'yaml';
import { validateAllTags } from './validator';
const CONFIG_DIR = path.join(os.homedir(), '.config', 'opencode');
const PLUGIN_ROOT = path.join(CONFIG_DIR, 'plugins', 'provider-tags');
const OPENCODE_CONFIG_PATH = path.join(CONFIG_DIR, 'opencode.jsonc');
const SETTINGS_PATH = path.join(PLUGIN_ROOT, 'settings.json');
const CANONICAL_PATH = path.join(PLUGIN_ROOT, 'canonical-models.json');
function stripBom(str) {
    if (typeof str === 'string' && str.charCodeAt(0) === 0xFEFF) {
        return str.slice(1);
    }
    return str;
}
function parseJsonc(content) {
    const stripped = stripBom(content);
    try {
        return YAML.parse(stripped);
    }
    catch {
        return JSON.parse(stripped);
    }
}
export function formatTag(tag) {
    const trimmed = tag.trim();
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        return trimmed;
    }
    return `[${trimmed}]`;
}
export function getPluginState() {
    let settings = { enabled: true, tags: {} };
    try {
        if (fs.existsSync(SETTINGS_PATH)) {
            settings = JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf8'));
        }
    }
    catch (err) {
        console.error('[provider-tags] Failed to parse settings.json:', err);
    }
    let canonical = {};
    try {
        if (fs.existsSync(CANONICAL_PATH)) {
            canonical = JSON.parse(fs.readFileSync(CANONICAL_PATH, 'utf8'));
        }
    }
    catch (err) {
        console.error('[provider-tags] Failed to parse canonical-models.json:', err);
    }
    let config = {};
    try {
        if (fs.existsSync(OPENCODE_CONFIG_PATH)) {
            config = parseJsonc(fs.readFileSync(OPENCODE_CONFIG_PATH, 'utf8'));
        }
    }
    catch (err) {
        console.error('[provider-tags] Failed to parse opencode.jsonc:', err);
    }
    const providers = [];
    const providersObj = config.provider || config.providers || {};
    for (const [pId, pVal] of Object.entries(providersObj)) {
        if (!pVal || typeof pVal !== 'object')
            continue;
        const pRecord = pVal;
        const modelKeys = pRecord.models ? Object.keys(pRecord.models) : [];
        let sampleModelName = '';
        if (modelKeys.length > 0) {
            const firstMId = modelKeys[0];
            const mVal = pRecord.models[firstMId];
            sampleModelName = (mVal && mVal.name) || firstMId;
        }
        providers.push({
            id: pId,
            name: pRecord.name || pId,
            modelsCount: modelKeys.length,
            currentTag: settings.tags[pId] || '',
            sampleModelName,
        });
    }
    return {
        enabled: settings.enabled ?? true,
        tags: settings.tags || {},
        providers,
        errors: validateAllTags(settings.tags || {}),
    };
}
export function applySettings(newSettings) {
    const validationErrors = validateAllTags(newSettings.tags || {});
    if (Object.keys(validationErrors).length > 0) {
        return {
            success: false,
            errors: validationErrors,
            message: 'Validation errors found',
            modifiedCount: 0,
        };
    }
    let canonical = {};
    if (fs.existsSync(CANONICAL_PATH)) {
        try {
            canonical = JSON.parse(fs.readFileSync(CANONICAL_PATH, 'utf8'));
        }
        catch { }
    }
    if (!fs.existsSync(OPENCODE_CONFIG_PATH)) {
        return {
            success: false,
            errors: {},
            message: 'opencode.jsonc not found',
            modifiedCount: 0,
        };
    }
    const rawConfig = fs.readFileSync(OPENCODE_CONFIG_PATH, 'utf8');
    let config;
    try {
        config = parseJsonc(rawConfig);
    }
    catch (err) {
        return {
            success: false,
            errors: {},
            message: `Failed to parse opencode.jsonc: ${err.message}`,
            modifiedCount: 0,
        };
    }
    // Backup
    try {
        fs.writeFileSync(`${OPENCODE_CONFIG_PATH}.bak-before-apply`, rawConfig, 'utf8');
    }
    catch (err) {
        console.error('[provider-tags] Backup write error:', err);
    }
    const providersObj = config.provider || config.providers || {};
    let modifiedCount = 0;
    for (const [pId, pVal] of Object.entries(providersObj)) {
        if (!pVal || typeof pVal !== 'object')
            continue;
        const pRecord = pVal;
        if (!pRecord.models)
            continue;
        const tag = (newSettings.tags && newSettings.tags[pId]) ? formatTag(newSettings.tags[pId]) : '';
        for (const [mId, mVal] of Object.entries(pRecord.models)) {
            if (!mVal || typeof mVal !== 'object')
                continue;
            let baseName = canonical[pId]?.[mId];
            if (!baseName) {
                let cur = mVal.name || mId;
                baseName = cur.replace(/\s*\[[^\]]+\]$/, '').trim();
            }
            let targetName = baseName;
            if (newSettings.enabled && tag) {
                targetName = `${baseName} ${tag}`;
            }
            if (mVal.name !== targetName) {
                mVal.name = targetName;
                modifiedCount++;
            }
        }
    }
    fs.writeFileSync(OPENCODE_CONFIG_PATH, JSON.stringify(config, null, 2), 'utf8');
    fs.writeFileSync(SETTINGS_PATH, JSON.stringify(newSettings, null, 2), 'utf8');
    return {
        success: true,
        errors: {},
        message: newSettings.enabled
            ? `Settings applied! Updated models: ${modifiedCount}`
            : `Plugin disabled: models restored to canonical names (${modifiedCount} updated)`,
        modifiedCount,
    };
}
export function resetToCanonical() {
    let canonical = {};
    if (fs.existsSync(CANONICAL_PATH)) {
        try {
            canonical = JSON.parse(fs.readFileSync(CANONICAL_PATH, 'utf8'));
        }
        catch { }
    }
    if (!fs.existsSync(OPENCODE_CONFIG_PATH)) {
        return { success: false, message: 'opencode.jsonc not found', modifiedCount: 0 };
    }
    const rawConfig = fs.readFileSync(OPENCODE_CONFIG_PATH, 'utf8');
    let config;
    try {
        config = parseJsonc(rawConfig);
    }
    catch (err) {
        return { success: false, message: `Failed to read config: ${err.message}`, modifiedCount: 0 };
    }
    fs.writeFileSync(`${OPENCODE_CONFIG_PATH}.bak-before-reset`, rawConfig, 'utf8');
    const providersObj = config.provider || config.providers || {};
    let modifiedCount = 0;
    for (const [pId, pVal] of Object.entries(providersObj)) {
        if (!pVal || typeof pVal !== 'object')
            continue;
        const pRecord = pVal;
        if (!pRecord.models)
            continue;
        for (const [mId, mVal] of Object.entries(pRecord.models)) {
            if (!mVal || typeof mVal !== 'object')
                continue;
            let baseName = canonical[pId]?.[mId];
            if (!baseName) {
                let cur = mVal.name || mId;
                baseName = cur.replace(/\s*\[[^\]]+\]$/, '').trim();
            }
            if (mVal.name !== baseName) {
                mVal.name = baseName;
                modifiedCount++;
            }
        }
    }
    fs.writeFileSync(OPENCODE_CONFIG_PATH, JSON.stringify(config, null, 2), 'utf8');
    const newSettings = {
        enabled: false,
        tags: {},
    };
    fs.writeFileSync(SETTINGS_PATH, JSON.stringify(newSettings, null, 2), 'utf8');
    return {
        success: true,
        message: `All models reset to canonical names! (${modifiedCount} updated)`,
        modifiedCount,
    };
}
