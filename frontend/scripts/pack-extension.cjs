/**
 * Rebuilds frontend/public/extension.zip from the repo's /extension folder.
 * The /extension download route serves this file — if you don't re-run this
 * after changing the extension, users keep downloading old code.
 */
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

const repoRoot = path.join(__dirname, '..', '..');
const extDir = path.join(repoRoot, 'extension');
const outZip = path.join(__dirname, '..', 'public', 'extension.zip');

if (!fs.existsSync(path.join(extDir, 'manifest.json'))) {
  console.error('Expected extension at:', extDir);
  process.exit(1);
}

fs.mkdirSync(path.dirname(outZip), { recursive: true });

const output = fs.createWriteStream(outZip);
const archive = archiver('zip', { zlib: { level: 9 } });

output.on('close', () => {
  console.log('Wrote', outZip, '(' + archive.pointer() + ' bytes)');
});

archive.on('error', (err) => {
  throw err;
});

archive.pipe(output);
archive.directory(extDir, 'extension');
archive.finalize();
