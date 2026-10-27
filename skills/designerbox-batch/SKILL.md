---
name: designerbox-batch
description: Use when the same treatment should run over several products: a list of products, a folder of photos, a CSV or a catalogue, with one total-cost confirmation. Also use to resume a DesignerBox batch that stopped ("continue the batch", "finish my batch"). NOT for a single product (use designerbox-product-photos) or one ad in several sizes (use designerbox-ads-social).
metadata:
  version: "0.1.0"
---

# DesignerBox: one treatment, many products

Rows in, one treatment applied to every row, one cost confirmation, no double charges. This skill assumes `designerbox-start-here` has confirmed the connector and read the credits. It builds one treatment from the outcomes in `designerbox-product-photos` and runs it, unchanged, for every row. The exact call shapes are in `../designerbox-product-photos/references/outcomes.md`; the model check (capability, ratio, count), the prices and the per-call picture limits are step 2 of `../designerbox-product-photos/SKILL.md`; failures and keys are in `references/retry-rules.md`. Do not copy them here.

Reply in the user's language. Keep replies short. Offer choices as labelled options (A, B, C). Ask at most 4 questions before a run. No em dashes, no sales talk, no offers to review their files.

## 1. Plan

1. **Get the rows.** A pasted list, a CSV, or a folder of photos. Echo the rows and the count back in a short list. If a row is unclear, ask.
2. **Pick one treatment.** A treatment is ONE fixed recipe of 1 or more calls per row, built from the outcomes in `designerbox-product-photos`: for example "clean white" is 1 call per row, "clean white + one lifestyle" is 2. The recipe is identical for every row; only the product changes (its photo, and its name where a call takes one). Ask only what is missing: the outcomes, pictures per outcome, the destination or ratio. If the user wants different recipes for different products, that is one batch per recipe, each with its own quote and yes.
3. **Get each photo in.** For a folder or local files, upload them now, in this phase, following `designerbox-start-here` (one `upload_asset` per file). List what was uploaded. Photos already in the library: `list_assets`, then `get_asset`.
4. **Check every reference.** Call `get_asset` with the `id` of each photo and use the `url` it returns. A reference that fails to download can be charged, so a row whose photo does not resolve is dropped from the plan and named to the user. Links in a CSV that are not from the DesignerBox library have no asset id: upload them first with `upload_asset` (the path in `designerbox-start-here`), or drop the row and name it. Never send an unchecked outside link to a paid call.
5. **Check the model.** Call `list_image_models` (free) and, for a template, `get_image_template`. Apply the model check in `../designerbox-product-photos/SKILL.md` step 2 to every call of the recipe. If a call does not pass, say so and offer what does. Never quote from memory.
6. **Price it.** Price one row's recipe: for each call, its price per picture (step 2 of `../designerbox-product-photos/SKILL.md`) times the pictures it asks for, added up. Total = recipe cost x number of rows. Formula and worked examples: `references/pricing.md`.
7. **Check the balance.** In the same reply as the quote, call `get_plan_limits` (free; a call earlier in that reply counts, one from an earlier reply does not) and read `limits.aiCredits.available`. If the total is more than `available`, say so and offer a smaller plan (fewer rows or pictures) before asking for a yes. If `available` is `null`, the plan is unlimited: say so and show no "credits after" number.
8. **One confirmation.** Send ONE message: the rows, the recipe (each call and its pictures), the uploads made, the total in credits (recipe cost x rows), the credits left after, and roughly how long it takes (from `references/pricing.md`; if it has no measured time for this host, say the time is not measured here yet). Then wait for one clear yes for the whole batch. A yes covers exactly that plan; if rows, recipe, count, model or ratio change, quote again.
9. **Draw a fresh `batchId`** for each confirmed plan: `<8 random letters/digits>` (in a shell: `openssl rand -hex 4`). Generate it new every time: never reuse an id from an earlier plan or copy one from this file. A yes is spent once its batch has run: another set, more of the same, or a redo is a new plan with a new quote, a new yes and a new `batchId`. One exception: calls refused with `provider_refused` never ran, so in the same conversation, when the user asks, they may run again under the original yes, as `references/retry-rules.md` says (not for a refusal of this photo or setting).

