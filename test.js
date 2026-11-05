import { validateAllTags, validateTag } from './dist/validator.js';
import { getPluginState, extractBaseName } from './dist/engine.js';
import { I18N_EN, I18N_RU, resolveTranslation } from './dist/i18n.js';
import { modify, applyEdits } from 'jsonc-parser';

console.log('Testing validator...');
const valid = validateTag('[AG]');
if (valid !== null) throw new Error('Failed valid tag test');

const invalidTooLong = validateTag('TOOLONGTAG12345');
if (!invalidTooLong) throw new Error('Failed too long tag test');

const invalidChars = validateTag('[AG*]');
if (!invalidChars) throw new Error('Failed invalid chars test');

const duplicateErrors = validateAllTags({
  'antigravity': '[AG]',
  'cpamp': '[AG]'
});
if (!duplicateErrors.antigravity || !duplicateErrors.cpamp) {
  throw new Error('Failed duplicate detection test');
}

console.log('Testing i18n keys parity...');
const enKeys = Object.keys(I18N_EN).sort();
const ruKeys = Object.keys(I18N_RU).sort();
if (JSON.stringify(enKeys) !== JSON.stringify(ruKeys)) {
  throw new Error(`i18n parity mismatch! EN keys: ${enKeys.length}, RU keys: ${ruKeys.length}`);
}

const interpolated = resolveTranslation('en', 'error.duplicate', { other: 'test-prov' });
if (!interpolated.includes('test-prov')) {
  throw new Error('Interpolation failed in resolveTranslation');
}

console.log('Testing JSONC comments preservation...');
const jsoncSample = '{\n  // My plugin\n  "plugin": ["test"],\n  "provider": {\n    "p1": {\n      "models": { "m1": { "name": "Old" } }\n    }\n  }\n}';
const edits = modify(jsoncSample, ['provider', 'p1', 'models', 'm1', 'name'], 'New [TAG]', {});
const modified = applyEdits(jsoncSample, edits);
if (!modified.includes('// My plugin') || !modified.includes('"New [TAG]"')) {
  throw new Error('Failed JSONC comments preservation test');
}

console.log('Testing smart base name extraction on external rename...');
const renamed = extractBaseName('Claude Opus 4.6 Thinking', 'claude-opus', '[AGM]', 'Claude Opus 3');
if (renamed !== 'Claude Opus 4.6 Thinking') {
  throw new Error('Failed external rename detection test');
}

console.log('Testing getPluginState...');
const state = getPluginState();
if (!state.providers || state.providers.length === 0) {
  throw new Error('Failed getPluginState test');
}
console.log('State providers count:', state.providers.length);
console.log('All tests passed successfully!');
