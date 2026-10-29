---
description: End the day. Saves your work, writes tomorrow's list and pauses Claude Code until morning.
argument-hint: "[morning time, e.g. 07:30]"
allowed-tools: Bash(node:*)
---

The user is ending their working day. Be brief and kind; this should take seconds and ask nothing of them.

1. From this conversation, decide what tomorrow's first moves are: at most 3 concrete next steps, in plain language. No time estimates, no priorities. If something is waiting on someone or something else, note it as blocked. If you do not know what they were working on, give no steps. Never invent work.
2. Run this one command. Add a `--step "..."` for each next step and a `--blocked "..."` for each blocked item. Add `--until HH:MM` only if the user gave a time ("$ARGUMENTS"). Keep the quoted text free of double quotes, backticks and dollar signs.

   `node "${CLAUDE_PLUGIN_ROOT}/bin/shutdown.js" shutdown --step "..." --blocked "..."`

3. Reply with the script's output and nothing more. Do not suggest further work, do not make any more tool calls: Claude Code is now paused until morning.
