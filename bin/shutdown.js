#!/usr/bin/env node
// Shutdown: ends the working day. Zero dependencies, Node 18+.
//   node shutdown.js shutdown [--until HH:MM] [--steps <file>]
//   node shutdown.js morning
//   node shutdown.js hook   (Claude Code hook events on stdin)
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const DEFAULT_MORNING = '08:00';

const homeDir = () => process.env.SHUTDOWN_HOME || path.join(os.homedir(), '.claude', 'shutdown');
const pausePath = () => path.join(homeDir(), 'pause.json');
const now = () => (process.env.SHUTDOWN_NOW ? new Date(process.env.SHUTDOWN_NOW) : new Date());

function git(cwd, ...args) {
  return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}

function repoRoot(cwd) {
  try {
    return git(cwd, 'rev-parse', '--show-toplevel').trim();
  } catch {
    return null;
  }
}

function option(args, name) {
  const i = args.indexOf(name);
  return i === -1 ? undefined : args[i + 1];
}

const pad = (n) => String(n).padStart(2, '0');
const dateLabel = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

// The next time the clock reads HH:MM, strictly after `from`.
function nextOccurrence(hhmm, from) {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm);
  if (!m || +m[1] > 23 || +m[2] > 59) throw new Error(`"${hhmm}" is not a time like 08:00`);
  const t = new Date(from);
  t.setHours(+m[1], +m[2], 0, 0);
  if (t <= from) t.setDate(t.getDate() + 1);
  return t;
}

// Saves uncommitted work as a local WIP commit. Never pushes.
function saveWork(root, when) {
  if (!git(root, 'status', '--porcelain').trim()) return { commit: null, files: [], notes: [] };
  git(root, 'add', '-A');
  const files = git(root, 'diff', '--cached', '--name-status').trim().split('\n').filter(Boolean);
  const notes = git(root, 'diff', '--cached', '-U0')
    .split('\n')
    .filter((l) => l.startsWith('+') && !l.startsWith('+++') && /\b(TODO|FIXME)\b/.test(l))
    .map((l) => l.slice(1).trim());
  const identity = git(root, 'config', 'user.email').trim() ? [] : ['-c', 'user.name=Shutdown', '-c', 'user.email=shutdown@localhost'];
  git(root, ...identity, 'commit', '--no-verify', '-q', '-m', `WIP: shutdown ${dateLabel(when)}`);
  return { commit: git(root, 'rev-parse', 'HEAD').trim(), files, notes };
}

function recentCommits(root) {
  try {
    return git(root, 'log', '-5', '--format=%s').trim().split('\n').filter((s) => s && !s.startsWith('WIP: shutdown'));
  } catch {
    return [];
  }
}

function excludeFromGit(root, name) {
  const file = path.resolve(root, git(root, 'rev-parse', '--git-path', 'info/exclude').trim());
  const current = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
  if (current.split(/\r?\n/).includes(name)) return;
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.appendFileSync(file, `${current && !current.endsWith('\n') ? '\n' : ''}${name}\n`);
}

const bullets = (items) => items.map((i) => `- ${i}`).join('\n');

function writeTomorrow(dir, isRepo, saved, when, stepsFile) {
  const label = { A: 'new', M: 'changed', D: 'deleted', R: 'renamed' };
  const inProgress = saved.files.map((line) => {
    const [status, ...rest] = line.split('\t');
    return `${rest.join(' -> ')} (${label[status[0]] || 'changed'})`;
  });
  const sections = [`# Tomorrow\n\nSaved ${dateLabel(when)}. Nothing here is urgent; it is just where you left off.`];
  if (inProgress.length) sections.push(`## In progress\n${bullets(inProgress)}`);
  if (saved.notes.length) sections.push(`## Notes you left in the code\n${bullets(saved.notes)}`);
  if (stepsFile) sections.push(`## Next steps\n${fs.readFileSync(stepsFile, 'utf8').trim()}`);
  const commits = isRepo ? recentCommits(dir) : [];
  if (commits.length) sections.push(`## Recent work\n${bullets(commits)}`);
  const file = path.join(dir, 'tomorrow.md');
  fs.writeFileSync(file, `${sections.join('\n\n')}\n`);
  return file;
}

