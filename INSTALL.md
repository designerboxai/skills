# Install on claude.ai

This guide is for anyone, no coding needed. It takes about five minutes. You need a DesignerBox account.

## Step 1: Add the DesignerBox connector

1. Open claude.ai and click your name, then Settings.
2. Open Connectors.
3. Click Add custom connector.
4. In the URL box paste this and save:

   `https://mcp.designerbox.ai/api`

5. Sign in to DesignerBox when the window asks.

(Screenshot: the Connectors page)
(Screenshot: the Add custom connector box with the URL filled in)
(Screenshot: the DesignerBox sign-in window)

If you already see a DesignerBox connector, check its address. The directory connector cannot make images. The one that can ends in `/api`.

## Step 2: Add the skills

Pick one way.

**Option A, the whole plugin.** Download the file `designerbox-studio-0.1.0.zip` from the [latest release](https://github.com/designerboxai/skills/releases/latest) (`https://github.com/designerboxai/skills/releases/latest`). Do not unzip it. In claude.ai open Customize, then Plugins, then Upload, and choose the file as it is.

(Screenshot: Customize, Plugins, Upload)

**Option B, one skill.** Download this repository, zip one folder inside `skills/` (for example `designerbox-product-photos`), and upload it as a skill.

**Option C, the simple fallback.** Open a Project, open its instructions, and paste the text of one `SKILL.md` file there.

Options B and C are partial: some rules live in other skills' reference files (what to do when a call fails, the exact call shapes), and those are lost. Option A, the whole plugin, is the supported way.

(Screenshot: the Project instructions box)

## Step 3: Try it

Start a new chat so the tools load, then type something like: "Make a white-background photo of my product." A small panel opens so you can pick your photo. Before anything is charged you will see the total in credits and be asked once to say yes.

(Screenshot: the photo upload panel)
(Screenshot: the cost question before a run)

## Something is not working

- No DesignerBox tools in the chat: start a new chat, then check Step 1.
- Asked to sign in again: do it, then repeat your request.
- Still stuck: contact@designerbox.ai.
