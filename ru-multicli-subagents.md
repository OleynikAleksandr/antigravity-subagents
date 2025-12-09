# SubAgent Manager

**Расширение VS Code для управления AI Sub-агентами в CLI-инструментах (Codex CLI, Claude Code CLI).**

![Version](https://img.shields.io/badge/version-0.0.20-blue)
![VS Code](https://img.shields.io/badge/VS%20Code-1.85+-purple)
![License](https://img.shields.io/badge/license-MIT-green)

## Обзор

SubAgent Manager позволяет создавать, организовывать и разворачивать специализированных AI-ассистентов (Sub-агентов), которые работают поверх ваших существующих AI CLI-инструментов. Определите агента один раз — и разворачивайте его где угодно.

### Ключевые возможности

- **Визуальный редактор** — создание и редактирование Sub-агентов в удобном графическом интерфейсе
- **Библиотека** — персональная коллекция переиспользуемых Sub-агентов  
- **Развёртывание** — развёртывание в один клик в область проекта или глобальную область
- **Multi-CLI** — работает с Codex CLI и Claude Code CLI как с основными оркестраторами. Создаёт Sub-агентов как для Codex CLI, так и для Claude Code CLI. Требует авторизации пользователя в Codex CLI и Claude Code CLI.
- **Интерактивный диалог** — Sub-агенты поддерживают полноценное интерактивное общение, а не только одноразовые ответы
- **Slash-команды** — автоматически генерируемые Slash-команды для ручного вызова Sub-агентов:
  - Codex CLI: `/prompts:subagent-{name}` (например, `/prompts:subagent-translator`)
  - Claude Code: `/subagent-{name}` (например, `/subagent-translator`)
- **Auto-Select Command** — автоматически создаёт команду `/subagent-auto`, которая напоминает оркестратору прочитать манифест и выбрать подходящего Sub-агента (если это ещё не сделано автоматически)
- **Авто-маршрутизация (Auto-Routing)** — основной оркестратор получает глобальную инструкцию просматривать манифест Sub-агентов и автоматически делегировать задачи наиболее подходящему Sub-агенту в зависимости от его специализации
- **Импорт/Экспорт** — обмен Sub-агентами между пользователями через файлы `.subagent`

![Create SubAgent UI](docs/images/create-subagent-ui.png)

## Установка

Скачайте последний релиз `.vsix` из раздела [Releases](https://github.com/OleynikAleksandr/multicli-subagents/releases) и установите его в VS Code:

1. В VS Code: `Extensions` → `...` → `Install from VSIX...`
2. Выберите загруженный файл `.vsix`

## Быстрый старт

1. **Откройте** SubAgent Manager из Activity Bar (иконка MsA)
2. **Создайте** нового Sub-агента, указав имя, описание, триггеры и инструкции
3. **Развёртывание** — выполните развёртывание в область проекта (текущая рабочая папка) или глобальную область (все проекты)
4. **Используйте** Sub-агента через Slash-команду в Codex/Claude, или упоминая триггерные слова в диалоге с основным агентом, или просто описав задачу, соответствующую описанию Sub-агента

### Пример: Translator SubAgent

```yaml
Name: translator
Triggers: Translates text and/or files to the specified language + translate, перевод, übersetzen
Instructions: |
  You are a professional translator.
  Translate the given text to the requested language.
  Preserve formatting and technical terms.
  Save translations next to the original files with a language prefix.
```

После развёртывания используйте в Codex CLI или Claude Code CLI:

```
/subagent-translator Translate this README to French
```

## Архитектура

```
~/.subagents/           # Хранилище глобальных Sub-агентов
├── manifest.json       # Реестр развёрнутых агентов
└── {agent}/            # Директория агента
    └── {agent}.md      # Инструкции агента

~/.codex/prompts/       # Slash-команды для Codex
└── subagent-{name}.md  # Команда для отдельного агента

~/.claude/commands/     # Slash-команды для Claude  
└── subagent-{name}.md  # Команда для отдельного агента
```

## Документация

- [Changelog](CHANGELOG.md)

## Лицензия

MIT
