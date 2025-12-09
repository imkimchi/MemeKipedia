import { ethers } from "hardhat";

/**
 * Check bonding curve token balance
 * Usage: npx hardhat run scripts/check-curve-balance.ts --network memecoreInsectarium -- --curve CURVE_ADDRESS
 */
async function main() {
  const args = process.argv.slice(2);
  const curveIndex = args.findIndex(arg => arg === '--curve') + 1;
  const CURVE_ADDRESS = curveIndex > 0 ? args[curveIndex] : null;

  if (!CURVE_ADDRESS) {
    console.log('❌ Error: Curve address required\n');
    console.log('Usage:');
    console.log('  npx hardhat run scripts/check-curve-balance.ts --network memecoreInsectarium -- --curve CURVE_ADDRESS\n');
    process.exit(1);
  }

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
  const [name, symbol, decimals] = await Promise.all([
    token.name(),
    token.symbol(),
    token.decimals(),
  ]);

  console.log('\n=== Token Info ===');
  console.log('Name:', name);
  console.log('Symbol:', symbol);
  console.log('Decimals:', decimals);

  // Get curve balance
  const curveBalance = await token.balanceOf(CURVE_ADDRESS);
  console.log('\n=== Bonding Curve Balance ===');
  console.log('Balance:', ethers.formatEther(curveBalance), symbol);

  if (curveBalance === 0n) {
    console.log('\n❌ PROBLEM: Bonding curve has no tokens!');
    console.log('\n💡 Solution: Transfer tokens to the curve:');
    console.log(`   npx hardhat run scripts/transfer-to-curve.ts --network memecoreInsectarium -- --token ${wikiTokenAddress} --curve ${CURVE_ADDRESS}`);
  } else {
    console.log('\n✅ Curve has tokens - trading should work!');
  }

  // Get curve info
  const info = await curve.getCurveInfo();
  console.log('\n=== Curve State ===');
  console.log('Current Price:', ethers.formatEther(info[0]), 'M per token');
  console.log('Tokens Sold:', info[1].toString());
  console.log('M Reserve:', ethers.formatEther(info[2]), 'M');
  console.log('Available Supply:', ethers.formatEther(info[3]), symbol);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
