// End-to-end: shutdown -> refused -> morning, on a real throwaway git repo.
// Everything runs in the OS temp folder; real ~/.claude is never touched.
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { makeDemoRepo, git } = require('./demo-repo');

const SCRIPT = path.join(__dirname, '..', 'bin', 'shutdown.js');
const EVENING = '2026-10-29T18:30:00'; // local time
const NEXT_MORNING = '2026-10-30T08:01:00';

let root, repo, home;

function run(args, { cwd = repo, input, now = EVENING } = {}) {
  return spawnSync(process.execPath, [SCRIPT, ...args], {
    cwd,
    input,
    encoding: 'utf8',
    env: { ...process.env, SHUTDOWN_HOME: home, SHUTDOWN_NOW: now },
  });
}

function hook(event, now) {
  const r = run(['hook'], { input: JSON.stringify(event), now });
  assert.equal(r.status, 0, `hook should exit 0, got ${r.status}: ${r.stderr}`);
  return r.stdout.trim() ? JSON.parse(r.stdout) : null;
}

const prompt = (text) => ({ hook_event_name: 'UserPromptSubmit', prompt: text });
const tool = (name, input = {}) => ({ hook_event_name: 'PreToolUse', tool_name: name, tool_input: input });
const status = () => git(repo, 'status', '--porcelain').split('\n').filter(Boolean).sort();
const commitCount = () => Number(git(repo, 'rev-list', '--count', 'HEAD').trim());

before(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'shutdown-test-'));
  repo = path.join(root, 'demo-repo');
  home = path.join(root, 'home');
  makeDemoRepo(repo);
});

after(() => fs.rmSync(root, { recursive: true, force: true }));

let dirtyBefore, commitsBefore;

test('harness: demo repo starts mid-task with uncommitted changes', () => {
  dirtyBefore = status();
  commitsBefore = commitCount();
  assert.deepEqual(dirtyBefore, [' M app.js', '?? src/']);
});

test('/shutdown saves the work, writes tomorrow.md and pauses', () => {
  const r = run(['shutdown', '--until', '08:00']);
  assert.equal(r.status, 0, r.stderr);
  assert.deepEqual(status(), [], 'working tree should be clean after the WIP commit');
  assert.equal(commitCount(), commitsBefore + 1);
  assert.match(git(repo, 'log', '-1', '--format=%s'), /^WIP/);
  const tomorrow = fs.readFileSync(path.join(repo, 'tomorrow.md'), 'utf8');
  assert.match(tomorrow, /app\.js/);
  assert.match(tomorrow, /reminders\.js/);
  assert.match(tomorrow, /TODO: mark notes/, 'notes left in the code are carried over');
  assert.ok(fs.existsSync(path.join(home, 'pause.json')), 'pause file should exist');
  assert.match(r.stdout, /Back at 08:00/);
});

test('while paused, a new prompt is refused with one kind line', () => {
  const out = hook(prompt('add the completeNote function'));
  assert.equal(out.decision, 'block');
  assert.match(out.reason, /You shut down for the day\. Back at 08:00\./);
});

test('while paused, running agents cannot use tools', () => {
  for (const name of ['Edit', 'Write', 'Read']) {
    const out = hook(tool(name, { file_path: 'app.js' }));
    assert.equal(out.hookSpecificOutput.permissionDecision, 'deny', name);
    assert.match(out.hookSpecificOutput.permissionDecisionReason, /Back at 08:00/);
  }
  const bash = hook(tool('Bash', { command: 'git commit -am more' }));
  assert.equal(bash.hookSpecificOutput.permissionDecision, 'deny');
});

test('while paused, /morning is never blocked (always escapable)', () => {
  assert.equal(hook(prompt('/morning')), null);
  assert.equal(hook(prompt('/shutdown:morning')), null);
  const viaTool = tool('Bash', { command: `node "${SCRIPT}" morning` });
  assert.equal(hook(viaTool), null);
});

