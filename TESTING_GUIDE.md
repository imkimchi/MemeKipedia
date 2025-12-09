# Complete Buy/Sell Feature Testing Guide - A to Z

## Overview

This comprehensive guide walks you through testing the buy/sell functionality on wiki pages from setup to execution. Follow these steps to test real trading (not automated tests) on the Memecore Insectarium testnet.

**Time Required:** ~25 minutes
**Difficulty:** Beginner-friendly

---

## Prerequisites

### 1. Already Deployed Contracts ✅

Good news! The contracts are already deployed on Memecore Insectarium:

```bash
# These are already in your .env.local
NEXT_PUBLIC_M_TOKEN_ADDRESS=0x15A89cb09A7Bbe07E913Ce75d44Aaeaa8c3ed1ac
NEXT_PUBLIC_MEMESWAP_FACTORY_ADDRESS=0x207F61a1B85AdeD5e9F38D6f64C5d017a3a38981
NEXT_PUBLIC_MEMESWAP_ROUTER_ADDRESS=0xAE62769D66C29310b5Fe5C87d7c3E5904Deeb298
MEMECORE_PRIVATE_KEY=0x2d3cbcbf83ca2d2ffa364836526db748c0d72f8bcfcf1853715888b71be99691
```

⚠️ **Important:** The MEMECORE_PRIVATE_KEY above is for TESTNET ONLY. Never use on mainnet!

### 2. Get Testnet Tokens

1. **Visit Faucet:** https://faucet.memecore.com/insectarium
2. **Enter your wallet address**
3. **Receive 450 testnet $M tokens**
4. **Fund deployer wallet** (for gas fees and liquidity)

### 3. Wallet Setup

- Install MetaMask or Rainbow Wallet
- Add Memecore Insectarium network:
  - **Network Name:** MemeCore Insectarium Testnet
  - **RPC URL:** https://rpc.insectarium.memecore.net/
  - **Chain ID:** 43522
  - **Currency Symbol:** M
  - **Block Explorer:** https://insectarium.blockscout.memecore.com/

---

## Test Plan

### Phase 1: Smart Contract Deployment

#### Test 1.1: Deploy AMM Factory Contract

**Objective:** Deploy MemeSwapV2Factory to testnet

**Steps:**
1. Compile Uniswap V2 Factory contract
2. Deploy using Foundry or Hardhat:
   ```bash
   forge create --rpc-url https://rpc.insectarium.memecore.net \
     --private-key $MEMECORE_PRIVATE_KEY \
     src/MemeSwapV2Factory.sol:MemeSwapV2Factory
   ```
3. Save deployed factory address

**Expected Result:**
- ✅ Contract deployed successfully
- ✅ Transaction confirmed on block explorer
- ✅ Factory address saved to `.env`

---

#### Test 1.2: Deploy AMM Router Contract

**Objective:** Deploy MemeSwapV2Router with factory address

**Steps:**
1. Deploy router contract:
   ```bash
   forge create --rpc-url https://rpc.insectarium.memecore.net \
     --private-key $MEMECORE_PRIVATE_KEY \
     --constructor-args $FACTORY_ADDRESS $WETH_ADDRESS \
     src/MemeSwapV2Router.sol:MemeSwapV2Router
   ```
2. Save deployed router address

**Expected Result:**
- ✅ Router deployed successfully
- ✅ Router address saved to `.env`

---

### Phase 2: Wiki Token Deployment

#### Test 2.1: Create New Wiki with Token

**Test Wiki Details:**
- **Name:** "Doge Warrior"
- **Symbol:** DOGWAR (auto-generated)
- **Category:** Gaming
- **Logo:** Upload test image
- **Initial Supply:** 1,000,000,000 tokens

**Steps:**

1. **Navigate to create wiki page**
   ```
   http://localhost:3000/wiki/new
   ```

2. **Fill wiki details:**
   - Title: "Doge Warrior"
   - Category: Gaming
   - Upload logo image
   - Write sample content

3. **Submit wiki**

4. **Verify token deployment:**
   ```bash
   npm run test:memecore
   ```

**Expected Result:**
- ✅ Wiki created successfully
- ✅ MRC-20 token deployed
- ✅ Token address saved to wiki record
- ✅ Token visible on block explorer
- ✅ Total supply: 1,000,000,000

**Verification:**
```bash
# Check token on explorer
open https://insectarium.blockscout.memecore.com/address/$TOKEN_ADDRESS
```

---

### Phase 3: Liquidity Pool Creation

#### Test 3.1: Create Pool and Add Liquidity

**Objective:** Create trading pool for your wiki token using the new add-liquidity script.

