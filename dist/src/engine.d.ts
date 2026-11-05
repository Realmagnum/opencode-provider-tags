import type { ProviderTagsState } from './contract';
export declare function formatTag(tag: string): string;
export declare function getPluginState(): ProviderTagsState;
export declare function applySettings(newSettings: {
    enabled: boolean;
    tags: Record<string, string>;
}): {
    success: boolean;
    errors: Record<string, string>;
    message: string;
    modifiedCount: number;
};
export declare function resetToCanonical(): {
    success: boolean;
    message: string;
    modifiedCount: number;
};
