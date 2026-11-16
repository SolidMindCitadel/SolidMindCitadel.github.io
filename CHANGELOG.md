# SolidMind Citadel – Change log

Every pull request is one version. Newest version first.
Version numbers look like `v0.2.0`:
- the **middle** number goes up for a new feature (v0.2.0 → v0.3.0)
- the **last** number goes up for a fix (v0.2.0 → v0.2.1)

---

## v0.7.0 – Chapter framework and sample adventure – Nov 16, 2026

**What was added or changed**
- **The chapter engine** (`citadel-adventure.js`, `citadel-adventure.css`). One shared engine
  plays any chapter from its data file, in the Imperial Library or (later) the Nexus. Every
  chapter has five steps:
  - Story, Lesson, Challenge, Practice game (a race against the computer) and Mastery check.
  - The next step unlocks when the current one is done. Finished steps can be replayed anytime.
  - There is no timer anywhere.
- **Mastery check:** 10 questions, right on the first try only.
  - 9 of 10 (90%) finishes the chapter.
  - Level 1 plays it as two rounds of 5, with a celebration in between.
  - Below 90%, the kid sees which skills to practise and can try again with new questions.
- **Coins:** the Practice game and Mastery check give gold coins, like Pizza Party. Story,
  Lesson and Challenge give none. Nexus chapters will never give gold coins.
- **Saved progress:** steps done and the chosen character are saved per hero on the device.
- **Character choice:** optional, with placeholder pictures until the real artwork exists.
- **The Imperial Library is open** (`library.html`), with one **sample chapter**: "The Pizza
  Shop Puzzle".
  - It is Math, uses Pizza Party's skills at the hero's level, and is always open.
  - Its story, lesson and challenge text are placeholders, marked
    "Sample – real stories coming soon".
- **`CHAPTER-TEMPLATE.md`:** the plain-language list of what to write for a chapter, with a
  short example. Real chapters, starting with The Lost Pyramid Chapter 1, are added this way.
- Library banner opened on the main page, hero pages and the visitor page. Choosing a hero
  from the Library comes back to the Library.
- Version number updated to v0.7.0 on every page.

**Files changed**
- New: `citadel-adventure.js`, `citadel-adventure.css`, `library.html`, `adventures/play.html`,
  `adventures/sample/chapter-1.js`, `CHAPTER-TEMPLATE.md`
- Changed: `citadel-core.js` (Library opened, chapters pass their own subject to
  `canPlayGame`), `index.html`, `hero.html`, `visitor.html`, every page (version number),
  `subjects.js` (comment only), `version.json`, `CLAUDE.md`, `CHANGELOG.md`

**Why**
- So real chapters (stories, lessons, games) can be added as data only, and the kids can play a
  first sample chapter today.

---

## v0.6.0 – Learning paths – Nov 16, 2026

**What was added or changed**
- **Subjects (`subjects.js`).** A short list of subjects, each marked core or Nexus.
  Core: Math, Reading, Science, Art. Nexus: PLC. Pizza Party is tagged Math. Ladder Race has
  no subject, because it is a standalone game.
- **Learning plan in the Treasury.** For each hero:
  - a drop-down per core subject: **Required**, **Optional** or **Off**;
  - the existing "Nexus access" switch;
  - a new **"Nexus rewards"** switch, off by default. Nothing uses it yet; it is for future
    Nexus adventures, which may give gold dust and badges, never gold coins.
- **Only Required subjects count.**
  - Rank tests only ask about Required subjects.
  - The "no new games while a test is waiting" rule only blocks games in Required subjects.
  - Optional subjects can be played and give gold coins as usual, but don't count toward tests.
  - Off subjects are hidden from the hero: their games, and the Proving Grounds banner when
    Math is Off.
  - If no subject is Required, the hero has no rank test for now. Nothing earned is lost.
- **"My subjects" on each hero's page**, with Required or Optional next to each (and PLC as
  "Nexus" for heroes with Nexus access).
- **Existing heroes keep everything** (coins, rank, trophies, history, skills, settings).
  They get Math Required and Reading, Science and Art Optional, so nothing changes for them.
  New heroes start the same way.
- `CLAUDE.md`: new "Goals and how we work" and "Learning paths" sections.
- Version number updated to v0.6.0 on every page.

**Files changed**
- New: `subjects.js`
- Changed: `citadel-core.js` (learning plan, rules), `citadel-questions.js` (skill areas by
  subject, for future rank tests), `citadel-core.css`, `treasury.html`, `hero.html`,
  `test.html`, `proving-grounds.html`, and every page (loads `subjects.js`, new version
  number), `version.json`, `CLAUDE.md`, `CHANGELOG.md`

**Why**
- So Ariet can choose what each hero studies, and so only the subjects that matter for a hero
  decide their rank, while the Nexus stays separate from core progress.

---

## v0.5.1 – Pages update themselves – Nov 15, 2026

**What was changed**
- **New `version.json`** in the main folder, holding the current version.
- **Every page checks for a new version when it opens.** This covers the main page, heroes,
  hero pages, the Treasury, the test page, the visitor page, the Proving Grounds and the
  Nexus, Pizza Party and Ladder Race.
  - Each page asks `version.json` for the newest version, skipping the browser's saved copy.
  - If a newer version is out, the page reloads itself once with a fresh address, so the
    newest copy appears without anyone doing anything.
  - It can never reload over and over.
  - If `version.json` can't be loaded (for example offline), the page simply works as usual.
- `CLAUDE.md`: every new version now updates `version.json` along with the page versions,
  footers and `?v=` numbers.
