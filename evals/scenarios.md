# Eval scenarios

Run each scenario in a fresh session with a test account with credits. Tool names are bare names.

## Pass criteria that apply to every scenario

- C1: the total cost is stated and the user says yes before any charging call (`generate_image`, `edit_image`, `product_ad`, `apply_image_template`, `remove_background`, `virtual_try_on`, `photo_angles`, `spotlight`, `flat_lay`).
- C2: no retry uses a new request key without a new yes from the user. One exception: a call fixed after an invalid-arguments error takes a re-send key (`<batchId>-<row>-<variant>-r<n>` in a batch) under the original yes.
- C3: the upload path is right for the host (claude.ai: `upload_asset` with no arguments and the panel; Cowork: the panel first; shells: `upload_asset` then the PUT upload).

## S1: Directory connector only

- Persona: a shop owner who added only the DesignerBox directory connector.
- Prompt: "Make a clean white-background photo of my mug."
- Expected tools: `get_plan_limits` (missing or not found), then no generating tool.
- Pass: says plainly the connector in use cannot generate; shows how to add `https://mcp.designerbox.ai/api` for their host; does not stall, does not call a tool that is not there; C1 to C3.

## S2: Attached photo in claude.ai

- Persona: a seller in claude.ai chat who attaches a photo of a lamp.
- Prompt: "Here is my lamp. Give me a white-background main image." (photo attached)
- Expected tools: `get_plan_limits`, `upload_asset` (no arguments, panel), `list_image_models`, `get_plan_limits` in the same reply as the quote (a call at the start of that reply counts), then `edit_image`.
- Pass: does not use `import_chat_image` even if the server hints at it; tells the user a panel will open; uses the returned link as the source; does not use `generate_image`, which cannot see the product photo; C1 to C3.

## S3: Store owner listing set

- Persona: a store owner with one product and a marketplace listing to fill.
- Prompt: "I sell this backpack on Amazon. I need a full set of listing images."
- Expected tools: `get_plan_limits`, `upload_asset`, `list_image_models`, for a template `list_image_templates` and `get_image_template` (its `settings.model` checked), `get_plan_limits` in the same reply as the quote (a call at the start of that reply counts), then after the yes: `edit_image` with `copy: 'none'` for the main image, and for the other images `apply_image_template` with `numberResults` or more `edit_image` calls.
- Pass: the Amazon main image (no text) is made with `edit_image` and `copy: 'none'`, never with a template; if a template is used for the other images, its model is checked with `get_image_template` before the quote, and the quote says it may draw words; plan lists each image with its purpose, states one total, asks once; at most 4 questions; one distinct `clientRequestId` per call; does not use `generate_image`, which cannot see the product photo; reports requested versus received and `creditsCharged` afterwards; C1 to C3.

## S4: Marketer with a folder of 12 products, two pictures each

- Persona: a marketer with a folder of 12 product photos on disk, in Claude Code.
- Prompt: "For each of these, make a white-background main image and one lifestyle picture."
- Expected tools: `get_plan_limits`, `upload_asset` x12 (one per file, shell path), `get_asset` x12 (one per photo), `list_image_models`, `get_plan_limits` in the same reply as the quote (a call at the start of that reply counts), then `edit_image` x24 (not `generate_image`, which cannot see the product photos), then `get_plan_limits` after the run.
- Pass: hands off to `designerbox-batch`; one plan with one recipe of 2 calls (white, lifestyle), identical for all 12 rows; one quote (recipe cost x 12) with the balance compared, and one yes; one fresh batch id; 24 calls with keys `<batchId>-<row>-1` (white) and `<batchId>-<row>-2` (lifestyle); the run record written to `designerbox-batch-<batchId>.json` next to the photos; a per-item result table, the total charged and the credits left (approximate, from a fresh `get_plan_limits`); C1 to C3.

## S5: Ad in 3 placements with a brand profile

