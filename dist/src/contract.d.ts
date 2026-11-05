import { Schema } from "effect";
import { Ipc } from "@opencode/plugin/gui";
export declare const ProviderItemSchema: Schema.Struct<{
    readonly id: Schema.String;
    readonly name: Schema.String;
    readonly modelsCount: Schema.Number;
    readonly currentTag: Schema.String;
    readonly sampleModelName: Schema.String;
}>;
export type ProviderItem = typeof ProviderItemSchema.Type;
export declare const ProviderTagsStateSchema: Schema.Struct<{
    readonly enabled: Schema.Boolean;
    readonly tags: Schema.$Record<Schema.String, Schema.String>;
    readonly providers: Schema.$Array<Schema.Struct<{
        readonly id: Schema.String;
        readonly name: Schema.String;
        readonly modelsCount: Schema.Number;
        readonly currentTag: Schema.String;
        readonly sampleModelName: Schema.String;
    }>>;
    readonly errors: Schema.$Record<Schema.String, Schema.String>;
}>;
export type ProviderTagsState = typeof ProviderTagsStateSchema.Type;
export declare const ApplySettingsInputSchema: Schema.Struct<{
    readonly enabled: Schema.Boolean;
    readonly tags: Schema.$Record<Schema.String, Schema.String>;
}>;
export declare const ApplySettingsOutputSchema: Schema.Struct<{
    readonly success: Schema.Boolean;
    readonly message: Schema.String;
    readonly modifiedCount: Schema.Number;
    readonly errors: Schema.$Record<Schema.String, Schema.String>;
}>;
export declare const ResetOutputSchema: Schema.Struct<{
    readonly success: Schema.Boolean;
    readonly message: Schema.String;
    readonly modifiedCount: Schema.Number;
}>;
export declare const ProviderTagsBridge: Ipc<{
    readonly id: "provider-tags.bridge";
    readonly methods: {
        getState: {
            output: Schema.Struct<{
                readonly enabled: Schema.Boolean;
                readonly tags: Schema.$Record<Schema.String, Schema.String>;
                readonly providers: Schema.$Array<Schema.Struct<{
                    readonly id: Schema.String;
                    readonly name: Schema.String;
                    readonly modelsCount: Schema.Number;
                    readonly currentTag: Schema.String;
                    readonly sampleModelName: Schema.String;
                }>>;
                readonly errors: Schema.$Record<Schema.String, Schema.String>;
            }>;
        };
        applySettings: {
            input: Schema.Struct<{
                readonly enabled: Schema.Boolean;
                readonly tags: Schema.$Record<Schema.String, Schema.String>;
            }>;
            output: Schema.Struct<{
                readonly success: Schema.Boolean;
                readonly message: Schema.String;
                readonly modifiedCount: Schema.Number;
                readonly errors: Schema.$Record<Schema.String, Schema.String>;
            }>;
        };
        resetToCanonical: {
            output: Schema.Struct<{
                readonly success: Schema.Boolean;
                readonly message: Schema.String;
                readonly modifiedCount: Schema.Number;
            }>;
        };
    };
}>;
