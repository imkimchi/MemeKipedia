# Memekipedia Setup Guide

## 1. Install Dependencies

```bash
# Main project
pnpm install

# Contracts
cd contracts
pnpm install
cd ..
```

## 2. Environment Variables

Create `.env.local` in root:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# WalletConnect
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_walletconnect_project_id

# IPFS (Infura)
INFURA_IPFS_PROJECT_ID=your_infura_project_id
INFURA_IPFS_PROJECT_SECRET=your_infura_project_secret

# Contracts (after deployment)
NEXT_PUBLIC_MTOKEN_ADDRESS=
NEXT_PUBLIC_BADGENFT_ADDRESS=
NEXT_PUBLIC_STAKING_ADDRESS=
NEXT_PUBLIC_REWARD_DISTRIBUTOR_ADDRESS=
```

Create `.env` in `contracts/`:

```env
SEPOLIA_RPC_URL=your_alchemy_or_infura_sepolia_url
MAINNET_RPC_URL=your_alchemy_or_infura_mainnet_url
PRIVATE_KEY=your_deployer_private_key
```

## 3. Supabase Setup

1. Go to https://supabase.com
2. Create a new project
3. Copy your project URL and anon key to `.env.local`
4. In SQL Editor, run `docs/supabase_schema.sql`

## 4. WalletConnect Setup

1. Go to https://cloud.walletconnect.com
2. Create a new project
3. Copy Project ID to `.env.local`

## 5. Infura IPFS Setup

1. Go to https://infura.io
2. Create IPFS project
3. Copy Project ID and Secret to `.env.local`

## 6. Deploy Contracts

```bash
cd contracts
pnpm compile
pnpm run deploy --network sepolia  # or mainnet
```

Copy the deployed addresses to `.env.local`:
- NEXT_PUBLIC_MTOKEN_ADDRESS
- NEXT_PUBLIC_BADGENFT_ADDRESS
- NEXT_PUBLIC_STAKING_ADDRESS
- NEXT_PUBLIC_REWARD_DISTRIBUTOR_ADDRESS

## 7. Run Development Server

```bash
pnpm dev
```

Visit http://localhost:3000

## 8. Testing

1. Connect wallet (MetaMask/Rainbow)
2. Create a wiki
3. Create a bounty
4. Stake tokens (need M tokens)
5. Claim rewards

## Common Issues

### Supabase Connection Error
- Check URL and anon key
- Verify tables are created

### IPFS Upload Failed
- Check Infura credentials
- Verify file size < 5MB

### Contract Interaction Failed
- Check contract addresses in `.env.local`
- Verify wallet has enough ETH for gas
- Check network (Sepolia vs Mainnet)

### Wallet Not Connecting
- Check WalletConnect Project ID
- Clear browser cache
- Try different wallet
