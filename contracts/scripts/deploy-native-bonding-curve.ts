import { ethers } from "hardhat";

/**
 * Deploy NativeBondingCurve for a wiki token (uses native M)
 *
 * This creates a bonding curve that enables instant trading with native M tokens.
 *
 * Usage:
 * npx hardhat run scripts/deploy-native-bonding-curve.ts --network memecoreInsectarium -- --token TOKEN_ADDRESS
 */
async function main() {
  console.log("Deploying NativeBondingCurve contract...\n");

  // Get deployer
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  // Get account balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "M\n");

  // Get token address from command line
  const args = process.argv.slice(2);
  const tokenIndex = args.findIndex(arg => arg === '--token') + 1;
  const TOKEN_ADDRESS = tokenIndex > 0 ? args[tokenIndex] : null;

  if (!TOKEN_ADDRESS) {
    console.log("❌ Error: Token address required\n");
    console.log("Usage:");
    console.log("  npx hardhat run scripts/deploy-native-bonding-curve.ts --network memecoreInsectarium -- --token TOKEN_ADDRESS\n");
    process.exit(1);
  }

  console.log("=== Configuration ===");
  console.log("Wiki Token:", TOKEN_ADDRESS);
  console.log("Payment Token: Native M (chain token)");

  // Bonding curve parameters
  // Base price: 0.00000001 M per token (very cheap start)
  // Slope: Price increases by 0.000000001 M for each token sold
  const BASE_PRICE = ethers.parseEther("0.00000001");  // 0.00000001 M
  const SLOPE = ethers.parseEther("0.000000001");       // Increase per token

  console.log("\n=== Bonding Curve Parameters ===");
  console.log("Base Price:", ethers.formatEther(BASE_PRICE), "M per token");
  console.log("Slope:", ethers.formatEther(SLOPE), "M per token");
  console.log("Example prices:");
  console.log("  - 1st token:", ethers.formatEther(BASE_PRICE), "M");
  console.log("  - 1,000th token:", ethers.formatEther(BASE_PRICE + SLOPE * BigInt(1000)), "M");
  console.log("  - 1,000,000th token:", ethers.formatEther(BASE_PRICE + SLOPE * BigInt(1000000)), "M");

  // Deploy NativeBondingCurve
  console.log("\n=== Deploying NativeBondingCurve ===");
  const NativeBondingCurve = await ethers.getContractFactory("NativeBondingCurve");
  const bondingCurve = await NativeBondingCurve.deploy(
    TOKEN_ADDRESS,
    BASE_PRICE,
    SLOPE,
    deployer.address
  );

  await bondingCurve.waitForDeployment();
  const bondingCurveAddress = await bondingCurve.getAddress();

  console.log("✓ NativeBondingCurve deployed to:", bondingCurveAddress);

  // Transfer all tokens to bonding curve
  console.log("\n=== Transferring Tokens to Curve ===");
  const token = await ethers.getContractAt("MRC20Token", TOKEN_ADDRESS);
  const tokenBalance = await token.balanceOf(deployer.address);
  console.log("Deployer token balance:", ethers.formatEther(tokenBalance));

  if (tokenBalance > 0) {
    console.log("Transferring tokens to bonding curve...");
    const transferTx = await token.transfer(bondingCurveAddress, tokenBalance);
    await transferTx.wait();
    console.log("✓ Tokens transferred");

    const curveBalance = await token.balanceOf(bondingCurveAddress);
    console.log("Curve token balance:", ethers.formatEther(curveBalance));
  } else {
    console.log("⚠️  Warning: No tokens to transfer. Make sure deployer owns the tokens.");
  }

  // Get curve info
  console.log("\n=== Bonding Curve Info ===");
  const info = await bondingCurve.getCurveInfo();
  console.log("Current Price:", ethers.formatEther(info[0]), "M");
  console.log("Tokens Sold:", info[1].toString());
  console.log("M Reserve:", ethers.formatEther(info[2]), "M");
  console.log("Available Supply:", ethers.formatEther(info[3]));

  console.log("\n=== Deployment Summary ===");
  console.log("NativeBondingCurve Address:", bondingCurveAddress);
  console.log("Explorer:", `https://insectarium.blockscout.memecore.com/address/${bondingCurveAddress}`);
  console.log("\n=== Add to .env.local ===");
  console.log(`# Add to wiki record in database`);
  console.log(`bonding_curve_address=${bondingCurveAddress}`);
  console.log("\n✅ Trading is now enabled! Users can buy/sell with native M immediately.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
