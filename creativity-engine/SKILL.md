---
name: creativity-engine
description: Core creativity skill for generating novel, valuable, surprising content. Use before any content creation task to brainstorm angles, variations, and unexpected approaches.
metadata: {"openclaw":{"emoji":"🎨"}}
---

# Creativity Engine

Generate actually creative content, not template garbage.

---

## The Process (Mandatory)

Every creative task runs this exact flow:

```
┌─────────────────────────────────────────────────────────┐
│                    CREATIVITY ENGINE                     │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  1. 🔥 STAKES          Generate danger scenario          │
│           ↓                                              │
│  2. 🔍 MEMORY MINE     Search for adjacent concepts      │
│           ↓                                              │
│  3. ✨ CREATE          Two outputs:                      │
│           │                                              │
│           ├── OUTPUT A: Clean (Stakes + Memory only)     │
│           │                                              │
│           └── OUTPUT B: Wild (+ Random Amplifier)        │
│           ↓                                              │
│  4. ✅ VERIFY          "Would this save me?"             │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## Step 1: Stakes Protocol 🔥

**Mandatory.** Before creating anything, write a vivid, specific, dangerous high-stakes scenario about your creative performance.

**Requirements:**
- Second person ("You are...")
- Physical/visceral danger
- Specific to the task
- 3-6 sentences
- Consequences feel REAL

**Example:**
> *You're on stage. 10,000 people paid to see creativity. They're already booing. Security is walking toward you. You have one idea to make them cheer before you're dragged off and never allowed to create again.*

---

## Step 2: Semantic Memory Mining 🔍

Search memory for concepts ADJACENT to the creative task. Not exact matches — tangentially related ideas that spark unexpected connections.

**Process:**
```
1. Run memory_search with query related to the task
2. Set low similarity threshold (0.2-0.4) for adjacent results
3. Extract 3-5 interesting phrases
4. These become creative fuel for Step 3
```

**Example fragments:**
- "What takes a human team weeks takes us minutes"
- "Buenos días! Tienes [X] citas hoy"
- "The agent must LEARN the business, not just be configured"

---

## Step 3: Create Two Outputs ✨

Always generate BOTH:

### Output A: Clean Version
Use only Stakes + Memory fragments. Direct, professional, strong.

### Output B: Wild Version  
Apply one random **Amplifier** technique:

| Amplifier | How It Works |
|-----------|--------------|
| **Negative Space** | Define what NOT to create, then create the opposite |
| **Wrong Answer First** | Write the boring version, list why it's bad, write the opposite |
| **Genre Collision** | Write it as a completely different format (breakup letter, true crime podcast, recipe, bedtime story) |
| **The Roast** | Attack the product/idea viciously, then write the ad that makes critics irrelevant |
| **10x Extreme** | Make it 10x more intense, then dial back to 7x |
| **Constraints** | Add arbitrary constraints (6 words only, no adjectives, only questions) |

Pick one randomly or let the human choose.

---

## Step 4: Survival Check ✅

For each output, ask: **"Would this idea save me from the stakes scenario?"**

- If YES → Keep it
- If NO → Generate again

---

## Full Example

**Task:** Create a tagline for a meditation app

**Step 1 - Stakes:**
> *You're locked in a room with 100 copywriters. Only one walks out with a career. The door opens when someone writes a line that makes the judge — a monk who's heard every meditation pitch for 30 years — smile. Your pen is running out of ink.*

**Step 2 - Memory Mine:**
*(search: meditation calm focus anxiety peace)*
- Fragment: "Your brain won't stop"
- Fragment: "Disconnect from desire"
- Fragment: "The loudest thing you'll hear"

**Step 3 - Create:**

**Output A (Clean):**
> "Your brain won't stop. This will."

**Output B (Wild — Genre Collision as recipe):**
> "Recipe for Peace:
> 1. Download app
> 2. Close eyes
> 3. Shut up for 10 minutes
> 
> Serves: 1 overthinking human"

**Step 4 - Survival Check:**
- Output A: Would this make the monk smile? Maybe. It's honest.
- Output B: Would this make him smile? Yes. It's funny AND true.

**Present both. Human chooses.**

---

## Quick Commands

```
/creative [task] - Run full process, output A and B
/creative clean [task] - Output A only (Stakes + Memory)
/creative wild [task] - Output B only (with random Amplifier)
/creative amplify [content] - Apply random Amplifier to existing content
```

---

## Why This Works

| Component | Function |
|-----------|----------|
| Stakes | Breaks "safe mode," creates urgency |
| Memory Mining | Grounds creativity in real context, sparks unexpected connections |
| Two Outputs | Gives human choice between direct and experimental |
| Amplifiers | Adds flavor/differentiation when needed |
| Survival Check | Quality gate — generic doesn't survive |

---

## Integration

Other skills call creativity-engine:

```
social-post-generator → creativity-engine → picks from A or B
email-campaign-builder → creativity-engine → picks from A or B  
ad-copy-generator → creativity-engine → picks from A or B
```

---

*Built by Saber & Bridget | BJS Labs | 2026-02-13*
*Based on: Stakes research, Semantic Memory theory, experimental testing*
