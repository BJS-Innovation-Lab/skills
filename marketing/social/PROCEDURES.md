# Social Media Procedures

## Social Post Flow

```
1. Load brand profile (company-kb)
2. Run creativity-engine for angles
3. Draft post following platform rules below
4. Generate accompanying image/graphic (see below)
5. Show owner: "Here's the post + image. Approve to publish?"
6. On approval: Post (via API or mac-use)
7. Log to content-log.md with link
```

## Image Generation (Step 4)

**Every post should have a visual.** Text-only posts get 2-3x less engagement.

### Image Types by Content

| Post Type | Image Style |
|-----------|-------------|
| Thought leadership | Quote card with brand colors |
| Story/testimonial | Abstract illustration or photo |
| Announcement | Bold graphic with key message |
| Educational | Infographic or diagram |
| Behind-the-scenes | Authentic photo |

### Generation Process

```
1. Extract key message/quote from post
2. Generate image using brand colors (from voice.md)
3. Keep text minimal on image (1-2 lines max)
4. Ensure image works at small sizes (mobile preview)
5. Match platform dimensions:
   - LinkedIn: 1200x627 (landscape)
   - Facebook: 1200x630 (landscape)
   - Instagram: 1080x1080 (square) or 1080x1350 (portrait)
```

### Tools

- `openai-image-gen` skill for illustrations/abstract graphics
- `nano-banana-pro` skill for photo-realistic or edits
- Quote cards: Generate via HTML canvas or Canva API

### Anti-Generic Check for Images

- [ ] Uses brand colors?
- [ ] Not stock-photo generic?
- [ ] Text readable at thumbnail size?
- [ ] Matches the emotional tone of the post?
- [ ] Would stop someone scrolling?

## Owner Checkpoint

**Always show before posting:**
```
📱 [Platform] Post Draft

[The post content]

---
Hashtags: [hashtags]
Best time to post: [suggested time]

✅ Approve & Post
✏️ Edit
❌ Cancel
```

---

## Platforms

### LinkedIn
- Professional tone
- 1300 char limit (but shorter = better)
- Hook in first line (before "see more")
- 3-5 hashtags max
- Best times: Tue-Thu 8-10am

### Twitter/X  
- Punchy, conversational
- 280 chars (threads for longer)
- 1-2 hashtags max
- Best times: 9am, 12pm, 5pm

### Instagram
- Visual-first (need image/video)
- 2200 char caption limit
- Hashtags in first comment (15-20)
- Best times: 11am, 2pm

### Facebook
- Conversational, community-focused
- No strict length limit
- 1-3 hashtags max
- Best times: 1-4pm

## Post Templates

### LinkedIn - Insight Post
```
[Bold hook statement]

[2-3 lines of context]

Here's what I learned:

→ [Insight 1]
→ [Insight 2]  
→ [Insight 3]

[Question to drive engagement]

#relevant #hashtags
```

### Twitter - Thread Starter
```
[Hook that demands the click]

🧵 Thread:
```

### Instagram Caption
```
[Hook - first line is crucial]

[Story or insight - 2-3 short paragraphs]

[CTA - save this, share with someone who needs it, link in bio]

.
.
.
[hashtags in comment]
```

## Content Calendar Rhythm

| Day | Content Type |
|-----|--------------|
| Monday | Value/educational |
| Wednesday | Behind-the-scenes |
| Friday | Engagement/fun |

## Before Posting

- [ ] Ran creativity-engine?
- [ ] Matches brand voice?
- [ ] Has visual (if needed)?
- [ ] Proofread?
- [ ] Owner approved?