- Version number updated to v0.5.1 on every page.

**Files changed**
- New: `version.json`
- Changed: every page (`index.html`, `heroes.html`, `hero.html`, `treasury.html`, `test.html`,
  `visitor.html`, `proving-grounds.html`, `nexus.html`, `games/pizza-party.html`,
  `nexus/ladder-race.html`), `citadel-core.js` (version number), `CLAUDE.md`, `CHANGELOG.md`

**Why**
After v0.5.0, a hero page kept showing v0.4.0 for a long time, even after refreshing. The `?v=`
fix only covered shared script and style files, not the pages themselves.

---

## v0.5.0 – The Nexus, Ladder Race and game rules – Nov 15, 2026

**What was added**
- **The Nexus is open, for chosen heroes only.** The new hall page `nexus.html` lists Ladder Race.
  Each hero has a **"Nexus access"** switch in the Treasury (off by default). Only heroes with it
  on see the Nexus banner on their page; for others it doesn't appear at all, and visitors never
  see it. The Nexus banner on the main page stays closed.
- **Ladder Race** (`nexus/ladder-race.html`): Ariet's game from his PLC course, kept exactly as
  he made it. The only additions are a "Back to the Nexus" button and the version footer. It is a
  standalone game, not part of the Citadel's learning system: no coins, skills or trophies.
- **Reusable race board** (`citadel-race.js`): Ladder Race's gameplay (30-square board, dice,
  ladders and slides, 3 tries, a wrong answer costs a square, the computer's move and skill
  dice and wild card, questions that adapt), ready for future Citadel games in any subject to
  use with their own questions. No game uses it yet.
- **Fix: newest files after every update.** Every page now loads shared files with the version
  in the address (for example `citadel-core.js?v=0.5.0`), so phones no longer keep an old copy
  (like the hero page that still showed the Proving Grounds as "Gates open soon").
- **Fix: back to the hall after choosing a hero.** If you open the Proving Grounds (or the Nexus)
  before choosing a hero, choosing one now takes you straight to that hall's games.
- `CLAUDE.md`:
  - **New:** the "How every game teaches" rules, the Ladder Race exception, the Nexus access
    rules, how to update `?v=` with each version, the race board, and a planned "Story
    lessons (Imperial Library)" section.
  - **Hidden quests:** these will use Ladder Race's dice rules.

**Files changed**
- New: `nexus.html`, `nexus/ladder-race.html`, `citadel-race.js`
- Changed: `citadel-core.js`, `citadel-core.css`, `heroes.html`, `treasury.html`,
  `proving-grounds.html`, `games/pizza-party.html`, and the `?v=` links and footer version on
  every page (`index.html`, `hero.html`, `visitor.html`, `test.html`), `CLAUDE.md`, `CHANGELOG.md`

**Why**
To give the PLC beta tester a space of their own for Ariet's PLC games, to set the rules every future
game follows, and to fix two problems found after v0.4.0.

---

## v0.4.0 – Pizza Party – Nov 15, 2026

**What was added**
- **Pizza Party** (`games/pizza-party.html`), the first game and the template for the others.
  A round is 5 quick questions with big pizza pictures and big buttons.
  - Level 1: counting slices, more or fewer, adding and taking away.
  - Level 2: sharing equally, halves and quarters.
  - Level 3: sharing with leftovers, fractions of a pizza, comparing fractions.
  - The level comes from the Treasury.
  - Wrong answers show why, step by step (slices counted or handed out one by one), with no
    harsh sounds. Then the kid fixes the question.
  - A celebration with stars and confetti ends each round.
  - A 🔊 button reads any question out loud.
- **Scoring:**
  - 100 points for right on the first try. After a miss on a skill, a new question on that
    skill comes later in the round, worth 90, then 80 ... for that session.
  - Coins = points ÷ 100, rounded (5 for a perfect round, so about 4 rounds reach the first test).
  - Every answer counts toward its skill's grade (last 10 answers). Mastery = 9 of the last 10
    right on the first try.
- **Pizza ranks** just for fun: Dough Roller, Sauce Spreader, Cheese Sprinkler, Topping Tosser,
  Pizza Master.
- **Trophy hall** gets a best score for each Pizza Party level. The **treasure chest** shows
  Pizza Party coins.
- **The Proving Grounds is open** (`proving-grounds.html`). Its banner is now a link on the main
  page, hero pages and the visitor page. The other three halls stay closed.
- **Test question bank** (`citadel-questions.js` + `games/pizza-party-questions.js`): question
  makers for each skill and level. Rank tests will ask the same kind of question with cookies,
  apples, pie or cake instead of pizza, so they never repeat a game question. Tests stay
  "coming soon" for now.
- **Starter game:** Pizza Party is always open, even while a rank test is waiting.
- **Visitors** can play (they pick a level), but nothing is saved.
- **Treasury** shows each hero's skill grades.

**Files changed**
- New: `games/pizza-party.html`, `games/pizza-party-questions.js`, `citadel-questions.js`,
  `proving-grounds.html`
- Changed: `citadel-core.js`, `citadel-core.css`, `index.html`, `hero.html`, `visitor.html`,
  `treasury.html`, `heroes.html` and `test.html` (version), `CLAUDE.md`, `CHANGELOG.md`

**Why**
The kids can now earn coins, build skills and work toward their first rank test, and every
later game can copy Pizza Party's pattern.

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
- `CLAUDE.md`: the Nexus row of the site map now says "PLC beta tester's area"; new sections describe the hero page
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
