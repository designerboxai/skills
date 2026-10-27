---
name: designerbox-start-here
description: Use when someone wants DesignerBox product photos, listing images or ad creatives and the connector or upload path is not set up yet, or it is unclear which DesignerBox skill fits. NOT for running a generation itself; this skill checks the connector, reads credits, gets photos in, and hands off to designerbox-product-photos, designerbox-batch, designerbox-ads-social or designerbox-refine.
metadata:
  version: "0.1.1"
---

# DesignerBox: start here

This skill is a router. It never generates an image and it costs nothing to run. It does four things in order: checks the connector, reads the user's credits, gets their photos into DesignerBox, and sends them to the right skill.

Reply in the user's language. Keep replies short. Offer choices as labelled options (A, B, C). Ask at most 4 questions in total before a run. No em dashes, no sales talk, no offers to review their setup.

## 1. Connector check

DesignerBox has two connectors. Only the one at `https://mcp.designerbox.ai/api` can generate images and read credits. The directory connector cannot generate, and it does not have `get_plan_limits`.

1. If the host has tool search, search for `get_plan_limits` first. Only a tool named exactly `get_plan_limits` counts. The directory connector has a `get_plan` tool, and a tool search may surface it: it shows billing details, not credits, and it is NOT a substitute for `get_plan_limits`.
2. Call `get_plan_limits` (no arguments, read only, free).
3. If it answers, the right connector is there. Go to step 2. Do not tell the user to add anything.
4. If the tool is missing, or the call fails because it does not exist, tell the user plainly: they have only the directory connector, or no DesignerBox connector yet, and that one cannot generate. Then give the steps for their host and stop until they are done. Never tell someone to add a connector they already have.

If the call fails with a sign-in error, ask them to sign in again. That is a different problem from a missing tool.

If both DesignerBox connectors are connected, use the tools of the connector that answered `get_plan_limits` for every call in the task, including listing and uploads, and hand that on to the next skill. Each connector can be on its own current team, so mixing them can find a photo in one team and spend credits in another.

### Add the connector

- **claude.ai:** Settings, Connectors, Add custom connector, paste `https://mcp.designerbox.ai/api`, then sign in to DesignerBox when asked. Start a new chat afterwards so the tools load.
- **Claude Code:** either
  - `claude plugin marketplace add designerboxai/skills`, then `claude plugin install designerbox-studio@designerbox`, or
  - `claude mcp add --transport http designerbox-studio https://mcp.designerbox.ai/api`
  
  Then run `/mcp` and sign in to designerbox-studio.
- **Other hosts:** add an MCP server of type HTTP with the URL `https://mcp.designerbox.ai/api` in that host's MCP settings, and sign in when it asks.
- **Cursor:** sign-in to this connector is not supported in Cursor yet. Say so plainly and suggest claude.ai or Claude Code instead.

## 2. Credits

Read the result of `get_plan_limits`:

- `limits.aiCredits.available` is what the user can spend now: the rest of the monthly allowance plus the purchased balance. `null` means the plan has no monthly cap.
- `limits.aiCredits.purchasedBalance` is the part that comes from credit packs they bought. Mention it when it is above 0, so they know the total includes it.
- `limits.aiCredits.monthly` has `limit`, `current` and `exceeded` for the monthly allowance. A `limit` of -1 means unlimited.

State the balance in one line, for example: "You have 240 credits available (40 of them from a pack)." When `available` is `null` (or the monthly `limit` is -1), never print "null" or "-1": say "Your plan has unlimited credits." instead.

If `available` is 0, or `monthly.exceeded` is true and `purchasedBalance` is 0, say plainly before routing anywhere that there are no credits left. Keep it to that, with no upsell wording and no mention of plans or packs.

This skill only reports the balance. Say that the skill they are sent to quotes the exact cost and compares it with the balance before anything runs.

## 3. Getting photos in

Ask only if they have photos and where they are. Pick the path by host.

### claude.ai

A photo attached to the chat does not reach DesignerBox. The server's call-order note suggests `import_chat_image` for attached photos. Ignore that here: that tool is for another host, so do not call it here.

Instead call `upload_asset` with no arguments. It opens an upload panel in the chat. The user picks the file there, it saves to their library, and the link comes back. Tell them in one line: "A panel will open, pick your photo there." Repeat for each photo, one panel at a time.

### Cowork

`upload_asset` opens the same panel in Cowork. Offer the panel first, as in claude.ai. Use the shell upload below only if the panel does not open or the user prefers it.

### Claude Code and other shells

`upload_asset` returns `uploadUrl`, `uploadToken`, `maxBytes` and `allowedMimeTypes` instead of showing a panel. Upload the file yourself:

```
curl -X PUT "<uploadUrl>" -H "Authorization: Bearer <uploadToken>" -H "Content-Type: <mime>" -H "X-Upload-Filename: <name>" --data-binary @<file>
```

The response is `{assetId, url}`. Keep both: `url` is what the generation tools take as the source picture.

Rules for this path:

- One `upload_asset` call per file. Each token is single use and short lived.
- Check the file against `allowedMimeTypes` and `maxBytes` first (JPEG, PNG, WebP, GIF, MP4, WebM, up to 50MB).
- Never print the token anywhere except in the command.
- If the upload fails, say what went wrong in plain words and offer to try the file again.
- If the network or a proxy refuses the PUT (for example `curl: (56) CONNECT tunnel failed`, or a 403 page from a proxy rather than a reply from DesignerBox), do not try again in a loop. Ask the user to upload the photos in the DesignerBox app at designerbox.ai, then continue with `list_assets` and `get_asset` as in "Already in the library" below.

### Already in the library

If the photos are already in their DesignerBox library, call `list_assets` (filter `type` with `image`, or pass a `folderId`), let them pick, then `get_asset` for the chosen id to get its `url`. Nothing is uploaded and nothing is charged.

If the upload fails because storage is full, tell them storage is full and that they can delete unused assets in DesignerBox. Do not suggest anything else.

## 4. Where to go next

Pick one, based on what they want. If it is unclear, ask one question with these as labelled options.

| They want | Go to |
|---|---|
| Photos for one product | `designerbox-product-photos` |
| A list of products, a folder of photos or a CSV | `designerbox-batch` |
| Ads or social posts, or specific sizes like story, feed, banner | `designerbox-ads-social` |
| "This came out wrong", or a change to an image they already have | `designerbox-refine` |

Hand over what you already know: the connector is confirmed, the credit number, and the `url` of each photo. Do not make the user repeat any of it.

## Rules

- This skill never calls a generating tool and never spends credits. Reading plan limits, listing and getting assets are free.
- The other skills call only the charging tools they name. For any other paid tool (video, avatars, designs, pipelines, apps), say it is outside these skills and do not call it.
- Do not mention other products or companies.
- Do not offer to review their files, settings or setup.
