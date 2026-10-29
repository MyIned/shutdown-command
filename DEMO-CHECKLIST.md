# Timeline & demo checklist

| Time  | Goal |
|-------|------|
| 17:00 | Arrive, form team, read briefs |
| 17:20 | Brief picked. CLAUDE.md filled in. Plan agreed in plan mode |
| 18:15 | Ugly end-to-end version works. First commit + push |
| 19:30 | **Feature freeze.** Only fixes from here |
| 19:30 | Ask Claude to walk the demo path and report what breaks |
| 19:40 | README + screenshot done, repo public |
| 19:45 | Record a 60-second screen capture as a fallback |
| 19:50 | Rehearse the demo twice, out loud, timed |
| 20:00 | Demos |

## The 3-minute demo
- [ ] **Problem (30s):** who has it, in the brief's words
- [ ] **Live (2 min):** one real scenario, start to finish, no detours
- [ ] **Tomorrow (30s):** how someone picks it up — repo link, run command

## Before you go up
- [ ] Laptop plugged in, notifications off (Focus Assist on)
- [ ] App already running, browser tab open on the start screen
- [ ] Unrelated windows closed, font size bumped up
- [ ] Demo data loaded (don't type it live)
- [ ] Fallback recording ready to play
- [ ] Repo link on a slide/tab to show at the end

## Submission (this is what gets scored)
An agent scores the repo README, the code and the form text. Do these before 20:00:
- [ ] Repo is **public** on GitHub and the link opens when you're logged out
- [ ] README follows the template: problem, who it's for, the idea it fits, how it gives time back, quick start, tests
- [ ] Clone the repo into a fresh folder and follow the README exactly. Does it work?
- [ ] `npm test` passes on the final commit
- [ ] No stubs, TODOs, mock data or dead files left in the code
- [ ] Form text drafted (below), reusing the README's wording

## Form draft
- **Problem / brief:** Take the load off — A shutdown command
- **Who it's for:**
- **What it does (2 sentences):**
- **How it gives time back:**
- **Repo link:**

## Scoring checklist (out of 100)
- [ ] **30 — Takes on the problem:** compression burnout, who it's for, fits "A shutdown command"
- [ ] **30 — It actually works:** repo runs, main thing works end to end, nothing faked
- [ ] **20 — Someone would use it:** stranger can start from the README, useful after tonight, works without us
- [ ] **20 — Gives time back:** saves time/attention, adds no work/alerts/prompts, time goes back to people
