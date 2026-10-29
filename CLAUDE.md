# Project: Shutdown — a shutdown command for Claude Code

## The problem (from the brief)
> "Take the load off — Build something that eases compression burnout." Idea: **A shutdown command** — "One command that saves your open work, writes tomorrow's list and pauses your agents until morning." The one rule: it has to give people time back, not help them do even more.

In our words: AI squeezes more work into each day and agents never get tired, so the workday has no end. People lose evenings to "just one more prompt" and lose the next morning rebuilding what they were doing.

## Who it's for
Someone who uses Claude Code every day to get real work done and can't find the end of it, **not necessarily a professional developer**: a freelancer, a small-business owner, a charity volunteer, a hobbyist building their own tools. They may not know what a "hook" is, may never type a git command, and may feel uneasy about how much AI has sped up their job. Assume they follow a README step by step and nothing more.

Consequence: everything must work with one slash command, make no git decisions for them, and degrade gracefully when the folder isn't a git repo.

## What the demo must show
1. Mid-task in a repo with uncommitted changes, run `/shutdown`. Show the saved WIP commit (clean `git status`) and the generated `tomorrow.md`.
2. Try to start Claude Code again. It is politely refused with one kind line ("You shut down for the day. Back at 08:00.") and nothing runs.
3. `/morning` lifts the pause, puts the changes back exactly as they were and shows `tomorrow.md`. Then the 30-second "how someone uses this tomorrow": install from the public repo, run `/shutdown` at the end of a day.

## Design decisions (challenging the starting sketch)
- **Current folder only.** Scanning "each repo with changes" is unbounded and risky. We save the repo Claude Code was opened in.
- **WIP commit, not stash.** Stashes are invisible and easy to lose; a visible commit "WIP: shutdown <date>" is proof the work is safe. `/morning` undoes it with `git reset HEAD~1` (only if HEAD is still that commit), so the user's tree is exactly as they left it and no WIP noise stays in history. **We never push, and never ask about pushing.**
- **Not a git repo?** Skip the commit, still write `tomorrow.md` and pause.
- **The pause is global** (`~/.claude/shutdown/pause.json`, override with `SHUTDOWN_HOME`), because the hook must stop Claude in every project, not just one.
- **Two hooks, one script.** `UserPromptSubmit` blocks the prompt with the kind line before the model is called (the polite refusal the user sees); `PreToolUse` stops agents/subagents that are already running.
- **It's a boundary, not a lock.** `/morning` always works, even early, with no scolding and no "are you sure?". The hook lets `/morning` and the script's `morning` command through. The pause also lifts itself at the morning time, so nobody has to remember anything.
- **tomorrow.md is built from git facts by the script** (files in progress, recent commits), and enriched by Claude with "next 3 steps" and "blocked" from the session via `--steps <file>`. Max 3 steps, no time estimates, no priorities: a list that shrinks the morning, not one that grows it. `tomorrow.md` is excluded locally via `.git/info/exclude` so it never lands in a commit.
- **Cut:** anything that nags (reminders, "you've worked N hours", scheduled alerts), anything that scores or ranks the day, multi-repo scanning, config files, accounts.

## Out of scope tonight
- User accounts / login
- Multi-repo scanning, stash mode, pushing to remotes
- Calendar/Slack/email integration; timers, reminders, nudges or "you've worked N hours" stats
- Any UI beyond Claude Code slash commands
- Locking the user out (always escapable)

## Stack
- Claude Code plugin: `commands/shutdown.md`, `commands/morning.md`, `hooks/hooks.json`, `.claude-plugin/plugin.json` + `marketplace.json`.
- One zero-dependency Node 18+ script, `bin/shutdown.js`, with subcommands `shutdown`, `morning`, `hook`. Cross-platform (Windows/macOS/Linux), git via `child_process`.
- Tests: `node:test`, no dependencies.
- Runs locally with one command: `npm test`. Demo scratch repo: `npm run demo:reset`.
- Install for others (two lines, be honest in the README): `/plugin marketplace add <owner>/<repo>` then `/plugin install shutdown@<marketplace>`.

## Build plan (each milestone ends with something working; run `npm test` at each)
| # | Budget | Done when | Tests going green |
|---|--------|-----------|-------------------|
| M0 | 17:20–17:40 | CLAUDE.md filled, harness in place, tests exist and fail for the right reason | none (red) |
| M1 | +30 min | `node bin/shutdown.js shutdown` makes the WIP commit, writes `tomorrow.md`, writes the pause file | save |
| M2 | +30 min | `hook` refuses prompts and tools while paused; `morning` lifts it and restores the tree. **Ugly end-to-end works, first commit + push by 18:15–18:30** | whole cycle |
| M3 | +30 min | Plugin packaging; installed from the local folder into real Claude Code; do the demo path for real | (manual) |
| M4 | +30 min | `commands/shutdown.md` has Claude write the next-3-steps file; non-git folder, expired pause, odd times handled | edge cases |
| M5 | to 19:30 | README with real output, repo public, fresh-clone test, dead code removed. **Freeze at 19:30** | all green |

## How we're judged (build to this)
An AI agent scores the build out of 100. It reads the repo's README and code, plus what we write in the submission form. It does NOT watch the demo, so anything that isn't in the README or code doesn't count.

- **30% Takes on the problem:** it's about compression burnout, it says who it's for, and it fits one of the six ideas ("A shutdown command").
- **30% It actually works:** the repo runs, the main thing works end to end, and nothing is faked or mocked up. Use real git operations and real hooks, with no placeholder data or stubbed functions in the shipped code.
- **20% Someone would use it:** a README that gets a stranger started, useful after tonight, and works without us there to explain it.
- **20% Gives time back:** it saves time or attention, it doesn't add work, alerts or prompts, and the saved time goes back to people. No nags or notifications. The pause message is a single, kind line, not a prompt to do more.

So:
- Keep the README accurate. Update it whenever behaviour changes, and never claim a feature that isn't built.
- Remove dead code, TODO stubs and unused files before the final commit. The judge reads the code.
- Install and run steps must work on a clean machine (Windows, macOS, Linux). Test them.

## How to check your work
- Run `npm test` after every change. It must pass before you say a step is done. It runs the full shutdown → refused → morning cycle on a real throwaway git repo created in the OS temp folder, with `SHUTDOWN_HOME` and `SHUTDOWN_NOW` pointed at scratch values, so it never touches real `~/.claude` or this project's git history.
- For manual poking, `npm run demo:reset` rebuilds `scratch/demo-repo` (gitignored) with uncommitted changes. Run the script there with `SHUTDOWN_HOME=scratch/home` set.
- **Lifting a pause:** delete `~/.claude/shutdown/pause.json` (or `scratch/home/pause.json`). Do not install the hooks into real Claude Code until M3, and test M3 with a short pause (`--until` a couple of minutes ahead) so we can't lock ourselves out mid-build.

## Ground rules
- Demo is at 20:00. Feature freeze at 19:30. Working beats impressive.
- Keep it to the fewest files and dependencies that work.
- Never hard-code API keys; read them from environment variables and keep `.env` out of git.
- After each working step, say so, so we can commit.
- If something is taking more than 15 minutes, stop and suggest a simpler route.
