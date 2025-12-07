#!/bin/bash
echo "⏳ Waiting for testnet tokens..."
echo "   Please complete the faucet request in your browser"
echo ""

for i in {1..20}; do
  echo "Checking balance (attempt $i/20)..."
  cd contracts && node ../scripts/check-balance.js 2>&1 | grep "Balance:" | head -1
  
  if cd contracts && node ../scripts/check-balance.js > /dev/null 2>&1; then
    echo ""
    echo "✅ Tokens received! Ready to deploy."
    exit 0
  fi
  
  if [ $i -lt 20 ]; then
    echo "   Waiting 10 seconds..."
    sleep 10
  fi
done

echo ""
echo "❌ Timeout waiting for tokens. Please check the faucet manually."
echo "   https://faucet.memecore.com/insectarium"
exit 1
