/**
 * Test script for end-to-end token deployment flow
 * Simulates creating a wiki with automatic token deployment
 */

import { deployMRC20Token, getTokenInfo } from '../lib/memecore/token-deployer'
import { sanitizeTokenSymbol } from '../lib/memecore/utils'
import { DEFAULT_NETWORK, getExplorerUrl, getTxExplorerUrl } from '../lib/memecore/config'

async function testDeployment() {
  console.log('🚀 Memecore Token Deployment Test\n')
  console.log('═══════════════════════════════════════════════════════')

  // Check environment variables
  if (!process.env.MEMECORE_PRIVATE_KEY) {
    console.error('❌ Error: MEMECORE_PRIVATE_KEY not found in environment')
    console.log('\nSetup instructions:')
    console.log('1. Generate wallet: npx hardhat run contracts/scripts/generate-wallet.js')
    console.log('2. Add private key to .env.local')
    console.log('3. Get testnet tokens: https://faucet.memecore.com/insectarium\n')
    process.exit(1)
  }

  if (!process.env.MRC20_BYTECODE || process.env.MRC20_BYTECODE === '0x') {
    console.error('❌ Error: MRC20_BYTECODE not found in environment')
    console.log('\nSetup instructions:')
    console.log('1. Compile contracts: cd contracts && npx hardhat compile')
    console.log('2. Extract bytecode: cat artifacts/contracts/MRC20Token.sol/MRC20Token.json | jq -r \'.bytecode\'')
    console.log('3. Add to .env.local as MRC20_BYTECODE\n')
    process.exit(1)
  }

  // Test wiki data
  const testWiki = {
    title: 'Doge to the Moon',
    category: 'Memes',
    logo: 'https://example.com/doge.png',
  }

  console.log('📝 Test Wiki Details:')
  console.log(`   Title: ${testWiki.title}`)
  console.log(`   Category: ${testWiki.category}`)
  console.log(`   Token Symbol: ${sanitizeTokenSymbol(testWiki.title)}`)
  console.log(`   Network: ${DEFAULT_NETWORK}`)
  console.log()

  try {
    console.log('⏳ Step 1: Deploying MRC-20 Token...\n')

    const deployment = await deployMRC20Token({
      name: testWiki.title,
      logoURI: testWiki.logo,
      category: testWiki.category,
      network: DEFAULT_NETWORK,
    })

    console.log('✅ Token Deployed Successfully!\n')
    console.log('═══════════════════════════════════════════════════════')
    console.log('Token Address:', deployment.tokenAddress)
    console.log('Token Name:', deployment.tokenName)
    console.log('Token Symbol:', deployment.tokenSymbol)
    console.log('Initial Supply:', deployment.initialSupply)
    console.log('Network:', deployment.network)
    console.log('═══════════════════════════════════════════════════════')
    console.log()
    console.log('🔗 Links:')
    console.log('   Token:', deployment.explorerUrl)
    console.log('   Transaction:', getTxExplorerUrl(deployment.network, deployment.transactionHash))
    console.log()

    console.log('⏳ Step 2: Verifying Token on Blockchain...\n')

    // Wait a bit for blockchain to process
    await new Promise((resolve) => setTimeout(resolve, 3000))

    const tokenInfo = await getTokenInfo(deployment.tokenAddress, deployment.network)

    console.log('✅ Token Verified Successfully!\n')
    console.log('═══════════════════════════════════════════════════════')
    console.log('Name:', tokenInfo.name)
    console.log('Symbol:', tokenInfo.symbol)
    console.log('Total Supply:', tokenInfo.totalSupply)
    console.log('Decimals:', tokenInfo.decimals)
    console.log('═══════════════════════════════════════════════════════')
    console.log()

    console.log('🎉 Test Completed Successfully!\n')
    console.log('Next steps:')
    console.log('1. View token in explorer:', deployment.explorerUrl)
    console.log('2. Enable wiki integration: ENABLE_TOKEN_DEPLOYMENT=true')
    console.log('3. Create a wiki via /wiki/new to test full flow\n')

    return {
      success: true,
      deployment,
      tokenInfo,
    }
  } catch (error) {
    console.error('\n❌ Deployment Failed!\n')
    console.error('Error:', error instanceof Error ? error.message : error)
    console.log()

    if (error instanceof Error && error.message.includes('insufficient funds')) {
      console.log('💡 Solution: Get testnet tokens from faucet')
      console.log('   https://faucet.memecore.com/insectarium\n')
    } else if (error instanceof Error && error.message.includes('nonce')) {
      console.log('💡 Solution: Wait a moment and try again')
      console.log('   Transaction may still be pending\n')
    } else {
      console.log('💡 Check the setup guide:')
      console.log('   See MEMECORE_SETUP.md for detailed instructions\n')
    }

    process.exit(1)
  }
}

// Run test
testDeployment()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Unexpected error:', error)
    process.exit(1)
  })
