# Social Setup Skill

> Set up social media accounts and API integrations for new clients.

## When to Use

- New client needs social media presence
- Existing client wants to connect accounts to agent
- Setting up posting automation

## Platforms Covered

| Platform | Account Type | API Access |
|----------|--------------|------------|
| LinkedIn | Company Page | Marketing API |
| Facebook | Business Page | Meta Business Suite |
| Instagram | Business/Creator | Meta Business Suite |
| TikTok | Business | TikTok for Business |
| Twitter/X | Business | X API (paid tiers) |
| WhatsApp | Business | WhatsApp Business API |

---

## Phase 1: Account Creation

### Pre-Flight Checklist

Before creating accounts, gather:

| Info Needed | Example | Where to Get |
|-------------|---------|--------------|
| Business name | "Vulkn" | Client |
| Handle preference | @vulkn, @vulknai | Client (check availability) |
| Email for accounts | business@client.com | Client |
| Phone number | +52 55 1234 5678 | Client |
| Logo (square, 400x400+) | logo.png | Client or company-kb |
| Cover image (varies by platform) | cover.jpg | Client or generate |
| Bio/description (160 chars) | "AI teammates for SMBs" | Generate from voice.md |
| Website URL | vulkn.com | Client |

### Platform-Specific Setup

#### LinkedIn Company Page

```
1. Go to linkedin.com/company/setup/new
2. Enter company name
3. Choose company type (Small Business, usually)
4. Upload logo + cover
5. Add description from voice.md
6. Verify admin (needs personal LinkedIn account)
```

**API Setup (Marketing API):**
- Apply at linkedin.com/developers
- Create app → Get Client ID + Secret
- Request Marketing API access (may take days)
- Scopes needed: w_organization_social, r_organization_social

#### Facebook Business Page

```
1. Go to facebook.com/pages/create
2. Choose "Business or Brand"
3. Enter page name + category
4. Upload logo + cover
5. Add description, contact info, hours
6. Connect to Meta Business Suite
```

**API Setup:**
- Go to business.facebook.com
- Create Business Manager account
- Add Page to Business Manager
- Go to developers.facebook.com → Create App
- Add "Pages" product → Get Page Access Token

#### Instagram Business

```
1. Create personal IG account first (or use existing)
2. Go to Settings → Account → Switch to Professional
3. Choose "Business"
4. Connect to Facebook Page (required for API)
5. Add bio, profile pic, contact info
```

**API Setup:**
- Must connect to Facebook Page first
- Use Meta Business Suite for posting
- API access through Facebook Graph API
- Scopes: instagram_basic, instagram_content_publish

#### TikTok Business

```
1. Download TikTok app or go to tiktok.com
2. Sign up with business email
3. Go to Settings → Manage Account → Switch to Business
4. Choose category
5. Add bio, links, profile pic
```

**API Setup:**
- Apply at developers.tiktok.com
- Create app for "Content Posting"
- Review process can take 1-2 weeks
- Limited API compared to others

#### WhatsApp Business

```
1. Download WhatsApp Business app
2. Register with business phone number
3. Set up business profile (name, description, hours)
4. Add catalog if selling products
5. Set up quick replies, labels
```

**API Setup (Cloud API):**
- Go to developers.facebook.com
- Create app with WhatsApp product
- Verify business in Meta Business Manager
- Get phone number ID + access token
- Requires Meta Business verification

---

## Phase 2: API Integration

### Store Credentials Securely

Save to `~/.config/social/{platform}.json`:

```json
{
  "platform": "linkedin",
  "client_id": "xxx",
  "client_secret": "xxx",
  "access_token": "xxx",
  "refresh_token": "xxx",
  "page_id": "xxx",
  "expires_at": "2026-03-14T00:00:00Z"
}
```

**⚠️ NEVER commit these to git. Add to .gitignore.**

### Test Connection

After setup, verify each platform:

```bash
# LinkedIn - get company info
curl -H "Authorization: Bearer $TOKEN" \
  "https://api.linkedin.com/v2/organizations/$ORG_ID"

# Facebook - get page info  
curl "https://graph.facebook.com/v18.0/$PAGE_ID?access_token=$TOKEN"

# Instagram - get account info
curl "https://graph.facebook.com/v18.0/$IG_USER_ID?fields=username&access_token=$TOKEN"
```

---

## Phase 3: Connect to Agent

### Posting Flow

Once APIs are set up:

```
1. Agent drafts post (using client voice profile)
2. Owner approves via Telegram/WhatsApp
3. Agent calls platform API to publish
4. Agent logs to content-log.md
5. Agent updates learnings.md with any feedback
```

### Fallback: mac-use

If API isn't available or approved:
1. Agent uses mac-use skill
2. Opens browser to platform
3. Owner watches and approves
4. Agent posts via UI automation

---

## Client Handoff Checklist

After setup, give client:

- [ ] Login credentials (stored in their password manager)
- [ ] Which accounts are connected to agent
- [ ] How to approve posts (Telegram buttons, etc.)
- [ ] What the agent can/cannot do
- [ ] Emergency: how to revoke agent access

---

## Maintenance

### Token Refresh

Most tokens expire. Set up:
- LinkedIn: 60-day access tokens, 1-year refresh
- Facebook/IG: 60-day tokens, need refresh flow
- TikTok: Varies by permission

**Add to HEARTBEAT.md:**
```
- [ ] Check social token expiry (weekly)
```

### Handle Changes

If client changes:
- Password → Re-auth API
- Business name → Update all platforms
- Branding → New logo/cover everywhere

---

## Quick Reference: API Docs

| Platform | Developer Portal | Key Docs |
|----------|-----------------|----------|
| LinkedIn | developers.linkedin.com | Marketing API |
| Meta (FB/IG) | developers.facebook.com | Graph API, Pages API |
| TikTok | developers.tiktok.com | Content Posting API |
| Twitter/X | developer.twitter.com | v2 API |
| WhatsApp | developers.facebook.com/docs/whatsapp | Cloud API |
