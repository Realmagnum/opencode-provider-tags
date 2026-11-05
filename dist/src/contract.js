import { Schema } from "effect";
import { Ipc } from "@opencode/plugin/gui";
export const ProviderItemSchema = Schema.Struct({
    id: Schema.String,
    name: Schema.String,
    modelsCount: Schema.Number,
    currentTag: Schema.String,
    sampleModelName: Schema.String,
});
export const ProviderTagsStateSchema = Schema.Struct({
    enabled: Schema.Boolean,
    tags: Schema.Record(Schema.String, Schema.String),
    providers: Schema.Array(ProviderItemSchema),
    errors: Schema.Record(Schema.String, Schema.String),
});
export const ApplySettingsInputSchema = Schema.Struct({
    enabled: Schema.Boolean,
    tags: Schema.Record(Schema.String, Schema.String),
});
export const ApplySettingsOutputSchema = Schema.Struct({
    success: Schema.Boolean,
    message: Schema.String,
    modifiedCount: Schema.Number,
    errors: Schema.Record(Schema.String, Schema.String),
});
export const ResetOutputSchema = Schema.Struct({
    success: Schema.Boolean,
    message: Schema.String,
    modifiedCount: Schema.Number,
});
export const ProviderTagsBridge = Ipc.define({
    id: "provider-tags.bridge",
    methods: {
        getState: {
            output: ProviderTagsStateSchema,
        },
        applySettings: {
            input: ApplySettingsInputSchema,
            output: ApplySettingsOutputSchema,
        },
        resetToCanonical: {
            output: ResetOutputSchema,
        },
    },
});
