// Checks the plugin wiring: manifests, slash commands and the exact hook commands Claude Code runs.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const readJson = (file) => JSON.parse(fs.readFileSync(path.join(ROOT, file), 'utf8'));

test('plugin and marketplace manifests agree', () => {
  const plugin = readJson('.claude-plugin/plugin.json');
  const marketplace = readJson('.claude-plugin/marketplace.json');
  const entry = marketplace.plugins.find((p) => p.name === plugin.name);
  assert.ok(entry, `marketplace lists "${plugin.name}"`);
  assert.equal(entry.source, './');
});

test('both slash commands run the real script', () => {
  for (const name of ['shutdown', 'morning']) {
    const body = fs.readFileSync(path.join(ROOT, 'commands', `${name}.md`), 'utf8');
    assert.match(body, /^---\r?\n[\s\S]*description:[\s\S]*\n---\r?\n/, `${name}.md has frontmatter`);
    assert.ok(body.includes(`node "\${CLAUDE_PLUGIN_ROOT}/bin/shutdown.js" ${name}`), `${name}.md runs shutdown.js ${name}`);
  }
  assert.ok(fs.existsSync(path.join(ROOT, 'bin', 'shutdown.js')));
});

test('the hook commands in hooks.json refuse prompts and tools while paused', () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'shutdown-wiring-'));
  const env = { ...process.env, SHUTDOWN_HOME: home, SHUTDOWN_NOW: '2026-10-29T18:30:00' };
  fs.writeFileSync(path.join(home, 'pause.json'), JSON.stringify({
    until: new Date('2026-10-30T08:00:00').getTime(),
    message: 'You shut down for the day. Back at 08:00.',
  }));
  const { hooks } = readJson('hooks/hooks.json');
  const events = {
    UserPromptSubmit: { hook_event_name: 'UserPromptSubmit', prompt: 'one more thing' },
    PreToolUse: { hook_event_name: 'PreToolUse', tool_name: 'Edit', tool_input: {} },
  };
  try {
    for (const [name, event] of Object.entries(events)) {
      assert.ok(hooks[name], `hooks.json registers ${name}`);
      for (const { command } of hooks[name].flatMap((group) => group.hooks)) {
        const r = spawnSync(command.replaceAll('${CLAUDE_PLUGIN_ROOT}', ROOT), {
          shell: true, input: JSON.stringify(event), encoding: 'utf8', env,
        });
        assert.equal(r.status, 0, r.stderr);
        assert.match(r.stdout, /Back at 08:00/, `${name} is refused`);
      }
    }
  } finally {
    fs.rmSync(home, { recursive: true, force: true });
  }
});