function shutdown(args) {
  const cwd = process.cwd();
  const when = now();
  const hhmm = option(args, '--until') || DEFAULT_MORNING;
  const until = nextOccurrence(hhmm, when);
  const stepsFile = option(args, '--steps');

  const root = repoRoot(cwd);
  const dir = root || cwd;
  const saved = root ? saveWork(root, when) : { commit: null, files: [], notes: [] };
  if (root) excludeFromGit(root, 'tomorrow.md');
  const tomorrow = writeTomorrow(dir, Boolean(root), saved, when, stepsFile);

  fs.mkdirSync(homeDir(), { recursive: true });
  fs.writeFileSync(pausePath(), JSON.stringify({ until: until.getTime(), at: hhmm, repo: root, wip: saved.commit, tomorrow }, null, 2));

  const lines = [];
  if (saved.commit) lines.push(`Your work is saved (WIP commit ${saved.commit.slice(0, 7)}, not pushed).`);
  else if (root) lines.push('Nothing to save; your work was already committed.');
  else lines.push('This folder is not a git repo, so nothing was committed.');
  lines.push(`Tomorrow's list is in ${tomorrow}`, `You shut down for the day. Back at ${hhmm}.`);
  console.log(lines.join('\n'));
}

// The pause, or null if there is none, it has run out, or the file is unreadable.
// Failing open means a damaged file can never lock anyone out.
function activePause() {
  try {
    const pause = JSON.parse(fs.readFileSync(pausePath(), 'utf8'));
    return pause.until > now().getTime() ? pause : null;
  } catch {
    return null;
  }
}

const MORNING_PROMPT = /^\s*\/(?:[\w-]+:)?morning\b/;
const MORNING_COMMAND = /shutdown\.js["']?\s+morning\b/;

// Reads a Claude Code hook event on stdin and, while paused, refuses it with one kind line.
function hook() {
  const pause = activePause();
  if (!pause) return;
  const event = JSON.parse(fs.readFileSync(0, 'utf8') || '{}');
  const message = `You shut down for the day. Back at ${pause.at}.`;
  if (event.hook_event_name === 'UserPromptSubmit' && !MORNING_PROMPT.test(event.prompt || '')) {
    console.log(JSON.stringify({ decision: 'block', reason: message }));
  } else if (event.hook_event_name === 'PreToolUse' && !MORNING_COMMAND.test(event.tool_input?.command || '')) {
    console.log(JSON.stringify({
      hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'deny', permissionDecisionReason: message },
    }));
  }
}

// Lifts the pause (early is fine), puts the saved work back as it was and shows tomorrow's list.
function morning() {
  let pause = null;
  try {
    pause = JSON.parse(fs.readFileSync(pausePath(), 'utf8'));
  } catch {
    // no pause: still show the list below
  }
  if (pause?.wip) {
    try {
      if (git(pause.repo, 'rev-parse', 'HEAD').trim() === pause.wip) git(pause.repo, 'reset', '-q', 'HEAD~1');
    } catch {
      // leave the WIP commit in place; the work is safe either way
    }
  }
  fs.rmSync(pausePath(), { force: true });
  const list = pause?.tomorrow || path.join(process.cwd(), 'tomorrow.md');
  console.log('Good morning.\n');
  console.log(fs.existsSync(list) ? fs.readFileSync(list, 'utf8') : 'No list from yesterday. Start fresh.');
}

function main() {
  const [command, ...args] = process.argv.slice(2);
  try {
    if (command === 'shutdown') return shutdown(args);
    if (command === 'morning') return morning();
    if (command === 'hook') return hook();
    console.error('Usage: shutdown.js shutdown [--until HH:MM] [--steps <file>] | morning | hook');
    process.exitCode = 2;
  } catch (err) {
    console.error(`Shutdown could not finish: ${err.message}`);
    process.exitCode = 1;
  }
}

main();
