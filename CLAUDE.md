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

Three kids at different levels, from early elementary to middle school. Every game
needs Level 1, 2 and 3 so all of them can play the same game at their own level.
The oldest is also the **beta tester for the PLC games** in the Nexus.

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
| The Nexus | Where it connects | PLC and controls games (PLC beta tester's area) |

Main page: `index.html` (castle picture `citadel.jpg`, four hanging banners).
A banner is a `<div class="cloth">` while closed ("Gates open soon") and becomes
`<a class="cloth" href="...">` when its hall opens. Never link to a page that doesn't exist.

## Plan (build in this order, one feature per pull request)

1. **Foundation:** shared `citadel-core.js` with:
   - "Who enters the Citadel?" hero screen: each kid picks a nickname, a crest and a color
   - Level per hero (Level 1 / 2 / 3) set by the parent, not by age
   - Gold coins per hero, earned in games
   - Ranks: Apprentice → Squire → Knight → Engineer → Master Engineer, each with
     Bronze / Silver / Gold tiers, moved up only by passing tests (see "Rank ladder and tests")
   - **The Treasury:** parent area behind a PIN to set levels, view coins and approve rewards.
     A browser PIN is only a gate for kids, not real security; say so in code comments.
2. **First games:** 3–4 games, one or two per hall, all using `citadel-core.js`.
3. **The Nexus:** PLC games. Ariet will upload the existing files (PLC trainer
   prototype, ladder editor, and a "snake and ladder" PLC game). Do not invent or
   rebuild these from guesses; ask for the files. (Opened in v0.5.0 with Ladder Race.)

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

### The Nexus hall (built in v0.5.0)

- `nexus.html?id=<heroId>` lists the Nexus games. Each hero has a **"Nexus access"** switch in
  the Treasury, **off by default**. Only heroes with it on see the Nexus banner on their hero
  page; for everyone else the banner is left out completely (not shown as closed). Visitors
  never see or enter it. The Nexus banner on `index.html` stays closed, because that page is
  not tied to a hero. Like the PIN, this is a gate for kids, not security.
- **Ladder Race is an exception.** `nexus/ladder-race.html` is a standalone game from Ariet's
  PLC training course, kept exactly as Ariet made it (same rules, levels, look, fonts and coil
  names). It is NOT part of the Citadel's learning system: no coins, skill areas, mastery,
  question bank or trophies, and the SolidMind PLC I/O and naming rules above don't apply to it.
  The only Citadel additions are a back button to the Nexus and the version footer. Don't change
  how it plays without asking Ariet first.
- Its gameplay (not its PLC content) is the model for the reusable race board and for
  "How every game teaches" below.

## Rank ladder and tests (permanent rules, built in v0.2.0)

- 5 ranks (Apprentice, Squire, Knight, Engineer, Master Engineer) × 3 tiers
  (Bronze, Silver, Gold) = 15 steps. Everyone starts at **Apprentice – Bronze**.
- Moving up one tier always needs a passed test: Bronze → Silver, Silver → Gold, and
  Gold → next rank's Bronze (the **promotion test**). 14 tests in all.
- **Ranks never go up from coins alone.** Show rank and tier (e.g. "Squire – Silver") with a
  bronze, silver or gold badge on the hero card and hero page.
- Test rules:
  1. Each test has a coin amount. With at least that many coins the test unlocks. The kid
     chooses when to take it; it never starts by itself.
  2. Pass mark 75%. Pass = keep all coins, move up one tier.
  3. Fail = lose half of that test's coin amount (rounded down; test 50 → lose 25).
  4. After a first fail: one retake only, and only with at least the test's coin amount.
  5. Fail the retake = the test locks. To unlock, the hero must reach **90%** in each
     **weak area** of that retake, in that area's game. A weak area is an area scored
     **under 75%** on the retake. Only results earned after the lock count. Once all are
     mastered the test resets to a fresh test (needs the coins again, first try + one retake).
  6. While a hero has a test ready, failed once, or locked for mastery, no NEW games or
     challenges unlock for that hero (`Citadel.newGamesAllowed`). Games they already have
     still work. A game that teaches a weak area must stay playable, or the hero gets stuck.
- An **area** is one specific lesson or skill, not a hall or subject (e.g. "adding within 10",
  "multiplying multi-digit numbers", "latch circuits", "turn a light on/off with a switch").
  Every test question is tagged with exactly one area. Mastering one area never counts toward
  another.
- Each game defines how its 90% is measured (e.g. 9 of 10 wins against the computer, or 90%
  accuracy) and reports it with `Citadel.reportAreaScore(heroId, areaId, percent)`.
- Real tests call `Citadel.finishTest(heroId, answers)` with one `{area, label, correct}`
  per question. Coins from games go through `Citadel.addCoins(heroId, amount)`.
- `test.html` is a placeholder ("Test questions coming soon") with parent-only preview buttons
  behind the Treasury PIN (pretend pass/fail, add coins, pretend 90% in a weak area).
- **Test coin amounts are starting numbers** that Ariet can change in the Treasury:
  20, 30, 50, 60, 80, 110, 120, 150, 200, 220, 260, 320, 350, 400 (tests 1–14).

## Hero page features (built in v0.3.0)

- **Treasure chest:** every coin change is logged in the hero's coin history (date, + or −,
  where it came from). Games add coins with
  `Citadel.addCoins(heroId, amount, { game: "game-id", label: "Game Name" })`; this also adds to
  that game's total. Other sources: test fail, "Correction" (Treasury), "Parent preview" (test.html).
