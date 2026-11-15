# SolidMind Citadel – Change log

Every pull request is one version. Newest version first.
Version numbers look like `v0.2.0`:
- the **middle** number goes up for a new feature (v0.2.0 → v0.3.0)
- the **last** number goes up for a fix (v0.2.0 → v0.2.1)

---

## v0.3.0 – Treasure chest, trophies, settings, backup and visitor mode – Nov 15, 2026

**What was added**
- **Treasure chest** on each hero's page: coins earned from each game, and the coin history,
  newest first, with the date, the amount (+ or −) and where it came from (a game, a test not
  passed, a correction, or the parent preview). Games will report coins through `citadel-core.js`.
- **Trophy hall** on each hero's page: a dated badge for every tier and rank reached
  (Apprentice – Bronze from the day the hero joined) and a "Best scores" section for games.
  Until games exist it says "Play a game to earn your first trophy."
- **My settings** on each hero's page: Sound on/off and "Read words out loud" on/off (the
  browser's built-in speech). The kid can change them; games will read them.
- **Correct coins** in the Treasury: per hero, add or take away coins to fix a mistake, with a
  reason. Shows as "Correction" in the coin history. (Parent rewards will be gold dust later.)
- **Backup and restore** in the Treasury: download a backup file or copy the backup text;
  restore from either, with a clear warning that it replaces everything on the device. The
  Treasury explains why backups matter.
- **Visitor mode:** a "Play as a visitor" button on the heroes screen opens a visitor page.
  Visitors can play games (once they exist), but nothing is saved, coins aren't kept, and they
  can't take rank tests.
- `CLAUDE.md`: "son's area" is now "PLC beta tester's area"; new sections describe the hero page
  features and the planned hidden quests, special events and treasures (gold dust, nuggets,
  bricks). Those planned parts are not built.
- Heroes saved by v0.2.x are upgraded automatically: coins they already had appear as one line,
  "Coins from before the history began", and badges for steps already reached say "Earlier".

**Files changed**
- New: `visitor.html`
- Changed: `citadel-core.js`, `citadel-core.css`, `hero.html`, `heroes.html`, `treasury.html`,
  `test.html`, `index.html` (version), `CLAUDE.md`, `CHANGELOG.md`

**Why**
So each kid can see where their coins came from and what they've achieved, choose sound and
read-aloud for themselves, and so progress (which lives on one device only) can be backed up.
Visitor mode lets friends play without changing anyone's progress.

---

## v0.2.1 – Privacy fix, working rules and preview labels – Nov 15, 2026

**What was changed**
- **Privacy fix:** removed the kids' ages from `CLAUDE.md`. "Who uses it" now says three kids
  at different levels, from early elementary to middle school, and that the oldest is the
  beta tester for the PLC games.
- **Working rule** added to `CLAUDE.md`: Claude checks every change (privacy, correctness,
  site still works) before handing it over, gives exact step-by-step instructions naming
  each button and where it is, and asks when anything is unclear.
- **Preview button labels** on the test page now match the real scores:
  "Pretend pass (11 of 12, 91.7%)" and "Pretend fail (7 of 12, 58.3%)". They used to say
  92% and 58%, which didn't match the result shown after tapping them.
- Version number updated to v0.2.1 in every page footer.

**Files changed**
- `CLAUDE.md`, `CHANGELOG.md`, `test.html`, `citadel-core.js` (version number),
  and the footer version in `index.html`, `heroes.html`, `hero.html`, `treasury.html`

**Why**
The site is public, so the kids' ages should not be in any file. The working rule makes
sure every future change is fully checked before Ariet copies it. The labels were
rounded, so they didn't match the score the page reported.

---

## v0.2.0 – Hero profiles – Nov 15, 2026

**What was added**
- **"Enter the Citadel" button** on the main page. It opens the hero screen.
  The four hall banners on the main page stay closed.
- **"Who enters the Citadel?" screen** with one card per hero: nickname, crest and color.
  Tapping a card opens that hero's home page.
- **Hero home page:** nickname, crest, gold coins (start at 0), rank and tier with a
  bronze/silver/gold badge (starts at "Apprentice – Bronze"), level, the next test and its
  status, and the four halls (all "Gates open soon").
- **Rank ladder and tests:** 5 ranks × 3 tiers (Bronze, Silver, Gold). Moving up one tier
  always needs a passed test (14 tests; Gold → next rank is the "promotion test").
  Coins unlock a test but never raise a rank by themselves. Pass mark 75%; a fail costs half
  the test's coins; one retake; failing the retake locks the test until each weak area
  (under 75%) reaches 90% in its game. While a test is waiting, no new games unlock.
- **Test page** (`test.html`): shows the next test, its coin amount, status and rules. Taking it
  shows "Test questions coming soon". A parent-only preview (Treasury PIN) can pretend a
  pass, a fail, add coins, or a 90% score in a weak area, to see the whole flow.
- **The Treasury** (parent area behind a 4-digit PIN): add, edit and remove heroes, set each
  hero's level (1, 2 or 3) and see their progress: rank and tier, coins, next test status
  and weak areas. A table sets the coin amount for each of the 14 tests (starting numbers
  20 to 400, changeable). On first use it asks you to create the PIN.
  You can also change the PIN, lock the Treasury, and, if the PIN is forgotten, erase
  the Treasury on that device and start over.
- **Shared code** in `citadel-core.js` (heroes, coins, rank ladder, tests, area scores, levels,
  PIN, halls) and a
  shared look in `citadel-core.css`, so future games can reuse them.
- Version number in small text in the footer of every page.

**Files changed**
- New: `heroes.html`, `hero.html`, `treasury.html`, `test.html`, `citadel-core.js`, `citadel-core.css`, `CHANGELOG.md`
- Changed: `index.html` (button and version number), `CLAUDE.md` (version rules and change log)

**Why**
Step 1 of the plan: each kid needs their own hero before games can give them coins and
pick the right difficulty. Rewards and payouts are left out on purpose for a later version.

**Good to know**
- Everything is saved on that device only (phone, tablet or computer). It does not sync.
- The PIN keeps kids out but is not real security.
- Ranks first used coin totals; before release this was changed to the test-based ladder
  above, so ranks only go up by passing tests.
- Real test questions come with the games. Each question will be tagged with the one skill
  ("area") it checks.

---

## v0.1.0 – Main page – Nov 14, 2026

**What was added**
- The Citadel main page with the castle picture, the motto, and the four halls
  (Imperial Library, Proving Grounds, Forge, Nexus), all closed ("Gates open soon").
- The project brief for Claude.

**Files changed**
- New: `index.html`, `citadel.jpg`, `CLAUDE.md`

**Why**
To give the site its home and look before any games are built.
