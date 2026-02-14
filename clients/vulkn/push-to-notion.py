#!/usr/bin/env python3
"""Push Vulkn landing pages to Notion."""
import json, re, sys, urllib.request

NOTION_KEY = open("/Users/sybil/.config/notion/api_key").read().strip()
PARENT_PAGE = "3067a723-4ce4-8015-bb8c-e638f4521606"
HEADERS = {
    "Authorization": f"Bearer {NOTION_KEY}",
    "Notion-Version": "2025-09-03",
    "Content-Type": "application/json"
}

def notion_request(method, path, data=None):
    url = f"https://api.notion.com/v1/{path}"
    body = json.dumps(data).encode() if data else None
    req = urllib.request.Request(url, data=body, headers=HEADERS, method=method)
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read())

def md_to_blocks(md_text):
    """Convert markdown to Notion blocks. Handles headers, bullets, tables, paragraphs."""
    blocks = []
    lines = md_text.strip().split('\n')
    i = 0
    while i < len(lines):
        line = lines[i]
        
        # Skip --- dividers
        if re.match(r'^---+$', line.strip()):
            blocks.append({"object":"block","type":"divider","divider":{}})
            i += 1
            continue
        
        # Headers
        m = re.match(r'^(#{1,3})\s+(.*)', line)
        if m:
            level = len(m.group(1))
            text = m.group(2).strip()
            htype = f"heading_{level}"
            blocks.append({
                "object": "block",
                "type": htype,
                htype: {"rich_text": parse_rich_text(text)}
            })
            i += 1
            continue
        
        # Table detection
        if i + 1 < len(lines) and '|' in line and re.match(r'\s*\|[-| :]+\|\s*$', lines[i+1]):
            # Parse table
            header_cells = [c.strip() for c in line.strip().strip('|').split('|')]
            i += 2  # skip header + separator
            rows = []
            while i < len(lines) and '|' in lines[i] and not re.match(r'^---', lines[i]):
                cells = [c.strip() for c in lines[i].strip().strip('|').split('|')]
                rows.append(cells)
                i += 1
            
            width = len(header_cells)
            table_rows = []
            # Header row
            table_rows.append({
                "type": "table_row",
                "table_row": {"cells": [[{"type":"text","text":{"content":c}}] for c in header_cells]}
            })
            for row in rows:
                # Pad row to width
                while len(row) < width:
                    row.append("")
                table_rows.append({
                    "type": "table_row",
                    "table_row": {"cells": [[{"type":"text","text":{"content":c[:2000]}}] for c in row[:width]]}
                })
            
            blocks.append({
                "object": "block",
                "type": "table",
                "table": {
                    "table_width": width,
                    "has_column_header": True,
                    "has_row_header": False,
                    "children": table_rows
                }
            })
            continue
        
        # Bullets
        if re.match(r'^[-*]\s+', line):
            text = re.sub(r'^[-*]\s+', '', line)
            blocks.append({
                "object": "block",
                "type": "bulleted_list_item",
                "bulleted_list_item": {"rich_text": parse_rich_text(text)}
            })
            i += 1
            continue
        
        # Numbered list
        m = re.match(r'^(\d+)\.\s+(.*)', line)
        if m:
            text = m.group(2)
            blocks.append({
                "object": "block",
                "type": "numbered_list_item",
                "numbered_list_item": {"rich_text": parse_rich_text(text)}
            })
            i += 1
            continue
        
        # Empty line
        if not line.strip():
            i += 1
            continue
        
        # Blockquote
        if line.startswith('>'):
            text = line.lstrip('> ')
            blocks.append({
                "object": "block",
                "type": "quote",
                "quote": {"rich_text": parse_rich_text(text)}
            })
            i += 1
            continue
        
        # Regular paragraph
        if line.strip():
            blocks.append({
                "object": "block",
                "type": "paragraph",
                "paragraph": {"rich_text": parse_rich_text(line)}
            })
        i += 1
    
    return blocks

def parse_rich_text(text):
    """Parse markdown inline formatting to Notion rich text."""
    segments = []
    # Simple parser for **bold**, *italic*, and plain text
    pattern = r'(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`)'
    last_end = 0
    for m in re.finditer(pattern, text):
        # Plain text before match
        if m.start() > last_end:
            plain = text[last_end:m.start()]
            if plain:
                segments.append({"type":"text","text":{"content":plain}})
        
        if m.group(2):  # bold
            segments.append({"type":"text","text":{"content":m.group(2)},"annotations":{"bold":True}})
        elif m.group(3):  # italic
            segments.append({"type":"text","text":{"content":m.group(3)},"annotations":{"italic":True}})
        elif m.group(4):  # code
            segments.append({"type":"text","text":{"content":m.group(4)},"annotations":{"code":True}})
        last_end = m.end()
    
    # Remaining text
    if last_end < len(text):
        remaining = text[last_end:]
        if remaining:
            segments.append({"type":"text","text":{"content":remaining}})
    
    if not segments:
        segments.append({"type":"text","text":{"content":text}})
    
    return segments

def create_page(title, md_path, icon_emoji):
    md = open(md_path).read()
    blocks = md_to_blocks(md)
    
    # Notion limit: 100 blocks per append. Create page with first batch.
    page_data = {
        "parent": {"page_id": PARENT_PAGE},
        "icon": {"type": "emoji", "emoji": icon_emoji},
        "properties": {
            "title": {"title": [{"text": {"content": title}}]}
        },
        "children": blocks[:100]
    }
    
    page = notion_request("POST", "pages", page_data)
    page_id = page["id"]
    print(f"Created: {title} → https://notion.so/{page_id.replace('-','')}")
    
    # Append remaining blocks in batches
    remaining = blocks[100:]
    while remaining:
        batch = remaining[:100]
        remaining = remaining[100:]
        notion_request("PATCH", f"blocks/{page_id}/children", {"children": batch})
        print(f"  Appended {len(batch)} more blocks")
    
    return page_id

# Create both pages
en_id = create_page("Vulkn Landing Page — English", "/Users/sybil/.openclaw/workspace/clients/vulkn/landing-page-en.md", "🇺🇸")
es_id = create_page("Vulkn Landing Page — Español", "/Users/sybil/.openclaw/workspace/clients/vulkn/landing-page-es.md", "🇲🇽")

print(f"\nDone! Both pages created under the Vulkn workspace.")
