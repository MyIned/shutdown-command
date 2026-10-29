# <Project name> — a shutdown command for Claude Code

<One sentence: what it does and who it's for. e.g. "One command that ends your working day: saves your work, writes tomorrow's list and pauses your Claude Code agents until morning — for developers who can't switch off.">

Built at the Claude Code Impact Lab, Dublin (29 Oct 2026), for the brief **"Take the load off: ease compression burnout"**, idea: **A shutdown command**.

## The problem: compression burnout
<2–3 sentences. AI tools compress more work into each day; agents can keep running and the day never has a clear end. Name the cost: evenings lost to "just one more prompt", and mornings lost rebuilding context.>

## Who it's for
<Specific person, e.g. "Developers who use Claude Code daily and find their workday has no clear stopping point.">

## How it gives time back
- **Ends the day in one command** instead of <N> minutes of tidying up and remembering.
- **Stops the evening creep:** agents are paused until morning, so there's nothing to keep checking.
- **Starts tomorrow in 30 seconds:** `/morning` shows exactly where you left off.
- **Adds no new alerts, nags or prompts.** It only removes work.

## Quick start
Requirements: <Claude Code, Node 18+, git>

```
<install command>
```

Then in any project, in Claude Code:
```
/shutdown
```
Next morning:
```
/morning
```

## What happens when you run it
1. <Saves work: …>
2. <Writes tomorrow.md: …>
3. <Pauses agents: …>

<Example tomorrow.md output — real output from a run, not invented>

## Undo / turn it off
<How to lift the pause early, and how to uninstall.>

## How it works
<Short: slash commands + PreToolUse hook + Node script. File-by-file map.>

## Tests
```
npm test
```
<What the test covers: the full shutdown → refused → morning cycle on a real scratch repo.>

## Limitations
<Be honest: what it doesn't do yet.>

## Team
<names>
