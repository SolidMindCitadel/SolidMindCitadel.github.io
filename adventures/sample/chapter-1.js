/*
  SolidMind Citadel - SAMPLE chapter data (adventures/sample/chapter-1.js)
  ------------------------------------------------------------
  Purpose: a short sample chapter so the kids can try the chapter engine
  now. ALL story, lesson and challenge text here is a PLACEHOLDER and the
  screen says "Sample – real stories coming soon". Real stories are written
  by Ariet and ChatGPT (see CHAPTER-TEMPLATE.md); don't turn this into one.
  It uses Pizza Party's skill areas and question makers, at the hero's level.

  Depends on: citadel-adventure.js (this file calls CitadelAdventure.chapter),
              games/pizza-party-questions.js (listed in questionFiles)

  Search these tags to jump to a section:
    [DATA-ABOUT]      title, subject, levels, flags
    [DATA-CHARACTERS] character choice (placeholder pictures)
    [DATA-STORY]      story scenes (placeholders)
    [DATA-LESSON]     lesson points per level
    [DATA-CHALLENGE]  "What should I do now?" questions per level
    [DATA-PRACTICE]   race questions (from the question bank)
    [DATA-MASTERY]    mastery check questions (from the question bank)
*/
CitadelAdventure.chapter({
  // [DATA-ABOUT]
  adventure: "sample", chapter: "chapter-1",       // must match the folder and file name
  adventureTitle: "Sample Adventure", chapterLabel: "Chapter 1",
  title: "The Pizza Shop Puzzle",
  emoji: "🍕",
  blurb: "Try the five steps of a chapter: story, lesson, challenge, race and mastery check.",
  subject: "math", track: "core", levels: [1, 2, 3],
  sample: true,    // shows "Sample – real stories coming soon"
  starter: true,   // always open, like Pizza Party (Ariet's choice for the sample)
  questionFiles: ["games/pizza-party-questions.js"],
  endText: "Sample chapter complete! Real adventures are coming soon.",

  // [DATA-CHARACTERS] Placeholder pictures until Ariet supplies artwork.
  characters: {
    ask: "Who will you be in this adventure?",
    list: [
      { id: "boy",  name: "Boy explorer",  emoji: "👦", alt: "Boy explorer (placeholder picture)",  art: "Boy archaeologist, full body, friendly" },
      { id: "girl", name: "Girl explorer", emoji: "👧", alt: "Girl explorer (placeholder picture)", art: "Girl archaeologist, full body, friendly" }
    ]
  },

  // [DATA-STORY] Placeholder scenes. {name} = the character the kid chose.
  story: [
    { emoji: "🏪🍕", alt: "A pizza shop (placeholder picture)", art: "Scene 1 picture",
      text: "Sample scene. {name} walks into a busy pizza shop. A real story will go here." },
    { emoji: "👨‍🍳❓", alt: "The cook looks puzzled (placeholder picture)", art: "Scene 2 picture",
      text: "Sample scene. The cook needs help with the slices. Can {name} help?" },
    { emoji: "🧭✨", alt: "Ready for the puzzle (placeholder picture)", art: "Scene 3 picture",
      text: "Sample scene. {name} is ready! First, a quick lesson." }
  ],

  // [DATA-LESSON] Short points with simple pictures, per level.
  lesson: [
    { levels: [1], title: "Count each slice once", emoji: "🍕 🍕 🍕", alt: "Three slices", text: "Touch each slice once as you count: 1, 2, 3. That's 3 slices." },
    { levels: [1], title: "More or fewer", emoji: "🍕🍕🍕🍕  vs  🍕🍕", alt: "Four slices and two slices", text: "4 slices is more than 2 slices. The bigger number is more." },
    { levels: [1], title: "Adding slices", emoji: "🍕🍕 + 🍕 = 🍕🍕🍕", alt: "Two slices plus one slice make three", text: "Adding puts groups together. 2 slices and 1 more make 3." },
    { levels: [2], title: "Sharing equally", emoji: "🍕🍕🍕 | 🍕🍕🍕", alt: "Six slices in two equal groups", text: "Equal means everyone gets the same. 6 slices for 2 friends is 3 each." },
    { levels: [2], title: "Halves and quarters", emoji: "◐  ◔", alt: "A half and a quarter of a circle", text: "Cut a pizza into 2 equal parts: halves. Into 4 equal parts: quarters." },
    { levels: [3], title: "Leftovers", emoji: "🍕🍕 | 🍕🍕 | 🍕🍕 + 🍕", alt: "Seven slices: three groups of two and one left over", text: "7 slices for 3 friends: 2 each makes 6, and 1 slice is left over." },
    { levels: [3], title: "Fractions", emoji: "◕", alt: "Three quarters of a circle", text: "3/4 means 3 of 4 equal parts. The bottom number says how many equal parts." },
    { levels: [3], title: "Comparing fractions", emoji: "◐ > ◔", alt: "A half is bigger than a quarter", text: "More parts means smaller pieces, so 1/2 is bigger than 1/4." }
  ],

  // [DATA-CHALLENGE] The character asks "What should I do now?". Every choice has
  // a "why" shown after it is picked (right or wrong). Exactly one choice is ok.
  challenge: [
    { levels: [1], text: "There are 3 slices. The cook adds 2 more. How many slices now?", emoji: "🍕🍕🍕 + 🍕🍕", alt: "Three slices plus two slices",
      choices: [
        { label: "4", why: "Count on from 3: 4, 5. Two more steps." },
        { label: "5", ok: true, why: "3 and 2 more: count on 4, 5. That makes 5." },
        { label: "6", why: "That's one too many. Count on from 3: 4, 5." } ] },
    { levels: [1], text: "Plate A has 4 slices. Plate B has 2. Which plate has more?", emoji: "A: 🍕🍕🍕🍕   B: 🍕🍕", alt: "Plate A with four slices, plate B with two",
      choices: [
        { label: "Plate A", ok: true, why: "Plate A has 4 and Plate B has 2. 4 is more than 2." },
        { label: "Plate B", why: "Plate B has only 2. Count Plate A again: it has 4." } ] },
    { levels: [2], text: "6 slices, 2 friends. Everyone gets the same. How many each?", emoji: "🍕🍕🍕🍕🍕🍕", alt: "Six slices",
      choices: [
        { label: "2", why: "2 + 2 is only 4. There are 6 slices to share." },
        { label: "3", ok: true, why: "6 shared by 2 is 3 each, because 3 + 3 = 6." },
        { label: "4", why: "4 + 4 is 8. That's more than 6 slices." } ] },
    { levels: [2], text: "A pizza is cut into 4 equal slices. What is one slice called?", emoji: "◔", alt: "One quarter of a circle",
      choices: [
        { label: "One half", why: "A half is 1 of 2 equal parts. This pizza has 4 parts." },
        { label: "One quarter", ok: true, why: "4 equal parts: each part is one quarter, 1/4." },
        { label: "One third", why: "A third is 1 of 3 equal parts. This pizza has 4 parts." } ] },
    { levels: [3], text: "7 slices, 3 friends, equal shares. How many each, and how many left over?", emoji: "🍕🍕🍕🍕🍕🍕🍕", alt: "Seven slices",
      choices: [
        { label: "2 each, 1 left over", ok: true, why: "3 friends × 2 = 6 slices, and 7 − 6 = 1 left over." },
        { label: "3 each, 0 left over", why: "3 friends × 3 = 9. There are only 7 slices." },
        { label: "2 each, 2 left over", why: "3 × 2 = 6 and 7 − 6 = 1, so only 1 is left over." } ] },
    { levels: [3], text: "Which is bigger: 1/2 or 1/4 of the same pizza?", emoji: "◐  ◔", alt: "A half and a quarter of a circle",
      choices: [
        { label: "1/2", ok: true, why: "2 parts are bigger than 4 parts of the same pizza, so 1/2 is bigger." },
        { label: "1/4", why: "4 parts means smaller pieces. 1/4 is smaller than 1/2." },
        { label: "They are the same", why: "Halves and quarters are different sizes: 1/2 is two quarters." } ] }
  ],

  // [DATA-PRACTICE] A race against the computer. Questions come from the bank
  // (new numbers every time), in Pizza Party's skill areas for each level.
  practice: {
    intro: "Race the computer to square 30! Right answers move you forward.",
    bank: { theme: "pizza", areas: {
      1: ["count-1-10", "more-fewer", "add-take-10"],
      2: ["share-equal", "halves-quarters"],
      3: ["share-leftover", "fraction-of-whole", "compare-fractions"] } },
    theme: { up: "Ladder", upEmoji: "🪜", down: "Slippery cheese", downEmoji: "🧀", finishEmoji: "🍕", cpuName: "Computer" }
  },

  // [DATA-MASTERY] 10 first-try questions on the same skill areas. 9 of 10 finishes the chapter.
  mastery: {
    bank: { theme: "pizza", areas: {
      1: ["count-1-10", "more-fewer", "add-take-10"],
      2: ["share-equal", "halves-quarters"],
      3: ["share-leftover", "fraction-of-whole", "compare-fractions"] } }
  }
});
