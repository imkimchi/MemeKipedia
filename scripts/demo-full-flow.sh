#!/bin/bash

# Full demonstration script for Memecore token deployment
# This script walks through the entire setup and deployment process

set -e

echo "🚀 Memecore Token Launchpad - Full Demo"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Check environment
echo "Step 1: Checking environment..."
if [ ! -f ".env.local" ]; then
    echo -e "${RED}❌ .env.local not found${NC}"
    echo "Creating from template..."
    cp .env.example .env.local
    echo -e "${YELLOW}⚠️  Please configure .env.local with your settings${NC}"
    echo ""
    exit 1
fi

# Check for required env vars
source .env.local
if [ -z "$MEMECORE_PRIVATE_KEY" ]; then
    echo -e "${RED}❌ MEMECORE_PRIVATE_KEY not set${NC}"
    echo ""
    echo "Generate a wallet:"
    echo "  cd contracts && npx hardhat run scripts/generate-wallet.js"
    echo ""
    exit 1
fi

echo -e "${GREEN}✅ Environment configured${NC}"
echo ""

# Step 2: Install dependencies
echo "Step 2: Installing dependencies..."
if [ ! -d "node_modules" ]; then
    npm install
fi
cd contracts
if [ ! -d "node_modules" ]; then
    npm install
fi
cd ..
echo -e "${GREEN}✅ Dependencies installed${NC}"
echo ""

# Step 3: Compile contracts
echo "Step 3: Compiling smart contracts..."
cd contracts
npx hardhat compile
cd ..
echo -e "${GREEN}✅ Contracts compiled${NC}"
echo ""

# Step 4: Extract bytecode
echo "Step 4: Extracting contract bytecode..."
BYTECODE=$(cat contracts/artifacts/contracts/MRC20Token.sol/MRC20Token.json | jq -r '.bytecode')
if [ -z "$BYTECODE" ] || [ "$BYTECODE" = "0x" ]; then
    echo -e "${RED}❌ Failed to extract bytecode${NC}"
    exit 1
fi
echo "MRC20_BYTECODE=$BYTECODE" >> .env.local
echo -e "${GREEN}✅ Bytecode extracted and saved${NC}"
echo ""

# Step 5: Check wallet balance
echo "Step 5: Checking wallet balance..."
echo "Wallet address: (extract from private key)"
echo ""
echo -e "${YELLOW}⚠️  Ensure your wallet has testnet M tokens${NC}"
echo "Get tokens from: https://faucet.memecore.com/insectarium"
echo ""
read -p "Press enter when you have testnet tokens..."

# Step 6: Run test deployment
echo ""
echo "Step 6: Testing token deployment..."
npm run test:memecore || tsx scripts/test-token-deployment.ts
echo ""

# Step 7: Database migration
echo "Step 7: Database migration..."
echo ""
echo -e "${YELLOW}⚠️  Run this SQL in your Supabase dashboard:${NC}"
echo ""
cat migrations/add_token_fields_to_wiki.sql
echo ""
read -p "Press enter when migration is complete..."

# Step 8: Enable token deployment
echo ""
echo "Step 8: Enabling token deployment..."
if grep -q "ENABLE_TOKEN_DEPLOYMENT=false" .env.local; then
    sed -i '' 's/ENABLE_TOKEN_DEPLOYMENT=false/ENABLE_TOKEN_DEPLOYMENT=true/' .env.local
elif ! grep -q "ENABLE_TOKEN_DEPLOYMENT" .env.local; then
    echo "ENABLE_TOKEN_DEPLOYMENT=true" >> .env.local
fi
echo -e "${GREEN}✅ Token deployment enabled${NC}"
echo ""

# Step 9: Start dev server
echo "Step 9: Starting development server..."
echo ""
echo -e "${GREEN}✅ Setup complete!${NC}"
echo ""
echo "═══════════════════════════════════════════════════════════"
echo "🎉 Your memecoin launchpad is ready!"
echo ""
echo "Next steps:"
echo "1. Start dev server: npm run dev"
echo "2. Navigate to: http://localhost:3000/wiki/new"
echo "3. Create a wiki - a token will be deployed automatically!"
echo "4. Check token on explorer:"
echo "   https://insectarium.blockscout.memecore.com/"
echo ""
echo "═══════════════════════════════════════════════════════════"
echo ""

# Optionally start server
read -p "Start dev server now? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    npm run dev
fi