- **No parent coin rewards.** The Treasury only has a "Correct coins" box per hero to fix
  mistakes, with a reason (shown as "Correction"). Parent rewards will be gold dust (see Planned).
- **Trophy hall:** a dated badge for every tier/rank reached (Apprentice – Bronze from the day the
  hero joins). Best scores come from games: `Citadel.recordBestScore(heroId, { game, label, score,
  text, lowerIsBetter })`. Until then it says "Play a game to earn your first trophy."
- **Settings per hero:** Sound and "Read words out loud", set by the kid on their page. Games use
  `Citadel.getSettings(heroId)`, `Citadel.playSound(heroId, "coin"|"right"|"wrong"|"tap")` and
  `Citadel.speak(heroId, text)`; the last two already respect the settings.
- **Backup and restore** (Treasury, behind the PIN): a file or copied text with everything on the
  device, including the test coin amounts and the PIN (scrambled). Restoring replaces everything.
  Backups contain nicknames: never commit one to this public repository.
- **Visitor mode:** "Play as a visitor" on heroes.html opens `visitor.html`. Games use the player
  id `Citadel.VISITOR_ID` ("visitor"). Visitors can play, but nothing is saved: coins vanish when
  they leave, no trophies, no treasure chest, and no rank tests.

## Games: how they work (built in v0.4.0, Pizza Party is the template)

- Each game is `games/<name>.html?id=<heroId or visitor>` with its question makers in
  `games/<name>-questions.js`. Hall pages (e.g. `proving-grounds.html?id=...`) list their games in
  one `GAMES` line each. Copy `games/pizza-party.html` when building a new game.
- **Levels:** a game uses the hero's level from the Treasury. Visitors pick a level.
- **Choosing a hero from a hall:** a hall or game opened without a hero links "Choose a hero"
  to `heroes.html?next=<hall>`, and the chosen hero lands straight back in that hall's games.
  Each new hall must be added to `NEXT_PAGES` in `citadel-core.js` `[JS-NEXT]`.
- **Starter games** (`Citadel.STARTER_GAMES`, now just `pizza-party`) are never blocked by rule 6.
  Other games check `Citadel.canPlayGame(heroId, gameId)`.
- **Scoring (Ariet's rules):**
  - Right on the first try = 100 points.
  - Wrong: the game shows why, step by step (never a harsh sound). The kid then fixes that
    same question, which earns no points, and that skill gets a "miss".
  - Later in the round, a NEW question on that skill is added (at most 3 extra per round).
  - Each miss on a skill this session lowers that skill's points by 10 (90, 80, 70 ... never
    below 10). Misses reset when the hero leaves the game page.
  - Coins per round = total points ÷ 100, rounded. A perfect 5-question round = 5 coins, so
    4 good rounds unlock the first test (20 coins).
- **Skills:** every answer goes to `Citadel.reportAnswer(heroId, {area, label, points, firstTry})`.
  - Grade = average points of the last 10 answers in that skill (wrong = 0).
  - Mastery = right on the first try in at least 9 of the last 10. A fixed question never
    counts; a later re-test answered right does.
- **Best score** per game and level goes to the Trophy hall (`Citadel.recordBestScore`).
- Each game may have its own fun mini rank ladder, stored with `Citadel.setGameData`. It never
  changes the Citadel rank. Pizza Party (by rounds finished): Dough Roller 0, Sauce Spreader 3,
  Cheese Sprinkler 8, Topping Tosser 15, Pizza Master 25.
