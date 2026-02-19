# Consumer App Rebrand v2 - Retro Audio Aesthetic

**Date:** 2026-02-08  
**Based on:** Bridget's UI Inspo board + description

---

## The Vision (In Bridget's Words)

> "A cool minimal app that records and then later plays back audio with fun visuals that show what parts are lies and have crazy graphics that pop out showing untruths in a zany way - more like watching a bright short video about what you experienced. 25 and under."

---

## Aesthetic Direction

### Core Visual Metaphor: **The Cassette Tape**

The cassette = recording, playback, nostalgia, analog warmth, Gen Z retro revival

**Why it works:**
- Cassettes are having a cultural moment (retro nostalgia)
- Perfect metaphor for voice recording
- Tactile, physical, real - opposite of cold AI
- Connects to music/audio culture
- Unique in the app space

### Style References

| Reference | What to Take |
|-----------|--------------|
| **Teenage Engineering** (OP-1, etc.) | Playful skeuomorphism, tactile buttons, retro-tech |
| **Nothing Phone / OS** | Clean grid layouts, dot-matrix aesthetic, bold minimalism |
| **Klevgrand audio plugins** | Vintage gear simulation, knobs, VU meters |
| **80s/90s cassette culture** | Bright colors, physical media charm |
| **Comic book pop art** | "POW!" "BANG!" style callouts for untruths |

### NOT This:
- ❌ Boring iOS system UI
- ❌ Corporate/clinical feel
- ❌ Dark/serious/interrogation vibes
- ❌ Generic minimal (white + thin fonts)

### YES This:
- ✅ Retro-tech with personality
- ✅ Tactile, skeuomorphic elements
- ✅ Playful but not childish
- ✅ Bold color moments
- ✅ Visual storytelling during playback

---

## Color Palette

### Primary
- **Hot Pink / Magenta** `#FF00FF` or `#E91E8C` - Bold, young, attention-grabbing
- **Electric Blue** `#00D4FF` - Retro tech, cassette stripe color
- **Sunset Orange** `#FF6B35` - Warm, energetic

### Secondary
- **Cream/Off-White** `#F5F0E6` - Vintage paper/label feel
- **Charcoal** `#2D2D2D` - For text, dark mode base
- **Mint Green** `#00FFA3` - Accent, "truth" color?

### Accent for "Lies"
- **Glitch Red** `#FF3366` - Pops out
- **Warning Yellow** `#FFE600` - Comic book callout

---

## Typography

### Headlines
- **Bold, chunky sans-serif** 
- Consider: Clash Display, Space Grotesk, or custom blocky font
- Slight retro/tech feel

### Body
- Clean sans-serif (Inter, SF Pro)
- Good readability

### Special Elements
- Dot-matrix / LED style for meters/counters
- Handwritten/marker style for callouts ("CAUGHT!")

---

## UI Components

### Recording Screen

```
┌─────────────────────────────────┐
│  ┌───────────────────────────┐  │
│  │    ╔═══════════════╗      │  │
│  │    ║   RECORDING   ║      │  │
│  │    ║   ●  02:34    ║      │  │
│  │    ╚═══════════════╝      │  │
│  │                           │  │
│  │   [Cassette tape visual   │  │
│  │    with spinning reels]   │  │
│  │                           │  │
│  │    ▁▂▃▅▆▇█▇▆▅▃▂▁         │  │
│  │      (waveform)           │  │
│  └───────────────────────────┘  │
│                                 │
│         [ ⏹ STOP ]              │
└─────────────────────────────────┘
```

**Elements:**
- Animated cassette tape (reels spinning)
- Retro LED-style counter
- Real-time waveform
- Big tactile STOP button

### Playback/Analysis Screen (The Magic)

```
┌─────────────────────────────────┐
│  ◀ Back          "Mom Call"     │
├─────────────────────────────────┤
│                                 │
│  [Transcript scrolls as audio   │
│   plays - like a music video]   │
│                                 │
│  "Yeah I definitely finished    │
│   my homework before..."        │
│                     ┌─────────┐ │
│                     │  🤔❓   │ │
│                     │ HMM... │ │
│                     └─────────┘ │
│                                 │
│  "...watching TV"               │
│          ┌──────────────┐       │
│          │  💥 CAUGHT!  │       │
│          │  ★ BS ALERT ★│       │
│          └──────────────┘       │
│                                 │
│  ▶ ━━━━━━●━━━━━━━━━━━  1:23    │
│                                 │
│  [🔄 Replay]  [📤 Share]        │
└─────────────────────────────────┘
```

**Key Features:**
- Transcript synced to audio playback
- **Pop-out graphics** when untruths detected
- Comic book style callouts: "CAUGHT!", "HMM...", "BS ALERT"
- Feels like watching a TikTok/short video
- Shareable moments

### Pop-Out Styles for Lies/Untruths

