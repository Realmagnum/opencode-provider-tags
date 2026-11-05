export const I18N_EN = {
    "settings.title": "Provider Tags (plugin)",
    "settings.header.title": "Provider Tags",
    "settings.header.desc": "Disambiguate duplicate model names in the model picker by appending short provider suffixes.",
    "settings.example.title": "Example in model picker:",
    "settings.switch.title": "Enable suffixes for model names",
    "settings.switch.desc": "Append short provider tags (e.g. [AG], [CPAMP]) to the end of displayed model names.",
    "settings.table.title": "Provider tag mapping",
    "settings.table.btn.defaults": "Fill defaults",
    "settings.table.col.provider": "Provider",
    "settings.table.col.models": "Models",
    "settings.table.col.tag": "Short tag",
    "settings.table.loading": "Loading providers...",
    "settings.table.empty": "No providers found in configuration",
    "settings.status.clean": "All settings applied",
    "settings.status.dirty": "Unsaved changes",
    "settings.status.errors": "Validation errors in tags",
    "settings.btn.reset": "Reset to canonical names",
    "settings.btn.apply": "Apply",
    "settings.btn.applying": "Applying...",
    "settings.btn.resetting": "Resetting...",
    "settings.confirm.reset": "Are you sure you want to reset all model names to their original (canonical) form?\nAll [TAG] suffixes will be removed.",
    "settings.help": "* Changes are not saved automatically. Click \"Apply\" to save changes and update opencode.jsonc. Models update live without restarting OpenCode.",
    "gear.title": "Open provider tags settings",
    "error.maxLength": "Max 12 characters",
    "error.invalidChars": "Allowed: letters, numbers, _, -, space, []",
    "error.unclosedBrackets": "Brackets [] must be closed",
    "error.duplicate": "Duplicate tag with {{other}}",
};
export const I18N_RU = {
    "settings.title": "Метки провайдеров (плагин)",
    "settings.header.title": "Метки провайдеров",
    "settings.header.desc": "Разделение дублирующихся названий моделей в меню выбора через короткие суффиксы.",
    "settings.example.title": "Пример в списке выбора моделей:",
    "settings.switch.title": "Включить суффиксы для моделей",
    "settings.switch.desc": "Добавлять короткую метку провайдера (напр. [AG], [CPAMP]) в конец отображаемого имени модели.",
    "settings.table.title": "Привязка коротких меток к провайдерам",
    "settings.table.btn.defaults": "Заполнить по умолчанию",
    "settings.table.col.provider": "Провайдер",
    "settings.table.col.models": "Моделей",
    "settings.table.col.tag": "Короткая метка",
    "settings.table.loading": "Загрузка провайдеров...",
    "settings.table.empty": "Провайдеры не найдены в конфигурации",
    "settings.status.clean": "Все настройки применены",
    "settings.status.dirty": "Есть несохраненные изменения",
    "settings.status.errors": "Есть ошибки валидации в метках",
    "settings.btn.reset": "Сбросить к каноническому виду",
    "settings.btn.apply": "Применить",
    "settings.btn.applying": "Применение...",
    "settings.btn.resetting": "Сброс...",
    "settings.confirm.reset": "Вы уверены, что хотите вернуть список моделей к первоначальному (каноническому) виду?\nВсе суффиксы [TAG] будут удалены.",
    "settings.help": "* Изменения не сохраняются автоматически. Нажмите кнопку «Применить» для обновления конфигурации opencode.jsonc. Список моделей обновится на лету без перезапуска OpenCode.",
    "gear.title": "Открыть настройки меток провайдеров",
    "error.maxLength": "Максимум 12 символов",
    "error.invalidChars": "Разрешены буквы, цифры, _, -, пробел и []",
    "error.unclosedBrackets": "Скобки [] должны быть закрыты",
    "error.duplicate": "Дубликат метки с {{other}}",
};
export const I18N_CATALOG = {
    en: I18N_EN,
    "en-us": I18N_EN,
    ru: I18N_RU,
    "ru-ru": I18N_RU,
};
export function resolveTranslation(locale, key, params) {
    const norm = (locale || "").toLowerCase().replace("_", "-");
    const lang = norm.split("-")[0] || "en";
    const dict = I18N_CATALOG[norm] || I18N_CATALOG[lang] || I18N_EN;
    const template = dict[key] ?? I18N_EN[key] ?? key;
    if (!params)
        return template;
    return template.replace(/\{\{\s*([a-zA-Z0-9_-]+)\s*\}\}/g, (_, p) => {
        return params[p] !== undefined ? String(params[p]) : `{{${p}}}`;
    });
}
