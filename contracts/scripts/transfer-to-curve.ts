import { ethers } from "hardhat";

/**
 * Transfer tokens to bonding curve
 * Usage: npx hardhat run scripts/transfer-to-curve.ts --network memecoreInsectarium -- --token TOKEN_ADDRESS --curve CURVE_ADDRESS
 */
async function main() {
  const [deployer] = await ethers.getSigners();

  // Get addresses from command line
  const args = process.argv.slice(2);
  const tokenIndex = args.findIndex(arg => arg === '--token') + 1;
  const curveIndex = args.findIndex(arg => arg === '--curve') + 1;

  const TOKEN_ADDRESS = tokenIndex > 0 ? args[tokenIndex] : null;
  const CURVE_ADDRESS = curveIndex > 0 ? args[curveIndex] : null;

  if (!TOKEN_ADDRESS || !CURVE_ADDRESS) {
    console.log('❌ Error: Both token and curve addresses required\n');
    console.log('Usage:');
    console.log('  npx hardhat run scripts/transfer-to-curve.ts --network memecoreInsectarium -- --token TOKEN_ADDRESS --curve CURVE_ADDRESS\n');
    process.exit(1);
  }

  console.log('=== Transfer Tokens to Bonding Curve ===\n');
  console.log('Deployer:', deployer.address);
  console.log('Token Address:', TOKEN_ADDRESS);
  console.log('Curve Address:', CURVE_ADDRESS);

  // Get token contract
  const token = await ethers.getContractAt('MRC20Token', TOKEN_ADDRESS);

  // Check deployer balance
  const deployerBalance = await token.balanceOf(deployer.address);
  console.log('\nDeployer token balance:', ethers.formatEther(deployerBalance));

  if (deployerBalance === 0n) {
    console.log('❌ Deployer has no tokens to transfer!');
    process.exit(1);
  }

  // Check curve balance
  const curveBalance = await token.balanceOf(CURVE_ADDRESS);
  console.log('Curve token balance:', ethers.formatEther(curveBalance));

  if (curveBalance > 0n) {
    console.log('\n⚠️  Curve already has tokens!');
    console.log('Do you want to transfer more? (Ctrl+C to cancel)');
  }

  // Transfer tokens
  console.log(`\n📤 Transferring ${ethers.formatEther(deployerBalance)} tokens to curve...`);

  const tx = await token.transfer(CURVE_ADDRESS, deployerBalance);
  console.log('Transaction hash:', tx.hash);

  await tx.wait();
  console.log('✅ Transfer successful!');

  // Verify
  const newCurveBalance = await token.balanceOf(CURVE_ADDRESS);
  console.log('\n=== Final Balances ===');
  console.log('Deployer:', ethers.formatEther(await token.balanceOf(deployer.address)));
  console.log('Curve:', ethers.formatEther(newCurveBalance));

  console.log('\n🎉 Trading is now enabled!');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
