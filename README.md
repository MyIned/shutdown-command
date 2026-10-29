# Shutdown — a shutdown command for Claude Code

One command that ends your working day: it saves your open work, writes tomorrow's list and pauses Claude Code until morning. For anyone who uses Claude Code every day and can't find the end of it.

Built at the Claude Code Impact Lab, Dublin (29 Oct 2026), for the brief **"Take the load off: ease compression burnout"**, idea: **A shutdown command**.

## The problem: compression burnout
AI tools squeeze more work into every day, and agents never get tired, so the day never has a natural end. The cost is evenings lost to "just one more prompt", and mornings lost trying to remember what you were in the middle of.

## Who it's for
Someone who uses Claude Code daily to get real work done and has no clear stopping point. That could be a freelancer, a small-business owner, a charity volunteer or a hobbyist, not only a professional developer. You don't need to know git or what a hook is.

## How it gives time back
- **Ends the day in one command.** No tidying up, no remembering what to save.
- **Stops the evening creep.** Once you've shut down, Claude Code politely declines new requests until morning, so there's nothing to keep checking.
- **Starts tomorrow in seconds.** `/shutdown:morning` puts everything back exactly as you left it and shows your list.
- **Adds nothing.** No reminders, no alerts, no timers, no scores, no questions. The refusal is one kind line, and you can always get out of it.

## Quick start
You need [Claude Code](https://claude.com/claude-code) (2.1.275 or later) and Node 18+. Git is used if the folder is a git repo; it's optional.

```
/plugin install shutdown --marketplace MyIned/shutdown-command
```

(If that doesn't work on your version, use two steps: `/plugin marketplace add MyIned/shutdown-command`, then `/plugin install shutdown@shutdown-command`.)

At the end of your day, in Claude Code:
```
/shutdown:shutdown
```
Want a different morning time? `/shutdown:shutdown 07:30`. The default is 08:00.

Next morning:
```
/shutdown:morning
```

## What happens when you run it
1. **Saves your work.** If the folder is a git repo with unsaved changes, they're stored in a local commit called `WIP: shutdown <date>`. It is never pushed anywhere. Folders that aren't git repos are left alone.
2. **Writes `tomorrow.md`** in the folder: the files you had in progress, any `TODO`/`FIXME` notes you added, up to 3 next steps (and anything you are waiting on) that Claude writes from your conversation, and your recent work. `tomorrow.md` is kept out of git for you.
3. **Pauses Claude Code until morning.** New requests get one line, and tool calls from agents that are still running are stopped:

   > You shut down for the day. Back at 08:00.

At the morning time the pause lifts by itself. `/shutdown:morning` lifts it early with no questions, undoes the WIP commit so your files are exactly as you left them, and shows `tomorrow.md`.

Real output from the demo repo (`npm run demo:reset`):

```
Your work is saved (WIP commit c2934c8, not pushed).
Tomorrow's list is in <your project>/tomorrow.md
You shut down for the day. Back at 08:00.
```

```markdown
# Tomorrow

Saved 2026-10-29. Nothing here is urgent; it is just where you left off.

## In progress
- app.js (changed)
- src/reminders.js (new)

## Notes you left in the code
- // TODO: mark notes[id] as done and save to disk

## Next steps
- Finish completeNote so a note can be ticked off and saved
- Hook reminders.js up to the notes list

## Recent work
- Add basic notes app
```

## Undo / turn it off
- **Lift the pause now:** run `/shutdown:morning`. It always works, even while paused.
- **If that ever fails:** delete the file `pause.json` in the `.claude/shutdown` folder inside your home folder.
- **Uninstall:** `/plugin uninstall shutdown`.
- If something is wrong with the pause file, Shutdown lets everything through rather than lock you out.

## How it works
A Claude Code plugin with one small script and no dependencies.

| File | What it does |
|---|---|
| `bin/shutdown.js` | Everything real: `shutdown` (git WIP commit, `tomorrow.md`, pause file), `morning` (lift, restore, show list) and `hook` (decides whether to refuse an event) |
| `hooks/hooks.json` | Runs `hook` on every prompt (`UserPromptSubmit`) and every tool call (`PreToolUse`) |
| `commands/shutdown.md` | Asks Claude to write the next steps from your session, then runs the script |
| `commands/morning.md` | Runs `morning` |
| `.claude-plugin/` | Plugin and marketplace manifests, which is what makes the install command work |

The pause is a small file in `~/.claude/shutdown/`, so it covers every project, not just one.

## Tests
```
npm test
```
Runs the full shutdown → refused → morning cycle on a real throwaway git repo in your temp folder (with its own pause file, so your real settings are never touched). It checks the WIP commit and `tomorrow.md`, that prompts and tools are refused, that `/morning` always gets through and restores the exact working tree, that the pause lifts itself, and edge cases: not a git repo, a bad time, shutting down twice, and unreadable hook input.

To try it by hand: `npm run demo:reset` builds a demo repo with unsaved changes in `scratch/demo-repo`.

## Limitations
- It only saves the folder Claude Code was opened in, not every project you have.
- The pause is a boundary, not a lock: anyone can run `/shutdown:morning`, and you can edit your own files by hand while paused. That's deliberate.
- It stops Claude Code, not other tools or other people's machines.
- If you make new commits after shutting down, `/shutdown:morning` leaves the WIP commit in place and tells you.
- The next steps depend on Claude having context from your session; if it has none it says so rather than inventing work.

## Team
Dominic Higgins
