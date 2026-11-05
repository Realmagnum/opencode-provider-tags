import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { parse as parseJsonc, modify, applyEdits } from 'jsonc-parser';
import { validateAllTags } from './validator.js';
const CONFIG_DIR = path.join(os.homedir(), '.config', 'opencode');
const PLUGIN_ROOT = path.join(CONFIG_DIR, 'plugins', 'provider-tags');
const SETTINGS_PATH = path.join(PLUGIN_ROOT, 'settings.json');
const CANONICAL_PATH = path.join(PLUGIN_ROOT, 'canonical-models.json');
export function getOpenCodeConfigPath() {
    const jsonc = path.join(CONFIG_DIR, 'opencode.jsonc');
    if (fs.existsSync(jsonc))
        return jsonc;
    const json = path.join(CONFIG_DIR, 'opencode.json');
    if (fs.existsSync(json))
        return json;
    return jsonc;
}
function stripBom(str) {
    if (typeof str === 'string' && str.charCodeAt(0) === 0xFEFF) {
        return str.slice(1);
    }
    return str;
}
export function formatTag(tag) {
    const trimmed = tag.trim();
    if (!trimmed)
        return '';
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        return trimmed;
    }
    return `[${trimmed}]`;
}
/**
 * Smart extraction of base model name:
 * 1. If ends with assigned provider tag, strip it.
 * 2. If ends with any trailing [TAG], strip it.
 * 3. Never overwrite a newer external rename with a stale cache.
 */
