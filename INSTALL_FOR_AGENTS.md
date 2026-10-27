# Install runbook for agents

Follow these steps in order. Stop and tell the user at any step that fails. Do not spend credits at any point here: every call below is read only.

## 1. Detect the host

- Running inside Claude Code: use the Claude Code path.
- Running in claude.ai chat: use the claude.ai path (you cannot install for the user, so give them the steps).
- Codex, Cursor or another host: use the generic path.

## 2. Add the connector and the skills

The connector URL is `https://mcp.designerbox.ai/api`.

**Claude Code**

```
claude plugin marketplace add designerboxai/skills
claude plugin install designerbox-studio@designerbox
```

If you only want the connector: `claude mcp add --transport http designerbox-studio https://mcp.designerbox.ai/api`. Then the user runs `/mcp` and signs in to `designerbox-studio`.

**claude.ai**

Tell the user: Settings, Connectors, Add custom connector, paste the URL, sign in. Then have them download `designerbox-studio-0.1.1.zip` from https://github.com/designerboxai/skills/releases/latest and upload it as it is, without unzipping (Customize, Plugins, Upload), or upload one skill folder as a skill. Fallback: paste a `SKILL.md` into a Project's instructions. One skill folder or one pasted `SKILL.md` is partial: it loses rules that live in other skills' reference files (retry rules, call shapes). The plugin is the supported path. Full steps: [INSTALL.md](INSTALL.md).

**Codex**

Add the server from [`mcp.json`](mcp.json) to the Codex MCP config and point Codex at `skills/` (see [`.codex-plugin/plugin.json`](.codex-plugin/plugin.json)).

**Cursor and other hosts**

Add an MCP server of type HTTP with the URL above and copy the folders in `skills/` to where the host reads skills. Cursor sign-in is not supported yet: say so and suggest claude.ai or Claude Code.

**Skills only:** `npx skills add designerboxai/skills`. The connector is added separately.

## 3. Verify

1. Start a new session so the tools load.
2. Call `get_plan_limits` with no arguments. It is read only and free.
3. If it answers, the right connector is there. Report the credits in one line from `limits.aiCredits.available`. If `available` is `null`, say the plan has unlimited credits.
4. If the tool is missing, the user has only the directory connector or none. Repeat step 2 for the host.
5. If it fails with a sign-in error, ask the user to sign in again.

## Rules

- Never call a generating tool during install.
- Never print an upload token or any credential.
- Both `designerbox-studio` and the `designerbox` directory plugin can be installed side by side.
