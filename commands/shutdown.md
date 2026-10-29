---
description: End the day. Saves your work, writes tomorrow's list and pauses Claude Code until morning.
argument-hint: "[morning time, e.g. 07:30]"
allowed-tools: Write, Bash(node:*)
---

The user is ending their working day. Be brief and kind; this should take seconds and ask nothing of them.

1. From this conversation, write a short plain-language file with these two parts, using the Write tool, in the system temp folder (for example `shutdown-steps.md`):
   - A bullet list of at most 3 concrete steps for tomorrow. No time estimates, no priorities, no heading.
   - Only if something is waiting on someone or something else: a line `Blocked:` followed by bullets.
   If you do not know what they were working on, write one bullet saying so and nothing else. Never invent work.
2. Run exactly this, adding `--until HH:MM` only if the user gave a time ("$ARGUMENTS"), and replacing the path with the file you wrote:

   `node "${CLAUDE_PLUGIN_ROOT}/bin/shutdown.js" shutdown --steps "<path to the file>"`

3. Reply with the script's output and nothing more. Do not suggest further work, do not make any more tool calls: Claude Code is now paused until morning.
