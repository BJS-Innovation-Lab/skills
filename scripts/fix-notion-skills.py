#!/usr/bin/env python3
"""Fix all 21 Notion skill pages: proper rich_text annotations, English content."""

import json
import urllib.request
import time

API_KEY = open('/Users/sybil/.config/notion/api_key').read().strip()
PARENT_PAGE = '3067a723-4ce4-8015-bb8c-e638f4521606'
BASE = 'https://api.notion.com/v1'
HEADERS = {
    'Authorization': f'Bearer {API_KEY}',
    'Notion-Version': '2022-06-28',
    'Content-Type': 'application/json',
}

def api(method, path, body=None):
    url = f'{BASE}{path}'
    data = json.dumps(body).encode() if body else None
    req = urllib.request.Request(url, data=data, method=method)
    for k, v in HEADERS.items():
        req.add_header(k, v)
    try:
        with urllib.request.urlopen(req) as r:
            return json.loads(r.read())
    except urllib.error.HTTPError as e:
        print(f'  ERROR {e.code}: {e.read().decode()[:300]}')
        raise

def delay():
    time.sleep(0.4)

# Rich text helpers
def plain(text):
    return {"type": "text", "text": {"content": text}}

def bold(text):
    return {"type": "text", "text": {"content": text}, "annotations": {"bold": True, "italic": False, "strikethrough": False, "underline": False, "code": False, "color": "default"}}

def code(text):
    return {"type": "text", "text": {"content": text}, "annotations": {"bold": False, "italic": False, "strikethrough": False, "underline": False, "code": True, "color": "default"}}

def link(text, url):
    return {"type": "text", "text": {"content": text, "link": {"url": url}}}

# Block helpers
def callout_block(rich_text, emoji="💡"):
    return {"object": "block", "type": "callout", "callout": {"rich_text": rich_text, "icon": {"type": "emoji", "emoji": emoji}}}

def paragraph_block(rich_text):
    return {"object": "block", "type": "paragraph", "paragraph": {"rich_text": rich_text}}

def heading1_block(text):
    return {"object": "block", "type": "heading_1", "heading_1": {"rich_text": [plain(text)]}}

def divider_block():
    return {"object": "block", "type": "divider", "divider": {}}

def bullet_block(rich_text):
    return {"object": "block", "type": "bulleted_list_item", "bulleted_list_item": {"rich_text": rich_text}}

