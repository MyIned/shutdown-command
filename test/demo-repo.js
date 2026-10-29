// Builds a small real git repo that looks like someone stopped mid-task:
// one commit of history, then a modified tracked file and a new untracked file.
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

function git(dir, ...args) {
  return execFileSync('git', args, { cwd: dir, encoding: 'utf8' });
}

function makeDemoRepo(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(path.join(dir, 'src'), { recursive: true });
  git(dir, 'init', '-q');
  git(dir, 'config', 'user.name', 'Demo User');
  git(dir, 'config', 'user.email', 'demo@example.com');
  git(dir, 'config', 'commit.gpgsign', 'false');

  fs.writeFileSync(path.join(dir, 'app.js'),
    "const notes = [];\nfunction addNote(text) {\n  notes.push({ text, done: false });\n}\nmodule.exports = { addNote, notes };\n");
  fs.writeFileSync(path.join(dir, 'README.md'), '# Notes app\n');
  git(dir, 'add', '-A');
  git(dir, 'commit', '-q', '-m', 'Add basic notes app');

  // The unfinished work:
  fs.appendFileSync(path.join(dir, 'app.js'),
    "\nfunction completeNote(id) {\n  // TODO: mark notes[id] as done and save to disk\n}\n");
  fs.writeFileSync(path.join(dir, 'src', 'reminders.js'),
    "// Work in progress: remind me about notes due today\nmodule.exports = function dueToday(notes) {\n  return notes.filter((n) => !n.done);\n};\n");
  return dir;
}

module.exports = { makeDemoRepo, git };

if (require.main === module) {
  const dir = path.resolve(process.argv[2] || 'scratch/demo-repo');
  makeDemoRepo(dir);
  console.log(`Demo repo with uncommitted changes ready at ${dir}`);
}
