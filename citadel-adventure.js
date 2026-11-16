/*
  SolidMind Citadel - the chapter engine (citadel-adventure.js)
  ------------------------------------------------------------
  Purpose: ONE shared engine that plays any chapter of any adventure, for
  core subjects (Imperial Library) and the Nexus alike. Everything a
  chapter shows comes from its DATA file (adventures/<adventure>/<chapter>.js),
  so a new chapter needs only new data, never new code here.
  How to write a chapter: see CHAPTER-TEMPLATE.md.

  A chapter has five steps, played in order. The next step unlocks when
  the current one is done. After that, any finished step can be replayed
  (reread the story, replay the game) anytime. There is no timer anywhere.
    1. Story      short scenes: a picture area and text (read aloud)
    2. Lesson     the idea explained with simple pictures
    3. Challenge  the character asks "What should I do now?". The kid
                  answers with help: after EVERY answer the reason is shown,
                  and a wrong answer can simply be tried again. No coins.
    4. Practice   a race against the computer on the reusable race board
                  (citadel-race.js) with the chapter's questions. Done when a
                  race is finished, win or lose.
    5. Mastery    10 questions on the chapter's skill areas, right on the
                  FIRST try only. 90% (9 of 10) finishes the chapter. Level 1
                  plays it as two quick rounds of 5 with a celebration in
                  between. Below 90%: shows which skills to practise; retry
                  anytime with new questions.

  Coins and skills (Ariet's choices, same scoring as Pizza Party):
    - Practice and Mastery give gold coins: 100 points for a first-try
      right answer, minus 10 for each miss on that skill this visit
      (never below 10); coins = points / 100, rounded, when the race or
      check ends. Story, Lesson and Challenge give no coins.
    - Every Practice and Mastery answer goes to Citadel.reportAnswer, so
      it feeds the existing skill grades and 90% mastery.
    - Nexus chapters (track "nexus") NEVER give gold coins (CLAUDE.md).
  Who may open a chapter:
    - core chapters: the hero's learning plan must not have the subject Off,
      and rule 6 applies unless the chapter data says "starter: true"
      (Citadel.canPlayGame with the chapter's subject).
    - nexus chapters: only heroes with "Nexus access" (never visitors).
  Progress (which steps are done, the character chosen) is saved per hero
  per chapter on this device with Citadel.setGameData under the game id
  "adv-<adventure>-<chapter>". Visitors: kept in memory only.

  Depends on: citadel-core.js, citadel-adventure.css,
              citadel-race.js (Practice step),
              citadel-questions.js (only for chapters that use the question
              bank; the chapter lists its question files in "questionFiles").
  Used by:    adventures/play.html (plays a chapter), library.html (lists them)

  Search these tags to jump to a section:
    [JS-STEPS]      the five steps
    [JS-LOAD]       loading a chapter's data file
    [JS-ACCESS]     who may open a chapter
    [JS-PROGRESS]   saved step progress per hero
    [JS-QUESTIONS]  questions from the bank or written in the data
    [JS-RUN]        the chapter page: header, step map, stage
    [JS-CHARACTER]  optional character choice (placeholder pictures)
    [JS-STORY]      step 1, also used for step 2 (Lesson)
    [JS-CHALLENGE]  step 3
    [JS-PRACTICE]   step 4 (race board)
    [JS-MASTERY]    step 5
    [JS-HELPERS]    pictures, read-aloud, small helpers

  Privacy: nothing about the real child is stored. The character choice is
  only an avatar for the story.
*/
(function () {
  "use strict";

  /* [JS-STEPS] */
  var STEPS = [
    { id: "story",     name: "Story",         emoji: "📜" },
    { id: "lesson",    name: "Lesson",        emoji: "💡" },
    { id: "challenge", name: "Challenge",     emoji: "🤔" },
    { id: "practice",  name: "Practice game", emoji: "🎲" },
    { id: "mastery",   name: "Mastery check", emoji: "⭐" }
  ];
  var CHECK_SIZE = 10, CHECK_PASS = 90, LEVEL1_ROUND = 5;
  var SAMPLE_NOTE = "Sample – real stories coming soon";

  /* [JS-LOAD] A chapter data file calls CitadelAdventure.chapter({...}).
     load(adventuresFolder, adventure, chapter) adds the data file (and any
     question files it lists) to the page and gives back the chapter. Names
     may only use a-z, 0-9 and "-", so the address can't load anything else. */
  var registry = {};
  var NAME_OK = /^[a-z0-9-]{1,40}$/;

  function chapter(data) {
    if (!data || !NAME_OK.test(data.adventure || "") || !NAME_OK.test(data.chapter || "")) return;
    registry[data.adventure + "/" + data.chapter] = data;
  }

  function loadScript(src) {
    return new Promise(function (ok, fail) {
      var s = document.createElement("script");
      s.src = src;
      s.onload = function () { ok(); };
      s.onerror = function () { fail(new Error("Could not load " + src)); };
      document.head.appendChild(s);
    });
  }
  var loadedFiles = {};
  function loadOnce(src) { return loadedFiles[src] || (loadedFiles[src] = loadScript(src)); }

  // folder: path to the adventures/ folder from this page ("adventures/" or "")
  // root: path to the site's main folder from this page ("" or "../")
  // listOnly: true when a page only lists chapters (library.html), so the
  // question files aren't needed.
  function load(folder, root, adv, ch, listOnly) {
    if (!NAME_OK.test(adv || "") || !NAME_OK.test(ch || "")) return Promise.reject(new Error("bad name"));
    var key = adv + "/" + ch, v = "?v=" + window.Citadel.VERSION;
    var p = registry[key] ? Promise.resolve() : loadOnce(folder + key + ".js" + v);
    return p.then(function () {
      var chap = registry[key];
      if (!chap) throw new Error("No chapter data in " + key + ".js");
      // Question files listed by the chapter, relative to the site's main folder.
      chap._folder = folder + adv + "/"; // for pictures named in the data file
      if (listOnly) return chap;
      return Promise.all((chap.questionFiles || []).filter(function (f) { return /^[a-z0-9\/-]+\.js$/.test(f); })
        .map(function (f) { return loadOnce(root + f + v); })).then(function () {
          chap._folder = folder + adv + "/"; // for pictures named in the data file
          return chap;
        });
    });
  }

  function gameId(chap) { return "adv-" + chap.adventure + "-" + chap.chapter; }

  /* [JS-ACCESS] { ok } or { ok: false, why: "no-hero" | "nexus" | "off" | "test" } */
  function access(heroId, chap) {
    var C = window.Citadel, hero = C.getHero(heroId);
    if (!hero) return { ok: false, why: "no-hero" };
    if (chap.track === "nexus") return C.hasNexusAccess(heroId) ? { ok: true } : { ok: false, why: "nexus" };
    if (C.subjectChoice(hero, chap.subject) === "off") return { ok: false, why: "off" };
    if (C.canPlayGame(heroId, gameId(chap), { subject: chap.subject, starter: chap.starter === true })) return { ok: true };
    return { ok: false, why: "test" };
  }

  /* [JS-PROGRESS] { done: { story: "2026-11-16", ... }, character, best } */
  function progress(heroId, chap) {
    var d = window.Citadel.getGameData(heroId, gameId(chap));
    if (!d.done || typeof d.done !== "object") d.done = {};
    return d;
  }
  function saveProgress(heroId, chap, d) { window.Citadel.setGameData(heroId, gameId(chap), d); }
  function stepsDone(prog) { return STEPS.filter(function (s) { return prog.done[s.id]; }).length; }
  // A step is open when every step before it is done.
  function stepOpen(prog, i) {
    for (var k = 0; k < i; k++) if (!prog.done[STEPS[k].id]) return false;
    return true;
  }
  function finished(prog) { return !!prog.done.mastery; }

  // Items in the data can say "levels: [1, 2]" to show only at those levels.
  function forLevel(list, level) {
    return (list || []).filter(function (x) { return !x.levels || x.levels.indexOf(level) >= 0; });
  }

  /* [JS-QUESTIONS] A chapter's practice/mastery questions come from either
       "bank":      { areas: { 1: ["count-1-10", ...], 2: [...], 3: [...] }, theme: "pizza" }
                    -> new questions every time from citadel-questions.js
       "questions": [ { levels, area, areaLabel, text, choices: [{label, ok}], why } ]
                    -> questions written in the data file (shuffled)
     Both turn into one shape: { area, label, text, say, choices: [{label, ok}],
     why, bank (the bank question, for its pictures) }. */
  function questionSource(chap, part, level) {
    var Q = window.CitadelQuestions;
    var spec = chap[part] || {};
    var bank = spec.bank || chap.bank;
    var written = forLevel(spec.questions, level);
    var areas = [], labels = {};
    if (bank && Q) {
      ((bank.areas && bank.areas[level]) || []).forEach(function (a) {
        var info = Q.areas(level).filter(function (x) { return x.area === a; })[0];
        if (info) { areas.push(a); labels[a] = info.areaLabel; }
      });
    }
    written.forEach(function (w) {
      if (w.area && areas.indexOf(w.area) < 0) { areas.push(w.area); labels[w.area] = w.areaLabel || w.area; }
    });
    var lastSig = null, pool = {};
    function make(area) {
      var mine = written.filter(function (w) { return w.area === area; });
      var useBank = bank && labels[area] && Q && (!mine.length || Math.random() < 0.5) &&
        Q.areas(level).some(function (x) { return x.area === area; });
      if (useBank) {
        var q = Q.forGame(area, level, bank.theme || "pizza", lastSig);
        lastSig = q.sig;
        return { area: area, label: labels[area], text: q.text, say: q.say, why: q.why, bank: q,
          choices: q.choices.map(function (c) { return { label: c.label, say: c.say, ok: String(c.value) === String(q.answer) }; }) };
      }
      // Written questions: go through them in a shuffled order before repeating.
      if (!pool[area] || !pool[area].length) pool[area] = shuffle(mine);
      var w = pool[area].pop();
      return { area: area, label: labels[area], text: w.text, say: w.say || w.text, why: w.why || "", picture: w.picture,
        emoji: w.emoji, choices: shuffle(w.choices.map(function (c) { return { label: c.label, say: c.say || c.label, ok: c.ok === true }; })) };
    }
    return { areas: areas, labels: labels, make: make };
  }

  /* ---------------------------------------------------------------
     [JS-RUN] Plays a chapter on a page.
     CitadelAdventure.run({ mount, heroId, chapter, level, back: { href, text },
                            timing })   timing < 1 = faster (tests only)
     --------------------------------------------------------------- */
  function run(opt) {
    var C = window.Citadel, el = C.el;
    var chap = opt.chapter, id = opt.heroId, level = opt.level || 1;
    var nexus = chap.track === "nexus";
    var visitor = C.isVisitor(id);
    var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
    var T = opt.timing == null ? 1 : opt.timing;
    var prog = progress(id, chap);
    var misses = {}; // session only, like Pizza Party: reset when the page is left
    function pointsFor(area) { return Math.max(10, 100 - 10 * (misses[area] || 0)); }

    var root = el("div", { class: "adv" });
    opt.mount.textContent = "";
    opt.mount.appendChild(root);

    // Header: title, subject, sample note, player and coins.
    var subj = window.CitadelSubjects && window.CitadelSubjects.get(chap.subject);
    var head = el("header", { class: "adv-head" },
      el("p", { class: "adv-kicker", text: (chap.adventureTitle || "") + (chap.adventureTitle ? " · " : "") + (chap.chapterLabel || "") }),
      el("h1", null, el("span", { "aria-hidden": "true", text: (chap.emoji || "📖") + " " }), chap.title || "Chapter"),
      el("p", { class: "adv-tags" },
        subj ? el("span", { class: "adv-tag", text: subj.emoji + " " + subj.name }) : null,
        el("span", { class: "adv-tag", text: "Level " + level }),
        nexus ? el("span", { class: "adv-tag nexus", text: "Nexus" }) : null),
      chap.sample ? el("p", { class: "adv-sample", role: "note", text: SAMPLE_NOTE }) : null);
    var player = el("p", { class: "adv-player" });
    root.appendChild(head);
    root.appendChild(player);
    function drawPlayer() {
      var h = C.getHero(id);
      player.textContent = "";
      player.appendChild(el("span", { text: (visitor ? "Visitor" : h.nickname) + (character() ? " as " + character().name : "") }));
      if (!nexus) {
        player.appendChild(el("span", { class: "coin", "aria-hidden": "true" }));
        player.appendChild(el("span", { text: h.coins + (visitor ? " (just for fun)" : ""), "aria-label": h.coins + " gold coins" }));
      }
      if (chap.characters && prog.character) {
        player.appendChild(el("button", { class: "btn ghost small", type: "button", text: "Change character", onclick: chooseCharacter }));
      }
    }

    var map = el("ol", { class: "adv-steps", "aria-label": "Chapter steps" });
    var stage = el("section", { class: "adv-stage", "aria-live": "polite" });
    root.appendChild(map);
    root.appendChild(stage);

    function drawMap(current) {
      map.textContent = "";
      STEPS.forEach(function (s, i) {
        var open = stepOpen(prog, i), done = !!prog.done[s.id];
        var b = el("button", { type: "button", class: "adv-step" + (done ? " done" : "") + (s.id === current ? " now" : ""),
          disabled: !open, "aria-current": s.id === current ? "step" : null,
          "aria-label": s.name + (done ? ", done" : open ? ", open" : ", locked until the step before is done"),
          onclick: function () { show(s.id); } },
          el("span", { class: "adv-step-icon", "aria-hidden": "true", text: done ? "✅" : open ? s.emoji : "🔒" }),
          el("span", { class: "adv-step-name", text: (i + 1) + ". " + s.name }));
        map.appendChild(el("li", null, b));
      });
    }

    function markDone(stepId) {
      prog = progress(id, chap);
      if (!prog.done[stepId]) prog.done[stepId] = new Date().toISOString().slice(0, 10);
      saveProgress(id, chap, prog);
    }
    function nextStepId() {
      for (var i = 0; i < STEPS.length; i++) if (!prog.done[STEPS[i].id]) return STEPS[i].id;
      return null;
    }

    function show(stepId) {
      stage.textContent = "";
      drawPlayer();
      drawMap(stepId);
      if (chap.sample && stepId !== "practice" && stepId !== "mastery" && stepId !== "complete") {
        stage.appendChild(el("p", { class: "adv-sample small", text: SAMPLE_NOTE }));
      }
      ({ story: story, lesson: lesson, challenge: challenge, practice: practice, mastery: mastery, complete: complete })[stepId]();
      if (opt.onShow) opt.onShow(stepId);
      // After the first screen, bring the new step into view (on phones the
      // stage is below the step map).
      if (started && stage.scrollIntoView) stage.scrollIntoView({ block: "start", behavior: reduce ? "auto" : "smooth" });
      started = true;
    }
    var started = false;
    function goNext() { show(nextStepId() || "complete"); }

    // "Next: <step>" button at the end of a step.
    function nextButton(label) {
      var n = nextStepId();
      return el("button", { class: "btn big-btn", type: "button",
        text: label || (n ? "Next: " + STEPS.filter(function (s) { return s.id === n; })[0].name + " →" : "See the chapter end 🎉"),
        onclick: goNext });
    }

    /* [JS-CHARACTER] Optional. The data's "characters" list gives each choice a
       name and a picture (a placeholder until Ariet supplies artwork). */
    function character() {
      if (!chap.characters || !prog.character) return null;
      return chap.characters.list.filter(function (c) { return c.id === prog.character; })[0] || null;
    }
    function chooseCharacter() {
      stage.textContent = "";
      drawMap(null);
      drawPlayer();
      stage.appendChild(el("h2", { text: fill(chap.characters.ask || "Who will you be?") }));
      if (chap.sample) stage.appendChild(el("p", { class: "adv-sample small", text: "Sample pictures – real artwork coming soon" }));
      var list = el("div", { class: "adv-chars", role: "group", "aria-label": "Choose a character" });
      chap.characters.list.forEach(function (c) {
        list.appendChild(el("button", { type: "button", class: "adv-char" + (prog.character === c.id ? " picked" : ""),
          "aria-pressed": String(prog.character === c.id),
          onclick: function () {
            prog = progress(id, chap);
            prog.character = c.id;
            saveProgress(id, chap, prog);
            C.playSound(id, "tap");
            goNext();
          } }, picture(c, "adv-char-pic"), el("strong", { text: c.name })));
      });
      stage.appendChild(list);
      C.speak(id, fill(chap.characters.ask || "Who will you be?"));
    }

    /* [JS-STORY] Pages with a picture and text, Back / Next. Used for the
       Story (scenes) and the Lesson (points with simple pictures). */
    function pages(stepId, list, title) {
      var i = 0;
      list = forLevel(list, level);
      var box = el("div", { class: "adv-page" });
      stage.appendChild(el("h2", { text: title }));
      stage.appendChild(box);
      function draw() {
        var p = list[i];
        box.textContent = "";
        if (p.title) box.appendChild(el("h3", { text: fill(p.title) }));
        box.appendChild(picture(p, "adv-pic"));
        var text = fill(p.text);
        box.appendChild(el("div", { class: "adv-text-row" },
          el("p", { class: "adv-text", text: text }),
          speaker(function () { return fill(p.say || p.text); })));
        box.appendChild(el("p", { class: "adv-count", text: (i + 1) + " of " + list.length }));
        var row = el("div", { class: "btn-row" });
        if (i > 0) row.appendChild(el("button", { class: "btn ghost", type: "button", text: "← Back", onclick: function () { i--; draw(); } }));
        if (i < list.length - 1) {
          row.appendChild(el("button", { class: "btn big-btn", type: "button", text: "Next →", onclick: function () { i++; draw(); C.playSound(id, "tap"); } }));
        } else {
          row.appendChild(el("button", { class: "btn big-btn", type: "button", text: "Done ✓", onclick: function () {
            markDone(stepId); C.playSound(id, "right"); goNext();
          } }));
        }
        box.appendChild(row);
        C.speak(id, fill(p.say || p.text));
      }
      if (!list.length) { markDone(stepId); box.appendChild(nextButton()); return; }
      draw();
    }
    function story() { pages("story", chap.story, "Story"); }
    function lesson() { pages("lesson", chap.lesson, "Lesson"); }

    /* [JS-CHALLENGE] The character asks; the kid answers with help.
       Every answer shows its reason. Wrong answers can be tried again.
       No coins and no skill score here: this step is for learning. */
    function challenge() {
      var list = forLevel(chap.challenge, level), i = 0;
      stage.appendChild(el("h2", { text: "Challenge" }));
      var box = el("div", { class: "adv-page" });
      stage.appendChild(box);
      function draw() {
        var q = list[i], ch = character();
        box.textContent = "";
        box.appendChild(el("div", { class: "adv-ask" },
          ch ? picture(ch, "adv-ask-pic") : el("span", { class: "adv-ask-pic placeholder", "aria-hidden": "true", text: chap.emoji || "🤔" }),
          el("p", { class: "adv-bubble", text: fill(q.ask || "What should I do now?") })));
        if (q.picture || q.emoji) box.appendChild(picture(q, "adv-pic small"));
        var say = fill(q.ask || "What should I do now?") + " " + fill(q.text);
        box.appendChild(el("div", { class: "adv-text-row" }, el("p", { class: "adv-text", text: fill(q.text) }), speaker(function () { return say; })));
        var answers = el("div", { class: "adv-choices" }), why = el("p", { class: "adv-why", role: "status", hidden: true });
        q.choices.forEach(function (c) {
          var b = el("button", { type: "button", class: "adv-choice" + (c.label.length > 14 ? " long" : ""), text: fill(c.label),
            onclick: function () {
              why.hidden = false;
              if (c.ok) {
                b.classList.add("right");
                answers.querySelectorAll("button").forEach(function (x) { x.disabled = true; });
                why.className = "adv-why yes";
                why.textContent = "Yes! " + fill(c.why || q.why || "");
                C.playSound(id, "right");
                C.speak(id, why.textContent);
                box.appendChild(el("div", { class: "btn-row" }, i < list.length - 1
                  ? el("button", { class: "btn big-btn", type: "button", text: "Next →", onclick: function () { i++; draw(); } })
                  : el("button", { class: "btn big-btn", type: "button", text: "Done ✓", onclick: function () { markDone("challenge"); goNext(); } })));
              } else {
                b.disabled = true;
                why.className = "adv-why look";
                why.textContent = "Not quite. " + fill(c.why || q.hint || "Look again and try another answer.");
                C.playSound(id, "tap"); // never a harsh sound
                C.speak(id, why.textContent);
              }
            } });
          answers.appendChild(b);
        });
        box.appendChild(answers);
        box.appendChild(why);
        box.appendChild(el("p", { class: "adv-count", text: (i + 1) + " of " + list.length }));
        C.speak(id, say);
      }
      if (!list.length) { markDone("challenge"); box.appendChild(nextButton()); return; }
      draw();
    }

    /* [JS-PRACTICE] A race against the computer on the reusable race board.
       Tiers = the chapter's skill areas at this level, easiest first, so the
       board's "3 right in a row = harder" moves through the skills. */
    function practice() {
      var src = questionSource(chap, "practice", level);
      var spec = chap.practice || {};
      stage.appendChild(el("h2", { text: "Practice game" }));
      stage.appendChild(el("p", { class: "adv-text", text: fill(spec.intro || "Race the computer! Right answers move you forward.") }));
      if (!src.areas.length || !window.CitadelRace) { markDone("practice"); stage.appendChild(nextButton()); return; }
      var board = el("div", { class: "adv-race" }), after = el("div", { class: "adv-after" });
      stage.appendChild(board);
      stage.appendChild(after);
      var points = 0, answered = 0;
      window.CitadelRace.start({
        mount: board,
        playerName: character() ? character().name : (visitor ? "You" : C.getHero(id).nickname),
        tiers: src.areas.map(function (a) { return src.labels[a]; }),
        cpuLevels: [{ id: "easy", label: "Easy", tier: 1 }, { id: "medium", label: "Medium", tier: Math.min(2, src.areas.length) },
                    { id: "hard", label: "Hard", tier: src.areas.length }],
        cpuLevel: spec.cpuLevel || "easy",
        theme: spec.theme || {},
        timing: T,
        ask: function (tier) {
          var q = src.make(src.areas[Math.max(0, Math.min(src.areas.length, tier) - 1)]);
          var rq = { title: q.label, text: q.text, say: q.say, explain: q.why, area: q.area, areaLabel: q.label,
            choices: q.choices.map(function (c) { return { label: c.label, ok: c.ok }; }) };
          if (q.bank) {
            rq.draw = function (b, revealNow) {
              if (revealNow) window.CitadelQuestions.explain(q.bank, b, true);
              else b.appendChild(window.CitadelQuestions.draw(q.bank));
            };
          } else if (q.picture || q.emoji) {
            rq.draw = function (b) { b.appendChild(picture(q, "adv-pic small")); };
          }
          return rq;
        },
        onAnswer: function (a) {
          if (a.who !== "you") return;
          var q = a.question, pts = a.ok ? pointsFor(q.area) : 0;
          if (!a.ok) misses[q.area] = (misses[q.area] || 0) + 1;
          points += pts; answered++;
          C.reportAnswer(id, { area: q.area, label: q.areaLabel, points: pts, firstTry: a.ok });
        },
        onEnd: function (r) {
          var coins = nexus ? 0 : Math.round(points / 100);
          if (coins > 0) C.addCoins(id, coins, { game: gameId(chap), label: chap.title });
          points = 0; answered = 0;
          markDone("practice");
          drawPlayer(); drawMap("practice");
          after.textContent = "";
          after.appendChild(el("p", { class: "adv-result", text: (r.winner === "you" ? "You won the race! 🏆" : "Good race! The computer won this time.") +
            (nexus ? "" : " +" + coins + " gold " + (coins === 1 ? "coin" : "coins") + (visitor ? " (just for fun)" : "") + ".") }));
          after.appendChild(el("div", { class: "btn-row" }, nextButton()));
        },
        speak: function (t) { C.speak(id, t); },
        sound: function (k) { C.playSound(id, k); }
      });
    }

    /* [JS-MASTERY] 10 first-try questions spread over the chapter's skill
       areas. 90% (9 of 10) finishes the chapter. Level 1: two rounds of 5
       with a short celebration in between. */
    function mastery() {
      var src = questionSource(chap, "mastery", level);
      stage.appendChild(el("h2", { text: "Mastery check" }));
      if (!src.areas.length) { markDone("mastery"); stage.appendChild(nextButton()); return; }
      var intro = el("div", { class: "adv-page" },
        el("p", { class: "adv-text", text: "10 questions. Get " + Math.ceil(CHECK_SIZE * CHECK_PASS / 100) + " of 10 right on the first try to master this chapter. Take your time: there is no timer." +
          (level === 1 ? " You'll play two quick rounds of 5." : "") }),
        el("div", { class: "btn-row" }, el("button", { class: "btn big-btn", type: "button", text: "Start the check ⭐", onclick: begin })));
      stage.appendChild(intro);

      var slots, at, right, points, wrongAreas, box;
      function begin() {
        var list = [];
        while (list.length < CHECK_SIZE) list = list.concat(shuffle(src.areas));
        slots = list.slice(0, CHECK_SIZE);
        at = 0; right = 0; points = 0; wrongAreas = {};
        stage.textContent = "";
        stage.appendChild(el("h2", { text: "Mastery check" }));
        box = el("div", { class: "adv-page" });
        stage.appendChild(box);
        ask();
      }
      function ask() {
        var q = src.make(slots[at]);
        box.textContent = "";
        var dots = el("div", { class: "adv-dots", "aria-hidden": "true" });
        var from = level === 1 && at >= LEVEL1_ROUND ? LEVEL1_ROUND : 0, to = level === 1 && at < LEVEL1_ROUND ? LEVEL1_ROUND : CHECK_SIZE;
        for (var k = from; k < to; k++) dots.appendChild(el("span", { class: k < at ? "done" : k === at ? "now" : "", text: "⭐" }));
        box.appendChild(dots);
        box.appendChild(el("p", { class: "visually-hidden", text: "Question " + (at + 1) + " of " + CHECK_SIZE }));
        box.appendChild(el("div", { class: "adv-text-row" }, el("p", { class: "adv-q", text: q.text }), speaker(function () { return q.say; })));
        var pic = el("div", { class: "adv-qpic" });
        if (q.bank) pic.appendChild(window.CitadelQuestions.draw(q.bank));
        else if (q.picture || q.emoji) pic.appendChild(picture(q, "adv-pic small"));
        box.appendChild(pic);
        var answers = el("div", { class: "adv-choices" }), fb = el("p", { class: "adv-why", role: "status" });
        q.choices.forEach(function (c) {
          answers.appendChild(el("button", { type: "button", class: "adv-choice" + (c.label.length > 14 ? " long" : ""), text: c.label,
            "aria-label": c.say || c.label,
            onclick: function () {
              answers.querySelectorAll("button").forEach(function (x) { x.disabled = true; });
              if (c.ok) {
                this.classList.add("right");
                var pts = pointsFor(q.area);
                right++; points += pts;
                C.reportAnswer(id, { area: q.area, label: q.label, points: pts, firstTry: true });
                fb.className = "adv-why yes"; fb.textContent = "Yes! ⭐";
                C.playSound(id, "right");
                setTimeout(next, (reduce ? 700 : 1100) * T);
              } else {
                misses[q.area] = (misses[q.area] || 0) + 1;
                wrongAreas[q.area] = true;
                C.reportAnswer(id, { area: q.area, label: q.label, points: 0, firstTry: false });
                answers.querySelectorAll("button").forEach(function (x, k) { if (q.choices[k].ok) x.classList.add("right"); });
                fb.className = "adv-why look"; fb.textContent = "Here's why: " + (q.why || "");
                C.playSound(id, "tap");
                var ex = el("div", { class: "adv-explain" });
                if (q.bank) { box.appendChild(ex); window.CitadelQuestions.explain(q.bank, ex, true); }
                C.speak(id, q.why);
                box.appendChild(el("div", { class: "btn-row" }, el("button", { class: "btn big-btn", type: "button", text: "Next →", onclick: next })));
              }
            } }));
        });
        box.appendChild(answers);
        box.appendChild(fb);
        C.speak(id, q.say);
      }
      function next() {
        at++;
        if (at >= CHECK_SIZE) return end();
        if (level === 1 && at === LEVEL1_ROUND) return halfway();
        ask();
      }
      function halfway() {
        box.textContent = "";
        box.appendChild(el("div", { class: "adv-celebrate" },
          el("p", { class: "adv-big", "aria-hidden": "true", text: "🎉" }),
          el("h3", { text: "Round 1 done! " + right + " of 5 ⭐" }),
          el("p", { class: "adv-text", text: "Stretch, smile, and get ready for 5 more." }),
          el("div", { class: "btn-row" }, el("button", { class: "btn big-btn", type: "button", text: "Round 2 →", onclick: ask }))));
        C.playSound(id, "coin");
        C.speak(id, "Round one done! Ready for five more?");
      }
      function end() {
        var percent = Math.round(100 * right / CHECK_SIZE);
        var passed = percent >= CHECK_PASS;
        var coins = nexus ? 0 : Math.round(points / 100);
        if (coins > 0) C.addCoins(id, coins, { game: gameId(chap), label: chap.title });
        var best = C.recordBestScore(id, { game: gameId(chap) + "-level-" + level, label: chap.title + " – mastery check (Level " + level + ")",
          score: percent, text: percent + "%" });
        if (passed) markDone("mastery");
        prog = progress(id, chap);
        if (!prog.best || percent > prog.best) { prog.best = percent; saveProgress(id, chap, prog); }
        drawPlayer(); drawMap("mastery");
        box.textContent = "";
        box.appendChild(el("div", { class: "adv-celebrate" },
          el("p", { class: "adv-big", "aria-hidden": "true", text: passed ? "🏆" : "💪" }),
          el("h3", { text: right + " of " + CHECK_SIZE + " right (" + percent + "%)" }),
          nexus ? null : el("p", { class: "adv-result", text: "+" + coins + " gold " + (coins === 1 ? "coin" : "coins") + (visitor ? " (just for fun)" : "") }),
          best && !visitor ? el("p", { class: "adv-result", text: "New best score! 🏆" }) : null,
          el("p", { class: "adv-text", text: passed ? "You mastered this chapter!" : "So close! You need " + Math.ceil(CHECK_SIZE * CHECK_PASS / 100) + " of 10. Practise these skills, then try again with new questions:" })));
        if (!passed) {
          var ul = el("ul", { class: "adv-practise" });
          Object.keys(wrongAreas).forEach(function (a) { ul.appendChild(el("li", { text: src.labels[a] || a })); });
          box.appendChild(ul);
          box.appendChild(el("div", { class: "btn-row" },
            el("button", { class: "btn big-btn", type: "button", text: "Try again ⭐", onclick: begin }),
            el("button", { class: "btn ghost", type: "button", text: "Practice game 🎲", onclick: function () { show("practice"); } })));
        } else {
          box.appendChild(el("div", { class: "btn-row" }, el("button", { class: "btn big-btn", type: "button", text: "See the chapter end 🎉", onclick: function () { show("complete"); } })));
        }
        C.playSound(id, passed ? "coin" : "tap");
        C.speak(id, passed ? "You mastered this chapter!" : "So close! Practise a little, then try again.");
        if (passed && !reduce) confetti();
      }
    }

    // After the mastery check: replay anything.
    function complete() {
      prog = progress(id, chap);
      stage.appendChild(el("div", { class: "adv-celebrate" },
        el("p", { class: "adv-big", "aria-hidden": "true", text: "🏆" }),
        el("h2", { text: fill(chap.endText || "Chapter complete!") }),
        el("p", { class: "adv-text", text: "Best mastery check: " + (prog.best || 0) + "%. Tap any step above to reread the story or replay the game." })));
    }

    /* [JS-HELPERS] */
    // Replaces {name} with the chosen character's name (or the hero's nickname)
    // and {hero} with the nickname, so data files can talk to the player.
    function fill(text) {
      var h = C.getHero(id), nick = visitor ? "Explorer" : h.nickname;
      var ch = character();
      return String(text == null ? "" : text).replace(/\{name\}/g, ch ? ch.name : nick).replace(/\{hero\}/g, nick);
    }
    // A picture from the data: "picture" (a file in the chapter's folder, or
    // one per character: { boy: "...", girl: "..." }), else a box with the
    // data's emoji (a simple picture, or a placeholder until artwork exists). Every picture has alt text ("alt" in the data).
    function picture(item, cls) {
      var file = item.picture;
      if (file && typeof file === "object") file = prog.character ? file[prog.character] : null;
      var alt = fill(item.alt || item.name || "");
      if (file && /^[a-z0-9\/._-]+\.(png|jpe?g|webp|svg)$/i.test(file)) {
        return el("img", { class: cls, src: chap._folder + file, alt: alt, loading: "lazy" });
      }
      var box = el("div", { class: cls + " placeholder", role: "img", "aria-label": alt || "Picture coming soon" },
        el("span", { class: "adv-emoji", "aria-hidden": "true", text: item.emoji || item.placeholder || "🖼️" }));
      // "art" in the data describes artwork still needed (for Ariet), so the
      // placeholder says a real picture is coming.
      if (item.art) box.appendChild(el("span", { class: "adv-ph-note", text: "Picture coming soon" }));
      return box;
    }
    function speaker(getText) {
      return el("button", { class: "speaker", type: "button", "aria-label": "Read out loud", text: "🔊",
        onclick: function () { if (!C.speak(id, getText(), true)) this.title = "This device can't read out loud."; } });
    }
    function confetti() {
      var box = el("div", { class: "confetti", "aria-hidden": "true" });
      for (var i = 0; i < 24; i++) {
        box.appendChild(el("span", { text: ["⭐", "🎉", "🏆", "📜"][i % 4],
          style: "left:" + Math.round(Math.random() * 95) + "%;animation-delay:" + (Math.random() * 0.8).toFixed(2) + "s" }));
      }
      document.body.appendChild(box);
      setTimeout(function () { box.remove(); }, 3800);
    }

    // Start: character first (if the chapter has one and none is chosen yet),
    // then the first step that isn't done (or the chapter end).
    if (chap.characters && chap.characters.list && chap.characters.list.length && !prog.character) chooseCharacter();
    else goNext();
    return { show: show };
  }

  function shuffle(list) {
    var a = list.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }

  window.CitadelAdventure = {
    STEPS: STEPS, CHECK_SIZE: CHECK_SIZE, CHECK_PASS: CHECK_PASS,
    chapter: chapter, load: load, access: access, gameId: gameId,
    progress: progress, stepsDone: stepsDone, stepOpen: stepOpen, finished: finished, run: run
  };
})();
