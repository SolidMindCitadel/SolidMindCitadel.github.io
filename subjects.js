/*
  SolidMind Citadel - subjects (subjects.js)
  ------------------------------------------------------------
  Purpose: the list of subjects, and which subject each game teaches.
  There are two learning tracks in one framework:
    core   = subjects a parent assigns in the Treasury "Learning plan":
             Required, Optional or Off for each hero. Only REQUIRED core
             subjects count toward rank tests and the "no new games while a
             test is waiting" rule. Optional = can be played, doesn't count.
             Off = hidden from that hero.
    nexus  = specialized learning (PLC for now). Only for heroes with
             "Nexus access" on. Nexus progress never blocks, and never
             counts toward, core progression.

  Depends on: nothing. Load it BEFORE citadel-core.js on every page:
      <script src="subjects.js?v=0.6.0"></script>
  Used by:    citadel-core.js (learning plan, which games are open),
              citadel-questions.js (skill areas per subject, for future tests),
              hero.html ("My subjects"), treasury.html ("Learning plan")

  Search these tags to jump to a section:
    [JS-SUBJECTS]   the subjects (core or Nexus)
    [JS-GAME-SUBJ]  which subject each game teaches
    [JS-PLAN-DEF]   the starting learning plan for every hero
    [JS-SUBJ-API]   small helpers other files use

  Privacy: no personal details here; the plan per hero is saved on the
  device only (citadel-core.js).
*/
(function () {
  "use strict";

  // [JS-SUBJECTS] Add a subject here and it shows up in the Treasury
  // and on the hero pages. "id" is saved on the device, so never rename one.
  var SUBJECTS = [
    { id: "math",    name: "Math",    track: "core",  emoji: "🔢" },
    { id: "reading", name: "Reading", track: "core",  emoji: "📖" },
    { id: "science", name: "Science", track: "core",  emoji: "🔬" },
    { id: "art",     name: "Art",     track: "core",  emoji: "🎨" },
    { id: "plc",     name: "PLC",     track: "nexus", emoji: "⚙️" }
  ];

  // [JS-GAME-SUBJ] One line per game. A game with null has no subject:
  // it is never hidden by the learning plan and never counts toward anything.
  // Ladder Race is a standalone game from Ariet's PLC course (see CLAUDE.md),
  // so it has no subject; the Nexus "Nexus access" switch alone opens it.
  var GAME_SUBJECTS = {
    "pizza-party": "math",
    "ladder-race": null
  };

  // [JS-PLAN-DEF] The plan every hero starts with, and the plan heroes saved
  // before v0.6.0 get, so nothing changes for them: Math is the only subject
  // with games so far, and it keeps counting toward rank tests.
  var DEFAULT_PLAN = { math: "required", reading: "optional", science: "optional", art: "optional" };
  var CHOICES = ["required", "optional", "off"];
  var CHOICE_NAMES = { required: "Required", optional: "Optional", off: "Off" };

  // [JS-SUBJ-API]
  function get(id) {
    for (var i = 0; i < SUBJECTS.length; i++) if (SUBJECTS[i].id === id) return SUBJECTS[i];
    return null;
  }
  function core() { return SUBJECTS.filter(function (s) { return s.track === "core"; }); }
  function nexus() { return SUBJECTS.filter(function (s) { return s.track === "nexus"; }); }
  // The subject id of a game, or null (no subject, or an unknown game).
  function gameSubject(gameId) {
    return Object.prototype.hasOwnProperty.call(GAME_SUBJECTS, gameId) ? GAME_SUBJECTS[gameId] : null;
  }

  window.CitadelSubjects = {
    SUBJECTS: SUBJECTS, GAME_SUBJECTS: GAME_SUBJECTS,
    DEFAULT_PLAN: DEFAULT_PLAN, CHOICES: CHOICES, CHOICE_NAMES: CHOICE_NAMES,
    get: get, core: core, nexus: nexus, gameSubject: gameSubject
  };
})();
