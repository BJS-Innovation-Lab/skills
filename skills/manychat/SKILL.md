---
name: manychat
description: "ManyChat API for chatbot automation on Facebook, Instagram, WhatsApp, and Telegram. Send messages, manage subscribers, trigger flows, and set custom fields."
metadata:
  {
    "openclaw":
      {
        "emoji": "💬",
        "requires": { "env": ["MANYCHAT_API_KEY"] }
      }
  }
---

# ManyChat Skill

Control ManyChat chatbots via the API. Send messages, manage subscribers, trigger flows, and update custom fields.

## Setup

### Get API Key

1. Go to ManyChat → Settings → API
2. Copy your API key
3. Add to environment:

```bash
export MANYCHAT_API_KEY="your-api-key"
```

Or add to `TOOLS.md` for reference.

---

## API Base URL

```
https://api.manychat.com/fb/
```

All requests need:
```bash
-H "Authorization: Bearer $MANYCHAT_API_KEY"
-H "Content-Type: application/json"
```

---

## Common Operations

### Get Subscriber Info

```bash
curl -X GET "https://api.manychat.com/fb/subscriber/getInfo?subscriber_id=SUBSCRIBER_ID" \
  -H "Authorization: Bearer $MANYCHAT_API_KEY"
```

### Find Subscriber by Custom Field

```bash
curl -X GET "https://api.manychat.com/fb/subscriber/findByCustomField?field_id=FIELD_ID&field_value=VALUE" \
  -H "Authorization: Bearer $MANYCHAT_API_KEY"
```

### Send Text Message

```bash
curl -X POST "https://api.manychat.com/fb/sending/sendContent" \
  -H "Authorization: Bearer $MANYCHAT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "subscriber_id": "SUBSCRIBER_ID",
    "data": {
      "version": "v2",
      "content": {
        "messages": [
          {
            "type": "text",
            "text": "Hello! How can I help you today?"
          }
        ]
      }
    }
  }'
```

### Send Message with Buttons

```bash
curl -X POST "https://api.manychat.com/fb/sending/sendContent" \
  -H "Authorization: Bearer $MANYCHAT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "subscriber_id": "SUBSCRIBER_ID",
    "data": {
      "version": "v2",
      "content": {
        "messages": [
          {
            "type": "text",
            "text": "Choose an option:",
            "buttons": [
              {
                "type": "url",
                "caption": "Visit Website",
                "url": "https://example.com"
              },
              {
                "type": "call",
                "caption": "Call Us",
                "phone": "+1 555 555 5555"
              }
            ]
          }
        ]
      }
    }
  }'
```

### Send Image

```bash
curl -X POST "https://api.manychat.com/fb/sending/sendContent" \
  -H "Authorization: Bearer $MANYCHAT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "subscriber_id": "SUBSCRIBER_ID",
    "data": {
      "version": "v2",
      "content": {
        "messages": [
          {
            "type": "image",
            "url": "https://example.com/image.jpg"
          }
        ]
      }
    }
  }'
```

### Send Gallery (Cards)

```bash
curl -X POST "https://api.manychat.com/fb/sending/sendContent" \
  -H "Authorization: Bearer $MANYCHAT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "subscriber_id": "SUBSCRIBER_ID",
    "data": {
      "version": "v2",
      "content": {
        "messages": [
          {
            "type": "cards",
            "elements": [
              {
                "title": "Product 1",
                "subtitle": "Description here",
                "image_url": "https://example.com/product1.jpg",
                "action_url": "https://example.com/product1",
                "buttons": [
                  {
                    "type": "url",
                    "caption": "Buy Now",
                    "url": "https://example.com/buy/1"
                  }
                ]
              },
              {
                "title": "Product 2",
                "subtitle": "Another product",
                "image_url": "https://example.com/product2.jpg",
                "action_url": "https://example.com/product2"
              }
            ],
            "image_aspect_ratio": "horizontal"
          }
        ]
      }
    }
  }'
```

### Trigger a Flow

```bash
curl -X POST "https://api.manychat.com/fb/sending/sendFlow" \
  -H "Authorization: Bearer $MANYCHAT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "subscriber_id": "SUBSCRIBER_ID",
    "flow_ns": "content20180221085508_278589"
  }'
```

Note: `flow_ns` is found in the URL when viewing the flow in ManyChat.

### Add Tag to Subscriber

```bash
curl -X POST "https://api.manychat.com/fb/subscriber/addTag" \
  -H "Authorization: Bearer $MANYCHAT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "subscriber_id": "SUBSCRIBER_ID",
    "tag_id": "TAG_ID"
  }'
```

### Remove Tag from Subscriber

```bash
curl -X POST "https://api.manychat.com/fb/subscriber/removeTag" \
  -H "Authorization: Bearer $MANYCHAT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "subscriber_id": "SUBSCRIBER_ID",
    "tag_id": "TAG_ID"
  }'
```

### Set Custom Field

```bash
curl -X POST "https://api.manychat.com/fb/subscriber/setCustomField" \
  -H "Authorization: Bearer $MANYCHAT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "subscriber_id": "SUBSCRIBER_ID",
    "field_id": "FIELD_ID",
    "field_value": "new value"
  }'
```