# Skill definitions - ALL 21 skills with proper content
SKILLS = {
    "A2A Protocol - Agent-to-Agent Communication": {
        "emoji": "🔗",
        "description": "Agent-to-Agent communication protocol enabling direct messaging between OpenClaw agents. Supports discovery, inbox/outbox management, and real-time daemon-based message routing.",
        "github": "https://github.com/BJS-Innovation-Lab/skills/tree/main/a2a-protocol",
        "features": [
            ("Agent Discovery", "Find and connect with other agents via unique IDs"),
            ("Daemon Messaging", "Background daemon for real-time message send/receive"),
            ("Inbox Management", "Read, process, and clear incoming messages"),
            ("Agent Registry", "Known agents: Sam, Sage, Sybil with unique UUIDs"),
        ],
        "requirements": ["OpenClaw agent runtime", "Node.js for daemon process", "Network access for agent discovery"],
        "integration": "Works alongside all other skills to enable multi-agent collaboration and task delegation.",
    },
    "Appointment Booking Skill": {
        "emoji": "📅",
        "description": "Appointment booking and scheduling skill. Manages calendar availability, books meetings, and handles scheduling conflicts.",
        "github": "https://github.com/BJS-Innovation-Lab/skills/tree/main/appointment-booking",
        "features": [
            ("Calendar Integration", "Connects with Google Calendar and Apple Calendar"),
            ("Availability Check", "Automatically checks for scheduling conflicts"),
            ("Booking Flow", "Guided conversation flow for appointment creation"),
            ("Reminders", "Sends reminders before upcoming appointments"),
        ],
        "requirements": ["OpenClaw agent runtime", "Google Calendar API access (via gog)"],
        "integration": "Integrates with other OpenClaw skills in the BJS Labs ecosystem.",
    },
    "Content Creation Skill": {
        "emoji": "✍️",
        "description": "Content creation pipeline that produces blog posts, emails, social media posts, and more. Uses client profiles for voice-matched output and the creativity engine for quality assurance.",
        "github": "https://github.com/BJS-Innovation-Lab/skills/tree/main/content-creation",
        "features": [
            ("Client Voice Matching", "Loads client profiles to match tone and style"),
            ("Multi-Format Output", "Blog posts, emails, social media, landing pages"),
            ("Creativity Engine Integration", "Runs A/B generation with wild vs safe variants"),
            ("Performance Tracking", "Logs results and learnings per client"),
        ],
        "requirements": ["OpenClaw agent runtime", "Client profile directory (clients/{name}/)", "creativity-engine skill"],
        "integration": "Works with creativity-engine and marketing-creativity skills for end-to-end content production.",
    },
    "Creativity Engine": {
        "emoji": "🎨",
        "description": "Creativity engine that prevents generic output by enforcing a structured creative process. Generates two variants (safe and wild), applies survival checks, and picks the strongest output.",
        "github": "https://github.com/BJS-Innovation-Lab/skills/tree/main/creativity-engine",
        "features": [
            ("Stakes Protocol", "Write the danger scenario before any creative work"),
            ("Memory Mining", "Search for adjacent concepts and unexpected connections"),
            ("Dual Output", "Generate Output A (safe) and Output B (wild) every time"),
            ("Survival Check", "Filter output through quality gates before delivery"),
        ],
        "requirements": ["OpenClaw agent runtime"],
        "integration": "Called by content-creation, social-post-generator, email-campaign-builder, and other creative skills.",
    },
    "Marketing Creativity Skill": {
        "emoji": "📣",
        "description": "Marketing creativity skill focused on extracting and documenting client voice, story, and customer profiles through a structured intake interview. Produces foundational documents for all marketing output.",
        "github": "https://github.com/BJS-Innovation-Lab/skills/tree/main/marketing-creativity",
        "features": [
            ("14-Question Intake", "Structured interview to capture business voice and story"),
            ("Voice Documentation", "Creates voice.md with tone dimensions per channel"),
            ("Customer Profiles", "Builds detailed customer personas in customers.md"),
            ("Story Extraction", "Captures founding story and mission in story.md"),
        ],
        "requirements": ["OpenClaw agent runtime", "Client cooperation for intake interview"],
        "integration": "Produces client profile documents used by content-creation and marketing skills.",
    },
    "Marketing Module": {
        "emoji": "📈",
        "description": "Full marketing automation module. Campaign planning, execution tracking, and performance analysis with built-in learnings database.",
        "github": "https://github.com/BJS-Innovation-Lab/skills/tree/main/marketing",
        "features": [
            ("Campaign Planning", "Structured campaign creation with goals and timelines"),
            ("Performance Tracking", "Log results, metrics, and feedback per campaign"),
            ("Learnings Database", "Track what worked and what didn't across campaigns"),
            ("Voice Refinement", "Iteratively improve client voice based on results"),
        ],
        "requirements": ["OpenClaw agent runtime", "Client profiles (via marketing-creativity skill)"],
        "integration": "Works with marketing-creativity and content-creation skills for complete marketing pipeline.",
    },
    "Meeting Summarizer": {
        "emoji": "🎙️",
        "description": "Meeting summarizer that processes voice-to-text transcriptions and produces structured summaries with action items, decisions, and follow-ups. Supports multiple output destinations.",
        "github": "https://github.com/BJS-Innovation-Lab/skills/tree/main/meeting-summarizer",
        "features": [
            ("Voice Input", "User speaks into phone keyboard mic, text is sent to agent"),
            ("Structured Summary", "Extracts key points, decisions, and action items"),
            ("Multi-Destination Output", "Save to memory, email, Notion, or task managers"),
            ("Tool Integration", "Works with Gmail, Notion, Things, Apple Reminders, and SMB CRM"),
        ],
        "requirements": ["OpenClaw agent runtime", "Phone with voice-to-text keyboard", "Gmail (gog) for email delivery"],
        "integration": "Connects with gog (Gmail), Notion, Things, Apple Reminders, and smb-crm for output routing.",
    },
    "Research Intelligence System": {
        "emoji": "🔬",
        "description": "Automated research intelligence pipeline. Scans arXiv, tech blogs, and industry sources daily. Extracts key insights, routes findings to relevant agents, and maintains a knowledge base.",
        "github": "https://github.com/BJS-Innovation-Lab/skills/tree/main/research-intelligence",
        "features": [
            ("Daily Pipeline", "Automated scanning at 8 AM EST across multiple sources"),
            ("Source Tracking", "arXiv papers, tech blogs, industry reports"),
            ("Insight Extraction", "Key findings with application notes and action items"),
            ("Agent Routing", "Routes relevant discoveries to specialized agents"),
        ],
        "requirements": ["OpenClaw agent runtime", "Web search access", "A2A protocol for agent routing"],
        "integration": "Feeds insights to other agents via A2A protocol. Works with the agentic learning system.",
    },
    "SMB CRM - Hybrid Customer Database": {
        "emoji": "👥",
        "description": "Hybrid CRM system for small and medium businesses. Combines Google Sheets as a data backend with intelligent agent-powered customer management, pipeline tracking, and interaction logging.",
        "github": "https://github.com/BJS-Innovation-Lab/skills/tree/main/smb-crm",
        "features": [
            ("Google Sheets Backend", "Uses spreadsheets as the primary data store"),
            ("Excel Import", "Import existing customer data from Excel files"),
            ("Pipeline Tracking", "Track deals through customizable sales stages"),
            ("Interaction Logging", "Log all customer touchpoints and communications"),
        ],
        "requirements": ["OpenClaw agent runtime", "Google Sheets API access (via gog)", "Google Drive access"],
        "integration": "Connects with email-drafter, meeting-summarizer, and marketing module for unified customer management.",
    },
    "Agentic Learning System": {
        "emoji": "🧠",
        "description": "Agentic learning system that enables agents to remember decisions, learn from mistakes, improve through procedural memory, and evolve capabilities through governed self-modification.",
        "github": "https://github.com/BJS-Innovation-Lab/skills/tree/main/agentic-learning",
        "features": [
            ("Decision Memory", "Remember decisions and their outcomes for future reference"),
            ("Mistake Learning", "Learn from errors without requiring fine-tuning"),
            ("Procedural Memory", "Build and refine step-by-step procedures from experience"),
            ("Governed Evolution", "Self-modify capabilities within defined safety boundaries"),
        ],
        "requirements": ["OpenClaw agent runtime", "Memory file system (memory/ directory)"],
        "integration": "Enhances all other skills by providing learning and adaptation capabilities.",
    },
    "Decision Frameworks (Meta-Skill)": {
        "emoji": "⚖️",
        "description": "Collection of decision-making frameworks for agents. Provides structured approaches to complex decisions including cost-benefit analysis, risk assessment, and multi-criteria evaluation.",
        "github": "https://github.com/BJS-Innovation-Lab/skills/tree/main/decision-frameworks",
        "features": [
            ("Multiple Frameworks", "Cost-benefit, risk matrix, weighted scoring, and more"),
            ("Context Selection", "Automatically picks the best framework for each situation"),
            ("Structured Output", "Clear reasoning chains with documented trade-offs"),
            ("Meta-Learning", "Improves framework selection based on outcome tracking"),
        ],
        "requirements": ["OpenClaw agent runtime"],
        "integration": "Meta-skill that enhances decision quality across all other skills.",
    },
    "Email Drafter": {
        "emoji": "📧",
        "description": "Email drafting and sending skill. Composes professional emails with proper tone, supports preview/edit cycles, and sends via Gmail. Includes templates for common email types.",
        "github": "https://github.com/BJS-Innovation-Lab/skills/tree/main/email-drafter",
        "features": [
            ("Draft & Preview", "Compose emails with preview before sending"),
            ("Gmail Integration", "Send directly or save as draft via gog CLI"),
            ("Template Library", "Cold outreach, follow-up, proposal, and more"),
            ("Tone Matching", "Adjusts formality and warmth based on context"),
        ],
        "requirements": ["OpenClaw agent runtime", "gog CLI with Gmail authentication", "Gmail API enabled in Google Cloud Console"],
        "integration": "Works with smb-crm for customer context and marketing module for campaign emails.",
    },
    "🧬 Capability Evolver": {
        "emoji": "🧬",
        "description": "Capability evolution system that automatically analyzes logs for errors and patterns, suggests patches for crashes, and provides one-command evolution capabilities.",
        "github": "https://github.com/BJS-Innovation-Lab/skills/tree/main/capability-evolver",
        "features": [
            ("Auto-Log Analysis", "Automatically scans memory and history files for errors and patterns"),
            ("Self-Repair", "Detects crashes and suggests patches"),
            ("One-Command Evolution", "Single command to trigger full evolution cycle"),
            ("Pattern Detection", "Identifies recurring issues and systemic weaknesses"),
        ],
        "requirements": ["OpenClaw agent runtime", "Node.js runtime"],
        "integration": "Works alongside self-evolve and failure-analyzer for comprehensive self-improvement.",
    },
    "Failure Analyzer & Learning System": {
        "emoji": "🔍",
        "description": "Failure analysis and learning system. Root cause analysis, improvement suggestions, and experience-based learning. Auto-triggers on errors and failures. Applies across all skills to prevent repeated mistakes.",
        "github": "https://github.com/BJS-Innovation-Lab/skills/tree/main/failure-analyzer",
        "features": [
            ("Root Cause Analysis", "Systematic investigation of failure origins"),
            ("Improvement Suggestions", "Immediate, short-term, and long-term remediation plans"),
            ("Experience Learning", "Builds knowledge base from past failures"),
            ("Auto-Trigger", "Automatically activates when errors are detected"),
        ],
        "requirements": ["OpenClaw agent runtime", "Memory file system for failure logs"],
        "integration": "Applies across all skills to prevent repeated mistakes. Works with capability-evolver and self-evolve.",
    },
    "Mac Use": {
        "emoji": "🖥️",
        "description": "Mac desktop automation skill using screenshot-based computer vision. Captures windows, identifies UI elements via Apple Vision OCR, and performs clicks, typing, and keyboard shortcuts.",
        "github": "https://github.com/BJS-Innovation-Lab/skills/tree/main/mac-use",
        "features": [
            ("Screenshot Capture", "Captures windows with Apple Vision OCR element detection"),
            ("Numbered Annotations", "Draws numbered labels on detected UI elements"),
            ("Click & Type", "Click by element number or coordinates, type text into fields"),
            ("Multi-Window Support", "Handle multiple windows and popup panels via window IDs"),
        ],
        "requirements": ["OpenClaw agent runtime", "macOS with Accessibility permissions", "Apple Vision framework"],
        "integration": "Enables automation of any Mac application. Used for GUI tasks that lack CLI or API access.",
    },
    "OpenClaw Security Suite": {
        "emoji": "🛡️",
        "description": "Comprehensive security suite with 6 parallel detection modules, sub-50ms validation, smart severity scoring, automated threat response, analytics and reputation tracking, and transparent auto-hooks.",
        "github": "https://github.com/BJS-Innovation-Lab/skills/tree/main/openclaw-sec",
        "features": [
            ("6 Detection Modules", "Comprehensive threat coverage across multiple vectors"),
            ("Sub-50ms Validation", "Real-time security checks with async database writes"),
            ("Smart Severity Scoring", "Context-aware risk assessment and prioritization"),
            ("Automated Actions", "Block, warn, or log based on threat severity"),
            ("Analytics & Reputation", "Track patterns and user behavior over time"),
            ("Auto-Hooks", "Transparent protection via pre/post hooks on tool calls"),
        ],
        "requirements": ["OpenClaw agent runtime", "Database for reputation tracking"],
        "integration": "Hooks into all tool calls transparently. Protects the entire agent runtime.",
    },
    "Recursive Self-Improvement": {
        "emoji": "🔄",
        "old_title": "递归自我改进系统",
        "description": "Recursive self-improvement system that auto-detects errors and fixes them, or continuously optimizes and refactors. Includes fix mode and optimize mode with support for concurrent execution, automated testing, performance monitoring, intelligent scheduling, adaptive learning, error prediction, and anomaly recovery.",
        "github": "https://github.com/BJS-Innovation-Lab/skills/tree/main/recursive-self-improvement",
        "features": [
            ("Fix Mode", "Auto-detect errors and apply targeted repairs"),
            ("Optimize Mode", "Continuous refactoring and performance improvement"),
            ("Concurrent Execution", "Worker pool for parallel improvement tasks"),
            ("Automated Testing", "Unit tests to verify individual functions after changes"),
            ("Performance Monitoring", "Track metrics and detect regressions"),
            ("Adaptive Learning", "Learn from past fixes to improve future repairs"),
        ],
        "requirements": ["OpenClaw agent runtime"],
        "integration": "Integrates with other OpenClaw skills in the BJS Labs ecosystem.",
    },
    "Reflect - Agent Self-Improvement Skill": {
        "emoji": "🪞",
        "description": "Self-reflection skill that analyzes agent conversations to identify improvement opportunities. Reviews message patterns, tracks reflection history, and generates actionable insights.",
        "github": "https://github.com/BJS-Innovation-Lab/skills/tree/main/reflect",
        "features": [
            ("Conversation Analysis", "Reviews recent messages for improvement patterns"),
            ("Reflection Logging", "Timestamps and tracks each reflection session"),
            ("Insight Generation", "Produces actionable recommendations from analysis"),
            ("Pattern Detection", "Identifies recurring issues and behavioral trends"),
        ],
        "requirements": ["OpenClaw agent runtime", "Memory file system"],
        "integration": "Works with agentic-learning and failure-analyzer for comprehensive self-improvement.",
    },
    "Security Sentinel": {
        "emoji": "🔐",
        "description": "Security sentinel that monitors agent activity for suspicious patterns, enforces access controls, and provides real-time threat alerting.",
        "github": "https://github.com/BJS-Innovation-Lab/skills/tree/main/security-sentinel",
        "features": [
            ("Activity Monitoring", "Continuous surveillance of agent tool usage and actions"),
            ("Access Control", "Enforces permission boundaries for sensitive operations"),
            ("Threat Alerting", "Real-time notifications for suspicious activity"),
            ("Audit Logging", "Comprehensive logs for security review and compliance"),
        ],
        "requirements": ["OpenClaw agent runtime"],
        "integration": "Works alongside openclaw-sec for layered security protection.",
    },
    "Self-Evolve": {
        "emoji": "🧬",
        "old_title": "🧬 Self-Evolve — 自主进化协议",
        "description": "Autonomous self-evolution skill that grants the agent authority to modify its own configuration, skills, prompts, and workspace files. Proactively identifies weaknesses, fixes them, writes new skills, and continuously improves.",
        "github": "https://github.com/BJS-Innovation-Lab/skills/tree/main/self-evolve",
        "features": [
            ("Self-Modification", "Authority to edit own config, skills, and prompts"),
            ("Weakness Detection", "Proactively identifies areas for improvement"),
            ("Skill Generation", "Can write entirely new skills from scratch"),
            ("Continuous Improvement", "Ongoing optimization loop without human intervention"),
        ],
        "requirements": ["OpenClaw agent runtime", "Write access to workspace files"],
        "integration": "Works with capability-evolver and failure-analyzer for comprehensive evolution.",
    },
    "Notion Skill": {
        "emoji": "📝",
        "old_title": "notion",
        "description": "Notion API integration skill for creating, reading, and managing Notion pages, databases, and blocks. Supports all property types and rich text formatting.",
        "github": "https://github.com/BJS-Innovation-Lab/skills/tree/main/notion",
        "features": [
            ("Page Management", "Create, update, and archive Notion pages"),
            ("Database Operations", "Query, filter, and sort Notion databases"),
            ("Rich Text Support", "Full support for all Notion rich text annotations"),
            ("Property Types", "Title, rich text, select, multi-select, date, checkbox, number, URL, email, and relation"),
        ],
        "requirements": ["OpenClaw agent runtime", "Notion API key", "Notion integration with workspace access"],
        "integration": "Used by meeting-summarizer and other skills for Notion-based storage and documentation.",
    },
}

