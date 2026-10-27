import { test } from 'node:test';
import assert from 'node:assert';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validate } from './validate-skills.mjs';

const fx = (n) => path.join(path.dirname(fileURLToPath(import.meta.url)), '.fixtures', n);
const has = (errs, text) => assert.ok(errs.some((e) => e.includes(text)), `expected "${text}" in ${JSON.stringify(errs)}`);

test('valid gives no errors', () => assert.deepStrictEqual(validate(fx('valid')), []));
test('missing NOT for', () => has(validate(fx('missing-not-for')), 'description must contain "NOT for"'));
test('name mismatch', () => has(validate(fx('name-mismatch')), 'does not equal folder name "designerbox-photo"'));
test('manifest version mismatch', () => has(validate(fx('version-mismatch-manifest')), '.claude-plugin/marketplace.json: version "0.2.0" does not equal VERSION 0.1.0'));
test('unquoted version', () => has(validate(fx('unquoted-version')), 'metadata.version must be a quoted string, got 0.1.0'));
test('broken link', () => has(validate(fx('broken-link')), 'broken relative link references/missing.md'));
test('leak src path', () => has(validate(fx('leak-src-path')), 'leak pattern /src\\//i'));
test('leak email', () => has(validate(fx('leak-email')), 'leak: email someone@designerbox.ai'));
test('leak pattern from a local .leak-denylist', () => {
  const errs = validate(fx('leak-denylist'));
  assert.deepStrictEqual(errs, ['ERROR skills/designerbox-photo/SKILL.md: leak pattern .leak-denylist line 3']);
});
test('leak scan covers yml files', () => has(validate(fx('leak-yml')), 'ERROR .github/workflows/ci.yml: leak pattern /src\\//i'));
test('contact email allowed', () => assert.deepStrictEqual(validate(fx('contact-email-allowed')), []));
test('skill not in README', () => has(validate(fx('skill-not-in-readme')), 'README.md: skill table does not list `designerbox-photo`'));
test('empty root reports no skills', () => has(validate(fx('valid') + '/skills/designerbox-photo'), 'no skills found'));
test('description over 1024', () => has(validate(fx('description-too-long')), 'max 1024'));
test('metadata.internal', () => has(validate(fx('internal-key')), 'metadata.internal is not allowed'));
test('folded description', () => has(validate(fx('folded-description')), 'description must be a single line'));
test('description with ": " (invalid plain YAML)', () => has(validate(fx('yaml-colon-description')), 'strict YAML parsers reject it'));
test('skill version differs from VERSION', () => has(validate(fx('version-mismatch-skill')), 'metadata.version "0.2.0" does not equal VERSION 0.1.0'));
test('VERSION missing', () => has(validate(fx('missing-version-file')), 'ERROR VERSION: file missing'));
test('README missing', () => has(validate(fx('missing-readme')), 'ERROR README.md: file missing'));
test('broken link with anchor', () => has(validate(fx('broken-anchor-link')), 'broken relative link references/missing.md#intro'));
test('each new fixture fails only for its reason', () => {
  for (const n of ['description-too-long', 'internal-key', 'folded-description', 'yaml-colon-description', 'version-mismatch-skill', 'missing-version-file', 'missing-readme', 'broken-anchor-link'])
    assert.strictEqual(validate(fx(n)).length, 1, n);
});