- **Speech and sound:** every question has a 🔊 speaker button that reads it out for anyone.
  When "Read words out loud" is on, questions are also read automatically. Sound plays only
  when Sound is on.
- **Test question bank** (`citadel-questions.js`): games register question MAKERS per skill area
  and level, not fixed questions, so every question has new numbers.
  - Rank tests must ask the same TYPE of question (same skill, same level) but with different
    wording, numbers and things, so a kid can't pass by memorising game answers.
  - `CitadelQuestions.forTest` never uses a game's own theme. Pizza Party questions appear in
    tests as cookies, apples, pie or cake, with friends, ponies or teddy bears instead of kids.
  - test.html stays "Test questions coming soon" until 2–3 games exist. Ariet will then decide
    which skills each of the 14 tests covers.
- Pizza Party skill areas:
  - Level 1: Counting slices (`count-1-10`), More or fewer (`more-fewer`), Adding and taking
    away slices (`add-take-10`).
  - Level 2: Sharing equally (`share-equal`), Halves and quarters (`halves-quarters`).
  - Level 3: Sharing with leftovers (`share-leftover`), Fractions of a pizza
    (`fraction-of-whole`), Comparing fractions (`compare-fractions`).

## How every game teaches (permanent rules for all future games)

Ladder Race is the model.
- It must feel like a game, not schoolwork. The learning is the move: right answers power
  progress (move, win, build); wrong answers cost a little progress, never a scolding.
- Play against something: the computer, a rival or a timer.
- After every answer, show visually why it was right (like the circuit lighting up green).
- Difficulty adapts: a few right in a row gets harder, a couple wrong gets easier.
- Variety: shuffle question types so they don't repeat.
- Mix luck with skill so a struggling kid can still win sometimes.
- Short rounds for Level 1 players.
- Rotate themes between games (knights and princesses, space, dragons, pirates, kid-friendly
  mysteries and others). Pizza was one example, not a rule.

## Reusable race board (built in v0.5.0, `citadel-race.js`)

- A race-to-the-finish board game against the computer that any future Citadel game (math,
  reading, science...) can use with its own questions: `CitadelRace.start({ mount, playerName,
  ask(tier, who), tiers, cpuLevels, theme, onAnswer, onTier, onEnd, speak, sound })`.
  `CitadelRace.fromBank(q)` turns a `citadel-questions.js` question into a race question.
- It copies Ladder Race's gameplay, not its PLC content:
  - **Board:** 30 squares, ladders up, "downs" back (the theme names them: short circuits,
    dragon slides...).
  - **Turn:** roll the move die, then up to 3 tries, each a new question. A wrong answer
    costs 1 square; a roll used up, or 3 wrong answers, loses the turn.
  - **Adapts:** 3 right in a row = harder; 2 wrong at a tier = easier.
  - **Computer:** a move die and a skill die (6 = 40%, 5/4 = 60%, 3 = 80%, 1/2 = random
    10–90%). It follows the same 3-try rule, with +20% per retry. Every 3rd turn it gets a
    wild card: a skill die under 4 is re-rolled, with +30% (max 95%). Its question is shown so
    the kid can follow along.
- No game uses it yet. A game that does still follows the Citadel rules (coins, skill areas,
  mastery, trophies) through `citadel-core.js`, using the `onAnswer` and `onEnd` callbacks.

## Planned (not built yet): hidden quests and special events

- A hidden quest appears when a hero reaches each new rank: Squire, Knight,
  Engineer, Master Engineer. Kids don't know about quests until one appears.
- The quest is a race-to-the-finish board game against the computer, with
  questions covering everything the hero should have learned up to that rank.
- The computer gets harder to beat at each rank: easy to beat at Squire,
  medium at Knight, hard at Engineer, hardest at Master Engineer.
- The quest board game uses Ladder Race's dice rules: move die, skill die, 3 tries, and a
  wrong answer costs one square. It asks the hero's own questions instead of ladder logic.
  Build it on the reusable race board (`citadel-race.js`).
- Completing a quest earns a real-money reward, $5 by default, amount
  changeable in the Treasury.
- The parent controls quests both ways: an on/off switch per hero, and the
  parent approves each quest before it appears to the kid.
- Special events: the parent triggers them from the Treasury at any time.
  They never change rank or tier. They show the parent how well the hero is
  doing. Afterwards the parent may award hint tokens (spent on hints in
  games) or decide on a money reward.
