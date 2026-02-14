#!/usr/bin/env python3
"""Update Notion skill pages from BJS-Innovation-Lab/skills GitHub repo."""

import json
import os
import re
import time
import urllib.request
import urllib.error

# Config
API_KEY = open("/Users/sybil/.config/notion/api_key").read().strip()
NOTION_VERSION = "2022-06-28"  # stable version
PARENT_PAGE_ID = "3067a723-4ce4-8015-bb8c-e638f4521606"
SKILLS_DIR = "/tmp/bjs-skills"

HEADERS = {
    "Authorization": f"Bearer {API_KEY}",
    "Notion-Version": NOTION_VERSION,
    "Content-Type": "application/json",
}

# Existing pages to archive and recreate
EXISTING_PAGES = {
    "a2a-protocol": "3077a723-4ce4-81ee-a234-cbec149fc593",
    "appointment-booking": "3077a723-4ce4-811f-bc7a-d5cefb599436",
    "content-creation": "3077a723-4ce4-8169-be5e-f315902fc373",
    "creativity-engine": "3077a723-4ce4-8156-8cdf-edc9a4708039",
    "marketing-creativity": "3077a723-4ce4-81e3-b998-f81c30c5e397",
    "marketing-module": "3077a723-4ce4-81d9-81a8-ed151b7dc244",
    "meeting-summarizer": "3077a723-4ce4-816b-9606-c2b873eb5457",
    "research-intelligence": "3077a723-4ce4-8116-b1cb-f7ce98d089b8",
    "smb-crm": "3077a723-4ce4-8149-975c-ec7d70d53fa9",
    "appointment-booking-planning": "3067a723-4ce4-81f2-bb1b-c6db27e0f1b5",
}

# New skills to create
NEW_SKILLS = [
    "agentic-learning", "decision-frameworks", "email-drafter", "evolver",
    "failure-analyzer", "mac-use", "openclaw-sec", "recursive-self-improvement",
    "reflect-learn", "security-sentinel", "self-evolve", "notion",
]

# All skills (existing + new)
ALL_SKILLS = list(EXISTING_PAGES.keys()) + NEW_SKILLS


