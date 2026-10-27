---
name: designerbox-ads-social
description: Use when someone wants ad or social creatives for a product with DesignerBox, in one or more placement sizes (feed, story, Pinterest, square, banner), optionally in their brand style. NOT for marketplace listing photos (use designerbox-product-photos) or video ads (not supported).
metadata:
  version: "0.1.1"
---

# DesignerBox: ads and social creatives

One product in, ad or social pictures out, in the sizes the user needs. This skill assumes `designerbox-start-here` has already confirmed the connector, read the credits and got the photo in as a `url`. If not, go there first and do not repeat its steps here.

Reply in the user's language. Keep replies short. Offer choices as labelled options (A, B, C). Ask at most 4 questions before a run. No em dashes, no sales talk, no offers to review their files. Never name tools to the user.

DesignerBox makes the pictures. It does not post or publish them anywhere.

## 1. Brand first

1. Call `list_brand_profiles` (read only, free). Take the profile with `isDefault: true`. If several exist and none is default, ask which one, as options.
2. Call `get_brand_profile` with `brandProfileId` set to that profile's `id`. Tell the user which profile you are using, by name, in one line.
3. A profile holds voice and themes, not colours. You may call `list_brand_assets` with that `brandProfileId` (read only, free) and use a palette swatch's `assetName` as a colour NAME hint only. Never infer hex values from an image or its URL. In every case, ask the user to confirm the colours (or give hex values) before they go into a prompt.
   Logo: no tool places a logo reliably, so do not fetch or place it. If the user wants their logo on the ad, say the picture is made without it and they can add the logo afterwards in the DesignerBox editor.
4. **No image tool reads the profile.** Carry it yourself. For `generate_image` or `edit_image`, put the tone (`brandVoice`, `mainThemes`), the confirmed colours and the style into the prompt. `product_ad` has only fixed options (`adStyle`, `background`, `lighting`), none of which takes a colour; its one free-text field is `productDescription`, so the tone and the confirmed colours go there (for example "calm and premium, deep green and cream"), and the style maps to the options. When the brand colours must show reliably, use `edit_image` instead: its prompt carries them. Say which choices came from the brand.
5. With no profile, offer: A) go unbranded, B) set one up now with `create_brand_profile` (`name`, `brandVoice`, `mainThemes`, optional `primaryNiche`; no credit cost). If they choose B, ask only for those fields.

## 2. Sizes up front

Ask where the pictures will be used and read `references/placements.md` to turn each placement into a ratio. Collect the full list of sizes now.

There is no free resize. Every size is its own paid run, so three sizes cost three times one. The total is quoted once, before any paid call.

## 3. Pick the path

| Path | Use it when | Call |
|---|---|---|
| Product ad | A quick styled ad of the product; the name may appear on it | `product_ad` |
| Ad template | The user names a template or wants a ready-made look; it may include words | `list_image_templates`, `get_image_template`, `apply_image_template` |
| Free prompt | A custom scene, a brand-colour treatment, or no text | `generate_image`, or `edit_image` with the product photo |

Call shapes:

- `product_ad`: `imageUrl`, `productName`, optional `productDescription`, `adStyle` (`minimal`, `bold`, `elegant`, `modern`, `vintage`, `luxury`, `vibrant`), `background` (`white`, `gradient`, `studio`, `lifestyle`, `abstract`, `solid`, `texture`), `lighting` (`soft`, `dramatic`, `natural`, `studio`, `rim`), `aspectRatio`, `clientRequestId`. One picture per call, default model price. Map the brand's tone to the options and say how (for example a calm, premium voice: `elegant`, `soft`).
- `apply_image_template`: `slug` (or `templateId`), `referenceImages: [{imageUrl: <product url>, type: 'subject'}]`, `numberResults` (1 up to the lower of 10 and the template model's `maxImages`; always send it: the template's own default count, up to 10, would change the quoted total), `aspectRatio`, `clientRequestId`.
- `edit_image`: `prompt`, `referenceImages: [{imageUrl: <product url>, type: 'raw'}]`, `editMode: 'product_image'`, `aspectRatio`, `numberResults` (1 up to the lower of 4 and the model's `maxImages`), optional `look`, `copy`, optional `model`, `clientRequestId`.
- `generate_image`: `prompt`, `aspectRatio`, `numberResults` (1 up to the lower of 4 and the model's `maxImages`), optional `look`, `copy`, optional `model`, `clientRequestId`. Use it only when there is no product photo.
- `look` is an id from the `looks` in `list_image_models`, or `'auto'`. Omit it to keep the prompt as written. Whenever you send `look: 'auto'`, also send the `model` you quoted AND `copy`: the server fills whatever is left out, so without `model` it could charge more than the quote, and without `copy` it decides on its own whether words appear. With no model id to send, leave `look` out.

## 4. Words on the picture

Default to `copy: 'none'`: no text, brand names or logos on the picture. It applies to `edit_image` and `generate_image` only.

- `product_ad` has no `copy` option, so the model may draw words, typically the product name. In the quote say the product name may appear on the picture and give the exact text. Do not promise that it will or will not.
- Templates (`apply_image_template`) have no `copy` option and a hidden prompt, so they may include words the user did not write. Say so in the quote.
- When the user wants no words, use `edit_image` or `generate_image` with `copy: 'none'`.
- After every result from `product_ad` or a template, check it for unexpected words and tell the user, as in `../designerbox-product-photos/SKILL.md` section 4, "Checking a picture": only if you can view it; otherwise say you could not check it and ask the user to confirm the words.

If the user wants words (a headline, an offer), use `copy: 'allow'`. It renders only the words quoted in the prompt, spelled as given. Before any run, show the user the exact words in quotes, once, and wait for their yes or their corrected spelling. Never add words they did not give. Check each returned picture for the words the same way and say if one is wrong; if you could not view it, say so and ask the user to check the spelling.

## 5. Plan and check before quoting

1. Call `list_image_models` (read only, free) and, for a template, `get_image_template`. Read the model facts as in `../designerbox-product-photos/SKILL.md` step 2. Never quote a price from memory or from this file.
2. **Model check.** Apply the model check (capability, ratio, count) in `../designerbox-product-photos/SKILL.md` step 2 to the model that will run, for every size the user needs. `product_ad` takes no model and uses the default; a template's model cannot be changed. If something does not fit, say so and offer what does.
3. **Cost rule.** Price each call as in `../designerbox-product-photos/SKILL.md` step 2: `product_ad` at the default model's per-image price per call, `edit_image`, `generate_image` and templates at the model's per-image price times the pictures.
4. Total = sizes x pictures per size x price.
5. **Balance.** In the same reply as the quote, call `get_plan_limits` (free; a call earlier in that reply counts, one from an earlier reply does not) and read `limits.aiCredits.available`. If the total is more than `available`, say so and offer a smaller plan (fewer sizes or pictures) before asking for a yes. If `available` is `null`, the plan is unlimited: say so and show no "credits after" number.
6. Send ONE message with: the brand in use, each size with its ratio, the exact words if any, the total in credits and the credits left after. Then wait for a clear yes. A yes covers exactly that plan. If sizes, pictures, model or words change, quote again.

Never run a paid call before that yes. Listing brands, models, templates and assets is free.

## 6. Running

- One distinct `clientRequestId` per CALL, generated when the run is confirmed. Reuse a call's id only as `../designerbox-batch/references/retry-rules.md` says.
- Keep the product itself unchanged: shape, colour, label and logo. If you viewed a result and it alters the product, say so and offer a redo, quoted on top; if you could not view it, ask the user to confirm (`../designerbox-product-photos/SKILL.md` section 4).
- Show every returned `url`, grouped by size. Report pictures received against requested, and the `creditsCharged` that came back. A result with `replayed: true` means no new charge.
- Failures, replays, credit limits and timeouts: follow `../designerbox-batch/references/retry-rules.md` (must read before the first paid call) for every failure. It says how to read the error (its code, or the text when your host shows only text), whether it was charged, what to do next and which `clientRequestId` to use. Never re-run a call that was or may have been charged under the original yes.

## 7. After the run

Ask which sizes to keep or change. For a change to a finished picture, go to `designerbox-refine`. For the same treatment across many products, go to `designerbox-batch`.

## Rules

- Never hard-code a price. Read `creditsPerImage`, `capabilities`, `aspectRatios` and `maxImages` from `list_image_models`.
- Only call the charging tools these skills name. For any other paid tool (video, avatars, designs, pipelines, apps), say it is outside these skills and do not call it.
- Do not mention other products or companies. Do not offer to review their files or setup.
