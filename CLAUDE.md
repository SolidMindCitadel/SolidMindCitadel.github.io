# SolidMind Citadel – project brief for Claude

Owner: Ariet Figueroa (GitHub: SolidMindCitadel)
Live site: https://solidmindcitadel.github.io/
Repository: SolidMindCitadel.github.io (public, GitHub Pages from `main`, root)

Read this whole file before making any change.

## What this is

A family learning-games site with a castle theme, inspired by a friend's site
(Ryan's "Learning Den"). It is **our own design**: don't copy Learning Den's code,
game titles, rank names or layout.

Tagline: "Envision a Brighter Tomorrow."
Method: **Envision → Engineer → Create** (imagine it, test it, build it).

Right now it's for family only. Later it may also host the SolidMind PLC trainer for
students, and the kids' games may move to their own repository (see "Keep it easy
to separate").

## Who uses it

Three kids: ages **11**, **8** and **7**. Every game needs difficulty levels so all
three can play the same game at their own level. The 11-year-old is also the
**beta tester for the PLC games** in the Nexus.

## Privacy rules (public site, never break these)

- No real names, ages, school, address, photos of the kids, or passwords in any file.
- Kids use **nicknames** they type in on their own device. Nicknames, levels and coins
  are saved in that browser only (localStorage), never committed to the repo.
- Saved progress lives on each device and does not sync between devices. Say so in the UI.

## Site map

| Hall | Theme | Holds |
| --- | --- | --- |
| The Imperial Library | Envision / learn | Reading, spelling, science facts |
| The Proving Grounds | Check / test | Math challenges, quizzes |
| The Forge | Create / build | Logic and building puzzles (patterns, sequences, simple circuits) |
| The Nexus | Where it connects | PLC and controls games (son's area) |

Main page: `index.html` (castle picture `citadel.jpg`, four hanging banners).
A banner is a `<div class="cloth">` while closed ("Gates open soon") and becomes
`<a class="cloth" href="...">` when its hall opens. Never link to a page that doesn't exist.

## Plan (build in this order, one feature per pull request)

1. **Foundation:** shared `citadel-core.js` with:
   - "Who enters the Citadel?" hero screen: each kid picks a nickname, a crest and a color
   - Level per hero (Level 1 / 2 / 3) set by the parent, not by age
   - Gold coins per hero, earned in games
   - Ranks: Apprentice → Squire → Knight → Engineer → Master Engineer
   - **The Treasury:** parent area behind a PIN to set levels, view coins and approve rewards.
     A browser PIN is only a gate for kids, not real security; say so in code comments.
2. **First games:** 3–4 games, one or two per hall, all using `citadel-core.js`.
3. **The Nexus:** PLC games. Ariet will upload the existing files (PLC trainer
   prototype, ladder editor, and a "snake and ladder" PLC game). Do not invent or
   rebuild these from guesses; ask for the files.

## Keep it easy to separate later

- Hall pages at the root: `library.html`, `proving-grounds.html`, `forge.html`, `nexus.html`.
- Kids' games in `games/` (e.g., `games/times-trials.html`).
- PLC material in `nexus/`.
- Use relative links only, so folders can move to another repository.

## Technical rules

- Static site for GitHub Pages: plain HTML, CSS and JavaScript. No build step,
  no frameworks that need compiling, no server, no API keys.
- File names lowercase with hyphens. GitHub Pages is case-sensitive.
- Must work on phones, tablets and computers (touch-friendly buttons, at least 44 px).
- Wrap every localStorage read/write in try/catch; the page must still work if storage is empty or blocked.
- Respect `prefers-reduced-motion`.
- Keep the look from `index.html`: night-sky navy, gold trim, arcane blue glow;
  fonts Cinzel (headings) and Alegreya Sans (body); light-mode "daylight stone" variant.
- Every image needs alt text.
- Test that a game can actually be finished and that coins are awarded correctly
  before opening a pull request.

## Code style (Ariet's preference)

- Each file starts with a header comment: purpose, files it depends on, and a tag index.
- Label every section with a searchable tag, e.g. `[CSS-COLORS]`, `[HTML-HALLS]`,
  `[JS-COINS]`. Keep tags and notes up to date when code changes.
- Comments explain *why*, in plain language Ariet can follow.

## Nexus / PLC rules (from the SolidMind PLC project)

- On screen the controller is "SolidMind PLC". No PLC brand or model names on screen.
- Wiring, terminals, program, indicators and equipment behavior must always agree.
  Any example presented as correct must actually work.
- A normally closed Stop button reads TRUE when released, so the ladder uses a
  normally open contact. An E-stop is hardwired and safety-rated; never present a
  PLC rung alone as an emergency stop.
- Virtual controller I/O never exceeds 8 DI, 4 DO, 2 AI, 2 AO, 2 RTD.

## How to work with Ariet

- Ariet is new to GitHub. Explain each pull request in plain words: what changed,
  which files, and how to check it on the live site after merging.
- Small pull requests, one feature at a time. Don't jump ahead to later steps.
- Don't guess about details that aren't in this file; ask.
- Add a line to the change log below with every merged change.

## Open decisions

- [ ] Coins: just for fun, or tied to real rewards approved in the Treasury?
- [ ] Treasury PIN: Ariet sets it on first use
- [ ] When to move the kids' games to their own repository (before sharing outside the family)

## Change log

- Nov 14, 2026: Repository created. Added `index.html` (Citadel main page with four
  closed halls), `citadel.jpg`, and this brief.
