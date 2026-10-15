import { randomBytes } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { chmodSync, copyFileSync, cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const source = dirname(fileURLToPath(import.meta.url));
const root = join(homedir(), 'Library', 'Application Support', 'SYNCRO SHIFT Executor');
const agents = join(homedir(), 'Library', 'LaunchAgents');
const plist = join(agents, 'com.syncrosfera.syncroshift-executor.plist');

function escapeXml(value) {
  return value.replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&apos;' })[char]);
}

if (!process.argv.includes('--prepare') && !process.argv.includes('--activate')) {
  throw new Error('USE_--prepare_OR_--activate');
}

mkdirSync(root, { recursive: true, mode: 0o700 });
chmodSync(root, 0o700);
mkdirSync(join(root, 'bin'), { recursive: true, mode: 0o700 });
mkdirSync(join(root, 'node_modules'), { recursive: true, mode: 0o700 });
copyFileSync(process.execPath, join(root, 'bin', 'node'));
chmodSync(join(root, 'bin', 'node'), 0o700);
copyFileSync(join(source, 'worker.mjs'), join(root, 'worker.mjs'));
const playwrightSource = join(dirname(dirname(process.execPath)), 'node_modules', 'playwright-core');
if (!existsSync(playwrightSource)) throw new Error('PLAYWRIGHT_CORE_NOT_FOUND');
cpSync(playwrightSource, join(root, 'node_modules', 'playwright-core'), { recursive: true, force: true });
const tokenFile = join(root, 'executor-token');
if (!existsSync(tokenFile)) writeFileSync(tokenFile, randomBytes(48).toString('hex') + '\n', { mode: 0o600 });
chmodSync(tokenFile, 0o600);
console.log(`PREPARED ${root}`);

if (process.argv.includes('--activate')) {
  mkdirSync(agents, { recursive: true });
  const args = [join(root, 'bin', 'node'), join(root, 'worker.mjs')];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">\n<plist version="1.0"><dict>\n<key>Label</key><string>com.syncrosfera.syncroshift-executor</string>\n<key>ProgramArguments</key><array>${args.map(value => `<string>${escapeXml(value)}</string>`).join('')}</array>\n<key>StartInterval</key><integer>60</integer>\n<key>RunAtLoad</key><true/>\n<key>StandardOutPath</key><string>${escapeXml(join(root, 'executor.out.log'))}</string>\n<key>StandardErrorPath</key><string>${escapeXml(join(root, 'executor.err.log'))}</string>\n</dict></plist>\n`;
  writeFileSync(plist, xml, { mode: 0o600 });
  const uid = process.getuid();
  execFileSync('launchctl', ['bootstrap', `gui/${uid}`, plist], { stdio: 'pipe' });
  console.log('ACTIVATED com.syncrosfera.syncroshift-executor');
}
