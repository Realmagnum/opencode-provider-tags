import type { ProviderTagsState } from "./contract";
export interface SettingsViewProps {
    bridge: {
        getState: (input?: {}) => Promise<ProviderTagsState>;
        applySettings: (input: {
            enabled: boolean;
            tags: Record<string, string>;
        }) => Promise<{
            success: boolean;
            message: string;
            modifiedCount: number;
            errors: Record<string, string>;
        }>;
        resetToCanonical: (input?: {}) => Promise<{
            success: boolean;
            message: string;
            modifiedCount: number;
        }>;
    };
    t: (key: string, params?: Record<string, any>) => string;
    locale: () => string;
}
export declare function SettingsView(props: SettingsViewProps): import("solid-js").JSX.Element;
