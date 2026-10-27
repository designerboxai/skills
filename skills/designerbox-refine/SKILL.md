---
name: designerbox-refine
description: Use when a DesignerBox result came out wrong or needs one specific change (a wrong colour, an altered label, an odd background, a misspelt word, a different mood). NOT for a first generation or for re-running the same request unchanged.
metadata:
  version: "0.1.0"
---

# DesignerBox: fix or change one thing in a result

A picture DesignerBox made is close but not right. This skill changes it with as little spend as possible. It assumes `designerbox-start-here` has already confirmed the connector and read the credits. If not, go there first and do not repeat its steps here.

Reply in the user's language. Keep replies short. Offer choices as labelled options (A, B, C). Ask at most 4 questions before a run. No em dashes, no sales talk, no offers to review their files. Never name tools to the user.

## 1. Name the defect, change one thing

Ask what is wrong, as labelled options where you can (colour, shape, background, light, words, the product itself changed, other). Turn the answer into ONE change, stated in a sentence ("make the lid matte black, leave everything else as it is"). If the user lists several problems, take the most important one first and say the others come after it. Several changes in one prompt is how a good part of a picture gets lost.

Questions to ask (only what is missing, at most 4): what is wrong, what it should be instead, which picture, and whether any words must appear (spelled exactly).

## 2. Get the picture

Work on the picture already made, not on a fresh one.

- Same conversation: use the `url` the earlier call returned.
- Earlier session: `list_assets` to find it, then `get_asset` for its link (both read only, free). Show the match and confirm it is the right one.

Keep the attempt count from here on (see section 5). The count follows the user's request, not the url: edits and a fallback generation all count toward the same 3. Each next attempt starts from the best result so far; if it is unclear which that is, ask the user to pick.

## 3. Edit, do not regenerate

Prefer `edit_image` on the result: the rest of the picture stays, only the named thing changes. A new generation re-rolls everything and costs the same on the same model.

- `edit_image`: `prompt` (the one change, plus "keep everything else the same"), `referenceImages: [{imageUrl: <the result url>, type: 'raw'}]`, `numberResults: 1`, no `aspectRatio` (the edit keeps the picture's own proportions), `copy: 'none'` unless the user wants words, optional `model`, `clientRequestId`.
- Words: with `copy: 'allow'`, only words quoted in the prompt are drawn, spelled as given. Show the exact words in quotes and wait for the user's yes or corrected spelling. Never add words they did not give. After the run, check the words as in `../designerbox-product-photos/SKILL.md` section 4, "Checking a picture", and say if one is wrong; if you could not view the picture, say so and ask the user to check the spelling.
- Use `generate_image` only when the result cannot be edited into what they want (the whole composition is wrong) and say why. It still counts toward the same 3 attempts. Quote it at its model's price, read live.
- Keep the product itself unchanged: shape, colour, label and logo. If you viewed the result and the edit alters the product, say so; if you could not view it, ask the user to confirm.
- Look: `look` is optional. Whenever you send `look: 'auto'`, also send the `model` you quoted AND `copy`: the server fills whatever is left out, so without `model` it could charge more than the quote, and without `copy` it decides on its own whether words appear. With no model id to send, leave `look` out.

## 4. Quote, then one yes per attempt

1. Call `list_image_models` (read only, free) and read `creditsPerImage`, `capabilities`, `aspectRatios` and `maxImages` of the model that will run, as in `../designerbox-product-photos/SKILL.md` step 2 (default model `nano-banana-pro`). Never quote a price from memory or from this file.
2. **Model check.** Use the model check in `../designerbox-product-photos/SKILL.md` step 2: `edit_image` needs a model with `image-to-image` in `capabilities`, and `generate_image` one with `text-to-image`. `edit_image` keeps the picture's proportions, so send no `aspectRatio`. For a `generate_image` fallback, the picture's ratio must be in the `aspectRatios` of the model that will run. If it is not, say so and offer another model that has it and passes the capability check.
3. **Cost rule.** One attempt costs the model's per-image price times one picture. In the same reply as the quote, call `get_plan_limits` (free; a call earlier in that reply counts, one from an earlier reply does not) and read `limits.aiCredits.available`. If the attempt costs more than `available`, say so and offer a cheaper model before asking for a yes. Say it plainly: "This attempt costs N credits. You have M left, so K after it." If `available` is `null`, the plan is unlimited: say so and show no "after" number.
4. **Cheaper to explore (offer once).** If trying ideas, offer a cheaper model for the exploring attempts and the original model for the final one. Only models that can edit an image qualify: filter `list_image_models` by `capability: 'image-to-image'`, read the prices and ratios there, and say plainly that a cheaper model may look different or hold the product less exactly. A model whose categories are only `upscale` is not an option here: it enlarges a picture, it does not change one.
5. Wait for a clear yes. A yes covers exactly one attempt. Every further attempt needs its own quote and its own yes.

## 5. Running, and the limit of 3

- Every attempt gets a NEW `clientRequestId`, generated when that attempt is confirmed. Never reuse an earlier attempt's id for a changed prompt, model or picture. Reuse an id only as `../designerbox-batch/references/retry-rules.md` says.
- Show the returned `url`, say what changed and what did not, and report the `creditsCharged` that came back. A result with `replayed: true` is the first result again: no new charge.
- Say it worked only if you viewed the picture (`../designerbox-product-photos/SKILL.md` section 4, "Checking a picture"). If you could not view it, say plainly that you could not check it and ask the user to confirm the change, the words and the product. Never describe a picture you were not shown.
- **After 3 attempts on this request, stop.** Do not start a fourth on your own. Say what was tried (one line each), what did not work, and what you suggest instead: a clearer photo of the product, a different starting picture, or the change made by hand in the DesignerBox editor. The credits spent on it: what was charged, and apart from it what may have been charged ("may have cost up to N credits", as in `../designerbox-batch/references/retry-rules.md`). Let the user decide. The cap only stops you from going on by yourself: if the user still wants another try, treat it as a new request with a fresh quote and a fresh yes before any paid call.

## 6. When a call is refused

Failures, replays, credit limits and timeouts: follow `../designerbox-batch/references/retry-rules.md` (must read before the first paid call) for every failure. It says how to read the error (its code, or the text when your host shows only text), whether it was charged, what to do next and which `clientRequestId` to use. Never re-run an attempt that was or may have been charged under its original yes, and never rephrase around `content_refused`. A refused or failed attempt still counts toward the 3 if it was or may have been charged.

## Rules

- One defect, one change, one picture per attempt.
- Never hard-code a price. Read `creditsPerImage`, `capabilities`, `aspectRatios` and `maxImages` from `list_image_models`.
- No paid call without a yes for that attempt.
- Only call the charging tools these skills name. For any other paid tool (video, avatars, designs, pipelines, apps), say it is outside these skills and do not call it.
- Do not mention other products or companies. Do not offer to review their files or setup.
