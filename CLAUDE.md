# Project: <name>

## The problem (from the brief)
<Paste the brief's wording. One sentence on the problem in our own words.>

## Who it's for
<The specific person who has this problem. Assume they are NOT technical unless the brief says otherwise.>

## What the demo must show
1. <The one thing that proves we solved it>
2. <Second step of the demo path>
3. <"How someone uses this tomorrow">

## Out of scope tonight
- User accounts / login
- <anything else we're deliberately not building>

## Stack
- <e.g. single-page HTML + JS / Python + Flask / Node + Express>
- Runs locally with one command: `<command>`

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
- Run `<npm test / node test.js>` after every change. It must pass before you say a step is done.
- Test against the scratch demo repo in `<path>`, never against this project's own git history.
- If you're testing the pause hook, make sure there's a way to lift it (delete the pause file) so you don't lock yourself out mid-build.

## Ground rules
- Demo is at 20:00. Feature freeze at 19:30. Working beats impressive.
- Keep it to the fewest files and dependencies that work.
- Never hard-code API keys; read them from environment variables and keep `.env` out of git.
- After each working step, say so, so we can commit.
- If something is taking more than 15 minutes, stop and suggest a simpler route.