test('/morning lifts the pause, restores the work and shows tomorrow.md', () => {
  const r = run(['morning'], { now: '2026-10-30T07:00:00' }); // early on purpose
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /reminders\.js/, 'prints tomorrow.md');
  assert.ok(!fs.existsSync(path.join(home, 'pause.json')), 'pause file removed');
  assert.deepEqual(status(), dirtyBefore, 'tree is exactly as it was left');
  assert.equal(commitCount(), commitsBefore, 'WIP commit is gone from history');
  assert.equal(hook(prompt('good morning')), null);
  assert.equal(hook(tool('Edit', {})), null);
});

test('the pause lifts itself at the morning time', () => {
  run(['shutdown', '--until', '08:00']);
  assert.equal(hook(prompt('hello'), '2026-10-29T23:00:00').decision, 'block');
  assert.equal(hook(prompt('hello'), NEXT_MORNING), null);
  assert.equal(hook(tool('Edit', {}), NEXT_MORNING), null);
});

test('a folder that is not a git repo still gets tomorrow.md and a pause', () => {
  const plain = path.join(root, 'plain-folder');
  fs.mkdirSync(plain);
  fs.writeFileSync(path.join(plain, 'budget.txt'), 'draft');
  const r = run(['shutdown', '--until', '08:00'], { cwd: plain });
  assert.equal(r.status, 0, r.stderr);
  assert.ok(fs.existsSync(path.join(plain, 'tomorrow.md')));
  assert.equal(hook(prompt('hello')).decision, 'block');
});

test('a time that is not a time changes nothing', () => {
  const repo2 = makeDemoRepo(path.join(root, 'bad-time'));
  const r = run(['shutdown', '--until', '25:99'], { cwd: repo2 });
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /not a time/);
  assert.deepEqual(git(repo2, 'status', '--porcelain').split('\n').filter(Boolean).length, 2, 'work left untouched');
});

test('shutting down twice still lets /morning restore everything', () => {
  fs.rmSync(path.join(home, 'pause.json'), { force: true });
  const twice = makeDemoRepo(path.join(root, 'twice'));
  const count = () => Number(git(twice, 'rev-list', '--count', 'HEAD').trim());
  const before = count();
  run(['shutdown', '--until', '08:00'], { cwd: twice });
  run(['shutdown', '--until', '08:00'], { cwd: twice });
  assert.match(fs.readFileSync(path.join(twice, 'tomorrow.md'), 'utf8'), /reminders\.js/, 'list survives the second run');
  run(['morning'], { cwd: twice });
  assert.equal(count(), before);
  assert.equal(git(twice, 'status', '--porcelain').split('\n').filter(Boolean).length, 2);
});

test('a hook that cannot read its event lets it through', () => {
  run(['shutdown', '--until', '08:00']);
  const r = run(['hook'], { input: 'not json' });
  assert.equal(r.status, 0);
  assert.equal(r.stdout.trim(), '');
});

test('a Friday shutdown keeps the weekend free and lifts on Monday', () => {
  const friday = makeDemoRepo(path.join(root, 'friday'));
  const r = run(['shutdown'], { cwd: friday, now: '2026-10-30T17:30:00' });
  assert.match(r.stdout, /You shut down for the weekend\. Back on Monday at 08:00\./);
  assert.match(hook(prompt('quick fix'), '2026-11-01T10:00:00').reason, /Back on Monday at 08:00/);
  assert.equal(hook(prompt('good morning'), '2026-11-02T08:01:00'), null);
});

test('next steps and blocked items from Claude end up in tomorrow.md (max 3 steps)', () => {
  const repo3 = makeDemoRepo(path.join(root, 'steps'));
  const r = run(['shutdown', '--step', 'one', '--step', 'two', '--step', 'three', '--step', 'four', '--blocked', 'waiting on Sam'], { cwd: repo3 });
  assert.equal(r.status, 0, r.stderr);
  const tomorrow = fs.readFileSync(path.join(repo3, 'tomorrow.md'), 'utf8');
  assert.match(tomorrow, /## Next steps\n- one\n- two\n- three\n/);
  assert.doesNotMatch(tomorrow, /four/);
  assert.match(tomorrow, /## Waiting on\n- waiting on Sam/);
});
