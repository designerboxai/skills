import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const LEAKS = [/src\//i, /\.ts\b/i];
const SCANNED = /\.(md|json|ya?ml|mjs)$/;
const EMAIL = /[A-Za-z0-9._%+-]+@designerbox\.ai/gi;
const SKIP_DIRS = new Set(['.git', 'node_modules']);

const read = (p) => fs.readFileSync(p, 'utf8');
const exists = (p) => fs.existsSync(p);

function walk(dir, root, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(e.name)) continue;
    const full = path.join(dir, e.name);
    const rel = path.relative(root, full).split(path.sep).join('/');
    if (e.isDirectory()) {
      if (rel === 'scripts/.fixtures') continue; // test fixtures, hidden so skill installers skip them
      walk(full, root, out);
    } else out.push(rel);
  }
  return out;
}

// Optional, never committed: maintainers may keep extra patterns in <root>/.leak-denylist
// (one regex per line, case-insensitive, # starts a comment).
function localDenylist(root, err) {
  const file = path.join(root, '.leak-denylist');
  if (!exists(file)) return [];
  const out = [];
  read(file).split(/\r?\n/).forEach((raw, i) => {
    const line = raw.trim();
    if (!line || line.startsWith('#')) return;
    try { out.push({ re: new RegExp(line, 'i'), label: `.leak-denylist line ${i + 1}` }); }
    catch { err('.leak-denylist', `line ${i + 1} is not a valid regex`); }
  });
  return out;
}

function parseFrontmatter(text) {
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  if (lines[0] !== '---') return { error: 'missing frontmatter (file must start with ---)' };
  const end = lines.indexOf('---', 1);
  if (end === -1) return { error: 'frontmatter is not closed (missing second ---)' };
  if (lines.slice(1, end).some((l) => /^\s+internal\s*:/.test(l))) return { error: 'metadata.internal is not allowed' };
  const [, l1, l2, l3, l4] = lines;
  const name = /^name: (\S.*)$/.exec(l1);
  if (!name) return { error: 'frontmatter line 2 must be `name: <x>`' };
  if (/^description:\s*[>|]/.test(l2 || '') || (l3 && /^\s/.test(l3))) return { error: 'description must be a single line (no folded or multi-line YAML)' };
  const desc = /^description: (\S.*)$/.exec(l2 || '');
  if (!desc) return { error: 'frontmatter line 3 must be `description: <one line>`' };
  if (end !== 5) return { error: 'frontmatter must be exactly: ---, name, description, metadata:, "  version", ---' };
  if (l3 !== 'metadata:') return { error: 'frontmatter line 4 must be `metadata:`' };
  const ver = /^  version: (.*)$/.exec(l4);
  if (!ver) return { error: 'frontmatter line 5 must be `  version: "<v>"`' };
  const q = /^"([^"]*)"$/.exec(ver[1].trim());
  return { name: name[1].trim(), description: desc[1].trim(), version: q ? q[1] : null, rawVersion: ver[1].trim() };
}

function jsonVersion(file, pick) {
  try { return pick(JSON.parse(read(file))); } catch { return undefined; }
}

export function validate(root) {
  const errors = [];
  const err = (f, m) => errors.push(`ERROR ${f}: ${m}`);

  const version = exists(path.join(root, 'VERSION')) ? read(path.join(root, 'VERSION')).trim() : null;
  if (version === null) err('VERSION', 'file missing');

  // 6. manifests
  const manifests = [
    ['.claude-plugin/plugin.json', (j) => j.version],
    ['.claude-plugin/marketplace.json', (j) => j.plugins?.[0]?.version],
    ['.codex-plugin/plugin.json', (j) => j.version],
    ['.cursor-plugin/plugin.json', (j) => j.version],
  ];
  if (version !== null) {
    for (const [f, pick] of manifests) {
      if (!exists(path.join(root, f))) { err(f, 'file missing'); continue; }
      const v = jsonVersion(path.join(root, f), pick);
      if (v !== version) err(f, `version ${JSON.stringify(v)} does not equal VERSION ${version}`);
    }
  }

  // 1-5, 7: skills
  const skillsDir = path.join(root, 'skills');
  const names = exists(skillsDir)
    ? fs.readdirSync(skillsDir, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name).sort()
    : [];
  if (names.length === 0) err('skills/', 'no skills found');
  const readme = exists(path.join(root, 'README.md')) ? read(path.join(root, 'README.md')) : null;
  for (const n of names) {
    const rel = `skills/${n}/SKILL.md`;
    const file = path.join(root, rel);
    if (!exists(file)) err(rel, 'SKILL.md missing');
    else {
      const fm = parseFrontmatter(read(file));
      if (fm.error) err(rel, fm.error);
      else {
        if (fm.name !== n) err(rel, `name "${fm.name}" does not equal folder name "${n}"`);
        if (!fm.description.includes('Use when')) err(rel, 'description must contain "Use when"');
        if (!fm.description.includes('NOT for')) err(rel, 'description must contain "NOT for"');
        if (fm.description.length > 1024) err(rel, `description is ${fm.description.length} characters (max 1024)`);
        // An unquoted YAML value may not hold ": " or " #": strict parsers (gh skill, npx skills) reject the file.
        if (/: | #/.test(fm.description)) err(rel, 'description must not contain ": " or " #" (strict YAML parsers reject it)');
        if (fm.version === null) err(rel, `metadata.version must be a quoted string, got ${fm.rawVersion}`);
        else if (version !== null && fm.version !== version) err(rel, `metadata.version "${fm.version}" does not equal VERSION ${version}`);
      }
    }
    if (readme === null) err('README.md', 'file missing');
    else if (!readme.includes('`' + n + '`')) err('README.md', `skill table does not list \`${n}\``);
  }

  // 8 + 9: scan files
  const leaks = [...LEAKS.map((re) => ({ re, label: String(re) })), ...localDenylist(root, err)];
  for (const rel of walk(root, root)) {
    const isMd = rel.endsWith('.md');
    if (!SCANNED.test(rel)) continue;
    const text = read(path.join(root, rel));
    if (isMd) {
      for (const m of text.matchAll(/\[[^\]]*\]\(([^)\s]+)\)/g)) {
        const target = m[1];
        if (/^(https?:|mailto:|#)/i.test(target)) continue;
        const p = decodeURI(target.split('#')[0]);
        if (!p) continue;
        if (!exists(path.resolve(root, path.dirname(rel), p))) err(rel, `broken relative link ${target}`);
      }
    }
    if (rel === 'scripts/validate-skills.mjs' || rel === 'scripts/validate-skills.test.mjs') continue;
    for (const { re, label } of leaks) if (re.test(text)) err(rel, `leak pattern ${label}`);
    for (const m of text.matchAll(EMAIL)) {
      if (m[0].toLowerCase() !== 'contact@designerbox.ai') err(rel, `leak: email ${m[0]} (only contact@designerbox.ai is allowed)`);
    }
  }
  return errors;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const root = path.resolve(process.argv[2] || path.join(path.dirname(fileURLToPath(import.meta.url)), '..'));
  const errors = validate(root);
  for (const e of errors) console.log(e);
  process.exit(errors.length ? 1 : 0);
}
