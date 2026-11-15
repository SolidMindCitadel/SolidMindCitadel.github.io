/*
  SolidMind Citadel - reusable race board (citadel-race.js)
  ------------------------------------------------------------
  Purpose: a race-to-the-finish board game against the computer that ANY
  future Citadel game (math, reading, science...) can use with its own
  questions. The GAMEPLAY copies Ariet's Ladder Race (nexus/ladder-race.html);
  its PLC content does not. Ladder Race itself stays a standalone game in
  the Nexus and does not use this file.

  How a turn works (same rules for player and computer):
    - Roll the move die: that number = squares you can move.
    - Up to 3 tries, each a NEW question. Right = move the squares left.
      Each wrong answer takes 1 square off the roll. Roll reaches 0, or
      3 wrong answers = turn lost.
    - After every answer the reason is shown (the game's own picture).
    - Questions adapt: 3 right in a row = harder tier; 2 wrong at a tier =
      easier tier.
    - "Up" squares (ladders, or the theme's version) climb up; "down"
      squares (short circuits, slides...) drop you back. First to the
      finish wins.
  The computer: a MOVE die and a SKILL die. Skill 6 = 40% chance to answer
  right, 5 or 4 = 60%, 3 = 80%, 2 or 1 = a random chance (10-90%). Every
  3rd turn a WILD CARD: if the skill die is under 4 it re-rolls and gets
  +30% (max 95%). Each wrong try adds +20% for the next try. Its question
  is shown so the player can follow along and learn from it.
  Luck (dice, ladders) mixes with skill, so a struggling kid can still win.

  Depends on: citadel-core.css (look: [CSS-RACE]). citadel-questions.js is
              optional: CitadelRace.fromBank turns a bank question into a
              race question.
  Used by:    future games (none yet). Planned: hidden quests.

  Search these tags to jump to a section:
    [JS-RULES]    numbers for the rules (change here)
    [JS-OPTIONS]  what a game passes in
    [JS-BOARD]    drawing the board
    [JS-TURN]     the player's turn: roll, tries, answers
    [JS-ADAPT]    harder / easier questions
    [JS-CPU]      the computer's turn
    [JS-MOVE]     moving pieces, ups and downs, winning
    [JS-BANK]     fromBank: use a citadel-questions.js question

  A race question (what options.ask returns):
    { title,             short name shown above it (optional)
      text, say,         the question on screen / read out loud
      choices: [{ label, ok }],
      explain,           one sentence: why the answer is right
      draw(box, reveal)  optional: draws the picture into box; reveal = true
                         after answering, to SHOW why (like wires lighting up) }
*/
(function () {
  "use strict";

  /* [JS-RULES] */
  var RULES = {
    finish: 30, ups: { 3: 10, 8: 17, 14: 23, 21: 28 }, downs: { 16: 9, 24: 13, 29: 20 },
    maxTries: 3, streakUp: 3, missesDown: 2,
    wildEvery: 3, wildBonus: 0.30, retryBonus: 0.20, maxChance: 0.95
  };
  function skillChance(n) {
    if (n === 6) return { p: 0.40, txt: "40%" };
    if (n === 5 || n === 4) return { p: 0.60, txt: "60%" };
    if (n === 3) return { p: 0.80, txt: "80%" };
    var p = Math.round((0.1 + Math.random() * 0.8) * 100) / 100;
    return { p: p, txt: "random: " + Math.round(p * 100) + "%" };
  }

  /* [JS-OPTIONS]
     CitadelRace.start({
       mount: element,                  where the game is drawn
       playerName: "Nickname",
       ask: function (tier, who) {...}, returns a race question; who = "you" | "cpu"
       tiers: ["Starter", "Builder", ...],   player question tiers (1 = first)
       startTier: 1,
       cpuLevels: [{ id: "easy", label: "Easy", tier: 1 }, ...], cpuLevel: "easy",
       theme: { up: "Ladder", upEmoji: "🪜", down: "Short circuit", downEmoji: "⚡",
                finishEmoji: "🏁", cpuName: "Computer" },
       onAnswer: function ({ who, ok, tryNo, tier, question }) {},  after every answer
       onTier: function (tier) {}, onEnd: function ({ winner }) {},
       speak: function (text) {}, sound: function (kind) {},       optional
       timing: 1                        1 = normal speed; smaller = faster (tests)
     })  ->  { newGame(), setCpuLevel(id), state() } */
  var SVG_NS = "http://www.w3.org/2000/svg";

  function h(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function start(opt) {
    var theme = Object.assign({ up: "Ladder", upEmoji: "🪜", down: "Slide", downEmoji: "⚡", finishEmoji: "🏁", cpuName: "Computer" }, opt.theme || {});
    var tiers = opt.tiers || ["Starter", "Builder", "Thinker"];
    var cpuLevels = opt.cpuLevels || [{ id: "easy", label: "Easy", tier: 1 }];
    var cpuLevel = opt.cpuLevel || cpuLevels[0].id;
    var T = opt.timing == null ? 1 : opt.timing;
    var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
    var name = opt.playerName || "You";
    var noop = function () {};
    var speak = opt.speak || noop, sound = opt.sound || noop;
    var G;

    function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms * T); }); }
    function cpuLvl() { return cpuLevels.filter(function (l) { return l.id === cpuLevel; })[0] || cpuLevels[0]; }

    // Layout: chips + board on one side, the turn panel on the other.
    var root = h("div", "race");
    var boardCard = h("section", "race-card");
    boardCard.setAttribute("aria-label", "Game board");
    var chips = h("div", "race-chips");
    var chipYou = h("div", "race-chip you"), chipCpu = h("div", "race-chip cpu");
    chips.appendChild(chipYou); chips.appendChild(chipCpu);
    var board = h("div", "race-board");
    var legend = h("div", "race-legend");
    boardCard.appendChild(chips); boardCard.appendChild(board); boardCard.appendChild(legend);
    var panelCard = h("section", "race-card");
    panelCard.setAttribute("aria-live", "polite");
    var panel = h("div", "race-panel"), log = h("div", "race-log");
    var settings = h("div", "race-settings");
    var lvlLabel = h("label", null, "Computer level ");
    var lvlSel = h("select");
    cpuLevels.forEach(function (l) { var o = h("option", null, l.label); o.value = l.id; lvlSel.appendChild(o); });
    lvlSel.value = cpuLevel;
    lvlSel.addEventListener("change", function () { cpuLevel = lvlSel.value; addLog(theme.cpuName + " level is now " + cpuLvl().label + "."); });
    lvlLabel.appendChild(lvlSel);
    var newBtn = h("button", "btn ghost small", "New game");
    newBtn.type = "button";
    newBtn.addEventListener("click", function () { newGame(); });
    settings.appendChild(lvlLabel); settings.appendChild(newBtn);
    panelCard.appendChild(panel); panelCard.appendChild(log); panelCard.appendChild(settings);
    root.appendChild(boardCard); root.appendChild(panelCard);
    opt.mount.textContent = "";
    opt.mount.appendChild(root);

    function addLog(t) { log.insertBefore(h("div", null, t), log.firstChild); }

    function chipsDraw() {
      chipYou.textContent = name + " · square " + G.you;
      chipCpu.textContent = theme.cpuName + " · square " + G.cpu;
      chipYou.classList.toggle("turn", G.turn === "you" && !G.over);
      chipCpu.classList.toggle("turn", G.turn === "cpu" && !G.over);
      var left = RULES.wildEvery - (G.cpuTurns % RULES.wildEvery);
      legend.textContent = theme.upEmoji + " " + theme.up + ": climb up · " + theme.downEmoji + " " + theme.down +
        ": slide down · Finish on " + RULES.finish + " · Your level: " + tiers[G.tier - 1] +
        " · " + theme.cpuName + " wild card " + (left === 1 ? "next turn" : "in " + left + " turns");
    }

    /* [JS-BOARD] 6 x 5 board, numbered in a zigzag from bottom-left (1) to top-right (30). */
    var COLS = 6, ROWS = 5, S = 80;
    function sqXY(n) {
      var i = n - 1, row = Math.floor(i / COLS), col = row % 2 === 0 ? i % COLS : COLS - 1 - (i % COLS);
      return [col * S + S / 2, (ROWS - 1 - row) * S + S / 2];
    }
    function svgEl(tag, attrs, text) {
      var n = document.createElementNS(SVG_NS, tag);
      for (var k in attrs) n.setAttribute(k, attrs[k]);
      if (text != null) n.textContent = text;
      return n;
    }
    function drawBoard() {
      var svg = svgEl("svg", { viewBox: "0 0 " + COLS * S + " " + ROWS * S, role: "img",
        "aria-label": "Board: " + name + " on " + G.you + ", " + theme.cpuName + " on " + G.cpu });
      for (var n = 1; n <= RULES.finish; n++) {
        var p = sqXY(n);
        svg.appendChild(svgEl("rect", { x: p[0] - S / 2 + 2, y: p[1] - S / 2 + 2, width: S - 4, height: S - 4, rx: 10,
          class: "race-sq" + (n === RULES.finish ? " finish" : n % 2 ? "" : " alt") }));
        svg.appendChild(svgEl("text", { x: p[0] - S / 2 + 10, y: p[1] - S / 2 + 22, class: "race-num" }, String(n)));
      }
      var f = sqXY(RULES.finish);
      svg.appendChild(svgEl("text", { x: f[0], y: f[1] + 16, "text-anchor": "middle", "font-size": 26 }, theme.finishEmoji));
      Object.keys(RULES.ups).forEach(function (a) { // ladders: two rails and rungs
        var p1 = sqXY(+a), p2 = sqXY(RULES.ups[a]), dx = p2[0] - p1[0], dy = p2[1] - p1[1], len = Math.hypot(dx, dy), ox = -dy / len * 9, oy = dx / len * 9;
        var g = svgEl("g", { class: "race-up" });
        g.appendChild(svgEl("line", { x1: p1[0] + ox, y1: p1[1] + oy, x2: p2[0] + ox, y2: p2[1] + oy }));
        g.appendChild(svgEl("line", { x1: p1[0] - ox, y1: p1[1] - oy, x2: p2[0] - ox, y2: p2[1] - oy }));
        var k = Math.floor(len / 22);
        for (var i = 1; i < k; i++) { var t = i / k, cx = p1[0] + dx * t, cy = p1[1] + dy * t; g.appendChild(svgEl("line", { x1: cx + ox, y1: cy + oy, x2: cx - ox, y2: cy - oy })); }
        svg.appendChild(g);
      });
      Object.keys(RULES.downs).forEach(function (a) { // downs: a zigzag line with the theme's emoji
        var p1 = sqXY(+a), p2 = sqXY(RULES.downs[a]), len = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]), d = "M" + p1[0] + " " + p1[1];
        for (var i = 1; i <= 8; i++) {
          var t = i / 8, cx = p1[0] + (p2[0] - p1[0]) * t, cy = p1[1] + (p2[1] - p1[1]) * t, w = i === 8 ? 0 : (i % 2 ? 10 : -10);
          d += " L" + (cx + (-(p2[1] - p1[1]) / len) * w) + " " + (cy + ((p2[0] - p1[0]) / len) * w);
        }
        svg.appendChild(svgEl("path", { d: d, class: "race-down" }));
        svg.appendChild(svgEl("text", { x: p1[0], y: p1[1] + 9, "text-anchor": "middle", "font-size": 22 }, theme.downEmoji));
      });
      function piece(n, cls, off) { var p = sqXY(n); return svgEl("circle", { cx: p[0] + off, cy: p[1] + 12, r: 14, class: "race-piece " + cls }); }
      var same = G.cpu === G.you;
      svg.appendChild(piece(G.cpu, "cpu", same ? 10 : 0));
      svg.appendChild(piece(G.you, "you", same ? -10 : 0));
      board.textContent = "";
      board.appendChild(svg);
      chipsDraw();
    }

    // Dice: 3 x 3 grid of pips.
    var PIPS = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };
    function die(n, kind) {
      var d = h("div", "race-die " + (kind || ""));
      d.setAttribute("role", "img");
      d.setAttribute("aria-label", n ? "Dice shows " + n : "Dice not rolled yet");
      for (var i = 0; i < 9; i++) d.appendChild(h("span", n && PIPS[n].indexOf(i) >= 0 ? "v" : ""));
      return d;
    }
    async function roll(slot, kind) {
      if (!reduce) for (var i = 0; i < 8; i++) { slot.replaceChildren(die(1 + Math.floor(Math.random() * 6), kind + " rolling")); await sleep(70); }
      var n = 1 + Math.floor(Math.random() * 6);
      slot.replaceChildren(die(n, kind));
      sound("tap");
      return n;
    }
    function triesRow(wrong) {
      var row = h("div", "race-tries", "Tries: ");
      for (var i = 0; i < RULES.maxTries; i++) row.appendChild(h("i", i < wrong ? "used" : ""));
      return row;
    }

    /* Shows a question with its picture and answer buttons. */
    function showQuestion(box, q, clickable, onPick) {
      box.textContent = "";
      if (q.title) box.appendChild(h("h3", "race-qtitle", q.title));
      var pic = h("div", "race-pic");
      if (q.draw) { q.draw(pic, false); box.appendChild(pic); }
      box.appendChild(h("p", "race-q", q.text));
      var answers = h("div", "race-answers");
      q.choices.forEach(function (c, i) {
        var b = h("button", "race-ans", c.label);
        b.type = "button";
        b.disabled = !clickable;
        if (clickable) b.addEventListener("click", function () { onPick(i); });
        answers.appendChild(b);
      });
      box.appendChild(answers);
      return { pic: pic, answers: answers };
    }
    function reveal(parts, q, picked) {
      parts.answers.querySelectorAll(".race-ans").forEach(function (b, k) {
        b.disabled = true;
        if (q.choices[k].ok) b.classList.add("right"); else if (k === picked) b.classList.add("wrong");
      });
      if (q.draw) { parts.pic.textContent = ""; q.draw(parts.pic, true); }
    }

    function newGame() {
      G = { you: 1, cpu: 1, turn: "you", over: null, cpuTurns: 0, tier: Math.min(tiers.length, Math.max(1, opt.startTier || 1)), streak: 0, misses: 0 };
      log.textContent = "";
      addLog("New game! " + theme.cpuName + " level: " + cpuLvl().label + ".");
      drawBoard();
      yourTurn();
    }

    /* [JS-TURN] */
    function yourTurn() {
      if (G.over) return;
      G.turn = "you"; chipsDraw();
      panel.textContent = "";
      panel.appendChild(h("p", "race-status", name + ", your turn!"));
      panel.appendChild(h("p", "race-sub", "Roll the dice. Answer to move that many squares. Each wrong answer takes 1 square off, and you get up to 3 tries."));
      var row = h("div", "race-dicebox"), slot = h("div");
      slot.appendChild(die(0));
      var btn = h("button", "btn race-roll", "Roll");
      btn.type = "button";
      row.appendChild(slot); row.appendChild(btn);
      panel.appendChild(row);
      btn.addEventListener("click", async function () {
        btn.disabled = true;
        var n = await roll(slot, "");
        addLog(name + " rolled " + n + ".");
        tryTurn(n, n, 0);
      });
    }

    function tryTurn(dice, move, wrong) {
      var q = opt.ask(G.tier, "you");
      panel.textContent = "";
      var top = h("div", "race-dicebox"), slot = h("div");
      slot.appendChild(die(dice));
      var info = h("div");
      info.appendChild(h("p", "race-status", "Win to move " + move));
      info.appendChild(triesRow(wrong));
      top.appendChild(slot); top.appendChild(info);
      panel.appendChild(top);
      var box = h("div", "race-question");
      panel.appendChild(box);
      var fb = h("div", "race-feedback"), next = h("div", "race-next");
      var parts = showQuestion(box, q, true, function (i) {
        var ok = !!q.choices[i].ok;
        reveal(parts, q, i);
        var lvl = adapt(ok);
        opt.onAnswer && opt.onAnswer({ who: "you", ok: ok, tryNo: wrong + 1, tier: G.tier, question: q });
        fb.textContent = "";
        if (ok) {
          sound("right");
          fb.className = "race-feedback good";
          fb.appendChild(h("b", null, "Yes! ")); fb.appendChild(document.createTextNode(q.explain || ""));
          if (lvl) fb.appendChild(h("div", "race-lvl", lvl));
          speak("Yes! " + (q.explain || ""));
          addLog(name + " got it right and moves " + move + ".");
          var go = h("button", "btn", "Move " + move + (move === 1 ? " square" : " squares"));
          go.type = "button";
          go.addEventListener("click", async function () { go.disabled = true; await moveBy("you", move); endTurn(); });
          next.replaceChildren(go);
        } else {
          var w = wrong + 1, m = move - 1, lost = m <= 0 || w >= RULES.maxTries;
          fb.className = "race-feedback bad";
          fb.appendChild(h("b", null, "Not this time. ")); fb.appendChild(document.createTextNode(q.explain || ""));
          fb.appendChild(h("div", null, "−1 square: " + (lost ? (m <= 0 ? "your roll is used up, so you lose this turn." : "that was your 3rd try, so you lose this turn.") : "you can still move " + m + " if you get the next one.")));
          if (lvl) fb.appendChild(h("div", "race-lvl", lvl));
          speak(q.explain || "");
          var nb = h("button", "btn", lost ? theme.cpuName + "'s turn" : "Next try (" + (RULES.maxTries - w) + " left)");
          nb.type = "button";
          nb.addEventListener("click", function () { if (lost) { addLog(name + " lost the turn and stays on " + G.you + "."); endTurn(); } else tryTurn(dice, m, w); });
          next.replaceChildren(nb);
        }
      });
      speak(q.say || q.text);
      panel.appendChild(fb); panel.appendChild(next);
    }

    /* [JS-ADAPT] */
    function adapt(ok) {
      var msg = "";
      if (ok) {
        G.streak++;
        if (G.streak >= RULES.streakUp && G.tier < tiers.length) { G.tier++; G.streak = 0; G.misses = 0; msg = "⬆ Great streak! Questions move up to " + tiers[G.tier - 1] + "."; }
      } else {
        G.streak = 0; G.misses++;
        if (G.misses >= RULES.missesDown && G.tier > 1) { G.tier--; G.misses = 0; msg = "⬇ A little easier now: back to " + tiers[G.tier - 1] + ". Build back up!"; }
      }
      if (msg) { addLog(msg); opt.onTier && opt.onTier(G.tier); chipsDraw(); }
      return msg;
    }

    /* [JS-CPU] */
    async function cpuTurn() {
      G.turn = "cpu"; G.cpuTurns++;
      var wild = G.cpuTurns % RULES.wildEvery === 0, lv = cpuLvl();
      chipsDraw();
      panel.textContent = "";
      panel.appendChild(h("p", "race-status", theme.cpuName + "'s turn"));
      var row = h("div", "race-dicebox"), mvSlot = h("div"), skSlot = h("div"), info = h("div");
      mvSlot.appendChild(die(0, "cpu")); skSlot.appendChild(die(0, "skill"));
      var c1 = h("div", "race-dcol"), c2 = h("div", "race-dcol");
      c1.appendChild(mvSlot); c1.appendChild(h("small", null, "Move"));
      c2.appendChild(skSlot); c2.appendChild(h("small", null, "Skill"));
      var chanceEl = h("div", "race-chance", "Chance: ?"), tries = triesRow(0);
      info.appendChild(chanceEl); info.appendChild(tries);
      if (wild) info.appendChild(h("div", "race-wild", "🃏 Wild card turn!"));
      row.appendChild(c1); row.appendChild(c2); row.appendChild(info);
      panel.appendChild(row);
      var msg = h("p", "race-sub", "Rolling…");
      panel.appendChild(msg);
      var box = h("div", "race-question"); box.hidden = true;
      var fb = h("div", "race-feedback"), next = h("div", "race-next");
      panel.appendChild(box); panel.appendChild(fb); panel.appendChild(next);
      await sleep(400);
      var mv = await roll(mvSlot, "cpu");
      var s = await roll(skSlot, "skill"), ch = skillChance(s), p = ch.p;
      chanceEl.textContent = "Chance: " + ch.txt;
      msg.textContent = "Move die: " + mv + ". Skill die: " + s + " → " + ch.txt + " chance on the first try.";
      if (wild) {
        await sleep(900);
        if (s < 4) {
          msg.textContent = "Wild card! Skill die was " + s + " (under 4), so it re-rolls and gets +30%.";
          await sleep(900);
          s = await roll(skSlot, "skill");
          var c3 = skillChance(s);
          p = Math.min(RULES.maxChance, c3.p + RULES.wildBonus);
          chanceEl.textContent = "Chance: " + Math.round(p * 100) + "% (wild)";
          msg.textContent = "New skill die: " + s + " → " + c3.txt + " + 30% = " + Math.round(p * 100) + "%.";
          addLog(theme.cpuName + " used its wild card: chance " + Math.round(p * 100) + "%.");
        } else msg.textContent += " Wild card not needed (skill die is 4 or more).";
      }
      await sleep(900);
      var wrong = 0, solved = false;
      while (!solved && wrong < RULES.maxTries && mv > 0) {
        var q = opt.ask(lv.tier, "cpu");
        box.hidden = false;
        var parts = showQuestion(box, q, false);
        box.insertBefore(h("h3", "race-qtitle", theme.cpuName + "'s try " + (wrong + 1)), box.firstChild);
        chanceEl.textContent = "Chance: " + Math.round(p * 100) + "%";
        msg.textContent = "Try " + (wrong + 1) + ": the " + theme.cpuName.toLowerCase() + " is thinking… can you solve it too?";
        fb.textContent = ""; fb.className = "race-feedback";
        await sleep(2000);
        var right = Math.random() < p, okIdx = q.choices.findIndex(function (c) { return c.ok; });
        var wrongIdx = q.choices.findIndex(function (c) { return !c.ok; });
        var picked = right ? okIdx : wrongIdx;
        reveal(parts, q, picked);
        opt.onAnswer && opt.onAnswer({ who: "cpu", ok: right, tryNo: wrong + 1, tier: lv.tier, question: q });
        if (right) {
          solved = true;
          fb.className = "race-feedback good";
          fb.textContent = theme.cpuName + " got it right. " + (q.explain || "");
          addLog(theme.cpuName + " solved it on try " + (wrong + 1) + " and moves " + mv + ".");
          msg.textContent = "Right answer! Moving " + mv + ".";
          await sleep(1300);
          await moveBy("cpu", mv);
        } else {
          wrong++; mv--; p = Math.min(RULES.maxChance, p + RULES.retryBonus);
          tries.querySelectorAll("i")[wrong - 1].classList.add("used");
          var lost = mv <= 0 || wrong >= RULES.maxTries;
          fb.className = "race-feedback bad";
          fb.textContent = theme.cpuName + " got it wrong! " + (q.explain || "") + " −1 square. " +
            (lost ? "It loses this turn." : "It can still move " + mv + ", and its chance goes up to " + Math.round(p * 100) + "%.");
          msg.textContent = lost ? "The " + theme.cpuName.toLowerCase() + " loses its turn." : "Next try in a moment…";
          if (lost) addLog(theme.cpuName + " lost its turn and stays on " + G.cpu + ".");
          else await sleep(2000);
        }
      }
      if (G.over) return;
      var go = h("button", "btn", name + "'s turn →");
      go.type = "button";
      go.addEventListener("click", function () { endTurn(); });
      next.replaceChildren(go);
    }

    /* [JS-MOVE] One square at a time, then an up or a down. Reaching the finish wins. */
    async function moveBy(who, n) {
      for (var k = 0; k < n; k++) {
        G[who] = Math.min(RULES.finish, G[who] + 1);
        drawBoard();
        await sleep(reduce ? 60 : 220);
        if (G[who] === RULES.finish) break;
      }
      var at = G[who], label = who === "you" ? name : theme.cpuName;
      if (RULES.ups[at]) { await sleep(250); G[who] = RULES.ups[at]; addLog(label + " found a " + theme.up.toLowerCase() + ": " + at + " → " + G[who] + "! " + theme.upEmoji); }
      else if (RULES.downs[at]) { await sleep(250); G[who] = RULES.downs[at]; addLog(label + " hit a " + theme.down.toLowerCase() + ": " + at + " → " + G[who] + ". " + theme.downEmoji); }
      drawBoard();
      if (G[who] >= RULES.finish) finish(who);
    }

    function finish(who) {
      G.over = who;
      chipsDraw();
      var youWon = who === "you";
      addLog((youWon ? name : theme.cpuName) + " reached " + RULES.finish + " and wins!");
      panel.textContent = "";
      var win = h("div", "race-win");
      win.appendChild(h("div", "race-big", youWon ? name + " wins! 🏆" : theme.cpuName + " wins!"));
      win.appendChild(h("p", "race-sub", youWon ? "You out-thought the " + theme.cpuName.toLowerCase() + "." : "So close! Every right answer made you stronger."));
      var again = h("button", "btn", "Play again");
      again.type = "button";
      again.addEventListener("click", function () { newGame(); });
      win.appendChild(again);
      panel.appendChild(win);
      sound(youWon ? "coin" : "tap");
      speak(youWon ? "You win!" : theme.cpuName + " wins this time.");
      opt.onEnd && opt.onEnd({ winner: who, you: G.you, cpu: G.cpu });
    }

    function endTurn() {
      if (G.over) return;
      if (G.turn === "you") cpuTurn(); else yourTurn();
    }

    newGame();
    return {
      newGame: newGame,
      setCpuLevel: function (id) { cpuLevel = id; lvlSel.value = id; },
      state: function () { return JSON.parse(JSON.stringify(G)); }
    };
  }

  /* [JS-BANK] Turns a citadel-questions.js question into a race question:
     the picture is drawn before answering, and the step-by-step
     explanation is shown after (reveal). */
  function fromBank(q) {
    var Q = window.CitadelQuestions;
    return {
      title: q.areaLabel, text: q.text, say: q.say, explain: q.why,
      choices: q.choices.map(function (c) { return { label: c.label, ok: String(c.value) === String(q.answer) }; }),
      draw: function (box, revealNow) {
        if (revealNow) Q.explain(q, box, true);
        else box.appendChild(Q.draw(q));
      },
      bank: q
    };
  }

  window.CitadelRace = { start: start, fromBank: fromBank, RULES: RULES, skillChance: skillChance };
})();