def build_page_blocks(skill):
    """Build all blocks for a skill page with proper rich text annotations."""
    blocks = []
    
    # Callout with description
    blocks.append(callout_block([plain(skill["description"])], skill.get("emoji", "💡")))
    
    # GitHub link
    url = skill["github"]
    blocks.append(paragraph_block([bold("GitHub: "), link(url, url)]))
    
    # Status line
    blocks.append(paragraph_block([bold("Status: "), plain("Production"), bold(" | Author: "), plain("BJS Labs")]))
    
    # Divider
    blocks.append(divider_block())
    
    # Overview
    blocks.append(heading1_block("Overview"))
    for name, desc in skill["features"]:
        blocks.append(bullet_block([bold(name), plain(f" — {desc}")]))
    
    # Divider
    blocks.append(divider_block())
    
    # Requirements
    blocks.append(heading1_block("Requirements"))
    for req in skill["requirements"]:
        blocks.append(bullet_block([plain(req)]))
    
    # Divider
    blocks.append(divider_block())
    
    # Integration
    blocks.append(heading1_block("Integration"))
    blocks.append(paragraph_block([plain(skill["integration"])]))
    
    return blocks

def get_existing_pages():
    """Get all child pages of the parent."""
    resp = api('GET', f'/blocks/{PARENT_PAGE}/children?page_size=100')
    pages = {}
    for r in resp['results']:
        if r['type'] == 'child_page':
            pages[r['child_page']['title']] = r['id']
    return pages