- Build quests and events only after the first games exist, since they use
  the games' questions.

## Planned (not built yet): story lessons (Imperial Library)

- Each game gets an original interactive story that teaches its concept first. Example: a
  kid-friendly mystery where a detective follows math clues to catch the culprit.
- Three steps:
  1. The kid reads how the character solves the first clue.
  2. The character asks "What should I do now?" and the kid answers.
  3. The attached game unlocks, and the kid plays as that character using the same skill.
- The game unlocks when the kid finishes the story and answers its questions. No timer.
- Length by level:
  - Level 1: about 5 minutes (big pictures, few words, uses read-aloud).
  - Level 2: about 10 minutes.
  - Level 3: about 15 minutes.
- After the first read the game stays unlocked, and the story can be reread anytime.
- All stories, characters and titles must be our own originals, never copied from existing books.
- The first story will be a test; Ariet picks its theme later. Pizza Party will later be
  reworked into a real game alongside it.

## Planned (not built yet): treasures

- Gold coins come from games and unlock tests.
- Gold dust is only given by the parent (special events and rewards) and is spent on
  hints in games (1 hint = 10 dust).
- 100 gold dust can be traded for 1 gold nugget.
- A gold brick is worth $5 real money: a hidden quest win gives 1 brick, or a hero can
  melt nuggets into a brick (10 nuggets per brick to start), but only after reaching
  Knight and only once the parent releases the melting feature, which may be its own
  special quest.
- Every exchange number (dust per nugget, nuggets per brick, hint cost, brick value) must
  be changeable in the Treasury.
- The goal is to teach saving vs. spending.

## Versions and records (permanent rules, follow on every change)

- **Every pull request is one version.** Numbers look like `v0.2.0`.
  New feature: raise the middle number (v0.2.0 → v0.3.0).
  Fix: raise the last number (v0.2.0 → v0.2.1).
- Put the version in the **pull request title**, e.g. "v0.2.0: Hero profiles".
- Add an entry to **`CHANGELOG.md`** (newest first): version, date, what was added or
  changed, which files changed, and why, in plain words.
- Show the current version in small text in the **footer of every page**. To update it,
  search all files for the tag `[VERSION]` (each page footer) and change
  `VERSION` in `citadel-core.js` `[JS-VERSION]`. New pages must include the footer version.
- **Newest files after every update (cache busting):** browsers keep old copies of shared
  files. Every link to a local `.css` or `.js` file ends in the version, for example
  `citadel-core.js?v=0.5.0`. With each new version, search all `.html` files for `?v=` and
  change every one to the new number (the old number must not remain anywhere). New pages
  and new shared files must use `?v=` too. A changed `?v=` makes browsers fetch the new file.
  HTML pages themselves may stay cached for up to about 10 minutes after a merge (GitHub Pages).
- **Pages update themselves (`version.json`, built in v0.5.1):**
  - The main folder has `version.json`, holding the current version: `{"version": "0.5.1"}`.
  - Every page has a small `[JS-UPDATE]` script in its `<head>` with
    `PAGE_VERSION`. When the page opens, it fetches `version.json` without using the browser's
    saved copy. If that version is newer, the page reloads **once** with `_fresh=<version>` in its
    address, so the newest copy loads.
  - It can't loop: it never reloads if the address already has that `_fresh` mark, or if
    this tab already tried for that version. If `version.json` can't be loaded, the page just
    works as usual.
- **Every new version updates all of these together:**
  1. `version.json`
  2. `PAGE_VERSION` in every page's `[JS-UPDATE]` script
  3. the footer text
  4. every `?v=` number
  5. `VERSION` in `citadel-core.js`

  Search all files for the old number; it must not remain anywhere. New pages must include the
  `[JS-UPDATE]` script (copy it from any page; use `../version.json` for pages in subfolders).
- Add a line to the **change log at the bottom of this file** too.
- In every pull request description, include a short **"How to undo this version"** note
  explaining how to use GitHub's **Revert** button on the merged pull request.

## How to work with Ariet

- Ariet is new to GitHub. Explain each pull request in plain words: what changed,
  which files, and how to check it on the live site after merging.
- Small pull requests, one feature at a time. Don't jump ahead to later steps.
- Don't guess about details that aren't in this file; ask.
- Add a line to the change log below with every merged change.
- Ariet copies and pastes exactly what Claude gives him and does not change code
  himself. So Claude is fully responsible for checking every change before handing it
  over: privacy (nothing personal in public files), correctness, and that the site still
  works. Give Ariet exact step-by-step instructions, naming the exact button and where it
  is on the screen. If anything is unclear or could go more than one way, ask Ariet
  before doing it.