### Get Bot Custom Fields

```bash
curl -X GET "https://api.manychat.com/fb/page/getCustomFields" \
  -H "Authorization: Bearer $MANYCHAT_API_KEY"
```

### Get Bot Tags

```bash
curl -X GET "https://api.manychat.com/fb/page/getTags" \
  -H "Authorization: Bearer $MANYCHAT_API_KEY"
```

### Get Bot Flows

```bash
curl -X GET "https://api.manychat.com/fb/page/getFlows" \
  -H "Authorization: Bearer $MANYCHAT_API_KEY"
```

---

## Message Types

| Type | Description |
|------|-------------|
| `text` | Plain text message |
| `image` | Image (JPG, PNG, GIF) |
| `video` | Video (max 25MB) |
| `audio` | Audio file (max 25MB) |
| `file` | Any file (max 25MB) |
| `cards` | Horizontal scrollable gallery |

## Button Types

| Type | Description |
|------|-------------|
| `url` | Opens external URL |
| `call` | Opens phone dialer |
| `flow` | Triggers another flow |
| `node` | Goes to specific node |
| `buy` | Stripe/PayPal payment |
| `dynamic_block_callback` | Calls external webhook |

---

## Actions (in responses)

Actions can be attached to messages to perform side effects:

```json
{
  "version": "v2",
  "content": {
    "messages": [...],
    "actions": [
      {
        "action": "add_tag",
        "tag_name": "contacted"
      },
      {
        "action": "set_field_value",
        "field_name": "last_contact",
        "value": "2026-02-25"
      }
    ]
  }
}
```

### Available Actions

| Action | Parameters |
|--------|------------|
| `add_tag` | `tag_name` |
| `remove_tag` | `tag_name` |
| `set_field_value` | `field_name`, `value` |
| `unset_field_value` | `field_name` |

---

## Quick Replies

Add quick reply buttons at the bottom of messages:

```json
{
  "version": "v2",
  "content": {
    "messages": [
      {
        "type": "text",
        "text": "What would you like to do?"
      }
    ],
    "quick_replies": [
      {
        "type": "node",
        "caption": "Get Help",
        "target": "Help Node"
      },
      {
        "type": "node",
        "caption": "Contact Sales",
        "target": "Sales Node"
      }
    ]
  }
}
```

---

## Limits

- Max 10 messages per response
- Max 11 quick replies
- Max 5 actions per response
- Files max 25MB

---

## Helper Script

Create a helper script for common operations:

```bash
#!/bin/bash
# manychat.sh - ManyChat API helper

API_KEY="${MANYCHAT_API_KEY}"
BASE_URL="https://api.manychat.com/fb"

mc_send() {
  local subscriber_id="$1"
  local message="$2"
  
  curl -s -X POST "$BASE_URL/sending/sendContent" \
    -H "Authorization: Bearer $API_KEY" \
    -H "Content-Type: application/json" \
    -d "{
      \"subscriber_id\": \"$subscriber_id\",
      \"data\": {
        \"version\": \"v2\",
        \"content\": {
          \"messages\": [{\"type\": \"text\", \"text\": \"$message\"}]
        }
      }
    }"
}

mc_trigger_flow() {
  local subscriber_id="$1"
  local flow_ns="$2"
  
  curl -s -X POST "$BASE_URL/sending/sendFlow" \
    -H "Authorization: Bearer $API_KEY" \
    -H "Content-Type: application/json" \
    -d "{
      \"subscriber_id\": \"$subscriber_id\",
      \"flow_ns\": \"$flow_ns\"
    }"
}

mc_get_subscriber() {
  local subscriber_id="$1"
  
  curl -s -X GET "$BASE_URL/subscriber/getInfo?subscriber_id=$subscriber_id" \
    -H "Authorization: Bearer $API_KEY"
}

mc_add_tag() {
  local subscriber_id="$1"
  local tag_id="$2"
  
  curl -s -X POST "$BASE_URL/subscriber/addTag" \
    -H "Authorization: Bearer $API_KEY" \
    -H "Content-Type: application/json" \
    -d "{\"subscriber_id\": \"$subscriber_id\", \"tag_id\": \"$tag_id\"}"
}

# Usage: source manychat.sh
# mc_send "123456" "Hello!"
# mc_trigger_flow "123456" "content123_456"
```

---

## Channels

ManyChat supports multiple channels. Replace `/fb/` in URLs with:

| Channel | URL Path |
|---------|----------|
| Facebook | `/fb/` |
| Instagram | `/ig/` |
| WhatsApp | `/wa/` |
| Telegram | `/tg/` |

Example for Instagram:
```bash
curl -X POST "https://api.manychat.com/ig/sending/sendContent" \
  -H "Authorization: Bearer $MANYCHAT_API_KEY" \
  ...
```

---

## Docs

- API Reference: https://api.manychat.com/swagger
- Dynamic Blocks: https://manychat.github.io/dynamic_block_docs/
- Instagram/WhatsApp/Telegram: https://manychat.github.io/dynamic_block_docs/channels/

---

*Questions? Ask Sybil via A2A.*