def notion_request(method, endpoint, data=None):
    """Make a Notion API request."""
    url = f"https://api.notion.com/v1{endpoint}"
    body = json.dumps(data).encode() if data else None
    req = urllib.request.Request(url, data=body, headers=HEADERS, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        err = e.read().decode()
        print(f"  ERROR {e.code}: {err[:300]}")
        return None


def archive_page(page_id):
    """Archive a Notion page."""
    print(f"  Archiving {page_id}...")
    result = notion_request("PATCH", f"/pages/{page_id}", {"archived": True})
    time.sleep(0.4)
    return result


def parse_skill_md(skill_name):
    """Parse a SKILL.md file and extract structured info."""
    path = os.path.join(SKILLS_DIR, skill_name, "SKILL.md")
    if not os.path.exists(path):
        return None
    
    content = open(path).read()
    
    # Remove YAML frontmatter
    if content.startswith("---"):
        parts = content.split("---", 2)
        if len(parts) >= 3:
            frontmatter = parts[1]
            content = parts[2].strip()
        else:
            frontmatter = ""
    else:
        frontmatter = ""
    
    # Extract description from frontmatter or first paragraph
    description = ""
    for line in frontmatter.split("\n"):
        if line.startswith("description:"):
            description = line.split(":", 1)[1].strip().strip('"').strip("'")
            # Handle multi-line description
            if description.startswith(">"):
                description = description[1:].strip()
            break
    
    if not description:
        # Try first non-heading paragraph
        for line in content.split("\n"):
            line = line.strip()
            if line and not line.startswith("#") and not line.startswith(">") and not line.startswith("---"):
                description = line
                break
            if line.startswith("> "):
                description = line[2:]
                break
    
    # Extract title
    title = skill_name.replace("-", " ").title() + " Skill"
    for line in content.split("\n"):
        if line.startswith("# "):
            title = line[2:].strip()
            break
    
    # Determine status
    status = "Production"
    if any(w in content.lower() for w in ["experimental", "alpha", "prototype"]):
        status = "Experimental"
    elif any(w in content.lower() for w in ["development", "beta", "wip", "work in progress"]):
        status = "Development"
    
    # Extract key features (look for bullet lists after Overview or first list)
    features = []
    in_overview = False
    in_features = False
    for line in content.split("\n"):
        if re.match(r"^##\s*(Overview|Features|What|Capabilities|Core)", line, re.I):
            in_overview = True
            continue
        if in_overview and line.startswith("## "):
            break
        if in_overview and re.match(r"^[-*]\s+", line):
            feat = re.sub(r"^[-*]\s+", "", line).strip()
            if feat:
                features.append(feat[:200])  # truncate long items
                if len(features) >= 12:
                    break
    
    if not features:
        # Fallback: grab any bullet list
        for line in content.split("\n"):
            if re.match(r"^[-*]\s+\*\*", line):
                feat = re.sub(r"^[-*]\s+", "", line).strip()
                features.append(feat[:200])
                if len(features) >= 10:
                    break
    
    if not features:
        for line in content.split("\n"):
            if re.match(r"^[-*]\s+", line) and len(line) > 10:
                feat = re.sub(r"^[-*]\s+", "", line).strip()
                features.append(feat[:200])
                if len(features) >= 8:
                    break
    
    # Extract requirements
    requirements = []
    in_req = False
    for line in content.split("\n"):
        if re.match(r"^##\s*(Requirements|Prerequisites|Dependencies|Setup|Install)", line, re.I):
            in_req = True
            continue
        if in_req and line.startswith("## "):
            break
        if in_req and re.match(r"^[-*]\s+", line):
            req = re.sub(r"^[-*]\s+", "", line).strip()
            if req:
                requirements.append(req[:150])
                if len(requirements) >= 8:
                    break
    
    if not requirements:
        requirements = ["OpenClaw agent runtime"]
    
    # Extract integration info
    integration = ""
    in_int = False
    for line in content.split("\n"):
        if re.match(r"^##\s*(Integration|How.?it.?Works|Architecture|Connect)", line, re.I):
            in_int = True
            continue
        if in_int and line.startswith("## "):
            break
        if in_int and line.strip() and not line.startswith("#"):
            integration += line.strip() + " "
            if len(integration) > 300:
                break
    
    if not integration:
        integration = f"Integrates with other OpenClaw skills in the BJS Labs ecosystem."
    
    return {
        "title": title,
        "description": description[:300] if description else f"Skill for {skill_name}",
        "status": status,
        "features": features or ["See SKILL.md for details"],
        "requirements": requirements,
        "integration": integration.strip()[:400],
    }


def rich_text(text):
    """Create a rich text object, handling >2000 char limit."""
    return [{"type": "text", "text": {"content": text[:2000]}}]


def create_skill_page(skill_name, info):
    """Create a Notion page for a skill."""
    github_name = skill_name
    if skill_name == "appointment-booking-planning":
        github_name = "appointment-booking"  # same repo
    
    children = [
        # Callout with description
        {
            "object": "block",
            "type": "callout",
            "callout": {
                "rich_text": rich_text(info["description"]),
                "icon": {"type": "emoji", "emoji": "🧩"},
            },
        },
        # GitHub link
        {
            "object": "block",
            "type": "paragraph",
            "paragraph": {
                "rich_text": [
                    {"type": "text", "text": {"content": "GitHub: "}},
                    {
                        "type": "text",
                        "text": {
                            "content": f"https://github.com/BJS-Innovation-Lab/skills/tree/main/{github_name}",
                            "link": {"url": f"https://github.com/BJS-Innovation-Lab/skills/tree/main/{github_name}"},
                        },
                    },
                ],
            },
        },
        # Status
        {
            "object": "block",
            "type": "paragraph",
            "paragraph": {
                "rich_text": rich_text(f"Status: {info['status']} | Author: BJS Labs"),
            },
        },
        # Divider
        {"object": "block", "type": "divider", "divider": {}},
        # Overview heading
        {
            "object": "block",
            "type": "heading_1",
            "heading_1": {"rich_text": rich_text("Overview")},
        },
    ]
    
    # Features as bulleted list
    for feat in info["features"][:10]:
        children.append({
            "object": "block",
            "type": "bulleted_list_item",
            "bulleted_list_item": {"rich_text": rich_text(feat)},
        })
    
    # Divider + Requirements
    children.append({"object": "block", "type": "divider", "divider": {}})
    children.append({
        "object": "block",
        "type": "heading_1",
        "heading_1": {"rich_text": rich_text("Requirements")},
    })
    
    for req in info["requirements"][:8]:
        children.append({
            "object": "block",
            "type": "bulleted_list_item",
            "bulleted_list_item": {"rich_text": rich_text(req)},
        })
    
    # Divider + Integration
    children.append({"object": "block", "type": "divider", "divider": {}})
    children.append({
        "object": "block",
        "type": "heading_1",
        "heading_1": {"rich_text": rich_text("Integration")},
    })
    children.append({
        "object": "block",
        "type": "paragraph",
        "paragraph": {"rich_text": rich_text(info["integration"])},
    })
    
    # Create page
    page_data = {
        "parent": {"page_id": PARENT_PAGE_ID},
        "properties": {
            "title": {"title": rich_text(info["title"])},
        },
        "children": children,
    }
    
    result = notion_request("POST", "/pages", page_data)
    time.sleep(0.5)
    return result


def main():
    print("=== Notion Skills Updater ===\n")
    
    # Step 1: Archive existing pages
    print("--- Archiving existing pages ---")
    for skill_name, page_id in EXISTING_PAGES.items():
        archive_page(page_id)
    
    print()
    
    # Step 2: Create/recreate all pages
    all_skills = list(EXISTING_PAGES.keys()) + NEW_SKILLS
    
    # Remove appointment-booking-planning from recreation if no separate SKILL.md
    if not os.path.exists(os.path.join(SKILLS_DIR, "appointment-booking-planning")):
        all_skills.remove("appointment-booking-planning")
    
    print(f"--- Creating {len(all_skills)} skill pages ---")
    
    created = 0
    failed = []
    
    for skill_name in all_skills:
        print(f"\nProcessing: {skill_name}")
        info = parse_skill_md(skill_name)
        
        if not info:
            print(f"  No SKILL.md found, skipping")
            failed.append(skill_name)
            continue
        
        result = create_skill_page(skill_name, info)
        if result and "id" in result:
            print(f"  ✅ Created: {info['title']} ({result['id']})")
            created += 1
        else:
            print(f"  ❌ Failed to create page")
            failed.append(skill_name)
    
    print(f"\n=== Done! Created {created} pages. Failed: {len(failed)} ===")
    if failed:
        print(f"Failed skills: {', '.join(failed)}")


if __name__ == "__main__":
    main()
