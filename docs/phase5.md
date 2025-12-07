Continue development for Memekipedia.

=== GOAL ===
Build the wiki editor & detail page.

=== REQUIREMENTS ===
1. Tiptap Editor:
   - MDX-compatible serializer
   - Autosave every 5 seconds
   - Image upload to IPFS
   - Toolbar: bold, italic, underline, link, heading, code, image

2. Pages:
   /wiki/new
   /wiki/[id]/edit
   /wiki/[id]

3. Wiki Detail Page:
   - Title, category, badges
   - Metadata: creator wallet, created_at, updated_at, CID
   - Render MDX via next-mdx-remote
   - Show recent history (5 versions)

4. Save flow:
   Editor produces MDX + Snapshot
   Snapshot → IPFS → CID → save to Supabase (wiki table)

Generate all code.
Only output code.

