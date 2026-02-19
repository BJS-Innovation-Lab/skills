# Research Dashboard Spec

## Overview
Add a Research Dashboard to BJS Labs HQ (https://hq-front-bjs-labs-c3qd.vercel.app) where team members can view research papers discovered by the Research Intelligence system.

## Data Source
- **Table:** `research_papers` (Supabase)
- **Columns:**
  - `id` (uuid)
  - `source` (text) - "arxiv" | "semantic_scholar"
  - `source_id` (text) - external ID
  - `title` (text)
  - `authors` (jsonb) - array of author names
  - `abstract` (text)
  - `published_date` (date)
  - `categories` (text[])
  - `pdf_url` (text)
  - `relevance_score` (int) - 1-10
  - `relevance_reasoning` (text)
  - `relevance_tags` (text[])
  - `status` (text) - "new" | "reviewed" | "archived"
  - `processed_at` (timestamp)
  - `discovered_at` (timestamp)
  - `discovered_by` (text)

## Route
`/research` - new page in HQ dashboard

## UI Components

### 1. Research Page (`src/app/research/page.tsx`)
- Header with title + stats (total papers, new today, avg relevance)
- Filter bar (source, relevance range, date range, tags)
- Paper list with infinite scroll or pagination

### 2. PaperCard Component
- Title (clickable to expand)
- Source badge (arXiv / Semantic Scholar)
- Relevance score pill (color coded: 7-8 yellow, 9-10 green)
- Authors (truncated)
- Published date
- Tags/categories
- Expandable abstract
- PDF link button

### 3. FilterBar Component
- Source dropdown (All, arXiv, Semantic Scholar)
- Relevance slider (1-10 range)
- Date picker (last 7d, 30d, all)
- Search input (title/abstract)

## Style
Match existing HQ dashboard style:
- White cards with slate-200 borders
- Rounded-xl corners
- Slate/emerald/amber color palette
- Tailwind CSS

## Files to Create
1. `src/app/research/page.tsx` - main page
2. `src/components/research/PaperCard.tsx` - paper display component
3. `src/components/research/FilterBar.tsx` - filters component
4. `src/components/research/StatsHeader.tsx` - stats display

## Implementation Steps
1. Create research page with basic layout
2. Add Supabase query for research_papers
3. Build PaperCard component
4. Add FilterBar with state management
5. Add real-time updates (optional)
6. Test and deploy
