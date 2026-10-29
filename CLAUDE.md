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
