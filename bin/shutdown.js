#!/usr/bin/env node
// Shutdown: ends the working day. Zero dependencies, Node 18+.
//   node shutdown.js shutdown [--until HH:MM] [--steps <file>]
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

function main() {
  const [command, ...args] = process.argv.slice(2);
  try {
    if (command === 'shutdown') return shutdown(args);
    console.error('Usage: shutdown.js shutdown [--until HH:MM] [--steps <file>]');
    process.exitCode = 2;
  } catch (err) {
    console.error(`Shutdown could not finish: ${err.message}`);
    process.exitCode = 1;
  }
}

main();
