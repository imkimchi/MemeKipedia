import { ethers } from "hardhat";

async function main() {
  const CURVE_ADDRESS = "0x4D8a8a1065e0E7f222dffdf6fc2494c87742091a";
  const [deployer] = await ethers.getSigners();

  console.log('=== Transferring Tokens to Bonding Curve ===\n');
  console.log('Deployer:', deployer.address);
  console.log('Curve Address:', CURVE_ADDRESS);

  // Get bonding curve contract
  const curve = await ethers.getContractAt('NativeBondingCurve', CURVE_ADDRESS);

  // Get wiki token address
  const wikiTokenAddress = await curve.wikiToken();
  console.log('Wiki Token Address:', wikiTokenAddress);

  // Get token contract
  const token = await ethers.getContractAt('MRC20Token', wikiTokenAddress);
  const symbol = await token.symbol();

  // Check deployer balance
  const deployerBalance = await token.balanceOf(deployer.address);
  console.log('\nDeployer token balance:', ethers.formatEther(deployerBalance), symbol);

  if (deployerBalance === 0n) {
    console.log('❌ Deployer has no tokens to transfer!');
    console.log('\n⚠️  The tokens might be in a different wallet.');
    console.log('Check who owns the tokens with a block explorer.');
    process.exit(1);
  }

  // Transfer tokens
  console.log(`\n📤 Transferring ${ethers.formatEther(deployerBalance)} ${symbol} to curve...`);

  const tx = await token.transfer(CURVE_ADDRESS, deployerBalance);
  console.log('Transaction hash:', tx.hash);

  await tx.wait();
  console.log('✅ Transfer successful!');

  // Verify
  const newCurveBalance = await token.balanceOf(CURVE_ADDRESS);
  console.log('\n=== Final Balances ===');
  console.log('Deployer:', ethers.formatEther(await token.balanceOf(deployer.address)), symbol);
  console.log('Curve:', ethers.formatEther(newCurveBalance), symbol);

  console.log('\n🎉 Trading is now enabled! Try buying tokens.');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