export function extractBaseName(currentName, modelId, currentTag, cachedCanonical) {
    const raw = (currentName || modelId).trim();
    const formattedTag = currentTag ? formatTag(currentTag) : '';
    // Case 1: Model ends with current active tag
    if (formattedTag && raw.endsWith(formattedTag)) {
        const stripped = raw.slice(0, -formattedTag.length).trim();
        if (stripped)
            return stripped;
    }
    // Case 2: Model ends with a bracketed tag [XXX]
    const bracketMatch = raw.match(/^(.*?)\s*\[([^\]]+)\]$/);
    if (bracketMatch) {
        const prefix = bracketMatch[1].trim();
        if (prefix) {
            // If we had a cached canonical name that matches prefix, return prefix
            if (cachedCanonical && cachedCanonical === prefix) {
                return prefix;
            }
            // If cached canonical matches full raw name, then the brackets were part of the real name!
            if (cachedCanonical && cachedCanonical === raw) {
                return raw;
            }
            return prefix;
        }
    }
    // Case 3: Raw name has no tag or is an external rename
    return raw;
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
    let config = {};
    const configPath = getOpenCodeConfigPath();
    if (fs.existsSync(configPath)) {
        try {
            const raw = fs.readFileSync(configPath, 'utf8');
            config = parseJsonc(stripBom(raw)) || {};
        }
        catch (err) {
            console.error('[provider-tags] Failed to parse opencode config:', err);
        }
    }
    const providersObj = config.provider || config.providers || {};
    const activeProviderIds = new Set(Object.keys(providersObj));
    // Prune orphan tags of deleted providers
    const activeTags = {};
    for (const [k, v] of Object.entries(settings.tags || {})) {
        if (activeProviderIds.has(k)) {
            activeTags[k] = v;
        }
    }
    const providers = [];
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
            currentTag: activeTags[pId] || '',
            sampleModelName,
        });
    }
    return {
        enabled: settings.enabled ?? true,
        tags: activeTags,
        providers,
        errors: validateAllTags(activeTags),
    };
}
export function applySettings(newSettings) {
    const configPath = getOpenCodeConfigPath();
    if (!fs.existsSync(configPath)) {
        return {
            success: false,
            errors: {},
            message: `${path.basename(configPath)} not found`,
            modifiedCount: 0,
        };
    }
    const rawConfig = fs.readFileSync(configPath, 'utf8');
    let config;
    try {
        config = parseJsonc(stripBom(rawConfig));
    }
    catch (err) {
        return {
            success: false,
            errors: {},
            message: `Failed to parse ${path.basename(configPath)}: ${err.message}`,
            modifiedCount: 0,
        };
    }
    const providerKey = config.provider ? 'provider' : (config.providers ? 'providers' : 'provider');
    const providersObj = config[providerKey] || {};
    const activeProviderIds = new Set(Object.keys(providersObj));
    // Prune any tags for providers that no longer exist
    const cleanTags = {};
    for (const [k, v] of Object.entries(newSettings.tags || {})) {
        if (activeProviderIds.has(k)) {
            cleanTags[k] = v;
        }
    }
    const validationErrors = validateAllTags(cleanTags);
    if (Object.keys(validationErrors).length > 0) {
        return {
            success: false,
            errors: validationErrors,
            message: 'Validation errors found',
            modifiedCount: 0,
        };
    }
    // Load existing canonical cache
    let canonical = {};
    if (fs.existsSync(CANONICAL_PATH)) {
        try {
            canonical = JSON.parse(fs.readFileSync(CANONICAL_PATH, 'utf8'));
        }
        catch { }
    }
    // Backup config before modifying
    try {
        fs.writeFileSync(`${configPath}.bak-before-apply`, rawConfig, 'utf8');
    }
    catch (err) {
        console.error('[provider-tags] Backup write error:', err);
    }
    let updatedText = rawConfig;
    let modifiedCount = 0;
    let canonicalUpdated = false;
    for (const [pId, pVal] of Object.entries(providersObj)) {
        if (!pVal || typeof pVal !== 'object')
            continue;
        const pRecord = pVal;
        if (!pRecord.models)
            continue;
        if (!canonical[pId]) {
            canonical[pId] = {};
            canonicalUpdated = true;
        }
        const tag = cleanTags[pId] ? formatTag(cleanTags[pId]) : '';
        for (const [mId, mVal] of Object.entries(pRecord.models)) {
            if (!mVal || typeof mVal !== 'object')
                continue;
            const currentName = mVal.name || mId;
            const baseName = extractBaseName(currentName, mId, tag, canonical[pId][mId]);
            // Save/update canonical name whenever new model or external rename is discovered
            if (canonical[pId][mId] !== baseName) {
                canonical[pId][mId] = baseName;
                canonicalUpdated = true;
            }
            let targetName = baseName;
            if (newSettings.enabled && tag) {
                targetName = `${baseName} ${tag}`;
            }
            if (currentName !== targetName) {
                // Precise AST modification preserving comments and formatting
                const edits = modify(updatedText, [providerKey, pId, 'models', mId, 'name'], targetName, {});
                if (edits && edits.length > 0) {
                    updatedText = applyEdits(updatedText, edits);
                    modifiedCount++;
                }
            }
        }
    }
    // Write updated config
    if (modifiedCount > 0) {
        fs.writeFileSync(configPath, updatedText, 'utf8');
    }
    if (!fs.existsSync(PLUGIN_ROOT)) {
        try {
            fs.mkdirSync(PLUGIN_ROOT, { recursive: true });
        }
        catch { }
    }
    // Persist updated canonical models
    if (canonicalUpdated) {
        try {
            fs.writeFileSync(CANONICAL_PATH, JSON.stringify(canonical, null, 2), 'utf8');
        }
        catch (err) {
            console.error('[provider-tags] Failed to write canonical cache:', err);
        }
    }
    // Save clean settings
    const finalSettings = {
        enabled: newSettings.enabled,
        tags: cleanTags,
    };
    fs.writeFileSync(SETTINGS_PATH, JSON.stringify(finalSettings, null, 2), 'utf8');
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
    const configPath = getOpenCodeConfigPath();
    if (!fs.existsSync(configPath)) {
        return { success: false, message: `${path.basename(configPath)} not found`, modifiedCount: 0 };
    }
    const rawConfig = fs.readFileSync(configPath, 'utf8');
    let config;
    try {
        config = parseJsonc(stripBom(rawConfig));
    }
    catch (err) {
        return { success: false, message: `Failed to read config: ${err.message}`, modifiedCount: 0 };
    }
    let canonical = {};
    if (fs.existsSync(CANONICAL_PATH)) {
        try {
            canonical = JSON.parse(fs.readFileSync(CANONICAL_PATH, 'utf8'));
        }
        catch { }
    }
    // Backup before reset
    try {
        fs.writeFileSync(`${configPath}.bak-before-reset`, rawConfig, 'utf8');
    }
    catch (err) {
        console.error('[provider-tags] Backup write error:', err);
    }
    const providerKey = config.provider ? 'provider' : (config.providers ? 'providers' : 'provider');
    const providersObj = config[providerKey] || {};
    let updatedText = rawConfig;
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
            const currentName = mVal.name || mId;
            const baseName = extractBaseName(currentName, mId, '', canonical[pId]?.[mId]);
            if (currentName !== baseName) {
                const edits = modify(updatedText, [providerKey, pId, 'models', mId, 'name'], baseName, {});
                if (edits && edits.length > 0) {
                    updatedText = applyEdits(updatedText, edits);
                    modifiedCount++;
                }
            }
        }
    }
    if (modifiedCount > 0) {
        fs.writeFileSync(configPath, updatedText, 'utf8');
    }
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
