---
description: Call SubAgent "translator" - Переводит текст в указанных файлах с одного на другой указанные языки - языки нужно указать в Task
---
# SubAgent: translator

Execute this SubAgent with the given task.

Start command:
```bash
cd "/Users/oleksandroliinyk/VSCODE/antigravity-subagents/.subagents/translator" && codex exec --skip-git-repo-check --sandbox danger-full-access "First, read translator.md. Then: $TASK"
```

Resume command (if questions are asked):
```bash
cd "/Users/oleksandroliinyk/VSCODE/antigravity-subagents/.subagents/translator" && codex exec --sandbox danger-full-access resume $SESSION_ID "$ANSWER"
```
