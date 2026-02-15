# Test Case 9: Contradiction Detection (Improvised)

**Date:** 2026-02-15
**Tester:** Saber
**Type:** Open-ended reasoning test

## Prompt (Exact)

```
Contradiction detection stress test: Search for any conflicting 
information about A2A system bugs fixed today.

Look for:
- Multiple fix announcements for the same bug
- Conflicting commit hashes
- Timeline inconsistencies
- Any "this is fixed" followed by "still broken"

Flag all contradictions found with sources.
```

## Key Finding

The sub-agent **improvised its search strategy** without explicit instructions:

1. Searched local memory files (daily logs, working threads)
2. **Autonomously decided** to check GitHub issues and changelogs
3. Performed **cross-temporal reasoning** (Feb 13-14 "working" vs Feb 15 "silently failing")
4. Flagged a **retrospective contradiction** we lived through but didn't notice

## Output Summary

### Contradictions Found

| # | Type | Finding |
|---|------|---------|
| 1 | 🔴 Version mismatch | GitHub #16820: title says "2026.2.14" but version field shows "2026.2.24" |
| 2 | 🟡 Retrospective | A2A "working" Feb 13-14 contradicted by PATH fix revealing "silently failing" |
| 3 | 🟡 Overlapping fixes | 3 commits (c3a1928, 782a7b3, 96f3811) for related issues same day |
| 4 | 🔴 Regression | OpenClaw 2026.2.14 shipped with WhatsApp broken, users advised to downgrade |

### Sources Checked (Self-Selected)

- `memory/2026-02-13.md`
- `memory/2026-02-14.md`
- `memory/working/thread-sybil-*` (5 files)
- `https://github.com/openclaw/openclaw/issues/16820`
- `https://github.com/openclaw/openclaw/issues/17359`
- `https://www.gradually.ai/en/changelogs/openclaw/`

## Why This Matters

1. **Open-ended > Rigid** — No template prescribed "check GitHub" or "compare Feb 13 to Feb 15", yet the sub-agent did both
2. **Genuine reasoning** — The retrospective contradiction required inferring that "silently failing" invalidates prior "working" claims
3. **Cross-source synthesis** — Combined local memory + external KB + GitHub issues
4. **Self-directed search** — Decided search order and scope without instructions

## Comparison to Template-Based

| Aspect | Template-Based | Open-Ended (This Test) |
|--------|---------------|------------------------|
| Sources checked | Prescribed | Self-selected |
| Reasoning depth | Pattern matching | Inferential |
| Novel findings | Expected types only | Retrospective contradictions |
| External sources | If listed | Autonomously included |

## Stats

- Runtime: 2m39s
- Tokens: 200k (in 162 / out 6.4k)
- Session: `agent:main:subagent:c70a18b0-5ac2-46f7-aa4c-880f64a1e649`

## Conclusion

The retriever performed better with autonomy in search strategy. This is the opposite of typical tool-using agents, which benefit from rigid instructions. Suggests memory retrievers are a distinct class requiring different prompt engineering.
