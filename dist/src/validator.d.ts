export declare const TAG_CONSTRAINTS: {
    MIN_LENGTH: number;
    MAX_LENGTH: number;
    ALLOWED_PATTERN: RegExp;
};
export declare function validateTag(tag: string, t?: (k: string, p?: Record<string, any>) => string): string | null;
export declare function validateAllTags(tags: Record<string, string>, t?: (k: string, p?: Record<string, any>) => string): Record<string, string>;
