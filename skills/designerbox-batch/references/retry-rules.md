# Retry rules

This file owns failures, keys, replays and error codes for every DesignerBox skill. The other skills point here. For one product, skip the batch-only parts (`batchId`, rows, calls in flight).

## Keys

- One `clientRequestId` per call, generated when the run is confirmed. In a batch the key is `<batchId>-<row>-<variant>`, with one fresh `batchId` per confirmed plan (`../SKILL.md`, step 9).
- **Same key**: only to send the exact same call again, with the same arguments, where the table below says "Same" (a timeout or lost connection, `rate_limited`, `too_many_in_flight`, `credits_busy`, `provider_refused` when the user asks for it, option A for an unknown outcome). The same key with the same arguments, within 30 minutes of the first call finishing, returns the first outcome (`replayed: true`, or the same charged error) and never charges twice. A service restart forgets keys. Keep each key's exact arguments in the run record so the retry is identical.
- **Re-send key**: a call fixed after an invalid-arguments error is a changed request, so it takes a fresh key for that one call, under the original yes (nothing ran the first time). In a batch: `<batchId>-<row>-<variant>-r<n>`, where `n` is the re-send number (1, 2...). The `batchId` stays the same: one per confirmed plan. The run record keeps one line per key.
- **New plan key**: every other new key is a new paid run and needs a new quote and a clear yes first. In a batch that is a new confirmed plan with a new `batchId`, never an old key.
- The same key with different arguments gives `idempotency_conflict`.

## Reading a failure

- A DesignerBox failure always comes back as a tool result. A coded refusal carries its code in `structuredContent.error`. claude.ai and Claude Code show only the result's text, starting `Error:`, even for a coded refusal. So for a tool result with no visible code, find the code with "When only the text is shown" below, before anything else.
- A failure with no code is one that matches none of rows 1-8b there, or an `MCP error -32602` text:
  - `MCP error -32602: Input validation error ...`: the arguments did not match the tool. Nothing ran.
  - `MCP error -32602: Output validation error ...`: the call RAN (and may have charged), but its result could not be read. Handle it like "This attempt may have used credits" below.
- `MCP error -32001: Request timed out`, `MCP error -32000: Connection closed`, or any other timeout or dropped connection with no tool result, is the HOST's own error, not a DesignerBox one: use the "Timeout" rows.

## When only the text is shown

Match the text in this order and stop at the first match. The quoted words are the server's own.

| Order | The text contains | Read it as |
|---|---|---|
| 1 | `was already used for a different request` | `idempotency_conflict`. Check this first: it also says "send a new clientRequestId", but nothing was charged. |
| 2 | `Too many requests` (and `Please try again in N seconds`) | `rate_limited`, with N as `retryAfterSeconds` |
| 3 | `Another generation is starting` | `credits_busy` |
| 4 | `Not enough AI credits`, `AI credit limit reached` or `Limit exceeded for` | `limit_exceeded` |
| 5 | `does not support that aspect ratio` or `returns at most` | `unsupported_option` |
| 6 | `declined:` | `content_refused` |
| 7 | `AI generation is paused` / `AI generation is not available for this account` / `We could not check your credits just now` / `Please verify your email address` | `ai_paused` / `ai_blocked` / `credits_unavailable` / `email_not_verified` |
| 8 | `temporarily paused by the operator` / `is not available on this workspace's current DesignerBox plan` / `Re-authorize with that scope` | `service_paused` / `upgrade_required` / `insufficient_scope` |
| 8b | `the image service refused the request` | `provider_refused`, or `provider_rejected` when the text says it could not process this photo or setting |
| 9 | anything else | an error with no code: the rows below that start "Error without a code", in their order |

## Table