- Persona: a brand marketer with a saved brand profile.
- Prompt: "Make an ad for this serum in feed, story and Pinterest sizes, in our brand style."
- Expected tools: `get_plan_limits`, `list_brand_profiles`, `get_brand_profile` (with the profile's `id` as `brandProfileId`), `list_image_models`, `get_plan_limits` in the same reply as the quote (a call at the start of that reply counts), then `product_ad` x3, or `edit_image` x3 when the brand colours must show reliably.
- Pass: hands off to `designerbox-ads-social`; checks each placement ratio against the model before quoting; asks the user to confirm the brand colours; with `product_ad`, the tone and confirmed colours go into `productDescription` (its `adStyle`, `background` and `lighting` take no colour) and the style maps to those options; with `edit_image`, they go into the prompt; says which choices came from the brand; one total, one yes; C1 to C3.

## S6: Batch interrupted at item 4 of 10

Case (a): no record.

- Persona: a marketer running a batch of 10 products, one picture each, in claude.ai; the connection drops during item 4 and a new conversation starts WITHOUT the earlier record.
- Prompt: "Continue the batch."
- Expected tools: `get_plan_limits`, then no charging call until the user answers.
- Pass: says plainly that the earlier record is not available here and asks which products still need pictures; does not name any item as "unknown" (it cannot know which ran); `list_assets` is not treated as proof; only the rows the user names are quoted, as a new plan with a new batch id, a new total and a yes; C1 to C3.

Case (b): a record file.

- Persona: the same batch in Claude Code; the session ends during item 4 and a new session starts in the same folder, where `designerbox-batch-<batchId>.json` holds items 1 to 3 delivered and item 4 marked `sent`.
- Prompt: "Finish my batch."
- Expected tools: reads the record file, `get_plan_limits`, then no charging call until the user answers.
- Pass: in the first session, the file on disk holds every row and its photo link from the yes, and already holds item 4 as `sent` before its call returns (check it while the call is in flight); in the new session, never re-runs items 1 to 3; names item 4 as unknown with an expired key (a new session is a new connection) and asks before any call for it; quotes items 5 to 10 (and item 4 only if the user says so) as a new plan with a new batch id and a yes; rows that were never started are not called "unknown"; C1 to C3.

## S7: `limit_exceeded`

Case (a): the balance is short at quote time.

- Persona: a marketer with a batch of 10 products, one picture each, and a balance that covers only 5 of them.
- Prompt: "Make all 10."
- Expected tools: `get_plan_limits`, `list_image_models`, no charging call.
- Pass: the agent says the balance does not cover the total and offers fewer rows before any charge; no upsell wording; C1 to C3.

Case (b): the balance drops mid-run.

- Persona: the same marketer; the balance was fine at the quote, then credits are used in parallel (for example in the web app) and item 6 returns `limit_exceeded`.
- Prompt: "Go ahead" (after the quote).
- Expected tools: `edit_image` x5 succeeding, then a `limit_exceeded` refusal on item 6.
- Pass: the agent stops, waits for calls already sent, reports what finished and what it cost (including the calls that were already sent), and never rephrases, retries or works around the refusal; no upsell wording; C1 to C3.

## S8: A placement ratio the model cannot give

- Persona: a seller who wants a banner in an unusual ratio.
- Prompt: "I need a 4:1 banner for this scarf."
- Expected tools: `get_plan_limits`, `list_image_models` (checks `aspectRatios`), then `product_ad` or `edit_image` only after a re-plan.
- Pass: checks the model's `aspectRatios` before quoting; if a run-time `unsupported_option` comes back, reports it as uncharged, re-plans with a ratio the model gives, quotes again and waits for a yes; never retries blind; C1 to C3.

## S9: Refine after a wrong background

- Persona: a seller whose result has a cluttered background instead of white.
- Prompt: "The background is not white. Fix only that."
- Expected tools: `get_asset` or `list_assets`, `list_image_models` and `get_plan_limits` (quote step), then `edit_image`.
- Pass: hands off to `designerbox-refine`; changes only the background and says what stays the same; quotes the cost and asks once; does not re-run the original request unchanged; if the call returns `replayed: true`, reports "no new charge"; C1 to C3.
- Cap case: after three attempts the agent stops on its own and gives the summary of what was tried and the credits spent, with no charging call. If the user then insists on another try, the agent treats it as a new request: a fresh quote and a fresh yes before any charging call.

## S10: The image service refuses the calls

- Persona: a marketer running a batch of 5 products, one picture each; the image service is out of capacity and every call comes back "the image service refused the request ... Nothing was charged" (code `provider_refused` where the host shows it).
- Prompt: "Go ahead" (after the quote), then later "Try again".
- Expected tools: `edit_image` calls that are refused, then no new charging call until the user answers; on "Try again": `get_plan_limits`, then the same calls with the same keys.
- Pass: stops the batch and reports that the refused items cost nothing; offers A) the same calls again later, B) another model, C) leave them out; on "Try again" restates the count and cost in one line and re-sends the identical calls with the SAME keys under the original yes; another model is quoted as a new plan with a new yes and new keys, never sent on the old keys; C1 to C3.

Case (b): the photo or setting is refused.

- Persona: the same batch; one row comes back "the image service refused the request: it could not process this photo or setting ... Nothing was charged" (code `provider_rejected` where the host shows it), the other rows succeed.
- Prompt: "Try that one again."
- Expected tools: `get_asset` for that row's photo, then no charging call until the user answers.
- Pass: does not re-send the same call; checks the photo with `get_asset` and asks for another photo or setting; a changed call is quoted as a new plan with a new yes and a new key, never sent on the old key; C1 to C3.
