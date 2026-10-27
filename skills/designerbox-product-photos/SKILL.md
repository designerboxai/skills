---
name: designerbox-product-photos
description: Use when one product needs listing photos, a white-background main image, lifestyle scenes, extra angles, relighting, a flat lay or an on-model shot with DesignerBox. NOT for several products at once (use designerbox-batch) or ad sizes with brand styling (use designerbox-ads-social).
metadata:
  version: "0.1.0"
---

# DesignerBox: product photos for one product

One product in, a set of store photos out. This skill assumes `designerbox-start-here` has already confirmed the connector, read the credits and got the photo in as a `url`. If not, go there first and do not repeat its steps here.

Reply in the user's language. Keep replies short. Offer choices as labelled options (A, B, C). Ask at most 4 questions before a run. No em dashes, no sales talk, no offers to review their files.

## 1. Pick the outcome

Ask what they want, as labelled options. Never name tools to the user.

| Outcome | What the user gets | Call shapes |
|---|---|---|
| Listing set | A full set of store photos in one go (main, scenes, details); a template, so it may draw words | `references/outcomes.md`, "Listing set" |
| Clean white | The product on a plain white background | "Clean white" |
| Lifestyle | The product in a real scene, with or without text | "Lifestyle" |
| More angles | New views of the same product | "More angles" |
| Relight | The same photo with different studio light | "Relight" |
| Flat lay | Several items arranged from above on a surface | "Flat lay" |
| On a model | A person wearing or holding the product | "On a model" |

If the destination is a marketplace (Amazon, Etsy, Shopify, own site), read `references/marketplaces.md` before choosing size and background, and tell the user which rule applies.

Questions to ask (only what is missing, at most 4): which outcome, how many pictures, the destination or ratio, and for a lifestyle scene the setting.

## 2. Plan and check before quoting

1. Call `list_image_models` (read only, free). It has no "default" marker. The default model is `nano-banana-pro`: read its `creditsPerImage`, `capabilities`, `aspectRatios` and `maxImages` live from the list. If that id is not in the list, use the default price stated in the `generate_image` tool description. Never quote a price from memory or from this file.
2. **Model check (capability, ratio, count).** This is the rule the other DesignerBox skills point to. Check the model that will run. For a template, call `get_image_template` and read `settings.model`: check that model; if it is `null`, the template uses the default model. If it names a model that is not in `list_image_models`, the template cannot be priced: stop, say so, and pick another template. Never fall back to the default price for it.
   - Capability: a call that sends a photo (`edit_image`, `virtual_try_on`, and `apply_image_template` with `referenceImages`) needs `image-to-image` in the model's `capabilities`. `generate_image` needs `text-to-image`.
   - Ratio: the ratio the user needs (for example 1:1 for a main image, 4:5 for a feed) must be in its `aspectRatios`.
   - Count: pictures per call are at most the LOWER of its `maxImages` (`null`: no model limit) and the tool's own limit, which is 4 for `generate_image`, `edit_image` and `virtual_try_on` and 10 for `apply_image_template`. More pictures than that means more calls.
   If something does not fit, say so and offer what does: a ratio or count the model gives, or another model that passes all three checks. A template's model cannot be changed, so for a template offer another template or another outcome instead.
3. **No ratio for these.** `photo_angles`, `spotlight` and `flat_lay` take no `aspectRatio`: the output follows the input photo. Do not promise a ratio for them.
4. **Cost rule.** `photo_angles`, `spotlight`, `flat_lay` and `product_ad` take no model and charge the default model's per-image price, read live as in step 1. `edit_image`, `generate_image`, `virtual_try_on` and templates charge the chosen model's per-image price (a template with `settings.model` of `null`: the default model's) times the pictures. `remove_background` has its own fixed price, stated in the tool's description.
5. **Templates: always send `numberResults`.** Without it the template's own default count (up to 10) runs, which would change the quoted total.
6. **Text rule.** If the user wants no words on the picture ("no text", "no logos"), use `edit_image` with `copy: 'none'`, not `product_ad`. `product_ad` is for pictures that carry the product name. Templates have no `copy` option and may draw words too: say so in the quote. For a no-text marketplace main image, use `edit_image` with `copy: 'none'`, not a template.
7. **Look.** `look` is optional. Whenever you send `look: 'auto'`, also send the `model` you quoted AND `copy` (`'none'` or `'allow'`): the server fills whatever is left out, so without `model` it could charge more than the quote, and without `copy` it decides on its own whether words appear. If you have no model id to send (the default model is missing from `list_image_models`), leave `look` out entirely.
8. **On a model with no person photo is two paid steps.** First a person picture is made, then the product is put on them. Say this up front and include both steps in the total.

## 3. One confirmation, then run

In the same reply as the quote, call `get_plan_limits` (free; a call earlier in that reply counts, one from an earlier reply does not) and read `limits.aiCredits.available`. If the total is more than `available`, say so and offer a smaller plan (fewer pictures or steps) before asking for a yes. If `available` is `null`, the plan is unlimited: say so and show no "credits after" number.

Send ONE message with the plan: each step, pictures per step, the total in credits, and the credits left after. Then wait for a clear yes. A yes covers exactly that plan. If the plan changes (more pictures, another model, another ratio), quote again.

Never run a paid call before that yes. Listing models, templates and assets is free.

## 4. Running

- Send one distinct `clientRequestId` per CALL, generated when the run is confirmed (a run with 4 angles is 4 calls and 4 ids). Reuse a call's id only as `../designerbox-batch/references/retry-rules.md` says.
- A result with `replayed: true` is the first result again: tell the user there was no new charge.
- A result can hold fewer images than asked. Report received against requested, and always the `creditsCharged` that came back. Fewer pictures cost less only on `generate_image`, `edit_image`, `apply_image_template` and `virtual_try_on`; `product_ad`, `photo_angles`, `spotlight` and `flat_lay` charge their full price even when fewer or no pictures come back.
- Show every returned `url`. Never describe a picture you were not shown.
- **Checking a picture.** This is the rule the other DesignerBox skills point to. Check a result (its words, the product) only if you can actually view the image. In Claude Code: download it (`curl -o <file> "<url>"`) and open the file with your file-reading tool. If you cannot view it, say plainly that you could not check it, and ask the user to confirm the words and that the product looks right. Never claim a check you did not do.

## 5. When a call fails

Follow `../designerbox-batch/references/retry-rules.md` (must read before the first paid call) for every failure. It says how to read the error (its code, or the text when your host shows only text), whether it was charged, what to do next and which `clientRequestId` to use. Never re-run a call that was or may have been charged under the original yes, and never rephrase or retry around `limit_exceeded` or `content_refused`.

## 6. After the run

Ask which pictures they want to keep or change. For a change to a finished picture, go to `designerbox-refine`. For the same treatment on many products, go to `designerbox-batch`.

## Rules

- Never hard-code a price. Read `creditsPerImage`, `capabilities`, `aspectRatios` and `maxImages` of the default model (`nano-banana-pro`) or the chosen model from `list_image_models`.
- Only call the charging tools these skills name. For any other paid tool (video, avatars, designs, pipelines, apps), say it is outside these skills and do not call it.
- Keep the product itself unchanged: shape, colour, label and logo. If you viewed a result and it alters the product, say so and offer a redo; if you could not view it, ask the user to confirm (section 4, "Checking a picture").
- Do not mention other products or companies. Do not offer to review their files or setup.
