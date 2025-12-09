import { ethers } from "hardhat";
import "dotenv/config";

/**
 * Add Liquidity to MemeSwap Pool
 *
 * Creates a trading pair (if needed) and adds initial liquidity for M token <-> Wiki token
 *
 * Usage:
 * npx hardhat run scripts/add-liquidity.ts --network memecoreInsectarium
 *
 * Required env vars:
 * - MEMECORE_PRIVATE_KEY: Your wallet private key (must have M tokens and wiki tokens)
 * - NEXT_PUBLIC_M_TOKEN_ADDRESS: M token address
 * - NEXT_PUBLIC_MEMESWAP_ROUTER_ADDRESS: Router address
 */

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Adding liquidity with account:", deployer.address);

  // Contract addresses from environment
  const M_TOKEN_ADDRESS = process.env.NEXT_PUBLIC_M_TOKEN_ADDRESS;
  const ROUTER_ADDRESS = process.env.NEXT_PUBLIC_MEMESWAP_ROUTER_ADDRESS;
  const FACTORY_ADDRESS = process.env.NEXT_PUBLIC_MEMESWAP_FACTORY_ADDRESS;

  if (!M_TOKEN_ADDRESS || !ROUTER_ADDRESS || !FACTORY_ADDRESS) {
    throw new Error("Missing contract addresses in .env.local");
  }

  // Get wiki token address from command line argument
  const args = process.argv.slice(2);
  const wikiTokenAddressIndex = args.findIndex(arg => arg === '--token') + 1;
  const WIKI_TOKEN_ADDRESS = wikiTokenAddressIndex > 0 ? args[wikiTokenAddressIndex] : null;

  if (!WIKI_TOKEN_ADDRESS) {
    console.log("\n❌ Error: Wiki token address required");
    console.log("\nUsage:");
    console.log("  npx hardhat run scripts/add-liquidity.ts --network memecoreInsectarium --token <TOKEN_ADDRESS>");
    console.log("\nExample:");
    console.log("  npx hardhat run scripts/add-liquidity.ts --network memecoreInsectarium --token 0x1234...");
    process.exit(1);
  }

  console.log("\n=== Configuration ===");
  console.log("M Token:", M_TOKEN_ADDRESS);
  console.log("Wiki Token:", WIKI_TOKEN_ADDRESS);
  console.log("Router:", ROUTER_ADDRESS);
  console.log("Factory:", FACTORY_ADDRESS);

  // Get contract instances
  const mToken = await ethers.getContractAt("MToken", M_TOKEN_ADDRESS);
  const wikiToken = await ethers.getContractAt("MRC20Token", WIKI_TOKEN_ADDRESS);
  const router = await ethers.getContractAt("MemeSwapRouter", ROUTER_ADDRESS);
  const factory = await ethers.getContractAt("MemeSwapFactory", FACTORY_ADDRESS);

  // Check balances
  const mBalance = await mToken.balanceOf(deployer.address);
  const wikiBalance = await wikiToken.balanceOf(deployer.address);

  console.log("\n=== Wallet Balances ===");
  console.log("M tokens:", ethers.formatEther(mBalance));
  console.log("Wiki tokens:", ethers.formatEther(wikiBalance));

  if (mBalance === 0n || wikiBalance === 0n) {
    throw new Error("Insufficient token balance. You need both M tokens and Wiki tokens.");
  }

  // Liquidity amounts (you can customize these)
  // Default: Add 10% of M balance and 50% of wiki token supply
  const amountM = mBalance / 10n; // 10% of M balance
  const amountWiki = wikiBalance / 2n; // 50% of wiki tokens

  console.log("\n=== Liquidity to Add ===");
  console.log("M tokens:", ethers.formatEther(amountM));
  console.log("Wiki tokens:", ethers.formatEther(amountWiki));

  // Check if pair already exists
  const existingPair = await factory.getPair(M_TOKEN_ADDRESS, WIKI_TOKEN_ADDRESS);
  if (existingPair !== ethers.ZeroAddress) {
    console.log("\n⚠️  Pair already exists:", existingPair);
    console.log("This will add liquidity to existing pool");
  } else {
    console.log("\n✅ Creating new pair...");
  }

  // Approve tokens for router
  console.log("\n=== Approving Tokens ===");

  const mAllowance = await mToken.allowance(deployer.address, ROUTER_ADDRESS);
  if (mAllowance < amountM) {
    console.log("Approving M tokens...");
    const approveMTx = await mToken.approve(ROUTER_ADDRESS, amountM);
    await approveMTx.wait();
    console.log("✓ M tokens approved");
  } else {
    console.log("✓ M tokens already approved");
  }

  const wikiAllowance = await wikiToken.allowance(deployer.address, ROUTER_ADDRESS);
  if (wikiAllowance < amountWiki) {
    console.log("Approving Wiki tokens...");
    const approveWikiTx = await wikiToken.approve(ROUTER_ADDRESS, amountWiki);
    await approveWikiTx.wait();
    console.log("✓ Wiki tokens approved");
  } else {
    console.log("✓ Wiki tokens already approved");
  }

  // Add liquidity
  console.log("\n=== Adding Liquidity ===");
  const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes from now

  const addLiquidityTx = await router.addLiquidity(
    M_TOKEN_ADDRESS,
    WIKI_TOKEN_ADDRESS,
    amountM,
    amountWiki,
    0, // amountAMin (0 for first liquidity)
    0, // amountBMin (0 for first liquidity)
    deployer.address, // LP tokens recipient
    deadline
  );

  console.log("Transaction hash:", addLiquidityTx.hash);
  console.log("Waiting for confirmation...");

  const receipt = await addLiquidityTx.wait();
  console.log("✅ Liquidity added successfully!");

  // Get pair address
  const pairAddress = await factory.getPair(M_TOKEN_ADDRESS, WIKI_TOKEN_ADDRESS);
  console.log("\n=== Pool Created ===");
  console.log("Pair Address:", pairAddress);
  console.log("Explorer:", `https://insectarium.blockscout.memecore.com/address/${pairAddress}`);

  // Get pool reserves
  const pair = await ethers.getContractAt("MemeSwapPair", pairAddress);
  const reserves = await pair.getReserves();
  const token0 = await pair.token0();
  const token1 = await pair.token1();

  const isToken0M = token0.toLowerCase() === M_TOKEN_ADDRESS.toLowerCase();
  const reserveM = isToken0M ? reserves[0] : reserves[1];
  const reserveWiki = isToken0M ? reserves[1] : reserves[0];

  console.log("\n=== Pool Reserves ===");
  console.log("M tokens:", ethers.formatEther(reserveM));
  console.log("Wiki tokens:", ethers.formatEther(reserveWiki));
  console.log("Price: 1 M =", Number(reserveWiki) / Number(reserveM), "WIKI");
  console.log("Price: 1 WIKI =", Number(reserveM) / Number(reserveWiki), "M");

  console.log("\n=== Next Steps ===");
  console.log("1. Trading is now enabled for this token!");
  console.log("2. Visit the wiki page and test buy/sell");
  console.log("3. Make sure you have M tokens in your wallet to buy");
  console.log("4. Pool address:", pairAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
