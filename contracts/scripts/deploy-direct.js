/**
 * Direct deployment script using ethers.js (no Hardhat)
 * Deploys MRC-20 token to Memecore Insectarium testnet
 */

const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

async function main() {
  console.log('🚀 Memecore Token Deployment Test\n');
  console.log('═══════════════════════════════════════════════════════');

  // Load environment from .env.local
  const envPath = path.join(__dirname, '../../.env.local');
  const envContent = fs.readFileSync(envPath, 'utf8');
  const privateKey = envContent.match(/MEMECORE_PRIVATE_KEY=(0x[a-fA-F0-9]+)/)[1];
  const bytecode = envContent.match(/MRC20_BYTECODE=(0x[a-fA-F0-9]+)/)[1];

  console.log('Private Key:', privateKey.substring(0, 10) + '...');
  console.log('Bytecode length:', bytecode.length);

  // Setup provider and wallet
  const rpcUrl = 'https://rpc.insectarium.memecore.net/';
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);

  console.log('Deployer Address:', wallet.address);

  // Check balance
  const balance = await provider.getBalance(wallet.address);
  console.log('Balance:', ethers.formatEther(balance), 'M');
  console.log('═══════════════════════════════════════════════════════\n');

  if (balance === 0n) {
    throw new Error('Insufficient balance');
  }

  // Token parameters
  const tokenName = 'Doge to the Moon';
  const tokenSymbol = 'DOGE';
  const initialSupply = ethers.parseUnits('1000000000', 18); // 1 billion with 18 decimals
  const logoURI = 'https://example.com/doge.png';
  const description = 'Doge to the Moon - A memecoin from the Memes category on Memekipedia';

  console.log('📝 Token Details:');
  console.log('   Name:', tokenName);
  console.log('   Symbol:', tokenSymbol);
  console.log('   Supply:', ethers.formatUnits(initialSupply, 18));
  console.log('   Logo:', logoURI);
  console.log('\n⏳ Deploying contract...\n');

  // Load contract ABI from artifacts
  const artifactPath = path.join(__dirname, '../artifacts/contracts/MRC20Token.sol/MRC20Token.json');
  const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));

  // Create contract factory
  const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet);

  try {
    // Deploy contract
    const contract = await factory.deploy(
      tokenName,
      tokenSymbol,
      ethers.parseUnits('1000000000', 0), // Initial supply without decimals
      logoURI,
      description,
      wallet.address
    );

    console.log('   Transaction sent:', contract.deploymentTransaction().hash);
    console.log('   Waiting for confirmation...\n');

    await contract.waitForDeployment();

    const address = await contract.getAddress();

    console.log('✅ Token Deployed Successfully!\n');
    console.log('═══════════════════════════════════════════════════════');
    console.log('Token Address:', address);
    console.log('Transaction Hash:', contract.deploymentTransaction().hash);
    console.log('═══════════════════════════════════════════════════════\n');
    console.log('🔗 View on Explorer:');
    console.log('   Token:', `https://insectarium.blockscout.memecore.com/address/${address}`);
    console.log('   TX:', `https://insectarium.blockscout.memecore.com/tx/${contract.deploymentTransaction().hash}`);
    console.log('\n');

    // Verify token info
    console.log('⏳ Verifying token on blockchain...\n');
    await new Promise(resolve => setTimeout(resolve, 3000));

    const name = await contract.name();
    const symbol = await contract.symbol();
    const totalSupply = await contract.totalSupply();
    const decimals = await contract.decimals();

    console.log('✅ Token Verified!\n');
    console.log('═══════════════════════════════════════════════════════');
    console.log('Name:', name);
    console.log('Symbol:', symbol);
    console.log('Total Supply:', ethers.formatUnits(totalSupply, decimals));
    console.log('Decimals:', decimals);
    console.log('═══════════════════════════════════════════════════════\n');

    console.log('🎉 Test Completed Successfully!\n');

    return {
      address,
      transactionHash: contract.deploymentTransaction().hash,
      name,
      symbol,
      totalSupply: totalSupply.toString(),
    };
  } catch (error) {
    console.error('\n❌ Deployment Failed!\n');
    console.error('Error:', error.message);
    if (error.code === 'INSUFFICIENT_FUNDS') {
      console.log('\n💡 Solution: Get more testnet tokens from faucet');
    }
    throw error;
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
