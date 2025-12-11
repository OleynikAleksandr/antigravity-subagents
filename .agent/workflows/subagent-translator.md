---
description: Call SubAgent "translator" - Переводит текст в указанных файлах с одного на другой указанные языки - языки нужно указать в Task
---
# SubAgent: translator

Execute this SubAgent with the given task.

Start command:
```bash
"$SUBAGENTS_DIR/start.sh" codex translator "$TASK"
```

Resume command (if questions are asked):
```bash
"$SUBAGENTS_DIR/resume.sh" codex translator $SESSION_ID "$ANSWER"
```
