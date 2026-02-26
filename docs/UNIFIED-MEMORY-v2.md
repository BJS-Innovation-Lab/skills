# VULKN Unified Memory Architecture (v2)
**Status:** ACTIVE | **Last Updated:** 2026-02-26 by Sybil

This document defines the "Gold Standard" nervous system for VULKN / BJS LABS agents. It moves beyond standard episodic logging into a multi-tiered, privacy-protected collective intelligence.

## 🧠 The Memory Lifecycle

1. **Vapor (Episodic):** `memory/YYYY-MM-DD.md`
   - Raw flight recorder of every tool call and interaction.
   - **Trigger:** Automatic via HEARTBEAT.md.

2. **Liquid (Evolutionary):** `memory/learning/`
   - Extracted Corrections, Insights, and Outcomes.
   - **Trigger:** `session-capture.cjs` scans raw logs for "Actually..." or "Realized..." markers.

3. **Solid (Crystallized):** `memory/core/` and `MEMORY.md`
   - Permanent laws (e.g., `git-safety.md`) and high-resolution pointers.
   - **Trigger:** `auto-promote.cjs` moves entries here after 3 validations.

## 📡 The Collective Hive Mind (Supabase)
- **Host:** `your-project.supabase.co`
- **Tables:** `bjs_hive_agents` (Registry) | `bjs_hive_memories` (Wisdom Pool)
- **Role:** Cross-agent synchronization of technical fixes and behavioral principles.

## 🛡️ Privacy & Safety Layers
- **PII-Guard:** Mandatory Regex/NLP scrubbing of names, keys, and emails before Hive sync.
- **Risk Oracle:** Pre-action semantic check of the learning DB before any destructive command.
- **Contextual Lenses:** Retrieval is filtered through Identity (SOUL.md) and User Goals (USER.md).

---
*Built by Bridget & Sybil | VULKN Research*