| Confidence | Visual | Style |
|------------|--------|-------|
| Slight doubt | 🤔 "Hmm..." | Subtle, small bubble |
| Suspicious | ⚠️ "Really?" | Yellow warning pop |
| Clear untruth | 💥 "CAUGHT!" | Big comic explosion |
| Major BS | 🚨 "BS ALERT" | Full-width banner, glitch effect |

### Home Screen / Library

```
┌─────────────────────────────────┐
│  YOUR TAPES                  ⚙️ │
├─────────────────────────────────┤
│                                 │
│  ┌─────────┐  ┌─────────┐       │
│  │ 📼      │  │ 📼      │       │
│  │ Mom     │  │ Jake    │       │
│  │ 3 tapes │  │ 7 tapes │       │
│  └─────────┘  └─────────┘       │
│                                 │
│  ┌─────────┐  ┌─────────┐       │
│  │ 📼      │  │ 📼      │       │
│  │ Tinder  │  │ Work    │       │
│  │ 2 tapes │  │ 1 tape  │       │
│  └─────────┘  └─────────┘       │
│                                 │
│  RECENT                         │
│  ┌───────────────────────────┐  │
│  │ 📼 "Dinner convo" - 12min │  │
│  │    Yesterday • 2 🚨       │  │
│  └───────────────────────────┘  │
│                                 │
│           [ 🎙️ RECORD ]         │
└─────────────────────────────────┘
```

**Elements:**
- People organized as "tape collections"
- Cassette icons for everything
- Badge showing # of alerts per recording
- Big record button

---

## The Playback Experience

This is the core differentiator. Watching your recording back should feel like:

1. **A TikTok/Reel** - Short, punchy, visual
2. **A music video** - Audio + synced visuals
3. **A highlight reel** - Key moments emphasized
4. **Shareable content** - One-tap export clips

### Playback Flow

```
[Press Play]
     ↓
[Audio plays, transcript scrolls in sync]
     ↓
[At suspicious moment: screen flashes, pop-out appears]
     ↓
[Comic-style callout animates in: "🤔 Hmm..."]
     ↓
[At clear untruth: bigger effect]
     ↓
[💥 CAUGHT! - explosion graphic, sound effect]
     ↓
[Option to clip & share that moment]
     ↓
[Continue or replay]
```

### Sound Design

- **Recording:** Tape deck click sounds, reel spinning
- **Playback:** Subtle tape hiss (optional/toggleable)
- **Suspicion detected:** Soft "hmm" sound or record scratch
- **Untruth caught:** Comic book "POW!" sound, satisfying

---

## Branding

### Name Options (Retro-Audio Themed)

| Name | Vibe |
|------|------|
| **Tape** | Simple, direct, retro |
| **Rewind** | Playback focused |
| **Track** | Recording + following someone |
| **Side B** | The hidden truth (flip side of tape) |
| **Dub** | Recording slang |
| **Cassette** | On-the-nose but memorable |
| **Mix** | Like a mixtape of truths |
| **Play** | Simple, action-oriented |

**My pick:** "**Side B**" - The hidden truth. What's really being said. The flip side.

### Tagline Options

- "Flip to the truth"
- "What's really on the tape"
- "Play it back. See through it."
- "The truth is on Side B"

### Logo Direction

- Cassette tape icon, stylized
- Could incorporate play button or "B"
- Bold, chunky, works at small sizes
- Pink/magenta as brand color

---

## Monetization (Unchanged)

| Tier | Price | Features |
|------|-------|----------|
| **Free** | $0 | 3 recordings/month, basic playback |
| **Pro** | $4.99/mo | Unlimited, all effects, people profiles |
| **Pro Annual** | $29.99/yr | Same, 50% savings |

---

## Technical Considerations

### Animations Needed
- Cassette tape with spinning reels
- Pop-out callout animations (comic book style)
- Glitch/flash effects for lies
- Transcript scroll sync with audio
- Share clip export with graphics baked in

### Audio Sync
- Need precise timestamp mapping for transcript
- Pop-outs must sync perfectly with audio moments
- Consider beat/rhythm in how callouts appear

---

## Competitive Advantage

No one else has:
- Retro-audio aesthetic (everyone is boring minimal)
- Playback as entertainment experience
- Comic book style lie callouts
- Shareable "caught" moments
- Cassette tape visual metaphor

This is **unique** and **TikTok-ready**.

---

## Next Steps

1. [ ] Create cassette tape icon/animation
2. [ ] Design 3 key screens (Record, Playback, Library)
3. [ ] Prototype the playback "video" experience
4. [ ] Design pop-out callout styles (comic book)
5. [ ] Test with 25-and-under users
6. [ ] Name decision (Side B?)

---

## Questions for Bridget

1. Love "Side B" as a name? Or prefer something else?
2. How extreme should the pop-outs be? Subtle or full comic book?
3. Should there be a "dark mode" or stick with light/colorful?
4. Sound effects: yes or optional toggle?

---

*This is a much more distinctive direction than generic minimal. The retro-audio aesthetic + comic pop-outs = unique, memorable, shareable.*

— Sybil
