/*
  SolidMind Citadel - shared question bank and drawings (citadel-questions.js)
  ------------------------------------------------------------
  Purpose: the TEST QUESTION BANK. Each game adds "question makers"
  (generators) here, one per skill area and level. A maker builds a brand
  new question every time it is called, with new numbers, so nothing can
  be learned by heart. Games and rank tests both use the bank:
    - a game asks for questions in its own theme (Pizza Party: pizza);
    - a rank test (later, when 2-3 games exist) asks for the SAME skill and
      level but in a DIFFERENT theme (cookies, apples, pie, cake...), with
      different wording. A test never shows a question exactly as the
      hero saw it in a game, because the game's own theme is never used
      in tests (see CitadelQuestions.forTest).
  This file also draws the pictures (slices, kids, pizzas cut into parts)
  and the step-by-step "here's why" explanations for wrong answers, so a
  test page can show questions exactly like the games do.

  Depends on: nothing (citadel-core.js is not needed here). subjects.js is
              only needed for areasForSubjects (rank tests use Required
              subjects only).
  Used by:    games/*-questions.js (they register makers), games/*.html,
              and later test.html.

  Search these tags to jump to a section:
    [JS-THEMES]    pizza, pie, cake, cookies, apples (things and people)
    [JS-BANK]      register makers; get a question for a game or a test
    [JS-HELPERS]   random numbers, shuffled answer choices, fractions
    [JS-DRAW]      pictures for a question
    [JS-EXPLAIN]   step-by-step explanation after a wrong answer

  A question looks like:
    { area, areaLabel, level, theme,
      text,      words shown on screen (short at Level 1)
      say,       words read out loud (may be longer than text)
      visual,    what picture to draw (see [JS-DRAW])
      choices,   [{ label, say, value }] big tap buttons
      answer,    the value of the right choice
      why,       one short sentence explaining the answer
      explain,   what to draw step by step when the answer was wrong
      sig }      a fingerprint, so the same question isn't asked twice in a row
*/
(function () {
  "use strict";

  /* ---------------------------------------------------------------
     [JS-THEMES] The "things" a question can be about.
     forFractions: true means the thing can be cut into equal parts
     (a pizza, a pie, a cake), so fraction questions can use it.
     --------------------------------------------------------------- */
  var THEMES = {
    pizza: { id: "pizza", whole: "pizza", wholes: "pizzas", piece: "slice", pieces: "slices",
      pieceEmoji: "🍕", person: "kid", people: "kids",
      personEmojis: ["🧒", "👧", "👦"],
      fill: "#F2B33D", crust: "#C47A2C", dot: "#C0392B", topping: "pepperoni", forFractions: true },
    pie: { id: "pie", whole: "pie", wholes: "pies", piece: "piece", pieces: "pieces",
      pieceEmoji: "🥧", person: "friend", people: "friends",
      personEmojis: ["🙂", "😀", "😊"],
      fill: "#D9934A", crust: "#9C5B22", dot: "#7A2E8F", topping: "berries", forFractions: true },
    cake: { id: "cake", whole: "cake", wholes: "cakes", piece: "piece", pieces: "pieces",
      pieceEmoji: "🍰", person: "teddy bear", people: "teddy bears",
      personEmojis: ["🧸"],
      fill: "#F4B6C8", crust: "#B5657E", dot: "#FFFFFF", topping: "sprinkles", forFractions: true },
    cookies: { id: "cookies", whole: null, piece: "cookie", pieces: "cookies",
      pieceEmoji: "🍪", person: "child", people: "children",
      personEmojis: ["🧒", "👧", "👦"], forFractions: false },
    apples: { id: "apples", whole: null, piece: "apple", pieces: "apples",
      pieceEmoji: "🍎", person: "pony", people: "ponies",
      personEmojis: ["🐴"], forFractions: false }
  };

  /* ---------------------------------------------------------------
     [JS-BANK]
     A game registers a maker like this:
       CitadelQuestions.register({
         game: "pizza-party", area: "count-1-10", areaLabel: "Counting slices",
         level: 1, fractions: false,
         make: function (theme, R) { ...return a question... } });
     --------------------------------------------------------------- */
  var makers = [];

  function register(m) {
    if (!m || !m.area || !m.level || typeof m.make !== "function") throw new Error("Bad question maker");
    makers.push(m);
  }

  function find(area, level) {
    return makers.filter(function (m) { return m.area === area && m.level === level; });
  }

  // Skill areas for a level, optionally only one game's: [{area, areaLabel, game}]
  function areas(level, game) {
    var seen = {}, out = [];
    makers.forEach(function (m) {
      if (m.level !== level || (game && m.game !== game) || seen[m.area]) return;
      seen[m.area] = true;
      out.push({ area: m.area, areaLabel: m.areaLabel, game: m.game });
    });
    return out;
  }

  // v0.6.0: skill areas for a level that belong to the given subjects only
  // (e.g. a hero's REQUIRED core subjects, from Citadel.requiredSubjects).
  // Rank tests must use this so Optional, Off and Nexus subjects never
  // appear on a rank test. The subject of an area is its game's subject in
  // subjects.js; without subjects.js nothing matches.
  function areasForSubjects(level, subjectIds) {
    var S = window.CitadelSubjects;
    if (!S || !Array.isArray(subjectIds)) return [];
    return areas(level).filter(function (x) { return subjectIds.indexOf(S.gameSubject(x.game)) >= 0; });
  }

  function build(m, theme, avoidSig) {
    for (var tries = 0; tries < 12; tries++) {
      var q = m.make(theme, R);
      q.area = m.area; q.areaLabel = m.areaLabel; q.level = m.level; q.theme = theme.id;
      if (!q.say) q.say = q.text;
      if (!q.sig || q.sig !== avoidSig) return q;
    }
    return q;
  }

  // A question for a GAME, in the game's own theme.
  function forGame(area, level, themeId, avoidSig) {
    var list = find(area, level);
    if (!list.length) throw new Error("No questions for " + area + " level " + level);
    return build(R.pick(list), THEMES[themeId] || THEMES.pizza, avoidSig);
  }

  // A question for a RANK TEST: same skill and level, but never in a theme
  // any game uses for that skill, so it can't look like a game question.
  function forTest(area, level) {
    var list = find(area, level);
    if (!list.length) throw new Error("No questions for " + area + " level " + level);
    var m = R.pick(list);
    var gameThemes = makers.filter(function (x) { return x.area === area; })
      .map(function (x) { return x.gameTheme || "pizza"; });
    var options = Object.keys(THEMES).filter(function (id) {
      return gameThemes.indexOf(id) < 0 && (!m.fractions || THEMES[id].forFractions);
    });
    return build(m, THEMES[R.pick(options)]);
  }

  /* ---------------------------------------------------------------
     [JS-HELPERS]
     --------------------------------------------------------------- */
  var R = {
    int: function (lo, hi) { return lo + Math.floor(Math.random() * (hi - lo + 1)); },
    pick: function (list) { return list[Math.floor(Math.random() * list.length)]; },
    shuffle: function (list) {
      var a = list.slice();
      for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
      return a;
    },
    // Number choices: the answer plus nearby wrong answers, all different, none below "min".
    numberChoices: function (answer, count, min, max) {
      var set = [answer], spread = 1;
      while (set.length < count && spread < 30) {
        [answer - spread, answer + spread].forEach(function (n) {
          if (set.length < count && n >= min && n <= max && set.indexOf(n) < 0 && Math.random() < 0.8) set.push(n);
        });
        spread++;
      }
      for (var n = min; set.length < count && n <= max; n++) if (set.indexOf(n) < 0) set.push(n);
      return R.shuffle(set).map(function (n) { return { label: String(n), say: String(n), value: n }; });
    },
    plural: function (n, one, many) { return n + " " + (n === 1 ? one : many); },
    // "3/8" read out loud as "3 eighths"
    fractionWords: function (n, d) {
      var names = { 2: ["half", "halves"], 3: ["third", "thirds"], 4: ["quarter", "quarters"],
        5: ["fifth", "fifths"], 6: ["sixth", "sixths"], 8: ["eighth", "eighths"], 10: ["tenth", "tenths"], 12: ["twelfth", "twelfths"] };
      var w = names[d] || [d + "th", d + "ths"];
      return n + " " + (n === 1 ? w[0] : w[1]);
    },
    gcd: function (a, b) { return b ? R.gcd(b, a % b) : a; }
  };

  /* ---------------------------------------------------------------
     [JS-DRAW] Pictures. Each returns a DOM element.
     visual kinds:
       { kind: "pieces", n }                       a row of pieces
       { kind: "addtake", a, b, op: "+" | "-" }    two groups, or some crossed out
       { kind: "people-pieces", pieces, people }   pieces above, people below
       { kind: "circle", parts, shaded }           one pizza cut into equal parts
       { kind: "two-circles", left, right }        two pizzas side by side
     Every picture gets a text description for screen readers.
     --------------------------------------------------------------- */
  var SVG_NS = "http://www.w3.org/2000/svg";

  function h(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function pieceRow(n, theme, cls) {
    var row = h("div", "q-row " + (cls || ""));
    for (var i = 0; i < n; i++) {
      var p = h("span", "q-piece", theme.pieceEmoji);
      p.setAttribute("aria-hidden", "true");
      row.appendChild(p);
    }
    return row;
  }

  function peopleRow(n, theme) {
    var row = h("div", "q-row q-people");
    for (var i = 0; i < n; i++) {
      var p = h("span", "q-person", theme.personEmojis[i % theme.personEmojis.length]);
      p.setAttribute("aria-hidden", "true");
      row.appendChild(p);
    }
    return row;
  }

  // A round pizza/pie/cake cut into "parts" equal slices, "shaded" of them topped.
  function circle(parts, shaded, theme, size, labels) {
    var s = size || 150, r = s / 2 - 6, c = s / 2;
    var svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("viewBox", "0 0 " + s + " " + s);
    svg.setAttribute("width", s); svg.setAttribute("height", s);
    svg.setAttribute("class", "q-circle");
    svg.setAttribute("aria-hidden", "true");
    for (var i = 0; i < parts; i++) {
      var a0 = (i / parts) * 2 * Math.PI - Math.PI / 2, a1 = ((i + 1) / parts) * 2 * Math.PI - Math.PI / 2;
      var path = document.createElementNS(SVG_NS, "path");
      var big = parts === 1 ? 1 : 0;
      var d = parts === 1
        ? "M" + c + " " + (c - r) + " A" + r + " " + r + " 0 1 1 " + (c - 0.01) + " " + (c - r) + " Z"
        : "M" + c + " " + c + " L" + (c + r * Math.cos(a0)) + " " + (c + r * Math.sin(a0)) +
          " A" + r + " " + r + " 0 " + big + " 1 " + (c + r * Math.cos(a1)) + " " + (c + r * Math.sin(a1)) + " Z";
      path.setAttribute("d", d);
      path.setAttribute("fill", i < shaded ? theme.fill : "#F7EBD3");
      path.setAttribute("stroke", theme.crust);
      path.setAttribute("stroke-width", "3");
      path.setAttribute("class", "q-slice" + (i < shaded ? " on" : ""));
      svg.appendChild(path);
      var mid = (a0 + a1) / 2;
      if (i < shaded) { // a topping dot on each topped slice
        var dot = document.createElementNS(SVG_NS, "circle");
        dot.setAttribute("cx", c + r * 0.62 * Math.cos(mid)); dot.setAttribute("cy", c + r * 0.62 * Math.sin(mid));
        dot.setAttribute("r", Math.max(3, r * 0.1)); dot.setAttribute("fill", theme.dot);
        svg.appendChild(dot);
      }
      if (labels) { // numbers 1, 2, 3... used in explanations
        var t = document.createElementNS(SVG_NS, "text");
        t.setAttribute("x", c + r * 0.35 * Math.cos(mid)); t.setAttribute("y", c + r * 0.35 * Math.sin(mid) + 5);
        t.setAttribute("text-anchor", "middle"); t.setAttribute("font-size", Math.max(11, r * 0.22));
        t.setAttribute("font-weight", "700"); t.setAttribute("fill", "#2B1A06");
        t.setAttribute("class", "step");
        t.textContent = i + 1;
        svg.appendChild(t);
      }
    }
    return svg;
  }

  function described(node, text) {
    var wrap = h("figure", "q-visual");
    wrap.setAttribute("role", "img");
    wrap.setAttribute("aria-label", text);
    wrap.appendChild(node);
    return wrap;
  }

  function draw(q) {
    var v = q.visual, t = THEMES[q.theme] || THEMES.pizza;
    switch (v.kind) {
      case "pieces":
        return described(pieceRow(v.n, t, "big"), R.plural(v.n, t.piece, t.pieces));
      case "addtake": {
        var box = h("div", "q-addtake");
        if (v.op === "+") {
          box.appendChild(pieceRow(v.a, t, "big"));
          box.appendChild(h("span", "q-op", "+"));
          box.appendChild(pieceRow(v.b, t, "big"));
          return described(box, R.plural(v.a, t.piece, t.pieces) + " and " + R.plural(v.b, t.piece, t.pieces) + " more");
        }
        var row = pieceRow(v.a, t, "big");
        for (var i = v.a - v.b; i < v.a; i++) row.children[i].classList.add("gone");
        box.appendChild(row);
        return described(box, R.plural(v.a, t.piece, t.pieces) + ", " + v.b + " eaten");
      }
      case "people-pieces": {
        var b2 = h("div", "q-stack");
        b2.appendChild(pieceRow(v.pieces, t, ""));
        b2.appendChild(peopleRow(v.people, t));
        return described(b2, R.plural(v.pieces, t.piece, t.pieces) + " and " + R.plural(v.people, t.person, t.people));
      }
      case "circle":
        return described(circle(v.parts, v.shaded, t, 170),
          "A " + t.whole + " cut into " + v.parts + " equal " + t.pieces + ", " + v.shaded + " with topping");
      case "two-circles": {
        var pair = h("div", "q-pair");
        [["left", "Left"], ["right", "Right"]].forEach(function (side) {
          var f = v[side[0]], col = h("div", "q-col");
          col.appendChild(circle(f.parts, f.shaded, t, 130));
          col.appendChild(h("span", "q-tag", side[1]));
          pair.appendChild(col);
        });
        return described(pair, "Left " + t.whole + ": " + v.left.shaded + " of " + v.left.parts + " parts. Right " + t.whole + ": " + v.right.shaded + " of " + v.right.parts + " parts.");
      }
    }
    return h("div");
  }

  /* ---------------------------------------------------------------
     [JS-EXPLAIN] After a wrong answer: show WHY, one step at a time
     (slices counted one by one, handed out one by one...).
     Elements with class "step" appear one after another. With
     "reduce motion" on, everything shows at once.
     explain kinds:
       { kind: "count", n }                         number each piece
       { kind: "add", a, b } / { kind: "take", a, b }
       { kind: "match", pieces, people }            one piece per person
       { kind: "deal", pieces, people }             hand out round and round
       { kind: "groups", n, groups }                split into equal groups
       { kind: "parts", parts, shaded }             number the parts of a pizza
       { kind: "compare", left, right }             two pizzas, bigger one marked
     Returns how long the animation takes (ms).
     --------------------------------------------------------------- */
  function explain(q, box, reduceMotion) {
    var e = q.explain, t = THEMES[q.theme] || THEMES.pizza;
    box.textContent = "";
    var stage = h("div", "q-explain");
    box.appendChild(stage);

    function numbered(n, startAt, cls) {
      var row = h("div", "q-row " + (cls || ""));
      for (var i = 0; i < n; i++) {
        var p = h("span", "q-piece");
        p.appendChild(h("span", "q-emoji", t.pieceEmoji));
        var num = h("span", "q-num step", String(startAt + i));
        p.appendChild(num);
        row.appendChild(p);
      }
      return row;
    }

    function plates(people, pieces) {
      // Deal pieces round and round: piece k goes to person k % people.
      var row = h("div", "q-plates"), cols = [];
      for (var p = 0; p < people; p++) {
        var col = h("div", "q-plate");
        col.appendChild(h("span", "q-person", t.personEmojis[p % t.personEmojis.length]));
        var pile = h("div", "q-pile");
        col.appendChild(pile);
        row.appendChild(col);
        cols.push(pile);
      }
      var order = [];
      for (var k = 0; k < pieces; k++) {
        var s = h("span", "q-piece small step", t.pieceEmoji);
        order.push({ el: s, to: k < Math.floor(pieces / people) * people ? cols[k % people] : null });
      }
      var left = h("div", "q-row q-left");
      order.forEach(function (o) { (o.to || left).appendChild(o.el); });
      return { row: row, left: left, leftCount: pieces % people };
    }

    switch (e.kind) {
      case "count":
        stage.appendChild(numbered(e.n, 1, "big"));
        break;
      case "add":
        stage.appendChild(numbered(e.a, 1, "big"));
        stage.appendChild(h("span", "q-op", "+"));
        stage.appendChild(numbered(e.b, e.a + 1, "big"));
        break;
      case "take": {
        var row = h("div", "q-row big");
        for (var i = 0; i < e.a; i++) {
          var p = h("span", "q-piece");
          p.appendChild(h("span", "q-emoji", t.pieceEmoji));
          if (i >= e.a - e.b) { p.classList.add("step"); p.classList.add("fade-out"); }
          else p.appendChild(h("span", "q-num step", String(i + 1)));
          row.appendChild(p);
        }
        stage.appendChild(row);
        break;
      }
      case "match": {
        var grid = h("div", "q-match");
        var n = Math.max(e.pieces, e.people);
        for (var m = 0; m < n; m++) {
          var pair = h("div", "q-pairup step");
          pair.appendChild(h("span", "q-piece" + (m < e.pieces ? "" : " none"), m < e.pieces ? t.pieceEmoji : "✖"));
          pair.appendChild(h("span", "q-person" + (m < e.people ? "" : " none"), m < e.people ? t.personEmojis[m % t.personEmojis.length] : "➕"));
          grid.appendChild(pair);
        }
        stage.appendChild(grid);
        break;
      }
      case "deal": {
        var d = plates(e.people, e.pieces);
        stage.appendChild(d.row);
        if (d.leftCount) { stage.appendChild(h("p", "q-note", "Left over:")); stage.appendChild(d.left); }
        break;
      }
      case "groups": {
        var dg = plates(e.groups, e.n);
        dg.row.querySelectorAll(".q-person").forEach(function (x, i2) { x.textContent = "🍽️"; x.setAttribute("aria-hidden", "true"); });
        stage.appendChild(dg.row);
        break;
      }
      case "parts":
        stage.appendChild(circle(e.parts, e.shaded, t, 190, true));
        break;
      case "compare": {
        var pr = h("div", "q-pair");
        [e.left, e.right].forEach(function (f, idx) {
          var col = h("div", "q-col" + (f.bigger ? " bigger step" : ""));
          col.appendChild(circle(f.parts, f.shaded, t, 130));
          col.appendChild(h("span", "q-tag", (idx ? "Right: " : "Left: ") + f.shaded + "/" + f.parts));
          pr.appendChild(col);
        });
        stage.appendChild(pr);
        break;
      }
    }
    if (q.why) stage.appendChild(h("p", "q-why step", q.why));

    var steps = stage.querySelectorAll(".step");
    if (reduceMotion) { steps.forEach(function (s) { s.classList.add("shown"); }); return 0; }
    var gap = steps.length > 14 ? 260 : 420;
    steps.forEach(function (s, i3) { setTimeout(function () { s.classList.add("shown"); }, 300 + i3 * gap); });
    return 300 + steps.length * gap;
  }

  window.CitadelQuestions = {
    THEMES: THEMES, R: R,
    register: register, areas: areas, areasForSubjects: areasForSubjects, forGame: forGame, forTest: forTest,
    draw: draw, explain: explain, circle: circle
  };
})();
