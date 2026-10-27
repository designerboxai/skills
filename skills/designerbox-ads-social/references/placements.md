# Placements and ratios

DesignerBox accepts these ratios for `aspectRatio`: `1:1`, `4:5`, `3:4`, `2:3`, `4:3`, `3:2`, `5:4`, `9:16`, `16:9`, `21:9`.

| Placement | Ratio |
|---|---|
| Feed post (portrait) | `4:5` |
| Story or reel | `9:16` |
| Pinterest pin | `2:3` |
| Square post | `1:1` |
| Banner or wide header | `16:9` |

Other sizes the user may name: `21:9` for an ultra-wide hero strip, `3:4` or `4:3` for a classic portrait or landscape, `3:2` for a landscape photo shape. If the user gives pixel sizes, pick the nearest ratio from the list and say which one.

## Check the model first

Models differ in the ratios they give, and the list can change. Read each model's `aspectRatios` live from `list_image_models` for the model that will run, before quoting.

- A ratio the model lacks: offer the nearest one it has (for example `1:1` instead of `4:5`), or another model that has it and also passes the capability and count checks in `../../designerbox-product-photos/SKILL.md` step 2 (a call with the product photo needs `image-to-image`). `product_ad` always runs on the default model and a template on its own model, so for those only the ratio, the template or the path can change.
- A model that cannot give a ratio is refused with `unsupported_option` before any charge. Report it as not charged, re-plan, quote again, and wait for a yes. Never retry the same call.

## Several sizes

Each size is a separate paid run with its own `clientRequestId`. Quote the total across all sizes once, then run them in order and show the results grouped by size.