| Code or situation | What it means | Charged? | What to do | Key |
|---|---|---|---|---|
| `rate_limited` | Over 30 image calls a minute (shared with the web app) | No | Wait `retryAfterSeconds`, retry. Drop to 1 call in flight. At most 3 waits per key, then stop and ask. | Same |
| `too_many_in_flight` | Too many jobs running for the team | No | Wait, retry. At most 3 waits per key, then stop and ask. | Same |
| `credits_busy` | A short-lived lock on the credits | No | One short wait and one same-key retry. If it is still busy, stop that item: send no new calls, wait for the calls already sent, and ask the user how to go on. | Same |
| `limit_exceeded` | Credits ran out (or another plan limit) | No | Stop the batch. Wait for the calls already sent. Report what finished and what it cost, including those calls. Never retry around it. | None |
| `ai_paused`, `ai_blocked`, `credits_unavailable`, `email_not_verified` | The account cannot generate right now | No | Stop. Tell the user, in your own words, what the tool said. Do not retry. | None |
| `service_paused`, `upgrade_required`, `insufficient_scope` | The tool is paused, or not available to this workspace or connection | No | Stop. Tell the user, in your own words, what the tool said. | None |
| `provider_refused`, `provider_rejected` | The image service refused the call: usually out of capacity, sometimes a photo it could not fetch or a request it would not take (`provider_rejected`: this photo or setting) | No | Stop the batch: send no new calls, wait for the calls already sent. Report which items did not run and that they cost nothing. Offer: A) run the same calls again later, B) another model where the tool takes one (`generate_image`, `edit_image`, `virtual_try_on`), or another template or outcome, C) leave them out. A) in this conversation: only when the user asks, call `get_plan_limits`, restate the count and cost in one line (if it no longer fits the balance, say so and offer fewer), then send the identical calls with the same keys under the original yes (each runs once; nothing is cached for a refusal). Do not offer A when the code is `provider_rejected`, the text says it could not process this photo or setting, or the same item is refused again: the identical call fails again. Check the photo with `get_asset` and ask. B) is a new plan: a new quote, a new yes and new keys, never the old keys with another model or template. In a new session, follow the resume rule in `../SKILL.md`. | Same for A, when the user asks; new plan key for B, after the yes |
| `content_refused` | The request was declined | No | Say so for that row. Never rephrase around it. Continue with other rows. | None |
| `unsupported_option` | The model cannot give that ratio or count | No | Re-plan that item with an option the model gives, quote again, wait for a yes | New plan key, after the yes |
| `idempotency_conflict` | The key was reused with different arguments: a bug in the run | No | Stop the batch and report | None |
| Timeout, connection still working | Outcome unknown | Maybe | Retry the exact call, at most 2 same-key retries per key, then mark unknown and follow the "key still live" row | Same |
| Unknown outcome, key still live (under 30 minutes since that call, no restart, no reconnect or new sign-in) | The first call may have run | Maybe | Stop and ask, with option A first: A) check again with the same key: the exact same call, no second charge (if the first call ran, its result comes back marked `replayed`; if it never reached DesignerBox, it runs once, at the price already quoted). B) leave the item out. C) a re-run, which is a new paid run: new quote, new yes. | Same for A; new plan key for C, after the yes |
| Every call in flight fails together, or the connector reconnected or signed in again | Keys may be forgotten after a restart | Maybe | Treat as unknown with an expired key: stop, name the items, ask | None until the user decides |
| Unknown outcome, key may be expired (over 30 minutes or service restarted) | A retry could charge twice | Unknown | Stop. Name the items. Ask the user. `list_assets` is not proof. | None until the user decides |
| Error without a code that says the arguments were invalid (`MCP error -32602: Input validation error`, `validation failed`) | The call was rejected before anything ran | No | Fix the call's arguments. Quote again and get a new yes only if the plan changed (count, model, ratio, price). | Re-send key |
| Error without a code, text says `This attempt may have used credits`, or `MCP error -32602: Output validation error` | It may or may not have been charged | Maybe | Report it apart from the charged total: "it may have cost up to N credits" (N = its quoted cost), and suggest checking the balance with `get_plan_limits`. Never re-run it under the original yes. Do not send a new key until the user says yes to a re-run, quoted on top. | New plan key, after the yes |
| Error without a code, text says `This attempt used credits` | Charged. The same key returns the same error | Yes | Count it at its quoted cost in that row and in the total charged ("it cost N credits"). Never re-run it under the original yes. Do not act on "send a new clientRequestId" until the user says yes to a re-run, quoted on top. | New plan key, after the yes |
| Error without a code, text says `Nothing was charged` | Not charged | No | Re-plan or report | None |
| Error without a code, anything else | Unknown | Maybe | Report it as "may have been charged" and ask | None |
| Any other code in `structuredContent.error` not in this table | Not charged | No | Stop and report | None |

## Rules

- Never re-run an item that succeeded.
- Retry with the same key only the exact same call with the same arguments.
- An error with no code may have been charged (except one that says the arguments were invalid, or that nothing was charged): never re-run it under the original yes.
- A result with `replayed: true` means no new charge. Count its `creditsCharged` once: it is what the first call cost.
- `variant` is the call's number within the row, not the picture's.