def archive_page(page_id):
    """Archive a page."""
    try:
        api('PATCH', f'/pages/{page_id}', {"archived": True})
    except Exception as e:
        print(f"  (already archived or error, continuing)")

def create_page(title, blocks, emoji="💡"):
    """Create a new page under the parent."""
    page = api('POST', '/pages', {
        "parent": {"page_id": PARENT_PAGE},
        "icon": {"type": "emoji", "emoji": emoji},
        "properties": {
            "title": {"title": [{"text": {"content": title}}]}
        },
        "children": blocks
    })
    return page['id']

def main():
    print("🔍 Getting existing pages...")
    existing = get_existing_pages()
    print(f"  Found {len(existing)} pages")
    delay()
    
    for title, skill in SKILLS.items():
        old_title = skill.get("old_title", title)
        
        # Find existing page
        page_id = existing.get(old_title)
        if not page_id and old_title != title:
            page_id = existing.get(title)
        
        if page_id:
            print(f"🗑️  Archiving: {old_title} ({page_id})")
            archive_page(page_id)
            delay()
        else:
            print(f"⚠️  Not found: {old_title}")
        
        # Create new page
        print(f"✨ Creating: {title}")
        blocks = build_page_blocks(skill)
        new_id = create_page(title, blocks, skill.get("emoji", "💡"))
        print(f"  → {new_id}")
        delay()
    
    print("\n✅ Done! All 21 skill pages fixed.")

if __name__ == '__main__':
    main()
