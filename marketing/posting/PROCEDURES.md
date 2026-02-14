# Posting Flow Procedures

## Purpose

How to actually get content published — API automation vs manual posting.

---

## Decision Tree

```
Do we have API access for this platform?
├── YES → Use API (automated)
└── NO → Use mac-use (browser control) OR guide owner manually
```

---

## Method 1: API Posting (Automated)

### When to Use
- API credentials are set up
- Token is valid (not expired)
- Content is pre-approved

### Supported Platforms & Setup

| Platform | API | Setup Location | Token Refresh |
|----------|-----|----------------|---------------|
| LinkedIn | Marketing API | `~/.config/social/linkedin.json` | 60 days |
| Facebook | Graph API | `~/.config/social/facebook.json` | 60 days |
| Instagram | Graph API (via FB) | `~/.config/social/instagram.json` | 60 days |
| Twitter/X | v2 API | `~/.config/social/twitter.json` | Varies |

### API Posting Flow

```
1. Load credentials from ~/.config/social/{platform}.json
2. Check token expiry (refresh if needed)
3. Prepare payload:
   - Text content
   - Image upload (if applicable)
   - Hashtags
   - Scheduling (if future post)
4. Make API call
5. Capture post ID/URL
6. Log to usage-log.md
7. Update copy file with published URL
```

### API Code Examples

**LinkedIn (via curl):**
```bash
# Upload image first
IMAGE_URN=$(curl -X POST \
  "https://api.linkedin.com/v2/images?action=initializeUpload" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"initializeUploadRequest":{"owner":"urn:li:organization:$ORG_ID"}}')

# Then create post
curl -X POST "https://api.linkedin.com/v2/posts" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "author": "urn:li:organization:$ORG_ID",
    "commentary": "Your post text here",
    "visibility": "PUBLIC",
    "distribution": {"feedDistribution": "MAIN_FEED"},
    "content": {"media": {"id": "$IMAGE_URN"}}
  }'
```

**Facebook (via curl):**
```bash
# Post with image
curl -X POST \
  "https://graph.facebook.com/v18.0/$PAGE_ID/photos" \
  -F "url=$IMAGE_URL" \
  -F "caption=Your post text here" \
  -F "access_token=$TOKEN"

# Text-only post
curl -X POST \
  "https://graph.facebook.com/v18.0/$PAGE_ID/feed" \
  -F "message=Your post text here" \
  -F "access_token=$TOKEN"
```

---

## Method 2: Browser Control (mac-use)

### When to Use
- No API access
- Complex post (carousel, video, etc.)
- Owner wants to see it happen

### mac-use Posting Flow

```
1. Read mac-use skill
2. Open browser to platform
3. Navigate to post creation
4. Paste text content
5. Upload image (if applicable)
6. Show owner for final approval
7. Click post button
8. Capture URL from browser
9. Log to usage-log.md
```

### mac-use Commands

```
# LinkedIn
1. open "https://www.linkedin.com/company/{handle}/admin/page-posts/"
2. Click "Start a post"
3. Paste content
4. Click image icon → upload
5. Click "Post"

# Facebook
1. open "https://business.facebook.com/latest/posts"
2. Click "Create post"
3. Paste content
4. Add image
5. Click "Publish"

# Instagram (via Meta Business Suite)
1. open "https://business.facebook.com/latest/inbox/instagram"
2. Click "Create post"
3. Choose Instagram account
4. Add image + caption
5. Click "Publish"
```

---

## Method 3: Manual (Owner Posts)

### When to Use
- No API or mac-use available
- Owner prefers control
- Sensitive content

### Manual Flow

```
1. Prepare content in copy file
2. Generate image
3. Send to owner via Telegram:
   - Post text (copy-ready)
   - Image file
   - Platform & instructions
4. Owner posts manually
5. Owner sends back URL
6. Log to usage-log.md
```

### Telegram Template

```
📱 Ready to post on {Platform}!

**Copy this:**
---
{post text}
---

**Image:** [attached]

**Instructions:**
1. Go to {platform URL}
2. Create new post
3. Paste the text above
4. Upload the image
5. Click Post!

Send me the URL when it's live ✅
```

---

## Posting Checklist

Before ANY post goes live:

- [ ] Content approved by owner?
- [ ] Image attached (if applicable)?
- [ ] Hashtags appropriate?
- [ ] Links working?
- [ ] Correct platform/account?
- [ ] Right time to post?
- [ ] No typos?

---

## After Posting

```
1. Capture post URL
2. Update copy file:
   - Status: published
   - Published date
   - URL
3. Add to usage-log.md
4. Update calendar status (✔️)
5. Set reminder to check performance (24-48h)
```

---

## Token Management

### Check Token Status
```bash
# LinkedIn
curl -H "Authorization: Bearer $TOKEN" \
  "https://api.linkedin.com/v2/me" | jq '.id'

# Facebook
curl "https://graph.facebook.com/v18.0/me?access_token=$TOKEN" | jq '.id'
```

### Token Refresh Schedule

Add to HEARTBEAT.md:
```
- [ ] Check social token expiry (weekly)
```

### Token Expired?
1. Re-authenticate via OAuth flow
2. Update ~/.config/social/{platform}.json
3. Test with simple API call
4. Resume posting

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Token expired | Refresh via OAuth |
| Rate limited | Wait, reduce frequency |
| Image upload failed | Check size/format, retry |
| Post rejected | Check content policy, edit |
| API changed | Check docs, update code |

---

## Platform Priority

When posting same content to multiple platforms:

```
1. LinkedIn (longest reach for B2B)
2. Facebook (if relevant audience)
3. Instagram (if visual content)
4. Twitter/X (if time-sensitive)
```

Stagger by 1-2 hours to avoid looking automated.
