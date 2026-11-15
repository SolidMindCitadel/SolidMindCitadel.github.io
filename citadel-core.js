/*
  SolidMind Citadel - shared code (citadel-core.js)
  ------------------------------------------------------------
  Purpose: everything the Citadel pages (and later the games) share:
  heroes, levels, gold coins, ranks, crests, colors, the four halls,
  and the Treasury PIN. Every page loads this file with:
      <script src="citadel-core.js"></script>
  (games in games/ will use "../citadel-core.js").

  Depends on: nothing. No frameworks, no server.
  Used by:    heroes.html, hero.html, treasury.html, test.html

  Search these tags to jump to a section:
    [JS-VERSION]   the site version number
    [JS-STORAGE]   saving to this device (localStorage), safe if blocked
    [JS-CRESTS]    crest pictures heroes can pick
    [JS-COLORS]    hero colors
    [JS-LEVELS]    Level 1 / 2 / 3
    [JS-RANKS]     Apprentice to Master Engineer, Bronze/Silver/Gold tiers
    [JS-TESTS]     the 14 tests, their rules, grading and coin amounts
    [JS-AREAS]     games report area scores; 90% mastery unlocks a locked test
    [JS-HEROES]    add, edit, remove and read heroes
    [JS-COINS]     gold coins (games will call Citadel.addCoins)
    [JS-PIN]       Treasury PIN (a gate for kids, NOT real security)
    [JS-HALLS]     the four hall banners (shared drawing code)
    [JS-HELPERS]   small helpers for building the page

  Privacy: nothing here leaves the device. Heroes are saved in this
  browser only and do NOT sync between devices.
*/
(function () {
  "use strict";

  // [JS-VERSION] Change this with every pull request (see CLAUDE.md "Versions").
  var VERSION = "0.2.0";

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
    return h;
  }

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
      outcome = "passed";
    } else {
      hero.coins = Math.max(0, hero.coins - Math.floor(cost / 2));
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

  /* [JS-AREAS] Games call this after a round to report how the hero did
     in ONE area (a percent from 0 to 100). Each game decides how its
     percent is measured (e.g. 9 wins out of 10 = 90, or accuracy).
     The best score per area is kept in hero.areas. If the hero's test
     is locked and this is one of its weak areas at 90% or more, that
     area counts as mastered. When every weak area is mastered, the test
     resets to a fresh test (rule 5). Returns the updated hero. */
  function reportAreaScore(heroId, area, percent) {
    area = String(area || "");
    percent = Number(percent);
    if (!area || !(percent >= 0 && percent <= 100)) return getHero(heroId);
    var data = load();
    var i = findById(data.heroes, heroId);
    if (i < 0) return null;
    var hero = data.heroes[i];
    var prev = hero.areas[area];
    hero.areas[area] = { best: prev ? Math.max(prev.best, percent) : percent, last: percent };
    var t = hero.test;
    if (t.locked && percent >= MASTERY_MARK && t.mastered.indexOf(area) < 0 &&
        t.weakAreas.some(function (a) { return a.id === area; })) {
      t.mastered.push(area);
      if (t.mastered.length >= t.weakAreas.length) hero.test = freshTest();
    }
    save(data);
    return hero;
  }

  /* ---------------------------------------------------------------
     [JS-HEROES]
     A hero looks like:
       { id, nickname, crest, color, level, coins, earned, created,
         step,   // place on the rank ladder, 0-14 (see [JS-RANKS])
         test,   // where they stand on their next test (see [JS-TESTS])
         areas } // best/last score per area, reported by games ([JS-AREAS])
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
      areas: {}
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
    save(data);
    return hero;
  }

  function removeHero(id) {
    var data = load();
    var i = findById(data.heroes, id);
    if (i >= 0) { data.heroes.splice(i, 1); save(data); }
  }

  /* ---------------------------------------------------------------
     [JS-COINS] Games call Citadel.addCoins(heroId, amount) when a
     hero finishes something. Only whole, positive amounts count.
     Returns the updated hero (or null if the hero is gone).
     --------------------------------------------------------------- */
  function addCoins(id, amount) {
    amount = Math.floor(Number(amount));
    if (!(amount > 0)) return getHero(id);
    var data = load();
    var i = findById(data.heroes, id);
    if (i < 0) return null;
    data.heroes[i].coins += amount;
    data.heroes[i].earned += amount;
    save(data);
    return data.heroes[i];
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
     --------------------------------------------------------------- */
  var HALLS = [
    { name: "The Imperial Library", href: null,
      text: "Learn how things work. Stories, puzzles and lessons that start every idea.",
      icon: '<path d="M10 44h40v8H10zM14 36h38v8H14zM10 28h40v8H10z"/><path d="M16 31h20M20 39h24M16 47h22"/>' },
    { name: "The Proving Grounds", href: null,
      text: "Test what you know. Challenges that show what works, and why.",
      icon: '<path d="M26 8h12M28 8v16L14 50a4 4 0 0 0 3.5 6h29a4 4 0 0 0 3.5-6L36 24V8"/><path d="M19 42h26"/><circle cx="28" cy="48" r="1.5"/><circle cx="36" cy="46" r="1.5"/>' },
    { name: "The Forge", href: null,
      text: "Build something real. Games and projects you make work yourself.",
      icon: '<path d="M8 22h34c0 6 6 10 14 10v4c-8 0-12 2-14 6H22c-2-4-6-6-10-6"/><path d="M8 22c0 6 2 10 4 14M26 42v8M38 42v8M20 54h24"/>' },
    { name: "The Nexus", href: null,
      text: "Where it all connects. Circuits, controllers and automation.",
      icon: '<circle cx="24" cy="38" r="9"/><path d="M24 23v4M24 49v4M9 38h4M35 38h4M13.4 27.4l2.8 2.8M31.8 45.8l2.8 2.8M13.4 48.6l2.8-2.8M31.8 30.2l2.8-2.8"/><circle cx="45" cy="19" r="6"/><path d="M45 9v3M45 26v3M35 19h3M52 19h3M38 12l2 2M50 24l2 2M38 26l2-2M50 14l2-2"/>' }
  ];

  // Fills a <ul class="halls"> with the four banners.
  // The icon markup above is fixed text written by us, so innerHTML is safe there.
  function renderHalls(list) {
    list.textContent = "";
    HALLS.forEach(function (hall) {
      var svg = document.createElementNS(SVG_NS, "svg");
      svg.setAttribute("viewBox", "0 0 64 64");
      svg.setAttribute("aria-hidden", "true");
      svg.innerHTML = hall.icon;
      var inner = el("div", { class: "cloth-inner" }, svg,
        el("h3", { text: hall.name }),
        el("p", { text: hall.text }),
        el("span", { class: "status", text: hall.href ? "Enter" : "Gates open soon" }));
      var cloth = hall.href ? el("a", { class: "cloth", href: hall.href }, inner) : el("div", { class: "cloth" }, inner);
      list.appendChild(el("li", { class: "hall" }, cloth));
    });
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
    reportAreaScore: reportAreaScore,
    hasPin: hasPin, setPin: setPin, checkPin: checkPin, validPin: validPin,
    resetEverything: resetEverything,
    el: el, crestSvg: crestSvg, renderHalls: renderHalls
  };
})();
