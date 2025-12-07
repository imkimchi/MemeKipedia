Continue development for Memekipedia.

=== GOAL ===
Implement:
- Full-text search via Supabase Postgres FTS
- Filters (category, sort)
- Pagination (cursor-based, limit 20)
- Auto-complete with 250ms debounce

=== REQUIREMENTS ===
1. DB Index:
CREATE INDEX wiki_fts_idx
ON wiki USING GIN (to_tsvector('simple', title || ' ' || category));

2. API:
app/api/wiki/search/route.ts
Supports:
  q, category, sort, cursor, limit

3. Frontend:
- SearchBar with 250ms debounce
- Category filter dropdown
- Sort dropdown
- WikiCard grid
- Pagination: Next / Prev buttons

Generate all code.
Only output code.

