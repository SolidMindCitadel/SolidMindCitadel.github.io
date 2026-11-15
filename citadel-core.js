/*
  SolidMind Citadel - shared code (citadel-core.js)
  ------------------------------------------------------------
  Purpose: everything the Citadel pages (and later the games) share:
  heroes, levels, gold coins, ranks, crests, colors, the four halls,
  and the Treasury PIN. Every page loads this file with:
      <script src="citadel-core.js"></script>
  (games in games/ will use "../citadel-core.js").

  Depends on: nothing. No frameworks, no server.
  Used by:    every page: heroes.html, hero.html, treasury.html, test.html,
              visitor.html, proving-grounds.html, games/*.html

  Search these tags to jump to a section:
    [JS-VERSION]   the site version number
    [JS-STORAGE]   saving to this device (localStorage), safe if blocked
    [JS-CRESTS]    crest pictures heroes can pick
    [JS-COLORS]    hero colors
    [JS-LEVELS]    Level 1 / 2 / 3
    [JS-RANKS]     Apprentice to Master Engineer, Bronze/Silver/Gold tiers
    [JS-TESTS]     the 14 tests, their rules, grading and coin amounts
    [JS-AREAS]     games report every answer; skill grades and 90% mastery
    [JS-GAMES]     which games a hero may play, and each game's own saved data
    [JS-HEROES]    add, edit, remove and read heroes
    [JS-COINS]     gold coins, coin history and per-game totals (the treasure chest)
    [JS-CORRECT]   parent "Correct coins" from the Treasury
    [JS-TROPHIES]  tier/rank badges and best scores (the trophy hall)
    [JS-SETTINGS]  per-hero Sound and "Read words out loud"
    [JS-VISITOR]   visitor mode: plays, but nothing is saved
    [JS-BACKUP]    backup and restore (file or copied text)
    [JS-PIN]       Treasury PIN (a gate for kids, NOT real security)
    [JS-HALLS]     the four hall banners (shared drawing code)
    [JS-NEXUS]     "Nexus access": which heroes may see the Nexus
    [JS-NEXT]      after choosing a hero, go back to the hall they came from
    [JS-HELPERS]   small helpers for building the page

  Privacy: nothing here leaves the device. Heroes are saved in this
  browser only and do NOT sync between devices.
*/
(function () {
  "use strict";

  // [JS-VERSION] Change this with every pull request (see CLAUDE.md "Versions").
  var VERSION = "0.5.0";

  /* ---------------------------------------------------------------
     [JS-STORAGE]
     All saved data lives under one key so it is easy to find, back up
     or wipe. If the browser blocks storage (private mode, settings),
     we keep working from memory so the page never breaks; progress is
     simply lost when the page closes. Pages can show a notice by
     checking Citadel.storageWorks().
     --------------------------------------------------------------- */
  var STORE_KEY = "smc-citadel";
  var SCHEMA = 1; // bump if the saved data shape ever changes
  var memoryCopy = null; // used when localStorage is blocked

  function emptyData() {
    return { schema: SCHEMA, heroes: [], pin: null, testCoins: DEFAULT_TEST_COINS.slice() };
  }

  function load() {
    var raw = null;
    try {
      raw = window.localStorage.getItem(STORE_KEY);
    } catch (e) {
      // Storage blocked: fall back to what we remember in memory.
    }
    if (raw == null) return memoryCopy ? clone(memoryCopy) : emptyData();
    try {
      var data = JSON.parse(raw);
      if (!data || typeof data !== "object" || !Array.isArray(data.heroes)) return emptyData();
      if (!("pin" in data)) data.pin = null;
      if (!Array.isArray(data.testCoins) || data.testCoins.length !== DEFAULT_TEST_COINS.length) {
        data.testCoins = DEFAULT_TEST_COINS.slice();
      }
      data.heroes.forEach(fillHero);
      return data;
    } catch (e) {
      // Saved data was damaged; start fresh instead of crashing.
      return emptyData();
    }
  }

  function save(data) {
    memoryCopy = clone(data);
    try {
      window.localStorage.setItem(STORE_KEY, JSON.stringify(data));
      return true;
    } catch (e) {
      return false; // still kept in memoryCopy for this visit
    }
  }

  function storageWorks() {
    // Try a tiny write so we know for sure (some browsers allow reads but block writes).
    try {
      var k = STORE_KEY + "-test";
      window.localStorage.setItem(k, "1");
      window.localStorage.removeItem(k);
      return true;
    } catch (e) {
      return false;
    }
  }

  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  // Makes sure every saved hero has all the fields, even if it was saved
  // by an older version of this file.
  function fillHero(h) {
    if (typeof h.coins !== "number") h.coins = 0;
    if (typeof h.earned !== "number") h.earned = h.coins;
    if (typeof h.step !== "number") h.step = 0;
    if (!h.test || typeof h.test !== "object") h.test = freshTest();
    if (!Array.isArray(h.test.weakAreas)) h.test.weakAreas = [];
    if (!Array.isArray(h.test.mastered)) h.test.mastered = [];
    if (!h.areas || typeof h.areas !== "object") h.areas = {};
    // Added in v0.3.0. Heroes saved before then get these filled in once.
    if (!Array.isArray(h.history)) {
      h.history = [];
      // Coins they already had get one entry so the history adds up.
      if (h.coins > 0) h.history.push({ date: null, amount: h.coins, source: "earlier", label: "Coins from before the history began" });
    }
    if (!h.gameTotals || typeof h.gameTotals !== "object") h.gameTotals = {};
    if (!Array.isArray(h.trophies)) {
      h.trophies = [];
      // A badge for every step already reached. Only the first has a known date.
      for (var s = 0; s <= h.step; s++) h.trophies.push({ step: s, date: s === 0 ? (h.created || null) : null });
    }
    if (!h.bestScores || typeof h.bestScores !== "object") h.bestScores = {};
    if (!h.games || typeof h.games !== "object") h.games = {}; // added in v0.4.0
    if (typeof h.nexusAccess !== "boolean") h.nexusAccess = false; // added in v0.5.0, off by default
    if (!h.settings || typeof h.settings !== "object") h.settings = {};
    if (typeof h.settings.sound !== "boolean") h.settings.sound = DEFAULT_SETTINGS.sound;
    if (typeof h.settings.readAloud !== "boolean") h.settings.readAloud = DEFAULT_SETTINGS.readAloud;
    return h;
  }

  function today() { return new Date().toISOString().slice(0, 10); }

  /* ---------------------------------------------------------------
     [JS-CRESTS] Pictures a hero can wear on their shield.
     Emoji so they look friendly and need no image files.
     "label" is read aloud by screen readers.
     --------------------------------------------------------------- */
  var CRESTS = [
    { id: "dragon",    emoji: "🐉", label: "Dragon" },
    { id: "lion",      emoji: "🦁", label: "Lion" },
    { id: "eagle",     emoji: "🦅", label: "Eagle" },
    { id: "wolf",      emoji: "🐺", label: "Wolf" },
    { id: "owl",       emoji: "🦉", label: "Owl" },
    { id: "unicorn",   emoji: "🦄", label: "Unicorn" },
    { id: "fox",       emoji: "🦊", label: "Fox" },
    { id: "bear",      emoji: "🐻", label: "Bear" },
    { id: "star",      emoji: "⭐",       label: "Star" },
    { id: "lightning", emoji: "⚡",       label: "Lightning" },
    { id: "gear",      emoji: "⚙️", label: "Gear" },
    { id: "crown",     emoji: "👑", label: "Crown" }
  ];

  // [JS-COLORS] Shield colors. All dark enough that the gold trim stands out.
  var COLORS = [
    { id: "crimson", label: "Crimson", hex: "#B23A48" },
    { id: "royal",   label: "Royal blue", hex: "#2F5DA8" },
    { id: "emerald", label: "Emerald", hex: "#2E8B57" },
    { id: "violet",  label: "Violet", hex: "#7B4FB0" },
    { id: "amber",   label: "Amber", hex: "#C9821A" },
    { id: "teal",    label: "Teal", hex: "#1F8A8A" },
    { id: "rose",    label: "Rose", hex: "#C2577F" },
    { id: "slate",   label: "Slate", hex: "#4A5A70" }
  ];

  // [JS-LEVELS] Set by the parent in the Treasury, not by age.
  // Games read hero.level (1, 2 or 3) to choose how hard to be.
  var LEVELS = [1, 2, 3];

  /* ---------------------------------------------------------------
     [JS-RANKS] The rank ladder: 5 ranks x 3 tiers = 15 steps.
       step 0  = Apprentice Bronze (everyone starts here)
       step 1  = Apprentice Silver, step 2 = Apprentice Gold,
       step 3  = Squire Bronze ... step 14 = Master Engineer Gold (the top).
     A hero's place is saved as hero.step (0 to 14).
     Ranks NEVER go up from coins alone: the only way up one step is
     to pass that step's test (see [JS-TESTS]).
     --------------------------------------------------------------- */
  var RANKS = ["Apprentice", "Squire", "Knight", "Engineer", "Master Engineer"];
  var TIERS = ["Bronze", "Silver", "Gold"];
  var TOP_STEP = RANKS.length * TIERS.length - 1; // 14

  // Turns a step number into { rank, tier, label }, e.g. "Squire – Silver"
  function stepInfo(step) {
    step = Math.max(0, Math.min(TOP_STEP, step | 0));
    var rank = RANKS[Math.floor(step / TIERS.length)];
    var tier = TIERS[step % TIERS.length];
    return { step: step, rank: rank, tier: tier, label: rank + " – " + tier };
  }
  function rankFor(hero) { return stepInfo(hero ? hero.step : 0); }

  /* ---------------------------------------------------------------
     [JS-TESTS] The 14 tests, one between each pair of steps.
     Test number t moves a hero from step t to step t+1.
     Tests 2, 5, 8 and 11 (Gold to the next rank's Bronze) are the
     "promotion tests".

     Rules (Ariet's, also written in CLAUDE.md):
     1. Each test has a coin amount. With at least that many coins the
        test unlocks. The kid chooses when to take it; it never starts
        by itself.
     2. Pass mark 75%. Pass = keep all coins, move up one tier.
     3. Fail = lose half the test's coin amount (rounded down).
     4. After a first fail: ONE retake, and only with at least the
        test's coin amount again.
     5. Fail the retake = the test locks until the hero reaches 90% in
        each "weak area" of that retake (an area scored under 75%), in
        that area's game. Only results earned AFTER the lock count, and
        each area counts only for itself. Then the test resets to a
        fresh test (needs the coins again, first try + one retake).
     6. While a test is unlocked, failed-once or locked for mastery,
        no NEW games or challenges unlock for that hero
        (Citadel.newGamesAllowed). Games they already have still work.

     An "area" is one specific lesson or skill, like "adding-within-10"
     or "latch-circuits". Every test question is tagged with exactly one.
     --------------------------------------------------------------- */
  var PASS_MARK = 75;
  var MASTERY_MARK = 90;

  // Starting coin amounts for the 14 tests. The parent can change them in
  // the Treasury; these are only the defaults (marked as such in CLAUDE.md).
  var DEFAULT_TEST_COINS = [20, 30, 50, 60, 80, 110, 120, 150, 200, 220, 260, 320, 350, 400];

  function testInfo(t) {
    var from = stepInfo(t), to = stepInfo(t + 1);
    var promotion = from.rank !== to.rank;
    return { number: t, from: from, to: to, promotion: promotion,
      name: (promotion ? "Promotion test: " : "Tier test: ") + from.label + " → " + to.label };
  }

  function getTestCoins() { return load().testCoins.slice(); }

  function setTestCoins(list) {
    if (!Array.isArray(list) || list.length !== DEFAULT_TEST_COINS.length) throw new Error("There must be 14 coin amounts.");
    var clean = list.map(function (n) { return Math.floor(Number(n)); });
    for (var i = 0; i < clean.length; i++) {
      if (!(clean[i] >= 1 && clean[i] <= 99999)) throw new Error("Test " + (i + 1) + ": use a whole number from 1 to 99999.");
    }
    var data = load();
    data.testCoins = clean;
    save(data);
  }

  function freshTest() { return { fails: 0, locked: false, weakAreas: [], mastered: [] }; }

  /* Where a hero stands with their next test. Returns:
       { state, test, cost, coins, weakAreas: [{id, label, done}] }
     state is one of:
       "top"         at Master Engineer Gold, no more tests
       "coins"       locked: not enough coins yet
       "ready"       unlocked: the hero may take it when they choose
       "retake-coins" failed once; retake unlocks at the coin amount
       "retake"      failed once; the one retake is ready
       "mastery"     failed twice; locked until weak areas reach 90% */
  function testStatus(hero) {
    var data = load();
    if (hero.step >= TOP_STEP) return { state: "top", test: null, cost: 0, coins: hero.coins, weakAreas: [] };
    var cost = data.testCoins[hero.step];
    var t = hero.test;
    var state;
    if (t.locked) state = "mastery";
    else if (t.fails === 0) state = hero.coins >= cost ? "ready" : "coins";
    else state = hero.coins >= cost ? "retake" : "retake-coins";
    return {
      state: state, test: testInfo(hero.step), cost: cost, coins: hero.coins,
      weakAreas: t.weakAreas.map(function (a) { return { id: a.id, label: a.label, done: t.mastered.indexOf(a.id) >= 0 }; })
    };
  }

  // Plain-words version of testStatus, for the hero page and the Treasury.
  function testStatusText(hero) {
    var s = testStatus(hero);
    switch (s.state) {
      case "top": return "Top of the ladder. No more tests.";
      case "coins": return "Locked: unlocks at " + s.cost + " coins (has " + s.coins + ").";
      case "ready": return "Ready! Take it whenever you choose.";
      case "retake-coins": return "Failed once. One retake left; it unlocks at " + s.cost + " coins (has " + s.coins + ").";
      case "retake": return "Failed once. The one retake is ready whenever you choose.";
      default: return "Locked until mastery: reach " + MASTERY_MARK + "% in each weak area below.";
    }
  }

  function canTakeTest(hero) {
    var st = testStatus(hero).state;
    return st === "ready" || st === "retake";
  }

  // Rule 6. Games/halls should call this before unlocking anything NEW.
  function newGamesAllowed(hero) {
    var st = testStatus(hero).state;
    return st === "coins" || st === "top";
  }

  /* Grades a finished test. "answers" is a list, one per question:
       { area: "adding-within-10", label: "Adding within 10", correct: true }
     Returns { percent, passed, areas: [{id, label, right, total, percent}],
               weakAreas: [{id, label}] }  (weak = under 75% in that area) */
  function gradeTest(answers) {
    var byArea = {}, order = [], right = 0;
    (answers || []).forEach(function (a) {
      var id = String(a.area || "general");
      if (!byArea[id]) { byArea[id] = { id: id, label: String(a.label || id), right: 0, total: 0 }; order.push(id); }
      byArea[id].total++;
      if (a.correct) { byArea[id].right++; right++; }
    });
    var total = (answers || []).length;
    var percent = total ? Math.round((right / total) * 1000) / 10 : 0;
    var areas = order.map(function (id) {
      var x = byArea[id];
      x.percent = Math.round((x.right / x.total) * 1000) / 10;
      return x;
    });
    return {
      percent: percent, passed: total > 0 && percent >= PASS_MARK, areas: areas,
      weakAreas: areas.filter(function (x) { return x.percent < PASS_MARK; })
                      .map(function (x) { return { id: x.id, label: x.label }; })
    };
  }

  /* A test page calls this when the hero finishes their test.
     It applies rules 2-5 and saves. Returns { result, outcome, hero }
     outcome: "passed", "failed-once" or "locked". */
  function finishTest(heroId, answers) {
    if (heroId === VISITOR_ID) throw new Error("Visitors can't take rank tests.");
    var data = load();
    var i = findById(data.heroes, heroId);
    if (i < 0) throw new Error("That hero is no longer here.");
    var hero = data.heroes[i];
    if (!canTakeTest(hero)) throw new Error("This test can't be taken right now.");
    var cost = data.testCoins[hero.step];
    var result = gradeTest(answers);
    var outcome;
    if (result.passed) {
      hero.step += 1;               // up one tier; coins are kept
      hero.test = freshTest();
      hero.trophies.push({ step: hero.step, date: today() }); // new badge in the trophy hall
      outcome = "passed";
    } else {
      var lost = Math.min(hero.coins, Math.floor(cost / 2));
      hero.coins -= lost;
      if (lost > 0) logCoins(hero, -lost, "test-fail", "Test not passed: " + testInfo(hero.step).name);
      if (hero.test.fails === 0) {
        hero.test.fails = 1;
        outcome = "failed-once";
      } else {
        // Second fail: lock until the retake's weak areas are mastered.
        hero.test = { fails: 2, locked: true, weakAreas: result.weakAreas, mastered: [] };
        outcome = "locked";
      }
    }
    save(data);
    return { result: result, outcome: outcome, hero: hero };
  }

  /* [JS-AREAS] Skill ("area") scores.
     Games call Citadel.reportAnswer after EVERY question:
         Citadel.reportAnswer(heroId, { area: "count-1-10", label: "Counting slices",
                                        points: 100, firstTry: true })
       points    0-100 for that question (0 = wrong). Each game decides
                 its points; Pizza Party uses 100 / 90 / 80 ... (see CLAUDE.md).
       firstTry  true only if the hero got it right on the first try.
     For each area we keep the last 10 answers and work out:
       grade    = average points of those (up to) 10 answers. It rises as a
                  kid starts getting things right, because old answers drop off.
       mastery  = how many of the last 10 were right on the first try, x 10.
                  Fewer than 10 answers can't reach 90%, so "mastered" really
                  means 9 or 10 out of the last 10.
     If the hero's test is locked and this area is one of its weak areas,
     mastery of 90%+ counts it as mastered (rule 5); when every weak area is
     mastered the test resets to a fresh test.
     Citadel.reportAreaScore(heroId, area, percent) is the older, simpler
     call that reports a mastery percent directly (games may still use it). */
  var RECENT_MAX = 10;

  function emptyArea(label) { return { label: label || "", recent: [], grade: 0, mastery: 0, best: 0, last: 0, answered: 0 }; }

  function fillArea(hero, area, label) {
    var a = hero.areas[area];
    if (!a || typeof a !== "object") a = hero.areas[area] = emptyArea(label);
    if (!Array.isArray(a.recent)) a.recent = [];
    if (label) a.label = label;
    ["grade", "mastery", "best", "last", "answered"].forEach(function (k) { if (typeof a[k] !== "number") a[k] = 0; });
    return a;
  }

  // Counts a weak area as mastered when the mastery percent is high enough.
  function applyMastery(hero, area, percent) {
    var t = hero.test;
    if (t && t.locked && percent >= MASTERY_MARK && t.mastered.indexOf(area) < 0 &&
        t.weakAreas.some(function (w) { return w.id === area; })) {
      t.mastered.push(area);
      if (t.mastered.length >= t.weakAreas.length) hero.test = freshTest();
    }
  }

  function heroForWrite(heroId) {
    if (heroId === VISITOR_ID) return { hero: visitorHero(), data: null }; // visitors: memory only
    var data = load();
    var i = findById(data.heroes, heroId);
    return i < 0 ? null : { hero: data.heroes[i], data: data };
  }

  function reportAnswer(heroId, ans) {
    ans = ans || {};
    var area = String(ans.area || "");
    var points = Math.max(0, Math.min(100, Math.round(Number(ans.points) || 0)));
    if (!area) return null;
    var w = heroForWrite(heroId);
    if (!w) return null;
    var a = fillArea(w.hero, area, ans.label ? String(ans.label) : "");
    a.recent.push({ p: points, f: !!ans.firstTry && points > 0 });
    if (a.recent.length > RECENT_MAX) a.recent.splice(0, a.recent.length - RECENT_MAX);
    a.answered += 1;
    a.grade = Math.round(a.recent.reduce(function (sum, r) { return sum + r.p; }, 0) / a.recent.length);
    a.mastery = a.recent.filter(function (r) { return r.f; }).length * (100 / RECENT_MAX);
    a.last = a.mastery;
    a.best = Math.max(a.best, a.mastery);
    applyMastery(w.hero, area, a.mastery);
    if (w.data) save(w.data);
    return { grade: a.grade, mastery: a.mastery, answered: a.answered, mastered: a.mastery >= MASTERY_MARK };
  }

  function reportAreaScore(heroId, area, percent) {
    area = String(area || "");
    percent = Number(percent);
    if (!area || !(percent >= 0 && percent <= 100)) return getHero(heroId);
    if (heroId === VISITOR_ID) return visitorHero(); // visitors: nothing kept
    var data = load();
    var i = findById(data.heroes, heroId);
    if (i < 0) return null;
    var hero = data.heroes[i];
    var a = fillArea(hero, area, "");
    a.best = Math.max(a.best, percent);
    a.last = percent;
    applyMastery(hero, area, percent);
    save(data);
    return hero;
  }

  // [{id, label, grade, mastery, answered, mastered}] for a hero, for pages to show.
  function skillGrades(hero) {
    var out = [];
    for (var k in hero.areas) {
      if (!Object.prototype.hasOwnProperty.call(hero.areas, k)) continue;
      var a = hero.areas[k];
      if (!a || !Array.isArray(a.recent) || !a.recent.length) continue;
      out.push({ id: k, label: a.label || k, grade: a.grade, mastery: a.mastery,
        answered: a.answered, mastered: a.mastery >= MASTERY_MARK });
    }
    return out;
  }

  /* [JS-GAMES] Which games a hero may play, and each game's own data.
     STARTER_GAMES are games every hero has from the start. They are
     never blocked by rule 6 ("no NEW games while a test is waiting").
     Any other game is open if the hero has played it before, or if
     no test is waiting (Citadel.newGamesAllowed).
     Each game can keep its own small saved data (for example its mini
     rank) in hero.games[gameId] with getGameData / setGameData.
     Visitors get the same calls, kept in memory only. */
  var STARTER_GAMES = ["pizza-party"];

  function canPlayGame(heroId, gameId) {
    if (STARTER_GAMES.indexOf(gameId) >= 0) return true;
    var hero = getHero(heroId);
    if (!hero) return false;
    return !!hero.games[gameId] || newGamesAllowed(hero);
  }

  function getGameData(heroId, gameId) {
    var hero = getHero(heroId);
    return hero && hero.games[gameId] ? clone(hero.games[gameId]) : {};
  }

  function setGameData(heroId, gameId, obj) {
    var w = heroForWrite(heroId);
    if (!w) return false;
    w.hero.games[gameId] = clone(obj || {});
    if (w.data) save(w.data);
    return true;
  }

  /* ---------------------------------------------------------------
     [JS-HEROES]
     A hero looks like:
       { id, nickname, crest, color, level, coins, earned, created,
         step,   // place on the rank ladder, 0-14 (see [JS-RANKS])
         test,   // where they stand on their next test (see [JS-TESTS])
         areas,      // best/last score per area, reported by games ([JS-AREAS])
         history,    // coin history, newest last ([JS-COINS])
         gameTotals, // coins earned per game ([JS-COINS])
         trophies,   // [{step, date}] one per tier/rank reached ([JS-TROPHIES])
         bestScores, // best score per game ([JS-TROPHIES])
         settings }  // { sound, readAloud } ([JS-SETTINGS])
     Nicknames only. Never real names (the site is public, and the
     Treasury reminds the parent of this).
     --------------------------------------------------------------- */
  var MAX_HEROES = 8;
  var MAX_NICK = 16;

  function cleanNickname(name) {
    return String(name == null ? "" : name).replace(/\s+/g, " ").trim().slice(0, MAX_NICK);
  }

  function findById(list, id) {
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return i;
    return -1;
  }

  function pick(list, id) {
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return list[0];
  }

  // Returns an error message (string) or "" if the hero details are fine.
  function checkHero(info, ignoreId) {
    var nick = cleanNickname(info.nickname);
    if (!nick) return "Please type a nickname.";
    var heroes = load().heroes;
    for (var i = 0; i < heroes.length; i++) {
      if (heroes[i].id !== ignoreId && heroes[i].nickname.toLowerCase() === nick.toLowerCase()) {
        return "Another hero already uses that nickname.";
      }
    }
    if (!ignoreId && heroes.length >= MAX_HEROES) return "The Citadel holds up to " + MAX_HEROES + " heroes.";
    return "";
  }

  function getHeroes() { return load().heroes; }

  function getHero(id) {
    if (id === VISITOR_ID) return visitorHero();
    var heroes = load().heroes;
    var i = findById(heroes, id);
    return i < 0 ? null : heroes[i];
  }

  function addHero(info) {
    var err = checkHero(info, null);
    if (err) throw new Error(err);
    var data = load();
    var hero = {
      id: "h" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      nickname: cleanNickname(info.nickname),
      crest: pick(CRESTS, info.crest).id,
      color: pick(COLORS, info.color).id,
      level: LEVELS.indexOf(Number(info.level)) >= 0 ? Number(info.level) : 1,
      coins: 0,   // coins they have now
      earned: 0,  // all coins ever earned (for the parent to see; NOT used for rank)
      created: new Date().toISOString().slice(0, 10),
      step: 0,    // Apprentice Bronze
      test: freshTest(),
      areas: {},
      games: {},
      nexusAccess: false, // the parent turns this on in the Treasury
      history: [],
      gameTotals: {},
      trophies: [{ step: 0, date: today() }], // Apprentice – Bronze from day one
      bestScores: {},
      settings: { sound: DEFAULT_SETTINGS.sound, readAloud: DEFAULT_SETTINGS.readAloud }
    };
    data.heroes.push(hero);
    save(data);
    return hero;
  }

  // Only nickname, crest, color and level can be edited here. Coins
  // change only through addCoins so they can't be typed in by mistake.
  function updateHero(id, changes) {
    var data = load();
    var i = findById(data.heroes, id);
    if (i < 0) throw new Error("That hero is no longer here.");
    var hero = data.heroes[i];
    if ("nickname" in changes) {
      var err = checkHero({ nickname: changes.nickname }, id);
      if (err) throw new Error(err);
      hero.nickname = cleanNickname(changes.nickname);
    }
    if ("crest" in changes) hero.crest = pick(CRESTS, changes.crest).id;
    if ("color" in changes) hero.color = pick(COLORS, changes.color).id;
    if ("level" in changes && LEVELS.indexOf(Number(changes.level)) >= 0) hero.level = Number(changes.level);
    if ("nexusAccess" in changes) hero.nexusAccess = changes.nexusAccess === true;
    save(data);
    return hero;
  }

  function removeHero(id) {
    var data = load();
    var i = findById(data.heroes, id);
    if (i >= 0) { data.heroes.splice(i, 1); save(data); }
  }

  /* ---------------------------------------------------------------
     [JS-COINS] The treasure chest.
     Games call:
         Citadel.addCoins(heroId, amount, { game: "times-trials", label: "Times Trials" })
     when a hero earns coins. Only whole, positive amounts count.
     Every change of coins is written to hero.history so the hero can
     see where each coin came from. Sources:
       "game"       earned in a game (also added to hero.gameTotals)
       "test-fail"  lost half a test's coin amount
       "correction" a parent fixed a mistake in the Treasury
       "preview"    parent preview buttons on test.html (for trying things out)
       "earlier"    coins a hero had before v0.3.0 started the history
     The history keeps the newest HISTORY_MAX entries so the saved data
     stays small; the per-game totals are never trimmed.
     Returns the updated hero (or null if the hero is gone).
     --------------------------------------------------------------- */
  var HISTORY_MAX = 300;

  function logCoins(hero, amount, source, label, note) {
    var entry = { date: today(), amount: amount, source: source, label: label };
    if (note) entry.note = note;
    hero.history.push(entry);
    if (hero.history.length > HISTORY_MAX) hero.history.splice(0, hero.history.length - HISTORY_MAX);
  }

  function addCoins(id, amount, from) {
    amount = Math.floor(Number(amount));
    if (!(amount > 0)) return getHero(id);
    from = from || {};
    var isPreview = from.preview === true;
    var gameId = String(from.game || "game");
    var gameLabel = String(from.label || from.game || "A game");
    // Visitors: coins show while they play, but are never saved.
    if (id === VISITOR_ID) { visitorHero().coins += amount; return visitorHero(); }
    var data = load();
    var i = findById(data.heroes, id);
    if (i < 0) return null;
    var hero = data.heroes[i];
    hero.coins += amount;
    hero.earned += amount;
    if (isPreview) {
      logCoins(hero, amount, "preview", "Parent preview (testing)");
    } else {
      logCoins(hero, amount, "game", gameLabel);
      var t = hero.gameTotals[gameId] || { label: gameLabel, coins: 0 };
      t.label = gameLabel;
      t.coins += amount;
      hero.gameTotals[gameId] = t;
    }
    save(data);
    return hero;
  }

  // Newest first, for the treasure chest.
  function coinHistory(hero) { return (hero.history || []).slice().reverse(); }

  // [{id, label, coins}] biggest first.
  function gameTotals(hero) {
    var out = [];
    for (var k in hero.gameTotals) {
      if (Object.prototype.hasOwnProperty.call(hero.gameTotals, k)) {
        out.push({ id: k, label: hero.gameTotals[k].label, coins: hero.gameTotals[k].coins });
      }
    }
    return out.sort(function (a, b) { return b.coins - a.coins; });
  }

  /* [JS-CORRECT] Parent-only, from the Treasury: fix a mistake in a
     hero's coins (plus or minus) with a reason. This is NOT a reward:
     parent rewards will be gold dust in a later version (see CLAUDE.md
     "Planned"). Coins never go below 0. Corrections don't change
     per-game totals or "earned". */
  function correctCoins(id, amount, reason) {
    amount = Math.trunc(Number(amount));
    reason = String(reason == null ? "" : reason).replace(/\s+/g, " ").trim().slice(0, 80);
    if (!amount || !isFinite(amount)) throw new Error("Type how many coins to add (like 5) or take away (like -5).");
    if (Math.abs(amount) > 99999) throw new Error("That number is too big.");
    if (!reason) throw new Error("Please write a short reason for the correction.");
    var data = load();
    var i = findById(data.heroes, id);
    if (i < 0) throw new Error("That hero is no longer here.");
    var hero = data.heroes[i];
    var change = amount < 0 ? -Math.min(hero.coins, -amount) : amount;
    if (change === 0) throw new Error(hero.nickname + " has no coins to take away.");
    hero.coins += change;
    logCoins(hero, change, "correction", "Correction", reason);
    save(data);
    return { hero: hero, change: change };
  }

  /* ---------------------------------------------------------------
     [JS-TROPHIES] The trophy hall.
     Badges: one for every tier and rank reached, with the date. Added
     automatically when a test is passed (see finishTest). Badges for
     steps reached before v0.3.0 have no date ("Earlier").
     Best scores: games call
         Citadel.recordBestScore(heroId, { game: "times-trials",
           label: "Times Trials", score: 42, text: "42 correct in 60 s",
           lowerIsBetter: false })
     and the best one per game is kept, with its date. "text" is how
     the score is shown; each game decides what it says.
     Returns true if this was a new best.
     --------------------------------------------------------------- */
  function trophies(hero) {
    return (hero.trophies || []).slice().sort(function (a, b) { return b.step - a.step; })
      .map(function (t) { var info = stepInfo(t.step); info.date = t.date; return info; });
  }

  function recordBestScore(id, r) {
    r = r || {};
    var score = Number(r.score);
    if (!r.game || !isFinite(score)) return false;
    var game = String(r.game);
    var target = id === VISITOR_ID ? visitorHero() : null;
    var data = target ? null : load();
    if (!target) {
      var i = findById(data.heroes, id);
      if (i < 0) return false;
      target = data.heroes[i];
    }
    var prev = target.bestScores[game];
    var better = !prev || (r.lowerIsBetter ? score < prev.score : score > prev.score);
    if (better) {
      target.bestScores[game] = { label: String(r.label || game), score: score,
        text: String(r.text || score), lowerIsBetter: !!r.lowerIsBetter, date: today() };
      if (data) save(data);
    }
    return better;
  }

  function bestScores(hero) {
    var out = [];
    for (var k in hero.bestScores) {
      if (Object.prototype.hasOwnProperty.call(hero.bestScores, k)) {
        var b = hero.bestScores[k];
        out.push({ id: k, label: b.label, score: b.score, text: b.text, date: b.date });
      }
    }
    return out.sort(function (a, b) { return a.label.localeCompare(b.label); });
  }

  /* ---------------------------------------------------------------
     [JS-SETTINGS] Each hero's own settings, changed on their page.
       sound      games play sounds only when this is on
       readAloud  games read words out loud (browser speech) when on
     Games use Citadel.getSettings(heroId), Citadel.playSound(heroId, kind)
     and Citadel.speak(heroId, text). Both helpers already check the
     setting, so a game can call them without checking first.
     --------------------------------------------------------------- */
  var DEFAULT_SETTINGS = { sound: true, readAloud: false };

  function getSettings(id) {
    var hero = getHero(id);
    var s = hero ? hero.settings : DEFAULT_SETTINGS;
    return { sound: s.sound, readAloud: s.readAloud };
  }

  function setSetting(id, name, value) {
    if (name !== "sound" && name !== "readAloud") return;
    if (id === VISITOR_ID) { visitorHero().settings[name] = !!value; return; }
    var data = load();
    var i = findById(data.heroes, id);
    if (i < 0) return;
    data.heroes[i].settings[name] = !!value;
    save(data);
  }

  // Can this browser speak at all? (Most phones and computers can.)
  function canSpeak() {
    try { return "speechSynthesis" in window && typeof window.SpeechSynthesisUtterance === "function"; }
    catch (e) { return false; }
  }

  // force: true means the kid tapped a speaker button, so read it even if
  // "Read words out loud" is off (they asked for it this one time).
  function speak(id, text, force) {
    if ((!force && !getSettings(id).readAloud) || !canSpeak() || !text) return false;
    try {
      window.speechSynthesis.cancel(); // stop anything still talking
      var u = new window.SpeechSynthesisUtterance(String(text));
      u.rate = 0.9; // a little slower, easier for young readers
      window.speechSynthesis.speak(u);
      return true;
    } catch (e) { return false; }
  }

  // Short built-in sounds made by the browser (no sound files needed).
  // kind: "coin", "right", "wrong" or "tap".
  var audioCtx = null;
  function playSound(id, kind) {
    if (!getSettings(id).sound) return false;
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      audioCtx = audioCtx || new AC();
      if (audioCtx.state === "suspended") audioCtx.resume();
      var notes = { coin: [988, 1319], right: [660, 880], wrong: [330, 220], tap: [600] }[kind] || [600];
      var t = audioCtx.currentTime;
      notes.forEach(function (f, n) {
        var osc = audioCtx.createOscillator(), gain = audioCtx.createGain();
        osc.type = "triangle";
        osc.frequency.value = f;
        gain.gain.setValueAtTime(0.0001, t + n * 0.11);
        gain.gain.exponentialRampToValueAtTime(0.2, t + n * 0.11 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + n * 0.11 + 0.16);
        osc.connect(gain); gain.connect(audioCtx.destination);
        osc.start(t + n * 0.11); osc.stop(t + n * 0.11 + 0.18);
      });
      return true;
    } catch (e) { return false; }
  }

  /* ---------------------------------------------------------------
     [JS-VISITOR] Visitor mode, for friends.
     A visitor is a pretend hero that lives only in this page's memory:
     getHero("visitor") returns it, and games can treat it like any
     hero. But nothing about it is ever saved: coins disappear when the
     page closes or changes, it never shows up in the Treasury, and it
     can't take rank tests (finishTest refuses).
     Pages for visitors use "?id=visitor" in the address.
     --------------------------------------------------------------- */
  var VISITOR_ID = "visitor";
  var visitorMemory = null;
  function visitorHero() {
    if (!visitorMemory) {
      visitorMemory = fillHero({ id: VISITOR_ID, nickname: "Visitor", crest: "star", color: "slate",
        level: 1, coins: 0, earned: 0, created: today(), step: 0, visitor: true,
        history: [], trophies: [], settings: { sound: DEFAULT_SETTINGS.sound, readAloud: DEFAULT_SETTINGS.readAloud } });
    }
    return visitorMemory;
  }
  function isVisitor(id) { return id === VISITOR_ID; }

  /* ---------------------------------------------------------------
     [JS-BACKUP] Backup and restore (Treasury only, behind the PIN).
     A backup is plain text (JSON) holding EVERYTHING saved on this
     device: heroes, coins, coin history, ranks, tests, trophies,
     settings, the test coin amounts and the PIN (scrambled).
     Restoring REPLACES everything on this device with the backup.
     Backups hold the kids' nicknames: keep them on your own devices
     and never upload one to the GitHub repository (it is public).
     --------------------------------------------------------------- */
  var BACKUP_APP = "solidmind-citadel-backup";

  function makeBackup() {
    return JSON.stringify({ app: BACKUP_APP, siteVersion: VERSION, made: new Date().toISOString(), data: load() }, null, 1);
  }

  // Checks a backup without changing anything. Returns { heroes, made } or throws.
  function readBackup(text) {
    var b;
    try { b = JSON.parse(String(text || "").trim()); }
    catch (e) { throw new Error("That doesn't look like a Citadel backup. Check that all of the text was copied."); }
    if (!b || b.app !== BACKUP_APP || !b.data || !Array.isArray(b.data.heroes)) {
      throw new Error("That doesn't look like a Citadel backup.");
    }
    var d = b.data;
    d.heroes.forEach(function (h) {
      if (!h || typeof h.id !== "string" || typeof h.nickname !== "string") throw new Error("This backup is damaged (a hero is missing details).");
      fillHero(h);
      h.nickname = cleanNickname(h.nickname) || "Hero";
      h.step = Math.max(0, Math.min(TOP_STEP, Math.floor(h.step) || 0));
      h.coins = Math.max(0, Math.floor(h.coins) || 0);
    });
    if (!Array.isArray(d.testCoins) || d.testCoins.length !== DEFAULT_TEST_COINS.length) d.testCoins = DEFAULT_TEST_COINS.slice();
    if (typeof d.pin !== "string") d.pin = null;
    d.schema = SCHEMA;
    return { data: d, heroes: d.heroes.length, made: b.made || null, siteVersion: b.siteVersion || "" };
  }

  // Replaces everything on this device with the backup. Returns true if it could be saved.
  function restoreBackup(text) {
    var r = readBackup(text);
    return save({ schema: SCHEMA, heroes: r.data.heroes, pin: r.data.pin, testCoins: r.data.testCoins });
  }

  /* ---------------------------------------------------------------
     [JS-PIN] The Treasury PIN.
     IMPORTANT: this is only a gate to keep kids out of the parent
     area. Anyone who knows how to open the browser's developer tools
     can get around it. It is NOT real security, so never protect
     anything important with it.
     We store a scrambled version (a "hash") instead of the digits,
     just so the PIN isn't sitting there in plain sight.
     --------------------------------------------------------------- */
  function scramble(pin) {
    var s = "citadel:" + pin;
    var h = 2166136261; // FNV-1a, a simple well-known scrambler
    for (var i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619) >>> 0;
    }
    return h.toString(16);
  }
  function validPin(pin) { return /^\d{4}$/.test(String(pin)); }
  function hasPin() { return !!load().pin; }
  function setPin(pin) {
    if (!validPin(pin)) throw new Error("The PIN must be exactly 4 digits.");
    var data = load();
    data.pin = scramble(pin);
    save(data);
  }
  function checkPin(pin) {
    var stored = load().pin;
    return !!stored && validPin(pin) && scramble(pin) === stored;
  }
  // "Forgot my PIN": wipes the PIN AND every hero on this device, so a
  // kid can't use it to quietly change their own level.
  function resetEverything() {
    memoryCopy = null;
    visitorMemory = null;
    try { window.localStorage.removeItem(STORE_KEY); } catch (e) { /* blocked: nothing saved anyway */ }
  }

  /* ---------------------------------------------------------------
     [JS-HELPERS]
     el("p", {class: "x"}, "text", childNode) builds an element.
     Text is always added as plain text, never as HTML, so a nickname
     can't break the page.
     --------------------------------------------------------------- */
  function el(tag, attrs) {
    var node = document.createElement(tag);
    if (attrs) {
      for (var k in attrs) {
        if (!Object.prototype.hasOwnProperty.call(attrs, k) || attrs[k] == null || attrs[k] === false) continue;
        if (k === "text") node.textContent = attrs[k];
        else if (k.slice(0, 2) === "on") node.addEventListener(k.slice(2), attrs[k]);
        else node.setAttribute(k, attrs[k] === true ? "" : attrs[k]);
      }
    }
    for (var i = 2; i < arguments.length; i++) {
      var c = arguments[i];
      if (c == null || c === false) continue;
      node.appendChild(typeof c === "string" || typeof c === "number" ? document.createTextNode(String(c)) : c);
    }
    return node;
  }

  // Draws a hero's shield: their color, gold trim, crest in the middle.
  // Built with real SVG elements (not HTML text) for the same safety reason as el().
  var SVG_NS = "http://www.w3.org/2000/svg";
  function crestSvg(hero, size) {
    var crest = pick(CRESTS, hero.crest);
    var color = pick(COLORS, hero.color);
    var svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("viewBox", "0 0 100 120");
    svg.setAttribute("width", size || 96);
    svg.setAttribute("height", Math.round((size || 96) * 1.2));
    svg.setAttribute("class", "crest");
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", crest.label + " crest on a " + color.label.toLowerCase() + " shield");
    var shield = document.createElementNS(SVG_NS, "path");
    shield.setAttribute("d", "M50 5 L92 18 V58 C92 88 72 106 50 115 C28 106 8 88 8 58 V18 Z");
    shield.setAttribute("fill", color.hex);
    shield.setAttribute("stroke", "#D9A441");
    shield.setAttribute("stroke-width", "5");
    shield.setAttribute("stroke-linejoin", "round");
    var text = document.createElementNS(SVG_NS, "text");
    text.setAttribute("x", "50");
    text.setAttribute("y", "62");
    text.setAttribute("text-anchor", "middle");
    text.setAttribute("dominant-baseline", "middle");
    text.setAttribute("font-size", "46");
    text.setAttribute("aria-hidden", "true");
    text.textContent = crest.emoji;
    svg.appendChild(shield);
    svg.appendChild(text);
    return svg;
  }

  // A small medal + "Rank – Tier" label, e.g. a silver medal and "Squire – Silver".
  function rankBadge(hero) {
    var info = rankFor(hero);
    return el("span", { class: "rank-badge tier-" + info.tier.toLowerCase() },
      el("span", { class: "medal", "aria-hidden": "true" }),
      el("span", { text: info.label }));
  }

  // Shows a gentle warning at the top of a page when this device can't save.
  function showStorageNotice(container) {
    if (storageWorks()) return;
    container.insertBefore(el("p", { class: "notice", role: "status",
      text: "This browser is not letting the Citadel save (maybe a private window). " +
            "You can look around, but heroes and coins will be forgotten when you close the page." }),
      container.firstChild);
  }

  /* ---------------------------------------------------------------
     [JS-HALLS] The four halls, drawn as hanging banners.
     "href" is null while a hall is closed ("Gates open soon").
     When a hall opens, put its page name here (e.g. "library.html")
     and every hero page will link to it. Never link a page that
     doesn't exist yet.
     needsNexusAccess: the banner is drawn only for heroes whose
     "Nexus access" is on (see [JS-NEXUS]); for everyone else, and for
     visitors, it is left out completely, not shown as closed.
     --------------------------------------------------------------- */
  var HALLS = [
    { name: "The Imperial Library", href: null,
      text: "Learn how things work. Stories, puzzles and lessons that start every idea.",
      icon: '<path d="M10 44h40v8H10zM14 36h38v8H14zM10 28h40v8H10z"/><path d="M16 31h20M20 39h24M16 47h22"/>' },
    { name: "The Proving Grounds", href: "proving-grounds.html",
      text: "Test what you know. Challenges that show what works, and why.",
      icon: '<path d="M26 8h12M28 8v16L14 50a4 4 0 0 0 3.5 6h29a4 4 0 0 0 3.5-6L36 24V8"/><path d="M19 42h26"/><circle cx="28" cy="48" r="1.5"/><circle cx="36" cy="46" r="1.5"/>' },
    { name: "The Forge", href: null,
      text: "Build something real. Games and projects you make work yourself.",
      icon: '<path d="M8 22h34c0 6 6 10 14 10v4c-8 0-12 2-14 6H22c-2-4-6-6-10-6"/><path d="M8 22c0 6 2 10 4 14M26 42v8M38 42v8M20 54h24"/>' },
    { name: "The Nexus", href: "nexus.html", needsNexusAccess: true,
      text: "Where it all connects. Circuits, controllers and automation.",
      icon: '<circle cx="24" cy="38" r="9"/><path d="M24 23v4M24 49v4M9 38h4M35 38h4M13.4 27.4l2.8 2.8M31.8 45.8l2.8 2.8M13.4 48.6l2.8-2.8M31.8 30.2l2.8-2.8"/><circle cx="45" cy="19" r="6"/><path d="M45 9v3M45 26v3M35 19h3M52 19h3M38 12l2 2M50 24l2 2M38 26l2-2M50 14l2-2"/>' }
  ];

  // Fills a <ul class="halls"> with the four banners. With a heroId, open
  // halls link to "hall.html?id=heroId" so the hall knows who is playing.
  // The icon markup above is fixed text written by us, so innerHTML is safe there.
  function renderHalls(list, heroId) {
    list.textContent = "";
    HALLS.forEach(function (hall) {
      if (hall.needsNexusAccess && !hasNexusAccess(heroId)) return; // hidden, not "closed"
      var svg = document.createElementNS(SVG_NS, "svg");
      svg.setAttribute("viewBox", "0 0 64 64");
      svg.setAttribute("aria-hidden", "true");
      svg.innerHTML = hall.icon;
      var inner = el("div", { class: "cloth-inner" }, svg,
        el("h3", { text: hall.name }),
        el("p", { text: hall.text }),
        el("span", { class: "status", text: hall.href ? "Enter" : "Gates open soon" }));
      var href = hall.href && heroId ? hall.href + "?id=" + encodeURIComponent(heroId) : hall.href;
      var cloth = href ? el("a", { class: "cloth", href: href }, inner) : el("div", { class: "cloth" }, inner);
      list.appendChild(el("li", { class: "hall" }, cloth));
    });
  }

  /* [JS-NEXUS] The Nexus holds Ariet's PLC course games. A parent turns
     "Nexus access" on per hero in the Treasury (off by default). Visitors
     never have it. Like the PIN, this is a gate for kids, not security:
     the pages are public. */
  function hasNexusAccess(heroId) {
    if (!heroId || heroId === VISITOR_ID) return false;
    var hero = getHero(heroId);
    return !!(hero && hero.nexusAccess);
  }

  /* [JS-NEXT] When someone opens a hall (or a game) before choosing a
     hero, they go to heroes.html?next=<hall>. After they tap a hero, they
     land back in that hall's games instead of the hero page. Only the halls
     listed here are allowed, so the address can't send anyone elsewhere. */
  var NEXT_PAGES = { "proving-grounds": "proving-grounds.html", "nexus": "nexus.html" };
  function nextPage(name, heroId) {
    var page = NEXT_PAGES[name];
    return page ? page + "?id=" + encodeURIComponent(heroId) : null;
  }

  // Everything other pages can use, under one name: Citadel
  window.Citadel = {
    VERSION: VERSION,
    CRESTS: CRESTS, COLORS: COLORS, LEVELS: LEVELS, RANKS: RANKS, TIERS: TIERS, HALLS: HALLS,
    TOP_STEP: TOP_STEP, PASS_MARK: PASS_MARK, MASTERY_MARK: MASTERY_MARK,
    DEFAULT_TEST_COINS: DEFAULT_TEST_COINS.slice(),
    MAX_HEROES: MAX_HEROES, MAX_NICK: MAX_NICK,
    storageWorks: storageWorks, showStorageNotice: showStorageNotice,
    getHeroes: getHeroes, getHero: getHero, addHero: addHero,
    updateHero: updateHero, removeHero: removeHero, checkHero: checkHero,
    addCoins: addCoins, rankFor: rankFor, stepInfo: stepInfo, rankBadge: rankBadge,
    testInfo: testInfo, getTestCoins: getTestCoins, setTestCoins: setTestCoins,
    testStatus: testStatus, testStatusText: testStatusText, canTakeTest: canTakeTest,
    newGamesAllowed: newGamesAllowed, gradeTest: gradeTest, finishTest: finishTest,
    reportAreaScore: reportAreaScore, reportAnswer: reportAnswer, skillGrades: skillGrades,
    STARTER_GAMES: STARTER_GAMES.slice(), canPlayGame: canPlayGame,
    hasNexusAccess: hasNexusAccess, nextPage: nextPage, NEXT_PAGES: NEXT_PAGES,
    getGameData: getGameData, setGameData: setGameData,
    coinHistory: coinHistory, gameTotals: gameTotals, correctCoins: correctCoins,
    trophies: trophies, recordBestScore: recordBestScore, bestScores: bestScores,
    getSettings: getSettings, setSetting: setSetting, canSpeak: canSpeak, speak: speak, playSound: playSound,
    VISITOR_ID: VISITOR_ID, isVisitor: isVisitor,
    makeBackup: makeBackup, readBackup: readBackup, restoreBackup: restoreBackup,
    hasPin: hasPin, setPin: setPin, checkPin: checkPin, validPin: validPin,
    resetEverything: resetEverything,
    el: el, crestSvg: crestSvg, renderHalls: renderHalls
  };
})();
