# Native M Token Upgrade Guide

## What Changed

The bonding curve now uses **native M tokens** (the chain's gas token) instead of a separate ERC20 M token.

**Before:** Required ERC20 M tokens at `0x15A89cb09A7Bbe07E913Ce75d44Aaeaa8c3ed1ac`
**After:** Uses your native M balance (450 M) directly

## Steps to Upgrade

### 1. Find your GG token address

Check the database or blockchain explorer for the GG token contract address.

### 2. Deploy new Native Bonding Curve

```bash
cd contracts

# Deploy native bonding curve for GG token
npx hardhat run scripts/deploy-native-bonding-curve.ts --network memecoreInsectarium -- --token <GG_TOKEN_ADDRESS>
```

Example:
```bash
npx hardhat run scripts/deploy-native-bonding-curve.ts --network memecoreInsectarium -- --token 0x1234...abcd
```

### 3. Update Database

Update the GG wiki record in your database with the new bonding curve address:

```sql
UPDATE wikis
SET bonding_curve_address = '<NEW_BONDING_CURVE_ADDRESS>'
WHERE token_symbol = 'GG';
```

### 4. Test Trading

1. Refresh the wiki page
2. You should now see your 450 M balance
3. Try buying 1000 GG tokens (cost: ~0.0005 M)
4. Transaction should succeed!

## What's Different

### For Users:
- ✅ Use native M balance (no need for ERC20 M tokens)
- ✅ No approval needed when buying (payable transaction)
- ✅ Approval only needed when selling wiki tokens

### For Developers:
- Contract: `NativeBondingCurve.sol` instead of `BondingCurve.sol`
- Buy function is `payable` and accepts `msg.value`
- No M token address in constructor
- Frontend uses `native-bonding-curve-service.ts`

## Verifying It Works

After deploying, check:

1. **Console logs** should show:
   ```
   Trading Mode: Bonding Curve (Native M)
   Fallback balances loaded (native): { m: '450', token: '0' }
   ```

2. **Trading panel** should show:
   - Your 450 M balance
   - No "Insufficient Balance" error
   - "Buy" button enabled (no approval needed)

3. **Test transaction** should:
   - Send native M
   - Receive GG tokens
   - Update balances immediately

## Troubleshooting

**Still showing 0 M balance?**
- Check you're connected to MemeCore Insectarium Testnet (Chain ID: 43522)
- Verify wallet is connected
- Check console for errors

**"Insufficient Balance" error?**
- Make sure you updated the database with new bonding curve address
- Refresh the page to reload the bonding curve address
- Check console shows "Bonding Curve (Native M)" mode

**Transaction fails?**
- Make sure bonding curve has GG tokens (check contract balance)
- Verify gas settings
- Check transaction on block explorer for detailed error
