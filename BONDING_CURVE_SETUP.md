# Bonding Curve Setup Guide

## Overview

The bonding curve system is now implemented! This enables **instant trading** when a wiki is created - just like pump.fun. No liquidity pools needed!

---

## What's Different?

### Before (AMM/Pool System):
1. Create wiki → Token deployed
2. **MANUAL STEP**: Run add-liquidity script
3. Pool created
4. Trading enabled

### Now (Bonding Curve):
1. Create wiki → Token + Bonding Curve deployed
2. **Trading enabled IMMEDIATELY!** ✨

---

## Setup Steps

### Step 1: Compile Contracts

```bash
cd contracts
npx hardhat compile
```

This compiles:
- `MRC20Token.sol`
- `BondingCurve.sol`

### Step 2: Get Bytecodes

After compilation, you need to extract the bytecodes and add them to `.env.local`:

#### For MRC20Token:
```bash
cat artifacts/contracts/MRC20Token.sol/MRC20Token.json | jq -r '.bytecode'
```

#### For BondingCurve:
```bash
cat artifacts/contracts/BondingCurve.sol/BondingCurve.json | jq -r '.bytecode'
```

### Step 3: Update .env.local

Add the bytecodes to your `.env.local`:

```bash
# Add these lines (replace with actual bytecodes from Step 2)
MRC20_BYTECODE=0x60806040523480156200001157600080fd5b50604051620027...
BONDING_CURVE_BYTECODE=0x60806040523480156200001157600080fd5b50604051620027...
```

**Note:** The bytecode is a very long hex string starting with `0x`. Make sure you copy the ENTIRE string!

### Step 4: Update Database Schema

Add the `bonding_curve_address` column to your `wiki` table in Supabase:

```sql
ALTER TABLE wiki
ADD COLUMN bonding_curve_address TEXT;
```

Or via Supabase Dashboard:
1. Go to Table Editor → `wiki` table
2. Click "Add Column"
3. Name: `bonding_curve_address`
4. Type: `text`
5. Nullable: Yes
6. Save

### Step 5: Test It!

Now create a wiki and test trading:

```bash
npm run dev
```

1. Go to `/wiki/create`
2. Fill in wiki details
3. Submit
4. **Watch the magic happen:**
   - Token deployed ✅
   - Bonding curve deployed ✅
   - All tokens transferred to curve ✅
   - Trading enabled ✅

5. Go to wiki page
6. You'll see "Bonding Curve Active" badge
7. Buy/sell tokens instantly!

---

## How It Works

### Bonding Curve Pricing

The bonding curve uses a linear pricing formula:

```
price = basePrice + (tokensSold × slope / PRECISION)
```

**Default Parameters:**
- Base Price: `0.00000001 M` per token (very cheap start!)
- Slope: `0.000000001 M` per token

**Example Prices:**
- 1st token: 0.00000001 M
- 1,000th token: 0.00000101 M
- 1,000,000th token: 0.00100001 M

Price increases linearly as more tokens are bought!

### Buy Process
1. User enters amount of tokens to buy
2. Curve calculates cost in M tokens
3. User approves M tokens (first time only)
4. User clicks "Buy"
5. M tokens sent to curve
6. Wiki tokens sent to user
7. Price increases for next buyer

### Sell Process
1. User enters amount of tokens to sell
2. Curve calculates M tokens to receive
3. User approves wiki tokens (first time only)
4. User clicks "Sell"
5. Wiki tokens sent to curve
6. M tokens sent to user
7. Price decreases for next buyer

---

## Architecture

### Smart Contracts

**BondingCurve.sol:**
- Holds all wiki tokens initially
- Calculates buy/sell prices automatically
- Handles buy/sell transactions
- No liquidity needed!

**Flow:**
```
Token Deployment → BondingCurve Deployment → Transfer All Tokens to Curve → Trading Live!
```

### Backend (Server-Side)

**`lib/memecore/token-deployer.ts`:**
- `deployTokenWithBondingCurve()` - New function
- Deploys token
- Deploys bonding curve
- Transfers tokens to curve
- Returns both addresses

**`app/api/wiki/route.ts`:**
- Uses `deployTokenWithBondingCurve()` instead of `deployMRC20Token()`
- Saves bonding curve address to database

### Frontend (Client-Side)

**`lib/memecore/bonding-curve-service.ts`:**
- `buyFromCurve()` - Execute buy
- `sellToCurve()` - Execute sell
- `getBuyQuote()` - Calculate buy cost
- `getSellQuote()` - Calculate sell return
- `getCurveInfo()` - Get curve stats