⚠️ **CRITICAL STEP:** Without liquidity, trading won't work! This is the most important step.

**Steps:**

1. **Get your wiki token address** from the wiki page after creation (Step 2.1)

2. **Run the liquidity script:**
   ```bash
   cd contracts
   npx hardhat run scripts/add-liquidity.ts \
     --network memecoreInsectarium \
     --token YOUR_WIKI_TOKEN_ADDRESS
   ```

   Replace `YOUR_WIKI_TOKEN_ADDRESS` with the actual token address.

3. **Script will automatically:**
   - Check your token balances
   - Approve tokens for the router
   - Create the trading pair (if doesn't exist)
   - Add liquidity (10% of M balance, 50% of wiki tokens)
   - Output pool address and initial price

**Example Output:**
```
=== Configuration ===
M Token: 0x15A89cb09A7Bbe07E913Ce75d44Aaeaa8c3ed1ac
Wiki Token: 0x1234abcd...
Router: 0xAE62769D66C29310b5Fe5C87d7c3E5904Deeb298

=== Wallet Balances ===
M tokens: 1000.0
Wiki tokens: 1000000000.0

=== Liquidity to Add ===
M tokens: 100.0
Wiki tokens: 500000000.0

✅ Liquidity added successfully!

=== Pool Created ===
Pair Address: 0xABCD1234...
Explorer: https://insectarium.blockscout.memecore.com/address/0xABCD1234...

=== Pool Reserves ===
M tokens: 100.0
Wiki tokens: 500000000.0
Price: 1 M = 5000000 WIKI
Price: 1 WIKI = 0.0000002 M

=== Next Steps ===
1. Trading is now enabled for this token!
2. Visit the wiki page and test buy/sell
3. Make sure you have M tokens in your wallet to buy
4. Pool address: 0xABCD1234...
```

**Expected Result:**
- ✅ Pool created successfully
- ✅ 100 M tokens deposited
- ✅ 500,000,000 wiki tokens deposited
- ✅ LP tokens minted to your wallet
- ✅ Initial price calculated and displayed
- ✅ Pool address saved for wiki page

**Verification:**
Visit the pool on block explorer:
```
https://insectarium.blockscout.memecore.com/address/POOL_ADDRESS
```

---

### Phase 4: Frontend Trading Interface

#### Test 4.1: View Wiki Detail Page with Trading Panel

**Steps:**

1. **Start the development server** (if not running):
   ```bash
   npm run dev
   ```

2. **Navigate to wiki detail page:**
   ```
   http://localhost:3000/wiki/YOUR_WIKI_ID
   ```

3. **Verify UI elements:**
   - Wiki content displayed
   - Token stats card visible (symbol, address, supply)
   - Trading panel visible on right side
   - Pool address loaded (not 0x000...)
   - Buy/Sell tabs available

**Expected Result:**
- ✅ Page loads without errors
- ✅ Token information displays correctly
- ✅ Trading panel shows "Buy" and "Sell" buttons
- ✅ Pool detected (no "Trading Not Available" warning)
- ✅ Balance fields show 0 or your current balance

---

#### Test 4.2: Execute Buy Transaction

**Objective:** Buy DOGWAR tokens with $M

**Test Data:**
- Amount to spend: 10 $M
- Expected output: ~50,000 DOGWAR (with slippage)
- Slippage tolerance: 1%

**Steps:**

1. **Connect wallet:**
   - Click "Connect Wallet"
   - Approve connection in MetaMask
   - Verify wallet address displayed

2. **Check balances:**
   - $M balance: Should show testnet $M
   - DOGWAR balance: Should be 0

3. **Enter buy amount:**
   - Select "Buy" tab
   - Enter "10" in amount field
   - Verify estimated output appears
   - Verify price calculation

4. **Approve $M spending:**
   - Click "Approve M" button
   - Confirm transaction in wallet
   - Wait for confirmation

5. **Execute swap:**
   - Click "Swap" button
   - Confirm transaction in wallet
   - Wait for confirmation

6. **Verify results:**
   - Check new DOGWAR balance
   - Check new $M balance
   - Verify transaction on explorer

**Expected Result:**
- ✅ Approval tx confirmed
- ✅ Swap tx confirmed
- ✅ DOGWAR balance increased by ~50,000
- ✅ $M balance decreased by 10
- ✅ Transaction visible on explorer
- ✅ Chart updates with new trade

---

#### Test 4.3: Execute Sell Transaction

**Objective:** Sell DOGWAR tokens for $M

**Test Data:**
- Amount to sell: 25,000 DOGWAR
- Expected output: ~5 $M (with slippage)
- Slippage tolerance: 1%

**Steps:**

1. **Select "Sell" tab**

2. **Enter sell amount:**
   - Enter "25000" in amount field
   - Verify estimated $M output

3. **Approve DOGWAR spending:**
   - Click "Approve DOGWAR" button
   - Confirm transaction
   - Wait for confirmation

4. **Execute swap:**
   - Click "Swap" button
   - Confirm transaction
   - Wait for confirmation

5. **Verify results:**
   - Check reduced DOGWAR balance
   - Check increased $M balance

**Expected Result:**
- ✅ Approval tx confirmed
- ✅ Swap tx confirmed
- ✅ DOGWAR balance decreased by 25,000
- ✅ $M balance increased by ~5
- ✅ Chart shows new candle with trade

---

### Phase 5: Chart & Analytics

#### Test 5.1: Verify Chart Data

**Objective:** Ensure chart accurately reflects trades

**Steps:**

1. **Execute multiple trades:**
   - Buy 5 $M worth
   - Wait 1 minute
   - Sell 3 $M worth
   - Wait 1 minute
   - Buy 7 $M worth

2. **Verify chart updates:**
   - Switch between timeframes (5m, 15m, 1h)
   - Check candle data accuracy
   - Verify volume bars

**Expected Result:**
- ✅ Chart shows all trades
- ✅ Candlesticks reflect price changes
- ✅ Volume bars show trade volume
- ✅ Different timeframes work correctly

---

#### Test 5.2: Verify Token Stats

**Steps:**

1. **Check stats accuracy:**
   - Price matches last trade
   - Market cap calculated correctly
   - Liquidity reserves match pool

2. **Verify auto-refresh:**
   - Execute new trade
   - Wait for stats to update (15s)

**Expected Result:**
- ✅ Price updates after trades
- ✅ Market cap recalculates
- ✅ Reserves update correctly

---

### Phase 6: Error Handling

#### Test 6.1: Insufficient Balance

**Steps:**
1. Try to buy with more $M than you have
2. Try to sell more DOGWAR than you own

**Expected Result:**
- ✅ "Insufficient Balance" error shown
- ✅ Swap button disabled

---

#### Test 6.2: Slippage Protection

**Steps:**
1. Set slippage to 0.1%
2. Try to execute large swap (>10% of pool)
3. Transaction should fail due to slippage

**Expected Result:**
- ✅ Transaction reverts with slippage error
- ✅ User funds not lost

---

#### Test 6.3: Expired Deadline

**Steps:**
1. Initiate swap
2. Wait 20+ minutes before confirming
3. Transaction should fail

**Expected Result:**
- ✅ Transaction reverts with "expired" error

---

### Phase 7: Multi-User Testing

#### Test 7.1: Concurrent Swaps

**Objective:** Test multiple users trading simultaneously

**Setup:**
- Use 2 different wallets
- Each with testnet $M

**Steps:**

1. **Wallet A:** Buy 5 $M worth
2. **Wallet B:** Buy 3 $M worth (at same time)
3. **Wallet A:** Sell 2 $M worth
4. **Wallet B:** Sell 4 $M worth

**Expected Result:**
- ✅ All transactions succeed
- ✅ Reserves update correctly
- ✅ Prices adjust based on trades
- ✅ No race conditions

---

### Phase 8: Performance Testing

#### Test 8.1: Load Testing

**Objective:** Ensure UI remains responsive under load

**Steps:**

1. Execute 20 consecutive swaps
2. Monitor page performance
3. Check chart rendering time

**Expected Result:**
- ✅ Page remains responsive
- ✅ Chart updates smoothly
- ✅ No memory leaks
- ✅ API calls complete in <2s

---

## Example Test Script

Create `scripts/test-trading-flow.ts`:

```typescript
import { createPoolAndAddLiquidity, getPoolInfo } from '@/lib/memecore/pool-creator'
import { deployMRC20Token } from '@/lib/memecore/token-deployer'

async function testFullTradingFlow() {
  console.log('🧪 Starting end-to-end trading test...\n')

  // Step 1: Deploy token
  console.log('1️⃣ Deploying MRC-20 token...')
  const tokenResult = await deployMRC20Token({
    name: 'Doge Warrior',
    logoURI: 'ipfs://QmTest123',
    category: 'Gaming',
    network: 'insectarium',
  })
  console.log(`✅ Token deployed: ${tokenResult.tokenAddress}`)
  console.log(`   Symbol: ${tokenResult.tokenSymbol}`)
  console.log(`   Tx: ${tokenResult.transactionHash}\n`)

  // Step 2: Create pool and add liquidity
  console.log('2️⃣ Creating pool and adding liquidity...')
  const poolResult = await createPoolAndAddLiquidity({
    tokenAddress: tokenResult.tokenAddress,
    liquidityM: '100',
    liquidityTokens: '500000',
    network: 'insectarium',
  })
  console.log(`✅ Pool created: ${poolResult.poolAddress}`)
  console.log(`   Liquidity: ${poolResult.liquidityM} M + ${poolResult.liquidityTokens} tokens`)
  console.log(`   Tx: ${poolResult.transactionHash}\n`)

  // Step 3: Verify pool
  console.log('3️⃣ Verifying pool reserves...')
  const poolInfo = await getPoolInfo(tokenResult.tokenAddress, 'insectarium')
  console.log(`✅ Pool info:`)
  console.log(`   Reserve M: ${(parseFloat(poolInfo!.reserveM) / 1e18).toFixed(2)}`)
  console.log(`   Reserve Token: ${(parseFloat(poolInfo!.reserveToken) / 1e18).toFixed(0)}`)
  console.log(`   Price: 1 ${tokenResult.tokenSymbol} = ${poolInfo!.priceInM.toFixed(6)} M\n`)

  console.log('✅ All tests passed!')
  console.log(`\nToken Address: ${tokenResult.tokenAddress}`)
  console.log(`Pool Address: ${poolResult.poolAddress}`)
  console.log(`\nView on explorer:`)
  console.log(`${tokenResult.explorerUrl}`)
  console.log(`${poolResult.explorerUrl}`)
}

testFullTradingFlow()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Test failed:', error)
    process.exit(1)
  })
```

Run the test:
```bash
npm run test:trading
```

---

## Checklist Summary

### Pre-Flight Checks
- [ ] Testnet $M tokens acquired
- [ ] Deployer wallet funded
- [ ] AMM contracts deployed
- [ ] Environment variables configured
- [ ] Frontend dependencies installed

### Token & Pool Creation
- [ ] MRC-20 token deployed successfully
- [ ] Pool created with correct reserves
- [ ] LP tokens minted to deployer
- [ ] Initial price calculated correctly

### Trading Functionality
- [ ] Wallet connection works
- [ ] Token approval flow works
- [ ] Buy transactions execute correctly
- [ ] Sell transactions execute correctly
- [ ] Balances update after swaps
- [ ] Slippage protection works

### UI/UX
- [ ] Chart renders correctly
- [ ] Price data updates automatically
- [ ] Trading panel shows correct quotes
- [ ] Token stats display accurately
- [ ] Error messages are clear
- [ ] Loading states work properly

### Performance
- [ ] Page loads in <3 seconds
- [ ] Chart updates smoothly
- [ ] No console errors
- [ ] Mobile responsive

### Security
- [ ] Slippage protection tested
- [ ] Deadline expiration tested
- [ ] Insufficient balance handled
- [ ] Transaction failures handled gracefully

---

## Troubleshooting

### Issue: "Insufficient balance" despite having funds

**Solution:**
- Check you're on Insectarium testnet
- Verify $M token address is correct
- Ensure wallet is connected to correct network

### Issue: Pool creation fails

**Solution:**
- Verify factory and router addresses
- Check deployer wallet has enough $M for gas + liquidity
- Ensure token approval before adding liquidity

### Issue: Chart not loading

**Solution:**
- Check console for errors
- Verify pool address is correct
- Ensure swap events exist (execute test trade first)
- Check RPC endpoint is accessible

### Issue: Swap transaction fails

**Solution:**
- Increase slippage tolerance
- Check token approval
- Verify sufficient balance
- Check deadline hasn't expired

---

## Success Criteria

The feature is ready for production when:

- ✅ All Phase 1-8 tests pass
- ✅ No console errors in browser
- ✅ All transactions confirm on testnet
- ✅ Chart displays accurate data
- ✅ UI is responsive and intuitive
- ✅ Error handling is comprehensive
- ✅ Performance meets targets (<2s load time)
- ✅ Security checklist completed

---

## Next Steps

After successful testnet testing:

1. **Code review** by senior developers
2. **Security audit** of smart contracts (optional but recommended)
3. **Mainnet deployment** checklist:
   - Deploy factory & router to mainnet
   - Update environment variables
   - Test with real $M (small amounts)
   - Monitor initial trades closely
4. **User documentation** and tutorials
5. **Marketing launch** announcement

---

## Support Resources

- **Memecore Docs:** https://docs.memecore.com
- **Block Explorer:** https://insectarium.blockscout.memecore.com/
- **Testnet Faucet:** https://faucet.memecore.com/insectarium
- **Uniswap V2 Docs:** https://docs.uniswap.org/contracts/v2
