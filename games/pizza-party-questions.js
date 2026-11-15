/*
  SolidMind Citadel - Pizza Party question makers (games/pizza-party-questions.js)
  ------------------------------------------------------------
  Purpose: adds Pizza Party's questions to the shared test question bank.
  Each maker builds a NEW question every time (new numbers), for one
  skill area at one level. The words come from the theme, so the same
  maker asks about pizza slices and kids in the game, and about cookies,
  apples, pie or cake (and friends, ponies, teddy bears) in rank tests.

  Depends on: ../citadel-questions.js (must be loaded first)
  Used by:    games/pizza-party.html, and later test.html

  Search these tags to jump to a section:
    [Q-LEVEL1]  Counting slices, More or fewer, Adding and taking away slices
    [Q-LEVEL2]  Sharing equally, Halves and quarters
    [Q-LEVEL3]  Sharing with leftovers, Fractions of a pizza, Comparing fractions

  Skill area ids are general (not "pizza") on purpose: another game may
  practise the same skill later and add its own makers under the same id.
*/
(function () {
  "use strict";
  var Q = window.CitadelQuestions, R = Q.R;
  var GAME = "pizza-party";
  function reg(area, areaLabel, level, make, fractions) {
    Q.register({ game: GAME, gameTheme: "pizza", area: area, areaLabel: areaLabel, level: level, make: make, fractions: !!fractions });
  }
  function P(n, t) { return R.plural(n, t.piece, t.pieces); }
  function K(n, t) { return R.plural(n, t.person, t.people); }

  /* =============================================================
     [Q-LEVEL1] Very little reading. Pictures do the work, and the
     longer "say" sentence is what gets read out loud.
     ============================================================= */

  // Counting slices (1-10)
  reg("count-1-10", "Counting slices", 1, function (t) {
    var n = R.int(1, 10);
    return {
      text: "How many " + t.pieces + "?",
      say: "Count the " + t.pieces + ". How many are there?",
      visual: { kind: "pieces", n: n },
      choices: R.numberChoices(n, 3, 1, 12), answer: n,
      why: "Count them one by one: there " + (n === 1 ? "is 1." : "are " + n + "."),
      explain: { kind: "count", n: n }, sig: "c" + n
    };
  });

  // More or fewer: enough for everyone? how many get none? how many left over?
  reg("more-fewer", "More or fewer", 1, function (t) {
    var people = R.int(2, 9), pieces;
    do { pieces = R.int(2, 10); } while (pieces === people && Math.random() < 0.7);
    var kind = R.pick(["enough", pieces < people ? "none" : "left"]);
    var base = { visual: { kind: "people-pieces", pieces: pieces, people: people },
      explain: { kind: "match", pieces: pieces, people: people } };
    var giveOne = "Give one " + t.piece + " to each " + t.person + ". ";
    if (kind === "enough") {
      var yes = pieces >= people;
      base.text = "Enough for every " + t.person + "?";
      base.say = "There are " + P(pieces, t) + " and " + K(people, t) + ". Is there one " + t.piece + " for every " + t.person + "?";
      base.choices = [{ label: "👍 Yes", say: "Yes", value: "yes" }, { label: "👎 No", say: "No", value: "no" }];
      base.answer = yes ? "yes" : "no";
      base.why = giveOne + (yes ? "Everyone gets one!" : (people - pieces) + " " + (people - pieces === 1 ? t.person + " gets" : t.people + " get") + " none.");
      base.sig = "e" + pieces + "-" + people;
    } else if (kind === "none") {
      base.text = "How many " + t.people + " get none?";
      base.say = "There are " + P(pieces, t) + " and " + K(people, t) + ". Each " + t.person + " gets one. How many " + t.people + " get none?";
      base.choices = R.numberChoices(people - pieces, 3, 0, 10); base.answer = people - pieces;
      base.why = giveOne + (people - pieces) + " get none.";
      base.sig = "n" + pieces + "-" + people;
    } else {
      base.text = "How many " + t.pieces + " are left?";
      base.say = "There are " + P(pieces, t) + " and " + K(people, t) + ". Each " + t.person + " gets one. How many " + t.pieces + " are left over?";
      base.choices = R.numberChoices(pieces - people, 3, 0, 10); base.answer = pieces - people;
      base.why = giveOne + (pieces - people) + " " + (pieces - people === 1 ? t.piece + " is" : t.pieces + " are") + " left over.";
      base.sig = "l" + pieces + "-" + people;
    }
    return base;
  });

  // Adding and taking away slices (within 10)
  reg("add-take-10", "Adding and taking away slices", 1, function (t) {
    if (Math.random() < 0.5) {
      var a = R.int(1, 8), b = R.int(1, 10 - a);
      return {
        text: a + " + " + b + " = ?",
        say: "There are " + P(a, t) + ". " + b + " more come. How many " + t.pieces + " in all?",
        visual: { kind: "addtake", a: a, b: b, op: "+" },
        choices: R.numberChoices(a + b, 3, 1, 12), answer: a + b,
        why: "Count them all: " + a + " and " + b + " more make " + (a + b) + ".",
        explain: { kind: "add", a: a, b: b }, sig: "a" + a + "+" + b
      };
    }
    var c = R.int(3, 10), d = R.int(1, c - 1);
    return {
      text: c + " − " + d + " = ?",
      say: "There are " + P(c, t) + ". " + d + " " + (d === 1 ? "is" : "are") + " eaten. How many are left?",
      visual: { kind: "addtake", a: c, b: d, op: "-" },
      choices: R.numberChoices(c - d, 3, 0, 10), answer: c - d,
      why: c + " take away " + d + " leaves " + (c - d) + ".",
      explain: { kind: "take", a: c, b: d }, sig: "t" + c + "-" + d
    };
  });

  /* =============================================================
     [Q-LEVEL2]
     ============================================================= */

  // Sharing equally (no leftovers), e.g. 12 slices among 4 kids
  reg("share-equal", "Sharing equally", 2, function (t) {
    var people = R.int(2, 5), each = R.int(2, 5), pieces = people * each;
    return {
      text: "Share " + pieces + " " + t.pieces + " fairly with " + people + " " + t.people + ". How many each?",
      say: "Share " + P(pieces, t) + " fairly with " + K(people, t) + ". How many " + t.pieces + " does each " + t.person + " get?",
      visual: { kind: "people-pieces", pieces: pieces, people: people },
      choices: R.numberChoices(each, 4, 1, 10), answer: each,
      why: "Hand them out one at a time, round and round: each " + t.person + " gets " + each + ".",
      explain: { kind: "deal", pieces: pieces, people: people }, sig: "s" + pieces + "/" + people
    };
  });

  // Halves and quarters: of a whole pizza, or of a number of slices
  reg("halves-quarters", "Halves and quarters", 2, function (t) {
    if (Math.random() < 0.5) {
      var parts = R.pick([2, 4]), shaded = parts === 2 ? 1 : R.int(1, 3);
      var answer = parts === 2 || shaded === 2 ? "1/2" : shaded + "/4";
      var words = { "1/2": "one half", "1/4": "one quarter", "3/4": "three quarters" };
      var opts = ["1/2", "1/4", "3/4", "1/3"].map(function (f) { return { label: f, say: words[f] || "one third", value: f }; });
      return {
        text: "What part has " + t.topping + "?",
        say: "This " + t.whole + " is cut into " + parts + " equal parts. What part has " + t.topping + " on it?",
        visual: { kind: "circle", parts: parts, shaded: shaded },
        choices: R.shuffle(opts), answer: answer,
        why: shaded + " of " + parts + " equal parts is " + words[answer] + (parts === 4 && shaded === 2 ? " (2 quarters make a half)." : "."),
        explain: { kind: "parts", parts: parts, shaded: shaded }, sig: "f" + shaded + "/" + parts
      };
    }
    var half = Math.random() < 0.5;
    var n = half ? 2 * R.int(1, 6) : 4 * R.int(1, 4);
    var ans = half ? n / 2 : n / 4;
    return {
      text: (half ? "Half" : "A quarter") + " of " + n + " " + t.pieces + " is?",
      say: "What is " + (half ? "half" : "a quarter") + " of " + P(n, t) + "?",
      visual: { kind: "pieces", n: n },
      choices: R.numberChoices(ans, 4, 1, 16), answer: ans,
      why: "Split them into " + (half ? 2 : 4) + " equal groups: each group has " + ans + ".",
      explain: { kind: "groups", n: n, groups: half ? 2 : 4 }, sig: (half ? "h" : "q") + n
    };
  }, true);

  /* =============================================================
     [Q-LEVEL3]
     ============================================================= */

  // Sharing with leftovers (division with remainders)
  reg("share-leftover", "Sharing with leftovers", 3, function (t) {
    var people = R.int(2, 5), each = R.int(1, 4), left = R.int(1, people - 1), pieces = people * each + left;
    function opt(e, l) { return { label: e + " each, " + l + " left", say: e + " each, and " + l + " left over", value: e + "|" + l }; }
    var list = [opt(each, left)], seen = [each + "|" + left];
    [[each + 1, 0], [each, left === people - 1 ? left - 1 : left + 1], [each - 1, left + people], [each + 1, left]].forEach(function (c) {
      var v = c[0] + "|" + c[1];
      if (list.length < 4 && c[0] >= 0 && c[1] >= 0 && seen.indexOf(v) < 0) { seen.push(v); list.push(opt(c[0], c[1])); }
    });
    return {
      text: "Share " + pieces + " " + t.pieces + " fairly with " + people + " " + t.people + ". How many each, and how many left over?",
      say: "Share " + P(pieces, t) + " fairly with " + K(people, t) + ". How many does each get, and how many are left over?",
      visual: { kind: "people-pieces", pieces: pieces, people: people },
      choices: R.shuffle(list), answer: each + "|" + left,
      why: "Hand them out round and round until there aren't enough for everyone: " + each + " each, " + left + " left over.",
      explain: { kind: "deal", pieces: pieces, people: people }, sig: "r" + pieces + "/" + people
    };
  });

  function sameValue(a, b) { return a[0] * b[1] === b[0] * a[1]; }

  // Fractions of a pizza (e.g. 3/8)
  reg("fraction-of-whole", "Fractions of a pizza", 3, function (t) {
    var d = R.pick([3, 4, 6, 8]), n = R.int(1, d - 1);
    var right = [n, d], cands = [[d - n, d], [n, d + 2], [d, n], [n + 1, d], [n - 1, d], [n, d - 1]];
    var list = [right];
    cands.forEach(function (c) {
      if (list.length < 4 && c[0] > 0 && c[1] > 0 && !list.some(function (x) { return x[0] === c[0] && x[1] === c[1]; }) && !sameValue(c, right)) list.push(c);
    });
    return {
      text: "What fraction has " + t.topping + "?",
      say: "This " + t.whole + " is cut into " + d + " equal parts. What fraction of the " + t.whole + " has " + t.topping + "?",
      visual: { kind: "circle", parts: d, shaded: n },
      choices: R.shuffle(list.map(function (f) { return { label: f[0] + "/" + f[1], say: R.fractionWords(f[0], f[1]), value: f[0] + "/" + f[1] }; })),
      answer: n + "/" + d,
      why: "It has " + d + " equal parts, and " + n + " have " + t.topping + ": that's " + n + "/" + d + ".",
      explain: { kind: "parts", parts: d, shaded: n }, sig: "w" + n + "/" + d
    };
  }, true);

  // Comparing fractions: which is more, or the same?
  reg("compare-fractions", "Comparing fractions", 3, function (t) {
    var L, Rt;
    if (Math.random() < 0.25) {
      var eq = R.pick([[[1, 2], [2, 4]], [[1, 2], [4, 8]], [[1, 4], [2, 8]], [[3, 4], [6, 8]], [[1, 3], [2, 6]], [[2, 3], [4, 6]], [[1, 2], [3, 6]]]);
      if (Math.random() < 0.5) eq.reverse();
      L = eq[0]; Rt = eq[1];
    } else {
      do {
        var d1 = R.pick([2, 3, 4, 6, 8]), d2 = R.pick([2, 3, 4, 6, 8]);
        L = [R.int(1, d1 - 1), d1]; Rt = [R.int(1, d2 - 1), d2];
      } while (sameValue(L, Rt));
    }
    var lv = L[0] / L[1], rv = Rt[0] / Rt[1];
    var answer = lv === rv ? "same" : lv > rv ? "left" : "right";
    var lcm = L[1] * Rt[1] / R.gcd(L[1], Rt[1]);
    var la = L[0] * lcm / L[1], ra = Rt[0] * lcm / Rt[1];
    var fl = L[0] + "/" + L[1], fr = Rt[0] + "/" + Rt[1];
    var why = lv === rv
      ? fl + " and " + fr + " cover the same amount of " + t.whole + "."
      : "Cut both into " + lcm + " equal parts: " + fl + " = " + la + "/" + lcm + " and " + fr + " = " + ra + "/" + lcm + ". " + (lv > rv ? fl : fr) + " is more.";
    return {
      text: "Left " + fl + ", right " + fr + ". Which is more?",
      say: "The left " + t.whole + " has " + R.fractionWords(L[0], L[1]) + " with " + t.topping + ". The right one has " + R.fractionWords(Rt[0], Rt[1]) + ". Which is more, or are they the same?",
      visual: { kind: "two-circles", left: { parts: L[1], shaded: L[0] }, right: { parts: Rt[1], shaded: Rt[0] } },
      choices: [{ label: "⬅ Left", say: "Left", value: "left" }, { label: "Same", say: "The same", value: "same" }, { label: "Right ➡", say: "Right", value: "right" }],
      answer: answer, why: why,
      explain: { kind: "compare", left: { parts: L[1], shaded: L[0], bigger: lv > rv }, right: { parts: Rt[1], shaded: Rt[0], bigger: rv > lv } },
      sig: "k" + fl + "v" + fr
    };
  }, true);
})();
