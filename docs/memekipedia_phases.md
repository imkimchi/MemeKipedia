# Memekipedia Development Phases

---

## Phase 1: Project Skeleton

You are the lead engineer for Memekipedia, a Web3-powered wiki platform.

=== TECH STACK ===
- Next.js 14 (App Router)
- TypeScript
- TailwindCSS
- Radix UI
- MDX via next-mdx-remote
- Tiptap (later)
- Zustand
- Wagmi + RainbowKit (wallet-only login)
- Supabase Postgres (hosted on AWS)
- Infura IPFS

=== DESIGN GUIDE (Memekipedia v1) ===
Primary: #a855f7
Secondary: #98fce5
Background: #0f172a
Surface: #1e293b
Text: #f1f5f9

Typography:
- Display: text-4xl font-bold
- H1: text-3xl font-semibold
- H2: text-2xl font-semibold
- Body: text-base leading-relaxed

UI Rules:
- Card: rounded-lg border border-slate-700 bg-slate-800 p-4 shadow-sm
- Primary Button: bg-[#a855f7] hover:bg-[#9333ea] text-white rounded-md px-4 py-2
- Input: bg-slate-800 border-slate-600 rounded-md px-3 py-2 text-slate-100 focus:ring-2 focus:ring-[#a855f7]

=== GOAL OF PHASE 1 ===
Generate the full project skeleton:

1. app/layout.tsx
   - Navbar with Connect Wallet button
   - Footer
   - Radix setup

2. /components/ui/*
   - Button
   - Card
   - Input
   - Skeleton
   - Modal (Radix Dialog)
   - Badge

3. /lib/*
   - supabase client
   - wagmi config
   - theme helper
   - global types

4. Dark mode only.

=== RULES ===
- Follow design guide exactly.
- Use Tailwind + Radix only.
- No placeholders or lorem ipsum.
- Output full file structures and code.

Only output code. Do not restate instructions.
Generate Phase 1 now.

---

## Phase 2: Wallet Authentication

Continue development for Memekipedia.

=== GOAL ===
Implement wallet-based authentication with Supabase integration.

=== REQUIREMENTS ===
1. Wallet connect via RainbowKit + Wagmi.
2. When user connects:
   - Call POST /api/auth/init
   - Server route upserts a user:
       id (uuid)
       wallet (text, unique)
       nickname (text)
       settings (jsonb)
       created_at (timestamp)

3. Create:
   - app/api/auth/init/route.ts (POST)
   - useUser() hook (Zustand)
   - useInitUser(walletAddress) → calls API and stores result

4. Navbar:
   - Show connected wallet
   - Link to /account

Generate all necessary files.

Only output code.

---

## Phase 3: IPFS Upload & Snapshot System

Continue development for Memekipedia.

=== GOAL ===
Implement IPFS upload (Infura) + Snapshot JSON system.

=== SNAPSHOT JSON FORMAT ===
{
  "version": 1,
  "type": "wiki",
  "title": "...",
  "category": "...",
  "body_mdx": "...",
  "media": [
    { "type": "image", "cid": "Qm...", "filename": "..." }
  ],
  "editor": "0x123...",
  "timestamp": 1700000000
}

=== REQUIREMENTS ===
1. /lib/ipfs.ts:
   uploadText → CID
   uploadFile → CID
   uploadSnapshot(snapshot) → CID

2. File size limits:
   - image/video < 5MB
   - snapshot < 1MB

3. Editor integrations:
   - ImageUploadButton → Uploads to IPFS
   - Snapshot save function

4. Supabase table: wiki
   - id
   - title
   - category
   - cid (text)
   - editor (wallet)
   - created_at
   - updated_at

Generate all code.
Only output code.

---

## Phase 4: Search & Pagination

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

---

## Phase 5: Wiki Editor & Detail Page

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

---

## Phase 6: Advanced Features (Non-Blockchain)

Continue development for Memekipedia.

=== GOAL ===
Implement non-blockchain advanced features.

=== FEATURES ===
1. Bounty Hub
   /bounty
   /bounty/[id]
   - Create bounty (title, description, reward_M, deadline)
   - Submit entry (submit CID)
   - List submissions sorted by upvotes

2. User Profile
   /account
   - wallet
   - badges
   - staking (placeholder until Phase 7)
   - edit history
   - rewards history

3. Home Dashboard
   - total wikis
   - weekly active editors
   - treasury amount
   - trending searches

Generate all UI + API files.
Only output code.

---

## Phase 7: Blockchain Features

Continue development for Memekipedia.

=== GOAL ===
Implement blockchain features.

=== CONTRACTS (Hardhat) ===
1. MToken (ERC20)
2. BadgeNFT (ERC721)
3. StakingContract
4. RewardDistributor
   - pull-based reward claims
   - editors earn M tokens
   - staking multiplier
   - badge multiplier

=== FRONTEND (wagmi) ===
1. Staking page:
   - stake
   - unstake
   - view lock period
   - view pending rewards

2. Badge gallery:
   - display owned Badge NFTs

3. Reward Claim button:
   - call rewardDistributor.claim()

=== DELIVERABLES ===
- Full contracts
- Deployment scripts
- Wagmi hooks
- UI pages

Only output code.
