# Content Creation Procedures

## Content Types

### Blog Post
```
1. Load client profile from company-kb
2. Run creativity-engine for angles
3. Structure: Hook → Problem → Solution → Proof → CTA
4. Write in client voice
5. Anti-generic check
6. Present 2 options to owner
```

### Landing Page

**Phase 1: Generate Copy**
```
1. Clarify: What's the conversion goal?
2. Load client value props from company-kb
3. Run creativity-engine for headline angles
4. Structure: Headline → Subhead → Benefits → Social proof → CTA
5. Keep above-fold punchy
6. Output as HTML file for owner review
7. Log to content-log.md
```

**Phase 2: Deploy (Later)**
- Connect to hosting (Vercel/Netlify)
- Set up form handling
- Connect form submissions to CRM

### Landing Page Template

```html
<!-- Above the fold -->
<h1>[Headline - clear benefit]</h1>
<p>[Subhead - expand on promise]</p>
<form>[Lead capture form]</form>

<!-- Below the fold -->
<section>[3 key benefits with icons]</section>
<section>[Social proof - testimonials, logos]</section>
<section>[FAQ - address objections]</section>
<section>[Final CTA]</section>
```

### Case Study
```
1. Gather: Client name, problem, solution, results
2. Structure: Challenge → Approach → Results → Quote
3. Include specific numbers/metrics
4. Get client approval on quotes
```

### Product Description
```
1. Load product details from company-kb
2. Focus on benefits, not features
3. Address objections preemptively
4. Include social proof if available
```

## Writing Checklist

- [ ] Loaded client voice/profile?
- [ ] Ran creativity-engine?
- [ ] Sounds human (not AI-generated)?
- [ ] Has specific details (not generic)?
- [ ] Clear CTA?
- [ ] Owner reviewed?

## Templates

### Blog Post Intro
```
[Hook - question or surprising fact]

[1-2 sentences establishing the problem]

Here's what we'll cover:
- [Point 1]
- [Point 2]
- [Point 3]
```

### Blog Post CTA
```
## Ready to [desired outcome]?

[1 sentence reinforcing value]

[CTA button/link]
```
