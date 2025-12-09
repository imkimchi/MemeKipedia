import { ethers } from "hardhat";

async function main() {
  const CURVE_ADDRESS = "0x4D8a8a1065e0E7f222dffdf6fc2494c87742091a";

  console.log('=== Checking Bonding Curve ===\n');
  console.log('Curve Address:', CURVE_ADDRESS);

  // Get bonding curve contract
  const curve = await ethers.getContractAt('NativeBondingCurve', CURVE_ADDRESS);

  // Get wiki token address
  const wikiTokenAddress = await curve.wikiToken();
  console.log('Wiki Token Address:', wikiTokenAddress);

  // Get token contract
  const token = await ethers.getContractAt('MRC20Token', wikiTokenAddress);

  // Get token info
  const [name, symbol] = await Promise.all([
    token.name(),
    token.symbol(),
  ]);

  console.log('\n=== Token Info ===');
  console.log('Name:', name);
  console.log('Symbol:', symbol);

  // Get curve balance
  const curveBalance = await token.balanceOf(CURVE_ADDRESS);
  console.log('\n=== Bonding Curve Balance ===');
  console.log('Balance:', ethers.formatEther(curveBalance), symbol);

  if (curveBalance === 0n) {
    console.log('\n❌ PROBLEM: Bonding curve has NO tokens!');
    console.log('\n💡 Solution: Transfer tokens to the curve:');
    console.log(`   npx hardhat run scripts/fix-transfer.ts --network memecoreInsectarium`);
  } else {
    console.log('\n✅ Curve has tokens - trading should work!');
  }

  // Check deployer balance
  const [deployer] = await ethers.getSigners();
  const deployerBalance = await token.balanceOf(deployer.address);
  console.log('\n=== Deployer Balance ===');
  console.log('Address:', deployer.address);
  console.log('Balance:', ethers.formatEther(deployerBalance), symbol);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