Nothing paid runs before the yes. Listing, reading and `get_asset` are free.

## 2. Fire

- Every charging call carries `clientRequestId` = `<batchId>-<row>-<variant>`: `row` is the product's number in the confirmed list (1, 2, 3...), `variant` numbers the recipe's calls within that row, in the same order for every row (1, 2, 3...). One call, one key, even when a call returns several pictures. A call that needs more pictures than one call allows (step 2 of `../designerbox-product-photos/SKILL.md`) is split into several calls, each with its own variant. Example: with the recipe "clean white + one lifestyle", `<batchId>-4-1` is the 4th product's white picture and `<batchId>-4-2` its lifestyle picture. Keys for re-sends and re-runs: `references/retry-rules.md`.
- Start with at most 5 calls in flight. The limit is 30 image calls a minute, shared with the DesignerBox web app, so other use of the account counts too. After a `rate_limited`, drop to 1 call in flight for the rest of the batch.
- The skill is correct when calls run one by one. If your client cannot run calls in parallel, run them in order; nothing else changes.
- Keep a run record as you go: the `batchId`, every row of the confirmed plan with its source photo link (written once, at the yes, so a resumed batch can quote the rows that never started without new uploads), and per key its row, its exact arguments (so a same-key retry sends the identical call), the outcome (sent, delivered, refused, charged failure, may have been charged, unknown), images received and `creditsCharged`. Mark a key `sent` just before its call and update it when the result comes back. Post one short progress line in the chat per finished row (row, pictures, credits), so the record lives in the conversation.
- In Claude Code, or any host with a shell, also write the run record to `designerbox-batch-<batchId>.json`: next to the photos, or in the current working directory when the photos have no local folder (library photos, a CSV of links). Write the file twice per key: when you mark it `sent` (before the call goes out) and again when its result comes back. A key that is only in memory is lost if the session dies, and its row would look never started. The file is what "finish my batch" reads back.

## 3. Settle

- Never re-run an item that succeeded.
- Show the returned `url` of each picture. Never describe a picture you were not shown, and check a picture only as in `../designerbox-product-photos/SKILL.md` section 4.
- Report requested against received, and always the `creditsCharged` that came back (which tools charge less for fewer pictures: `../designerbox-product-photos/SKILL.md` section 4).
- A result with `replayed: true` is the first result again: say "no new charge". Count its `creditsCharged` once: it is what the first call cost, the retry added nothing. After a timeout the first response was never seen, so this is where that row's cost comes from.

## 4. Retry rule

Full rules, the server's error texts and the key for each case: `references/retry-rules.md` (must read). In short:

- **A coded refusal** (its code is in `structuredContent.error`; if your host shows only the text, match it as in `references/retry-rules.md`) means nothing was charged.
  - `rate_limited`: wait `retryAfterSeconds`, retry with the SAME key, and drop to 1 call in flight. At most 3 waits per key, then stop and ask.
  - `too_many_in_flight`: wait, retry with the SAME key. At most 3 waits per key, then stop and ask.
  - `credits_busy`: a short-lived lock. One short wait and one same-key retry. If it is still busy, stop that item: send no new calls, wait for the calls already sent, and ask the user how to go on.
  - `limit_exceeded`, and the credit-gate codes `ai_paused`, `ai_blocked`, `credits_unavailable` and `email_not_verified`: stop the batch. Wait for the calls already sent, then tell the user what finished and what it cost, including those calls' results. Never retry around it.
  - `content_refused`: say so for that row. Never rephrase to get around it.
  - `unsupported_option`: re-plan that item with an option the model gives, quote again, wait for a yes.
  - `provider_refused` or `provider_rejected` (text: "the image service refused the request ... Nothing was charged"): stop the batch, wait for the calls already sent, and report the items that did not run as free. What to offer next, and when the same calls may run again, is in `references/retry-rules.md`: never re-run without the user asking, and another model or template is a new plan.
  - `idempotency_conflict`: a key bug. Stop the batch and report.
  - Any other code in `structuredContent.error` that is not listed here: nothing was charged. Stop and report it.
