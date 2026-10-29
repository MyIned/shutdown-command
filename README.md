# Shutdown — a shutdown command for Claude Code

[![test](https://github.com/MyIned/shutdown-command/actions/workflows/test.yml/badge.svg)](https://github.com/MyIned/shutdown-command/actions/workflows/test.yml)

One command that ends your working day: it saves your open work, writes tomorrow's list and pauses Claude Code until morning. For anyone who uses Claude Code every day and can't find the end of it.

Built at the Claude Code Impact Lab, Dublin (29 Oct 2026), for the brief **"Take the load off: ease compression burnout"**, idea: **A shutdown command**.

## The problem: compression burnout
AI tools squeeze more work into every day, and agents never get tired, so the day never has a natural end. The cost is evenings lost to "just one more prompt", and mornings lost trying to remember what you were in the middle of.

The brief came out of a public discussion where people, many of them not technical, described what AI is doing to their jobs and their evenings. The answer most tools give is to help you do more. Shutdown does the opposite: it gives the day an end.

## Who it's for
Someone who uses Claude Code daily to get real work done and has no clear stopping point. That could be a freelancer, a small-business owner, a charity volunteer or a hobbyist, not only a professional developer. You don't need to know git or what a hook is.

## How it gives time back
- **Ends the day in one command.** No tidying up, no remembering what to save.
- **Stops the evening creep.** Once you've shut down, Claude Code politely declines new requests until morning, so there's nothing to keep checking.
- **Keeps the weekend free.** Shut down on a Friday and the pause runs until Monday morning.
- **Starts tomorrow in seconds, with nothing to remember.** Your first message in the morning puts everything back exactly as you left it, and Claude already knows where you left off, so you don't re-explain yesterday.
- **Adds nothing.** No reminders, no alerts, no timers, no scores, no questions. The refusal is one kind line, and you can always get out of it.

## How it follows the brief's one rule
The brief's one rule is that a build has to give people time back, not help them do even more. Every part of Shutdown was checked against it:

| Part | How it could have made people work more | What Shutdown does instead |
|---|---|---|
| Saving work | Asking whether to push, or what to name the commit | Saves a local commit automatically. Never pushes, never asks |
| Tomorrow's list | A long to-do list that starts the worry early | At most 3 steps, with no time estimates and no priorities. If Claude doesn't know what you were doing, it writes no steps rather than inventing work |
| Pausing | Reminders, countdowns, "are you sure?" | One kind line, then silence. No notifications of any kind |
| The weekend | A Friday pause that lifts on Saturday morning | Lifts on Monday |
| Getting out early | Scolding, or a lock you have to fight | `/shutdown:morning` always works with no questions. It's a boundary, not a punishment |
| Morning | A dashboard or stats about yesterday, or an agent that starts on the list by itself | Your files back as you left them, plus the short list. Claude is told not to start on it unless you ask |

Things we deliberately didn't build: automatic shutdown at a set time, "hours worked" stats, streaks, reminders.

## In plain words
- **What gets saved:** the files in the folder you're working in, using git (a tool that keeps versions of files). If the folder doesn't use git, nothing is changed.
- **Where:** only on your computer. Shutdown itself never uploads, pushes or sends anything.
- **What stops:** Claude Code, in every project, until the morning time. Your computer and your other apps work as normal.
- **How to undo it:** type `/shutdown:morning` at any time.

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
Want a different morning time? `/shutdown:shutdown 07:30` (or `7am`, `7.30`). The default is 08:00. On a Friday (or at the weekend) the pause runs until Monday at that time.

Next morning there is nothing to do: just start working. Your first message puts everything back. Want to start early, or see the list first?
```
/shutdown:morning
```

### Try it in two minutes without installing
```
git clone https://github.com/MyIned/shutdown-command
cd shutdown-command
npm run demo:reset
cd scratch/demo-repo
claude --plugin-dir ../..
```
This opens Claude Code in a small demo project with unsaved work, with Shutdown loaded only for this session. Run `/shutdown:shutdown`, then type anything to see the pause, then `/shutdown:morning` to get everything back.

## What happens when you run it
1. **Saves your work.** If the folder is a git repo with unsaved changes, they're stored in a local commit called `WIP: shutdown <date>`. It is never pushed anywhere. Folders that aren't git repos are left alone.
2. **Writes `tomorrow.md`** in the folder: the files you had in progress, any `TODO`/`FIXME` notes you added, up to 3 next steps (and anything you are waiting on) that Claude writes from your conversation, and your recent work. `tomorrow.md` is kept out of git for you.
3. **Pauses Claude Code until morning.** New requests get one line, and tool calls from agents that are still running are stopped:

   > You shut down for the day. Back at 08:00.

**In the morning you don't have to do anything.** The pause lifts by itself at the time you set. Your first message to Claude that day puts your files back exactly as you left them (the WIP commit is undone) and hands Claude `tomorrow.md` as context, so it already knows where you left off.

`/shutdown:morning` does the same thing on demand: it lifts the pause early, with no questions, and shows you `tomorrow.md`.

Real output from the demo repo (`npm run demo:reset`):

```
Your work is saved on this computer (commit c2934c8). Nothing more is needed tonight.
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
| `test/` | `cycle.test.js` (the full day-to-morning cycle), `plugin.test.js` (the wiring), `demo-repo.js` (builds the demo repo) |

The pause is a small file in `~/.claude/shutdown/`, so it covers every project, not just one.

## Tests
```
npm test
```
Runs the full shutdown → refused → morning cycle on a real throwaway git repo in your temp folder (with its own pause file, so your real settings are never touched). It checks the WIP commit and `tomorrow.md`, that prompts and tools are refused, that `/morning` always gets through and restores the exact working tree, that the pause lifts itself and the first prompt of the morning restores the work and hands Claude the list, that a Friday shutdown lasts until Monday, that Claude's next steps are capped at 3, and edge cases: not a git repo, times written as `7am` or `7.30`, a bad time, shutting down twice (with new work in between), and unreadable hook input. A second file checks the plugin wiring: the manifests, both slash commands, and the exact hook commands from `hooks/hooks.json`, run the way Claude Code runs them.

The tests run on every push on Windows, macOS and Linux, with Node 18 and 22 (see the badge above).

To try it by hand: `npm run demo:reset` builds a demo repo with unsaved changes in `scratch/demo-repo`.

## Limitations
- It only saves the folder Claude Code was opened in, not every project you have.
- The pause is a boundary, not a lock: anyone can run `/shutdown:morning`, and you can edit your own files by hand while paused. That's deliberate.
- It stops Claude Code, not other tools or other people's machines.
- If you make new commits after shutting down, `/shutdown:morning` leaves the WIP commit in place and tells you.
- The next steps depend on Claude having context from your session; if it has none, it writes no steps rather than inventing work.

## Team
Dominic Higgins

## License
MIT, see [LICENSE](LICENSE).
