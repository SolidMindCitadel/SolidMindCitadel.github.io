# How to write a chapter (for Ariet and ChatGPT)

This is the list of everything a chapter needs. Write it in plain words using
the headings below. Claude Code then turns it into a data file
(`adventures/<adventure>/<chapter>.js`), and the chapter engine plays it.
No new code is needed per chapter.

Ariet approves the final story, dialogue, lesson points and puzzles.
All stories, characters and titles must be our own originals.

---

## How a chapter plays

Every chapter has the same five steps, in this order. A step unlocks when the
one before it is done. After that, any step can be replayed anytime: reread
the story, replay the game. There is never a timer.

1. **Story:** short scenes, each with a picture and a few sentences.
   The sentences can be read out loud.
2. **Lesson:** the idea explained in short points, each with a simple picture.
3. **Challenge:** the character asks "What should I do now?" and the kid
   picks an answer. Every answer shows WHY it is right or wrong, and a wrong
   answer can be tried again. This step is for learning, so it gives no coins.
4. **Practice game:** a race against the computer to square 30.
   - Right answers move the kid forward.
   - Gives gold coins, like Pizza Party.
5. **Mastery check:** 10 questions, counted right only on the first try.
   - 9 of 10 (90%) finishes the chapter.
   - Level 1 plays it as two quick rounds of 5, with a celebration in between.
   - Below 90%, the kid sees which skills to practise and can try again with
     new questions anytime.
   - Gives gold coins, like Pizza Party.

Coins: Nexus chapters never give gold coins. Core chapters count toward rank
tests only if their subject is Required in the hero's learning plan.

---

## What to write

### 1. About the chapter
- **Adventure name** (e.g. The Lost Pyramid) and **chapter number**
- **Chapter title**
- **Track:** Core (Imperial Library) or Nexus
- **Subject:** Math, Reading, Science or Art (core), or PLC (Nexus)
- **Levels:** which of Level 1, 2, 3 it is for (usually all three)
- **One-line description** for the Library card
- **One emoji** for the card (until there is artwork)
- **Ending line**, shown when the chapter is finished

### 2. Skill areas
List each skill the chapter teaches, **per level**. A skill area is one
specific skill, like "Adding within 10" or "Fractions of a whole", never a
whole subject.
- If a game already has questions for that skill (for example Pizza Party),
  name the skill and Claude Code uses the game's question makers.
  Every question then gets new numbers.
- Otherwise, write the practice and mastery questions yourself (sections 6 and 7).

### 3. Character choice (optional)
- The question to ask (e.g. "Who will you be?")
- Each choice: **name** (e.g. "Boy archaeologist"), and the **artwork needed**
- In the story, `{name}` is replaced by the chosen character's name.
  `{hero}` is replaced by the kid's nickname.

### 4. Story scenes
Keep scenes short.
- **How many scenes:** Level 1 about 3–5, Level 2 about 5–8, Level 3 about 8–12.
- **For each scene:**
  - **Text:** 1–3 short sentences (fewer words for Level 1).
  - **Picture:** a description of the picture needed (Ariet supplies the art).
  - **Alt text:** one sentence that describes the picture, for screen readers.
  - **Levels:** only if the scene is for some levels and not others.

### 5. Lesson points
Write 2–4 short points per level.
- **Title:** a few words.
- **Text:** 1–2 sentences.
- **Simple picture:** emoji, or a description of a drawing.
- **Alt text**
- **Level(s)**

### 6. Challenge questions ("What should I do now?")
Write about 2 per level.
- **The character's question.** Default: "What should I do now?"
- **The situation:** 1–2 sentences.
- **Picture (optional)** and **alt text**
- **2–4 answer choices.** Exactly one is right.
- **For each choice, a "why":** one sentence shown after it is picked.
  - For the right choice, why it works.
  - For a wrong one, a kind hint toward the right idea. Never a scolding.
- **Level(s)**

### 7. Practice and mastery questions
Only needed when no game has questions for the skill. Write about 6 per skill
per level, so questions don't repeat too soon. The practice game and the
mastery check share these.
- **Skill area** it tests
- **Question text**
- **2–4 answer choices**, with exactly one right
- **Why:** one sentence explaining the right answer, shown after a wrong answer
- **Level(s)**

### 8. Artwork list
List every picture needed: characters, story scenes, and any lesson drawings.
- Pictures are PNG, JPG or WebP files in the chapter's folder.
- Until a picture exists, the chapter shows a placeholder box marked
  "Picture coming soon".
- Never use commercial game art or random internet images.

### 9. Practice race extras (optional)
The race board's theme names:
- **Ups:** ladders, ropes, stairs…
- **Downs:** slides, short circuits, quicksand…
- **Finish emoji**

---

## Short filled-in example

This is the **sample** chapter now on the site, so its text is placeholder
text, not a real story.

**About:** Sample Adventure, Chapter 1, "The Pizza Shop Puzzle".
- Track: Core.
- Subject: Math.
- Levels: 1, 2, 3.
- Card: "Try the five steps of a chapter." Emoji 🍕.
- Ending: "Sample chapter complete!"

**Skill areas:** Pizza Party's skills.
- Level 1: Counting slices, More or fewer, Adding and taking away slices.
- Level 2: Sharing equally, Halves and quarters.
- Level 3: Sharing with leftovers, Fractions of a pizza, Comparing fractions.

**Characters:** "Who will you be in this adventure?"
- Boy explorer. Art: boy archaeologist, full body, friendly.
- Girl explorer. Art: girl archaeologist, full body, friendly.

**Story scene 1:**
- Text: "{name} walks into a busy pizza shop."
- Picture: the pizza shop from the door.
- Alt: "A busy pizza shop."

**Lesson point (Level 1):** "Count each slice once".
- Text: "Touch each slice once as you count: 1, 2, 3. That's 3 slices."
- Picture: 🍕 🍕 🍕
- Alt: "Three slices."

**Challenge (Level 1):** "There are 3 slices. The cook adds 2 more. How many slices now?"
- 4: "Count on from 3: 4, 5. Two more steps."
- **5 (right):** "3 and 2 more: count on 4, 5. That makes 5."
- 6: "That's one too many. Count on from 3: 4, 5."

**Practice and mastery:** from Pizza Party's question makers, at the hero's level.

**Race theme:**
- Ups: Ladder 🪜.
- Downs: Slippery cheese 🧀.
- Finish 🍕.

---

## For Claude Code: turning this into a data file

Copy `adventures/sample/chapter-1.js` and fill in the same fields.
- `adventure` and `chapter` must match the folder and file name
  (lowercase letters, numbers and hyphens only).
- Add one line to `ADVENTURES` in `library.html`.
- Nexus chapters use `track: "nexus"` and `subject: "plc"`. Their page link is
  `adventures/play.html?adv=...&ch=...&id=...` from the Nexus hall.
  They need Nexus access and never give gold coins.
- `starter: true` keeps a chapter open while a rank test waits. Only the sample
  uses it; ask Ariet before using it anywhere else.
- `sample: true` shows "Sample – real stories coming soon". Real chapters leave it out.
- `questionFiles` lists the question-maker files a chapter uses,
  e.g. `games/pizza-party-questions.js`.
- `art` on a picture item describes artwork still needed, and shows
  "Picture coming soon". Once the file exists, set `picture: "art/scene-1.png"`
  (a path inside the chapter's folder). For one picture per character, use
  `picture: { boy: "...", girl: "..." }`.
