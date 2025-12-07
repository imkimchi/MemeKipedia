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

