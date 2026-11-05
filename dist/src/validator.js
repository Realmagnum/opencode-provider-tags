export const TAG_CONSTRAINTS = {
    MIN_LENGTH: 1,
    MAX_LENGTH: 12,
    ALLOWED_PATTERN: /^[a-zA-Z0-9А-Яа-я_\-\s\[\]]+$/
};
export function validateTag(tag, t) {
    if (typeof tag !== 'string') {
        return 'Invalid data type';
    }
    const trimmed = tag.trim();
    if (trimmed.length < TAG_CONSTRAINTS.MIN_LENGTH) {
        return 'Tag cannot be empty';
    }
    if (trimmed.length > TAG_CONSTRAINTS.MAX_LENGTH) {
        return t ? t('error.maxLength') : `Max ${TAG_CONSTRAINTS.MAX_LENGTH} characters`;
    }
    if (!TAG_CONSTRAINTS.ALLOWED_PATTERN.test(trimmed)) {
        return t ? t('error.invalidChars') : 'Allowed: letters, numbers, _, -, space, []';
    }
    if (trimmed.includes('"') || trimmed.includes("'") || trimmed.includes('\\') || trimmed.includes('/')) {
        return 'Quotes and slashes are not allowed';
    }
    if ((trimmed.startsWith('[') && !trimmed.endsWith(']')) || (!trimmed.startsWith('[') && trimmed.endsWith(']'))) {
        return t ? t('error.unclosedBrackets') : 'Brackets [] must be closed';
    }
    return null;
}
export function validateAllTags(tags, t) {
    const errors = {};
    const seenTags = new Map(); // normalized tag -> providerId
    for (const [providerId, rawTag] of Object.entries(tags)) {
        if (!rawTag || !rawTag.trim()) {
            continue;
        }
        const singleErr = validateTag(rawTag, t);
        if (singleErr) {
            errors[providerId] = singleErr;
            continue;
        }
        const normalized = rawTag.trim().toLowerCase();
        if (seenTags.has(normalized)) {
            const otherProvider = seenTags.get(normalized);
            const dupMsg = t
                ? t('error.duplicate', { other: otherProvider })
                : `Duplicate tag with "${otherProvider}"`;
            errors[providerId] = dupMsg;
            if (!errors[otherProvider]) {
                errors[otherProvider] = t
                    ? t('error.duplicate', { other: providerId })
                    : `Duplicate tag with "${providerId}"`;
            }
        }
        else {
            seenTags.set(normalized, providerId);
        }
    }
    return errors;
}
