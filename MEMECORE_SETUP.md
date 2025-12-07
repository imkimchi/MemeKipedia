# Memecore Integration Setup Guide

This guide walks you through setting up the Memecore memecoin launchpad feature for your wiki platform.

## Overview

Each wiki automatically deploys a unique MRC-20 token on the Memecore blockchain:
- **Wiki Title** → Token Name
- **Wiki Slug** → Token Symbol (sanitized)
- **Wiki Logo** → Token Image/Metadata
- **Wiki Description** → Token Description

## Prerequisites

1. Node.js 18+ and npm/yarn
2. A wallet with Memecore testnet tokens (M)
3. Supabase database access
4. Basic understanding of Ethereum/EVM blockchains

## Step 1: Get Testnet Tokens

### Create/Import Wallet

```bash
# Generate new wallet (save the private key!)
npx hardhat run contracts/scripts/generate-wallet.js
```

Or import your existing wallet private key.

### Fund Wallet from Faucet

1. Visit: https://faucet.memecore.com/insectarium
2. Enter your wallet address
3. Complete reCAPTCHA
4. Click "Receive Insectarium $M"
5. Wait for 450M test tokens (~30 seconds)

### Verify Balance

```bash
# Check balance on block explorer
# Replace YOUR_ADDRESS with your wallet address
open "https://insectarium.blockscout.memecore.com/address/YOUR_ADDRESS"
```

## Step 2: Compile Smart Contracts

```bash
cd contracts

# Install dependencies
npm install

# Compile contracts
npx hardhat compile
```

This generates the MRC20Token contract artifacts.

### Extract Bytecode

```bash
# Extract bytecode for deployment
cat artifacts/contracts/MRC20Token.sol/MRC20Token.json | jq -r '.bytecode'
```

Copy the output (starts with `0x...`).

## Step 3: Configure Environment Variables

Create `.env.local` in project root:

```bash
# Memecore Configuration
MEMECORE_PRIVATE_KEY=0xYOUR_PRIVATE_KEY_HERE
MEMECORE_NETWORK=insectarium
ENABLE_TOKEN_DEPLOYMENT=true

# Paste the bytecode from Step 2
MRC20_BYTECODE=0x608060405234801561...
```

**Security Warning**: Never commit private keys to git! Add `.env.local` to `.gitignore`.

## Step 4: Update Database Schema

Run the migration to add token fields to your wiki table:

```bash
# Using Supabase CLI
supabase db push migrations/add_token_fields_to_wiki.sql

# Or run SQL directly in Supabase dashboard
```

The migration adds these columns to the `wiki` table:
- `token_address`: Contract address on Memecore
- `token_symbol`: Token ticker (e.g., "PEPE")
- `token_name`: Full token name
- `token_supply`: Initial supply
- `deploy_tx_hash`: Deployment transaction hash
- `token_network`: Network name (insectarium/mainnet)

## Step 5: Test Token Deployment

### Test via Hardhat Script

```bash
cd contracts

# Deploy a test token
npx hardhat run scripts/deploy-mrc20.ts --network memecoreInsectarium
```

Expected output:
```
Deploying MRC-20 token with account: 0x...
Account balance: 450000000000000000000000000
Token deployed to: 0x...
Transaction hash: 0x...
Verify on explorer: https://insectarium.blockscout.memecore.com/address/0x...
```

### Test via Application

```bash
# Start development server
npm run dev

# Create a new wiki with token deployment enabled
```

## Step 6: Verify Deployment

### Check Block Explorer

Visit the explorer URL from deployment output:
```
https://insectarium.blockscout.memecore.com/address/0xTOKEN_ADDRESS
```

You should see:
- Contract creation transaction
- Token name, symbol, supply
- Initial balance in deployer wallet

### Query Token Information

```typescript
import { getTokenInfo } from '@/lib/memecore/token-deployer'

const info = await getTokenInfo('0xTOKEN_ADDRESS', 'insectarium')
console.log(info)
// {
//   name: "Test Wiki Token",
//   symbol: "TWIKI",
//   totalSupply: "1000000000000000000000000000",
//   decimals: 18,
//   address: "0x..."
// }
```

## Step 7: Create a Wiki with Token

### Via UI

1. Navigate to `/wiki/new`
2. Fill in wiki details:
   - Title: "Pepe the Frog"
   - Category: "Memes"
   - Content: (your content)
   - Logo: (upload image)
3. Click "Publish Wiki"

### What Happens

1. **Token Deployment** (5-10 seconds)
   - Deploys MRC20Token contract
   - Name: "Pepe the Frog"
   - Symbol: "PEPE" (auto-generated)
   - Supply: 1,000,000,000 tokens
   - Logo: Uploaded image URL

2. **Wiki Creation**
   - Saves wiki to database
   - Links token address to wiki
   - Uploads content to IPFS