## Open decisions

- [ ] Coins: just for fun, or tied to real rewards approved in the Treasury?
- [x] Treasury PIN: Ariet sets it on first use (built in v0.2.0)
- [ ] When to move the kids' games to their own repository (before sharing outside the family)
- [ ] Theme of the first story lesson (Ariet picks later)

## Current files

| File | What it is |
| --- | --- |
| `index.html` | Main page (castle, four halls: Proving Grounds open, Nexus closed here, "Enter the Citadel" button) |
| `heroes.html` | "Who enters the Citadel?" hero cards (`?next=<hall>` returns to that hall after choosing) |
| `hero.html` | One hero's home page (`hero.html?id=...`): coins, rank, level, next test, halls, treasure chest, trophy hall, settings |
| `visitor.html` | Visitor page for friends: halls, games, nothing saved |
| `proving-grounds.html` | The Proving Grounds hall: list of its games (`?id=hero or visitor`) |
| `nexus.html` | The Nexus hall (`?id=hero`), only for heroes with Nexus access |
| `nexus/ladder-race.html` | Ladder Race: standalone game from Ariet's PLC course (exception, see Nexus) |
| `citadel-race.js` | Reusable race board for future Citadel games |
| `games/pizza-party.html` | Pizza Party, the first game and the template for others |
| `games/pizza-party-questions.js` | Pizza Party's question makers (added to the test bank) |
| `citadel-questions.js` | Shared test question bank, themes, pictures and step-by-step explanations |
| `treasury.html` | Parent area behind the PIN: add/edit/remove heroes, set levels, hero progress, correct coins, test coin amounts, backup and restore |
| `test.html` | A hero's next test (`test.html?id=...`): placeholder until real questions, parent preview |
| `citadel-core.js` | Shared code: heroes, coins and history, rank ladder, tests, area scores, trophies, settings, visitor, backup, levels, PIN, halls |
| `citadel-core.css` | Shared look for the pages above |
| `CHANGELOG.md` | Every version, newest first |
| `version.json` | The current version; pages compare against it and reload once when it's newer |

## Change log

- Nov 14, 2026: Repository created. Added `index.html` (Citadel main page with four
  closed halls), `citadel.jpg`, and this brief. (v0.1.0)
- Nov 15, 2026: **v0.2.0 Hero profiles.** Added `heroes.html`, `hero.html`, `treasury.html`,
  `test.html`, `citadel-core.js`, `citadel-core.css`, `CHANGELOG.md`; "Enter the Citadel" button
  and footer version on `index.html`; version rules and rank ladder/test rules above.
  Rewards/payouts and real test questions not built yet.
- Nov 15, 2026: **v0.2.1 Privacy fix, working rules and preview labels.** Removed the kids'
  ages from this file; added the "Claude checks everything, exact steps" working rule;
  test.html preview buttons now show the exact scores (11 of 12, 91.7% / 7 of 12, 58.3%).
- Nov 15, 2026: **v0.3.0 Treasure chest, trophies, settings, backup and visitor mode.** Hero page
  gets coin history and per-game totals, trophy hall, Sound/Read-aloud settings; Treasury gets
  "Correct coins" and backup/restore; new `visitor.html`; Nexus site-map note reworded; planned hidden
  quests, special events and treasures written down above (not built).
- Nov 15, 2026: **v0.4.0 Pizza Party.** First game (`games/pizza-party.html`), Proving Grounds
  opened (`proving-grounds.html`), shared question bank (`citadel-questions.js`), answer reporting,
  skill grades and mastery in `citadel-core.js`, skill grades in the Treasury. Game rules above.
- Nov 15, 2026: **v0.5.0 The Nexus, Ladder Race and game rules.** Nexus hall (`nexus.html`) with
  Ariet's Ladder Race (`nexus/ladder-race.html`, standalone exception), "Nexus access" switch in
  the Treasury, reusable race board (`citadel-race.js`), `?v=` cache busting on every page,
  return to the hall after choosing a hero (`heroes.html?next=`), "How every game teaches"
  rules, and planned quest dice rules and story lessons.
- Nov 15, 2026: **v0.5.1 Pages update themselves.** New `version.json`; every page checks it when
  it opens and reloads once if a newer version is out (no loops; works normally if it can't load).
