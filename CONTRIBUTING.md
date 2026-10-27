# Contributing

Issues are welcome: a bug, a skill that behaved badly, or a skill you would like. Pull requests are reviewed and may take a few days.

## Before you open a PR

Run both checks from the repo root:

```
node scripts/validate-skills.mjs
node --test --test-concurrency=4 scripts/validate-skills.test.mjs
```

Both must pass. The validator checks skill frontmatter, versions, the README skills table, relative links and the leak rule below.

## Style for skills

- Replies a skill prescribes are short, in the user's language, with choices as labelled options and at most 4 questions before a run.
- Name tools by bare name, for example `generate_image`.
- Every skill states the total cost and asks once before anything is charged.
- No em dashes, no sales talk, no offers to review a user's files.

## The leak rule

This repo is public. Do not add internal file paths, code from the service behind the connector, private email addresses (only contact@designerbox.ai is allowed), internal dates, or the names of internal systems. The validator fails on the obvious ones; use judgement for the rest.

Maintainers may keep an extra local deny-list in `.leak-denylist` (one regex per line, `#` for comments). It is gitignored and the validator reads it when present.

## Versions

`VERSION`, every manifest `version` and every `metadata.version` in a `SKILL.md` must be the same string.
