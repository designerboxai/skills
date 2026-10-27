# DesignerBox skills

Skills that teach an AI assistant to make product photos, listing image sets and ad creatives with [DesignerBox](https://designerbox.ai). They ship together with the DesignerBox MCP server as one plugin, `designerbox-studio`.

Every skill gives the total cost in credits and asks once before anything is charged.

## Skills

| Skill | Use it when |
|---|---|
| [`designerbox-start-here`](skills/designerbox-start-here/SKILL.md) | The connector or upload path is not set up yet, or it is unclear which skill fits. It checks the connector, reads your credits, gets your photos in and hands off. It never generates. |
| [`designerbox-product-photos`](skills/designerbox-product-photos/SKILL.md) | One product needs listing photos, a white-background main image, lifestyle scenes, extra angles, relighting, a flat lay or an on-model shot. |
| [`designerbox-batch`](skills/designerbox-batch/SKILL.md) | The same treatment should run over several products: a list, a folder of photos, a CSV or a catalogue, with one total-cost confirmation. |
| [`designerbox-ads-social`](skills/designerbox-ads-social/SKILL.md) | You want ad or social creatives for a product in one or more placement sizes (feed, story, Pinterest, square, banner), optionally in your brand style. |
| [`designerbox-refine`](skills/designerbox-refine/SKILL.md) | A result came out wrong or needs one specific change: a colour, a label, a background, a misspelt word, a mood. |

## Install

You need a DesignerBox account and the connector at `https://mcp.designerbox.ai/api`. The plugin adds it for you where the host supports that. Step-by-step with a non-technical walkthrough for claude.ai: [INSTALL.md](INSTALL.md). Agents can follow [INSTALL_FOR_AGENTS.md](INSTALL_FOR_AGENTS.md).

### claude.ai

1. Settings, Connectors, Add custom connector. Paste `https://mcp.designerbox.ai/api` and sign in.
2. Download `designerbox-studio-0.1.0.zip` from the [latest release](https://github.com/designerboxai/skills/releases/latest) and upload it as it is, without unzipping (Customize, Plugins, Upload). Or zip one skill folder and upload it as a skill.
3. Fallback: paste the text of a `SKILL.md` into a Project's instructions.

One skill folder or one pasted `SKILL.md` is partial: rules that live in other skills' reference files (retry rules, call shapes) are lost. The plugin is the supported path.

### Claude Code

```
claude plugin marketplace add designerboxai/skills
claude plugin install designerbox-studio@designerbox
```

Then run `/mcp` and sign in to `designerbox-studio`.

### Codex

Add the MCP server from [`mcp.json`](mcp.json) (URL `https://mcp.designerbox.ai/api`) to your Codex MCP config, and point Codex at the `skills/` folder. The plugin manifest is [`.codex-plugin/plugin.json`](.codex-plugin/plugin.json).

### Cursor and other hosts

Add an MCP server of type HTTP with the URL `https://mcp.designerbox.ai/api` in the host's MCP config JSON, then copy the folders in `skills/` to where the host reads skills.

Cursor and Codex: best effort; Cursor sign-in is not supported yet.

### Skills only

```
npx skills add designerboxai/skills
```

This installs the skills only. Add the connector separately with the URL above.

## Costs

DesignerBox generation uses your DesignerBox credits. Each skill works out the total before it runs, compares it with your balance and asks you once. A retry with the same request id within 30 minutes returns the first result instead of charging again. Nothing here sets prices: the numbers come from your account at the time you ask.

## Next to the DesignerBox directory plugin

The `designerbox` plugin from the directory (it can browse your library and designs but cannot generate) and `designerbox-studio` can be installed side by side. Only the connector at `https://mcp.designerbox.ai/api` can generate and read credits, and `designerbox-start-here` tells you if it is missing.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Release notes are in [CHANGELOG.md](CHANGELOG.md). Test scenarios for the skills are in [evals/scenarios.md](evals/scenarios.md).

## License

MIT, see [LICENSE](LICENSE). Questions: contact@designerbox.ai.
