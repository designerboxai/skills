# Changelog

## 0.1.1

- Installs cleanly with `gh skill install` and `npx skills add`: the validator's test fixtures moved to a hidden folder, so skill installers no longer pick them up.
- `designerbox-batch`: its description is valid YAML for strict parsers, and the validator now rejects a description that is not.
- README: badges, install routes first (including `gh skill install`), invoke commands, outcomes and a quick reference.

## 0.1.0

First release.

- Skills: `designerbox-start-here`, `designerbox-product-photos`, `designerbox-batch`, `designerbox-ads-social`, `designerbox-refine`.
- Manifests for Claude Code (plugin and marketplace), Codex and Cursor, with the connector at `https://mcp.designerbox.ai/api`.
- A repo validator and test scenarios in `evals/scenarios.md`.
