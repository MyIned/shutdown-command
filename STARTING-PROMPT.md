# Starting prompt

Copy the starter-kit files into a new project folder, open Claude Code there in **plan mode**, paste everything below the line, and fill in the brief.

---

We're at a 4-hour hackathon (Claude Code Impact Lab, Dublin). It's about 17:20 now and live demos start at 20:00, so we have roughly 2.5 hours of build time. Feature freeze is at 19:30.

**The brief we picked:**

> **Take the load off** — Build something that eases compression burnout. Pick one of these, or bring your own idea.
>
> - **For you — A workload tracker:** Shows how much you're juggling and when you last took a break, from your calendar, git history or Claude Code logs.
> - **For you — A check before you accept:** A Claude Code hook that asks you to explain a big change in one line before you accept it.
> - **For you — A shutdown command:** One command that saves your open work, writes tomorrow's list and pauses your agents until morning.
> - **For teams — A tracker for saved time:** Logs the hours AI saved and shows whether they went to more work or back to people.
> - **For helplines and charities — Support for hard calls:** When AI takes the easy calls, pace the hard ones and build in time to recover.
> - **For Dublin — Learning AI together:** One useful thing a week, learned in a group, instead of trying to keep up alone.
>
> **The one rule:** It has to give people time back, not help them do even more.

**Option we picked: A shutdown command.** Built as a Claude Code plugin (slash commands + a hook + a small Node script, so it works on Windows, macOS and Linux). Our starting sketch — challenge it:
- `/shutdown` — saves open work (WIP commit or stash on each repo with changes; never pushes without asking), writes `tomorrow.md` (what was in progress, the next 3 concrete steps, anything blocked) from the git diff and the session, then pauses agents.
- **Pausing agents** — a `PreToolUse` hook that blocks Claude Code tool calls while a pause file exists, with a kind message ("You shut down for the day. Back at 08:00.") until a set morning time.
- `/morning` — lifts the pause and shows `tomorrow.md` so the day starts in 30 seconds, not 30 minutes.
- Install for anyone tomorrow: one command from our public GitHub repo.

The demo path is: mid-task in a repo → `/shutdown` → show the saved commit and `tomorrow.md` → try to start Claude again and get politely refused → `/morning` picks it back up.

Check every idea against the one rule: if a feature could end up making people work more, cut it or flip it.

**Context:** The briefs came from a public discussion where people (many of them not technical, some uneasy about AI) named real problems about AI and their jobs, their families and communities, and who sets the rules. The people who'd use this are likely ordinary members of the public, not developers.

**Judging is on three things:**
1. How directly the build takes on the problem in the brief
2. Whether it actually works when shown live
3. Whether someone could realistically pick it up and use it after tonight

**Team:** <solo / N people — and what each is good at>
**Preferred stack:** <e.g. "whatever is simplest to run locally" / Python / Node / plain HTML+JS>
**Constraints:** Runs locally on a Windows laptop with one command. No deploy account. No user accounts or login. API keys only via environment variables, never committed.

**What I want from you first (don't write code yet):**
1. Restate the problem in one sentence and name the specific person it's for.
2. Suggest 2–3 possible builds, each doable in 2 hours, with the trade-off of each. Recommend one.
3. For the recommended build: the 3-step demo path, what's deliberately out of scope, the stack, and a build plan in ~30-minute milestones where each milestone ends with something working.
4. Fill in CLAUDE.md with the result.
5. Set up the harness before feature work: a scratch demo repo with some uncommitted changes, and a single `npm test` (or `node test.js`) that runs the shutdown → refused → morning cycle end to end, so you can check your own work after every milestone.

Keep it as simple as possible. A small thing that clearly works beats a big thing that half works.
