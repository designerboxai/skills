# Outcomes: exact call shapes

Every call below takes the product photo `url` from `designerbox-start-here`. Every image tool also accepts an optional `clientRequestId` (one distinct value per call, generated when the run is confirmed; reuse a call's value only as `../../designerbox-batch/references/retry-rules.md` says). Before quoting, read the model facts and apply the model check (capability, ratio, count) in `../SKILL.md`, step 2, to every call below that takes a model.

## Listing set

A full set from a template. Find one with `list_image_templates` (`q`, `hashtag`, `limit`): `hashtag: 'ecommerce'` lists the product templates (a bare `q: 'listing'` also returns real-estate ones). Read it with `get_image_template` (`slug`): its `settings.model` is the model you check (`null` means the default model). With `referenceImages` that model needs `image-to-image` in its `capabilities`. The template's image count is its default number of results.

- `apply_image_template`: `slug` (or `templateId`), `referenceImages: [{imageUrl: <product url>, type: 'subject'}]`, `numberResults` (1 up to the lower of 10 and the template model's `maxImages`; always send it, or the template's own default count, up to 10, runs and changes the quoted total), optional `aspectRatio`, `clientRequestId`.
- Charge: the template model's (or default model's) per-image price times the pictures delivered.
- Words: a template has no `copy` option and a hidden prompt, so it may draw words. Say so in the quote. For a no-text marketplace main image use "Clean white" (`edit_image` with `copy: 'none'`) instead.

Measured (October 2026): 1 picture at 4:5 came back 928 x 1152 in about 24 seconds and cost the quoted price. A full set of 6 is estimated (not measured) at about 6 times as long, since the default model makes one call per picture.

## Clean white

- `remove_background`: `imageUrl`. Returns a transparent PNG at a fixed price.
- For a white background instead: `edit_image`: `prompt` (plain white seamless background, product unchanged, soft natural shadow), `referenceImages: [{imageUrl, type: 'raw'}]`, `editMode: 'bgswap'`, `copy: 'none'`, `aspectRatio` (for example `'1:1'`), `numberResults` (1 up to the lower of 4 and the model's `maxImages`), optional `model`, `clientRequestId`.

Measured (October 2026): 1 picture at 1:1 came back 1024 x 1024 in about 23 seconds and cost the quoted price. With `copy: 'none'`, `nano-banana-2` also erased the words printed on the product's own label, while the default model kept them: for a product whose label carries words, say so in the quote and look at the result, or use the default model.

## Lifestyle

- With words allowed: `product_ad`: `imageUrl`, `productName`, optional `productDescription`, `adStyle` (`minimal`, `bold`, `elegant`, `modern`, `vintage`, `luxury`, `vibrant`), `background` (`white`, `gradient`, `studio`, `lifestyle`, `abstract`, `solid`, `texture`), `lighting` (`soft`, `dramatic`, `natural`, `studio`, `rim`), `aspectRatio`, `clientRequestId`. One picture per call, default model price.
- No text: `edit_image`: `prompt` (the scene), `referenceImages: [{imageUrl, type: 'raw'}]`, `editMode: 'product_image'`, `copy: 'none'`, `aspectRatio`, `numberResults` (1 up to the lower of 4 and the model's `maxImages`), optional `model`, `clientRequestId`.
- `copy: 'allow'` renders only words quoted in the prompt, spelled as given.

Measured (October 2026): 1 picture at 4:5 came back 928 x 1152 and cost the quoted price. The product and its own label were kept.

## More angles

- `photo_angles`: `imageUrl`, `rotation` (0 to 360), `tilt` (-90 to 90), optional `zoom` (0 wide, 5 medium, 10 close-up), `clientRequestId`. One picture per call, default model price. No `aspectRatio`: the output follows the input photo.
- Presets:
  - front: rotation 0, tilt 0
  - three-quarter: rotation 45, tilt 10
  - side: rotation 90, tilt 0
  - top-down: rotation 0, tilt 80

Measured (October 2026): about 21 seconds, 1024 x 1024, the quoted price. A 45 degree rotation came back close to the original view: for a clearly different angle, ask for a larger change and look at the result before going on.

## Relight

- `spotlight`: `imageUrl`, `azimuth` (0 to 360, 0 = front), `elevation` (-90 to 90), `lightType` (`soft`, `hard`, `rim`, `key`), `brightness` (0 to 100), optional `lightColor` (hex such as `#FFAA00`), `clientRequestId`. Default model price. No `aspectRatio`: the output follows the input photo.

Measured (October 2026): about 23 seconds and the quoted price. The output kept the input photo's shape (a 4:5 photo came back 928 x 1152).

## Flat lay

- `flat_lay`: `imageUrls` (1 to 8 product photos), `background` (`marble`, `wood`, `concrete`, `fabric`, `pink`, `neutral`), `style` (`minimal`, `luxe`, `bohemian`, `geometric`, `organic`), `itemCount` (1 to 10), optional `positionPrompt`, `clientRequestId`. Default model price. No `aspectRatio`, and the output shape is not guaranteed (square in our test).

Measured (October 2026): 2 products came back as one 1024 x 1024 (square) picture in about 24 seconds, at the quoted price. Do not promise a ratio for a flat lay.

## On a model

Needs a person picture. If the user has none, this is two paid steps; quote both.

1. Person picture (skip if they have one): `generate_image` (the model needs `text-to-image`): `prompt`, `copy: 'none'`, `aspectRatio`, `numberResults` (1 up to the lower of 4 and the model's `maxImages`), optional `model`, optional `look` (an id from `list_image_models` `looks`, or `'auto'`), `clientRequestId`. With `look: 'auto'` also send `model` (the one you quoted) and `copy`; with no model id to send, leave `look` out.
2. Clothing: `virtual_try_on` (the model needs `image-to-image`): `personImageUrl`, `garmentImageUrl`, optional `maskImageUrl`, optional `model`, `numberResults` (1 up to the lower of 4 and the model's `maxImages`), `clientRequestId`.
3. Other products held or placed with a person: `edit_image` (the model needs `image-to-image`): `prompt` (the person holding or using the product, product unchanged), `referenceImages: [{imageUrl: <person url>, type: 'raw'}, {imageUrl: <product url>, type: 'subject'}]`, `copy: 'none'`, `numberResults` (1 up to the lower of 4 and the model's `maxImages`), optional `model`, `clientRequestId`.

Measured: pending live run