3. **Response**
   ```json
   {
     "wiki": {
       "id": "uuid",
       "title": "Pepe the Frog",
       "token_address": "0x...",
       "token_symbol": "PEPE",
       "token_name": "Pepe the Frog",
       "deploy_tx_hash": "0x...",
       "token_network": "insectarium"
     }
   }
   ```

## Network Configuration

### Available Networks

| Network | Chain ID | RPC URL | Explorer |
|---------|----------|---------|----------|
| **Insectarium Testnet** | 43522 | https://rpc.insectarium.memecore.net/ | https://insectarium.blockscout.memecore.com/ |
| **Formicarium Testnet** | 43521 | https://rpc.formicarium.memecore.net/ | https://formicarium.memecorescan.io/ |
| **Mainnet** | 4352 | https://rpc.memecore.net/ | https://memecorescan.io/ |

### Switch Networks

Update `.env.local`:
```bash
# Use mainnet (requires real M tokens)
MEMECORE_NETWORK=mainnet

# Use formicarium testnet
MEMECORE_NETWORK=formicarium
```

## Troubleshooting

### "Insufficient balance" Error

**Problem**: Deployer wallet has no testnet tokens.

**Solution**:
1. Visit faucet: https://faucet.memecore.com/insectarium
2. Get 450M test tokens
3. Wait 30 seconds for confirmation

### "MRC20_BYTECODE not configured" Error

**Problem**: Contract bytecode missing from environment.

**Solution**:
1. Compile contracts: `cd contracts && npx hardhat compile`
2. Extract bytecode: `cat artifacts/contracts/MRC20Token.sol/MRC20Token.json | jq -r '.bytecode'`
3. Add to `.env.local`: `MRC20_BYTECODE=0x...`

### "Token deployment failed" Error

**Problem**: Transaction reverted or failed.

**Solution**:
1. Check gas balance: Ensure wallet has M tokens
2. Check RPC: Verify network connectivity
3. Check logs: `npm run dev` shows detailed errors
4. Try manual deployment: `npx hardhat run scripts/deploy-mrc20.ts --network memecoreInsectarium`

### Database Schema Error

**Problem**: Token fields missing from wiki table.

**Solution**:
```sql
-- Run migration in Supabase dashboard
ALTER TABLE wiki ADD COLUMN IF NOT EXISTS token_address VARCHAR(42);
-- ... (see migrations/add_token_fields_to_wiki.sql)
```

## Production Deployment

### Switch to Mainnet

1. **Get Mainnet M Tokens**
   - Purchase on exchanges
   - Bridge from other networks
   - Do NOT use testnet tokens

2. **Update Configuration**
   ```bash
   MEMECORE_NETWORK=mainnet
   ENABLE_TOKEN_DEPLOYMENT=true
   ```

3. **Security Best Practices**
   - Use a dedicated deployment wallet
   - Implement multi-sig for token ownership
   - Monitor deployment costs
   - Set gas limits and fee caps
   - Implement retry logic for failed deployments

4. **Test Thoroughly**
   - Deploy multiple test tokens on testnet
   - Verify all token features work
   - Test error handling
   - Load test with concurrent deployments

## Architecture Reference

```
User Creates Wiki
       ↓
API receives request
       ↓
Deploy MRC-20 Token
  - Name: Wiki Title
  - Symbol: Sanitized Slug
  - Supply: 1B tokens
  - Logo: Wiki Logo URL
       ↓
Wait for transaction
       ↓
Save wiki + token data
       ↓
Return success
```

## API Reference

### Deploy Token Programmatically

```typescript
import { deployMRC20Token } from '@/lib/memecore/token-deployer'

const result = await deployMRC20Token({
  name: 'My Memecoin',
  symbol: 'MYM', // Optional: auto-generated if not provided
  initialSupply: 1_000_000_000, // Optional: defaults to 1B
  logoURI: 'https://example.com/logo.png',
  description: 'A memecoin for my wiki', // Optional
  category: 'DeFi', // Optional: used in description
  network: 'insectarium', // Optional: defaults to MEMECORE_NETWORK
})

console.log('Token Address:', result.tokenAddress)
console.log('Explorer:', result.explorerUrl)
```

### Get Token Information

```typescript
import { getTokenInfo } from '@/lib/memecore/token-deployer'

const info = await getTokenInfo('0xTOKEN_ADDRESS', 'insectarium')
console.log(info.name) // "My Memecoin"
console.log(info.symbol) // "MYM"
console.log(info.totalSupply) // "1000000000000000000000000000"
```

## Support

- **Memecore Docs**: https://docs.memecore.com/
- **Block Explorer**: https://insectarium.blockscout.memecore.com/
- **Faucet**: https://faucet.memecore.com/insectarium
- **GitHub Issues**: [Your repo]/issues

## Next Steps

1. ✅ Set up testnet wallet and get tokens
2. ✅ Configure environment variables
3. ✅ Run database migration
4. ✅ Deploy test token
5. ✅ Create wiki with automatic token deployment
6. 🚀 Launch to production with mainnet