**`components/wiki/trading-panel.tsx`:**
- Detects if bonding curve exists
- Uses bonding curve service if available
- Falls back to AMM if pool exists
- Shows "Bonding Curve Active" badge

**`app/wiki/[id]/page.tsx`:**
- Passes `bondingCurveAddress` to TradingPanel
- No pool address needed for bonding curve

---

## Troubleshooting

### "BONDING_CURVE_BYTECODE not configured"

**Solution:** You need to compile the contract and add the bytecode to `.env.local`:

```bash
cd contracts
npx hardhat compile
cat artifacts/contracts/BondingCurve.sol/BondingCurve.json | jq -r '.bytecode'
# Copy output and add to .env.local as BONDING_CURVE_BYTECODE=0x...
```

### "MRC20_BYTECODE not configured"

**Solution:** Same as above but for MRC20Token:

```bash
cat artifacts/contracts/MRC20Token.sol/MRC20Token.json | jq -r '.bytecode'
# Add to .env.local as MRC20_BYTECODE=0x...
```

### "Failed to get quote from bonding curve"

**Possible causes:**
1. Bonding curve not deployed yet
2. No tokens in curve
3. Trying to sell more than was sold

**Solution:**
- Check bonding curve address on block explorer
- Verify curve has tokens
- For new tokens, you can only buy (not sell) initially

### Trading panel shows "Trading Not Available"

**Check:**
1. Wiki has `bonding_curve_address` in database
2. Bonding curve deployed successfully
3. Tokens transferred to curve

**Debug:**
```bash
# Check database
SELECT id, title, token_address, bonding_curve_address FROM wiki WHERE id = 'YOUR_WIKI_ID';
```

---

## Comparison: Bonding Curve vs AMM Pool

| Feature | Bonding Curve | AMM Pool |
|---------|--------------|----------|
| **Instant Trading** | ✅ Yes | ❌ No (requires liquidity) |
| **Liquidity Needed** | ✅ No | ❌ Yes (must add M tokens) |
| **Fair Launch** | ✅ Yes (same curve for all) | ⚠️ Depends on initial liquidity |
| **Price Discovery** | ✅ Automatic (formula-based) | ⚠️ Supply/demand |
| **Complexity** | ✅ Simple | ❌ Complex (pools, reserves) |
| **Gas Costs** | ✅ Lower | ❌ Higher |
| **Rug Pull Risk** | ✅ None (tokens locked in curve) | ⚠️ Possible (LP can remove) |

---

## Testing Checklist

- [ ] Contracts compiled successfully
- [ ] Bytecodes added to `.env.local`
- [ ] Database schema updated with `bonding_curve_address` column
- [ ] Create new wiki
- [ ] Token deployment succeeds
- [ ] Bonding curve deployment succeeds
- [ ] Wiki page loads
- [ ] "Bonding Curve Active" badge visible
- [ ] Can get buy quote
- [ ] Can execute buy (approve + buy)
- [ ] Balance updates after buy
- [ ] Can get sell quote
- [ ] Can execute sell (approve + sell)
- [ ] Balance updates after sell
- [ ] Price increases after buys
- [ ] Price decreases after sells

---

## Next Steps

1. **Compile contracts** (`npx hardhat compile`)
2. **Extract bytecodes** and add to `.env.local`
3. **Update database** schema
4. **Create test wiki** and verify trading works
5. **Monitor gas costs** and adjust if needed
6. **Consider** adding price charts for bonding curve

---

## Advanced: Customize Bonding Curve Parameters

The default parameters are set in `lib/memecore/token-deployer.ts`:

```typescript
// Current defaults
const BASE_PRICE = BigInt('10000000000') // 0.00000001 M
const SLOPE = BigInt('1000000000')       // Increase per token
```

To adjust pricing:
- **Lower BASE_PRICE** = cheaper initial tokens
- **Higher BASE_PRICE** = more expensive initial tokens
- **Lower SLOPE** = slower price increase
- **Higher SLOPE** = faster price increase

Example for steeper curve:
```typescript
const BASE_PRICE = BigInt('100000000000')  // 0.0000001 M (10x higher)
const SLOPE = BigInt('10000000000')         // 10x steeper
```

---

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Verify all environment variables are set
3. Check contract addresses on block explorer
4. Review server logs for deployment errors

Happy trading! 🚀
