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

