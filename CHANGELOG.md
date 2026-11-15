# SolidMind Citadel – Change log

Every pull request is one version. Newest version first.
Version numbers look like `v0.2.0`:
- the **middle** number goes up for a new feature (v0.2.0 → v0.3.0)
- the **last** number goes up for a fix (v0.2.0 → v0.2.1)

---

## v0.2.0 – Hero profiles – Nov 15, 2026

**What was added**
- **"Enter the Citadel" button** on the main page. It opens the hero screen.
  The four hall banners on the main page stay closed.
- **"Who enters the Citadel?" screen** with one card per hero: nickname, crest and color.
  Tapping a card opens that hero's home page.
- **Hero home page:** nickname, crest, gold coins (start at 0), rank (Apprentice to start),
  level, and the four halls (all "Gates open soon").
- **The Treasury** (parent area behind a 4-digit PIN): add, edit and remove heroes, set each
  hero's level (1, 2 or 3) and see their coins. On first use it asks you to create the PIN.
  You can also change the PIN, lock the Treasury, and, if the PIN is forgotten, erase
  the Treasury on that device and start over.
- **Shared code** in `citadel-core.js` (heroes, coins, ranks, levels, PIN, halls) and a
  shared look in `citadel-core.css`, so future games can reuse them.
- Version number in small text in the footer of every page.

**Files changed**
- New: `heroes.html`, `hero.html`, `treasury.html`, `citadel-core.js`, `citadel-core.css`, `CHANGELOG.md`
- Changed: `index.html` (button and version number), `CLAUDE.md` (version rules and change log)

**Why**
Step 1 of the plan: each kid needs their own hero before games can give them coins and
pick the right difficulty. Rewards and payouts are left out on purpose for a later version.

**Good to know**
- Everything is saved on that device only (phone, tablet or computer). It does not sync.
- The PIN keeps kids out but is not real security.
- Rank is based on all coins ever earned. The amounts (Squire 50, Knight 150, Engineer 400,
  Master Engineer 1000) are a first guess and easy to change in `citadel-core.js` `[JS-RANKS]`.

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
