# Pricing for a batch

Never use a number from this file as a price: the examples below only show the arithmetic. Each call's price per picture, the per-call picture limits and the template count rule are in step 2 of `../../designerbox-product-photos/SKILL.md`; read the prices live from `list_image_models`.

## Formula

```
recipe cost per product = for each call in the recipe: price per picture x pictures in that call, added up
                          (pictures = the numberResults you send, or 1 for a tool that gives one picture)
total credits           = recipe cost per product x number of products
credits after           = available - total credits
```

`available` is `limits.aiCredits.available` from `get_plan_limits`, read in the same reply as the quote (`../SKILL.md`, step 7).

Always report the `creditsCharged` that came back. The quote is the most the batch can cost, except that a re-run after a failure is a new plan, quoted on top. How a failure counts (charged, or may have been charged): `retry-rules.md`.

## Worked examples

A recipe of 1 call: 10 products, 4 pictures each in one call, on a 4-credit model:

- recipe cost = 4 credits x 4 pictures = 16 per product
- 16 x 10 products = 160 credits, 10 calls

If the user has 500 credits, the plan message says: total 160, credits after 340.

A recipe of 2 calls: 12 products, each "clean white + one lifestyle":

- call 1, clean white (`edit_image`, 1 picture) on a 4-credit model: 4 x 1 = 4
- call 2, lifestyle (`edit_image`, 1 picture) on the default model: suppose its price is 10 credits (the live price comes from `list_image_models`): 10 x 1 = 10
- recipe cost = 4 + 10 = 14 per product
- 14 x 12 products = 168 credits, 24 calls, keys `<batchId>-<row>-1` and `<batchId>-<row>-2`

## Time

Rate limit: 30 image calls a minute, shared with the web app. Start with 5 calls in flight. One call for one picture took about 20 to 25 seconds. In Claude Code, calls sent together still ran one after another (measured October 2026), so plan about 20 to 25 seconds per call: 10 products with 1 picture each take about 3 to 4 minutes. A call for several pictures is estimated (not measured) at about that long per picture. Time on claude.ai is not measured yet.

## Measured

| What | Result |
|---|---|
| Time for 5 products x 1 picture, Claude Code | about 97 seconds (the calls ran one after another) |
| Time per call, 1 picture | about 20 to 25 seconds |
| Credits charged vs quote | every finished call cost exactly its quote; a same-key retry cost 0 (`replayed: true`); a "Nothing was charged" refusal cost 0; one failed call that said "This attempt may have used credits" did cost its quote |
