/**
 * Generate a new Ethereum wallet for Memecore deployment
 * Saves private key and address to console
 */

const { ethers } = require('hardhat')

async function main() {
  // Generate random wallet
  const wallet = ethers.Wallet.createRandom()

  console.log('\n🎉 New Wallet Generated!\n')
  console.log('═══════════════════════════════════════════════════════')
  console.log('Address:', wallet.address)
  console.log('Private Key:', wallet.privateKey)
  console.log('═══════════════════════════════════════════════════════')
  console.log('\n⚠️  IMPORTANT: Save your private key securely!')
  console.log('   - Never share your private key')
  console.log('   - Never commit it to git')
  console.log('   - Add it to .env.local as MEMECORE_PRIVATE_KEY\n')
  console.log('Next steps:')
  console.log('1. Add private key to .env.local')
  console.log('2. Get testnet tokens from faucet:')
  console.log('   https://faucet.memecore.com/insectarium')
  console.log('3. Verify balance on explorer:')
  console.log(`   https://insectarium.blockscout.memecore.com/address/${wallet.address}\n`)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