- **Timeout or lost connection, no result** (the host's own error, such as `MCP error -32001: Request timed out` or `MCP error -32000: Connection closed`, with no DesignerBox tool result): a single timeout with the connection still working: retry with the SAME key, at most 2 same-key retries per key. After 2 retries mark the item unknown, stop, name it and ask. While its key is still live (under 30 minutes since that call, no restart or reconnect), offer first: A) check again with the same key, no second charge (if the first call ran, its result comes back; if it never arrived, it runs once at the quoted price), then B) leave it out, C) a re-run: a new plan with a new quote, a new yes and a new `batchId`. If every call in flight fails together, or the connector had to reconnect or sign in again, treat those items as unknown with an expired key (a restart forgets keys): stop, name them, ask.
- **Invalid arguments** (`MCP error -32602: Input validation error`, or `validation failed`): nothing ran. Fix the call and send it with a re-send key, `<batchId>-<row>-<variant>-r<n>`, under the original yes; quote again only if the plan changed.
- **Charged, or maybe charged** (text with `This attempt used credits`, `This attempt may have used credits`, or `MCP error -32602: Output validation error`): never re-run it under the original yes. Charged counts in the row and the total; "may have cost up to N credits" is reported apart from the total. A re-run is a new plan, quoted on top.
- **Any other error with no code**: text with `Nothing was charged` is not charged: re-plan or report. Anything else may have been charged: report it that way and ask.
- **Resuming ("finish my batch").** In Claude Code or a shell host, read `designerbox-batch-<batchId>.json` back (if there are several, ask which), and check each stored photo link again with `get_asset` (free) before quoting. Never re-run a key marked delivered. A key marked refused counts as missing. A key marked `sent` with no outcome is unknown, and a new session counts as a reconnect: treat it as unknown with an expired key (`references/retry-rules.md`): name it and ask. Quote only the calls that are still missing, as a new plan: in a row with `-1` delivered and `-2` unknown or missing, never re-run `-1`. Leftover calls that differ from the recipe (for example only `-2` for some rows) are their own plan with their own quote and yes. With no record file and no earlier record in this conversation, say plainly that the earlier record is not available here and ask the user which products still need pictures. Do not call any item unknown: you cannot know which ones ran. A recent `list_assets` can help them check but is not proof. Quote only the rows they name.
- **Unknown outcome and the key may have expired** (more than 30 minutes, or the service restarted in between): stop, name the items, ask the user. A look at `list_assets` is not proof either way.

## 5. Report

End with a table, one row per product: product, pictures received of requested, credits charged. A charged failure shows its cost in that row and in the total. Then:

- the total charged;
- apart from it, what may have been charged ("may have cost up to N credits": the outage text or an unknown outcome), with a suggestion to check the balance;
- the credits left, from a fresh `get_plan_limits` after the run, labelled approximate (other use of the account changes it);
- the library link (`libraryUrl` from a result). Pictures from `remove_background` are not saved to the library: give their links directly.

Name any row that failed or has an unknown outcome and what the user can choose next, as labelled options.

## Rules

- Never hard-code a price or a ratio. Read them from `list_image_models`.
- Money first: when in doubt, stop and ask rather than call again.
- Only call the charging tools these skills name. For any other paid tool (video, avatars, designs, pipelines, apps), say it is outside these skills and do not call it.
- Keep each product itself unchanged: shape, colour, label and logo.
- Do not mention other products or companies. Do not offer to review their files or setup.
