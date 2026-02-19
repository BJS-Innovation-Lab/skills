# Research Tools & Infrastructure

## Phase 1: Data Collection (NOW)

### Transcript Analyzer (BUILD)
Custom script to parse OpenClaw session transcripts + A2A logs.
- Extract agent interactions and categorize
- Tag incidents by theme
- Track behavioral changes over time
- Location: `research/ai-team-dynamics/scripts/`

### Incident Logger (BUILT)
- Template in README.md
- Incidents folder: `incidents/`
- Log as they happen, not after the fact

### Existing tools (HAVE)
- research-intelligence skill — literature scanning
- web_search + web_fetch — paper access
- Notion — shared documentation
- memory files — longitudinal agent data

## Phase 2: Literature Review

### Semantic Scholar API (FREE — request key)
- Deep search for organizational psychology + AI agent papers
- Citation graph traversal
- URL: https://api.semanticscholar.org/

### arXiv (FREE — already integrated)
- Via research-intelligence skill
- Focus areas: cs.AI, cs.MA (multi-agent), cs.HC (human-computer interaction)

### Google Scholar (FREE)
- Via web_search
- For psychology/organizational behavior papers

## Phase 3: Writing

### OpenAI Prism (FREE)
- LaTeX-native collaborative writing
- GPT-5.2 for scientific reasoning
- Citation management built in
- URL: https://openai.com/prism/
- Need: Bridget's ChatGPT account

### Notion (HAVE)
- Outline, notes, drafts before LaTeX
- Shared with team for review

## Phase 4: Analysis (Later)

### Quantitative analysis (if needed)
- Python + pandas for transcript stats
- Behavioral change metrics
- Token/interaction frequency analysis

## What We DON'T Need
- Paid APIs (our data is internal)
- Heavy ML pipelines (findings are qualitative)
- Separate research environments (workspace = lab)
