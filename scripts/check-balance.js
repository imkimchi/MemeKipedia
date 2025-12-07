// Quick script to check wallet balance on Memecore testnet
const { ethers } = require('ethers');

async function checkBalance() {
  const address = '0x3537CeA7176f0659ec65c3443a3E2cb351fD3120';
  const rpcUrl = 'https://rpc.insectarium.memecore.net/';

  const provider = new ethers.JsonRpcProvider(rpcUrl);

  try {
    const balance = await provider.getBalance(address);
    const balanceInM = ethers.formatEther(balance);

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('Wallet Address:', address);
    console.log('Balance:', balanceInM, 'M');
    console.log('Balance (wei):', balance.toString());
    console.log('═══════════════════════════════════════════════════════\n');

    if (balance > 0n) {
      console.log('✅ Wallet is funded! Ready to deploy tokens.\n');
      return true;
    } else {
      console.log('❌ Wallet has no funds. Please get testnet tokens from:');
      console.log('   https://faucet.memecore.com/insectarium\n');
      return false;
    }
  } catch (error) {
    console.error('Error checking balance:', error.message);
    return false;
  }
}

checkBalance()
  .then((hasFunds) => process.exit(hasFunds ? 0 : 1))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
