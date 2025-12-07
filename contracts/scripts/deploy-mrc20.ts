import { ethers } from "hardhat";

/**
 * Deploy a new MRC-20 token on Memecore network
 *
 * Usage:
 * npx hardhat run scripts/deploy-mrc20.ts --network memecoreInsectarium
 *
 * Or deploy directly from the script:
 * const address = await deployMRC20Token("MyToken", "MTK", 1000000000, "https://...", "Description", deployerAddress);
 */
async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying MRC-20 token with account:", deployer.address);
  console.log("Account balance:", (await ethers.provider.getBalance(deployer.address)).toString());

  // Example deployment - customize these values
  const tokenName = "Example Meme Token";
  const tokenSymbol = "EMT";
  const initialSupply = 1_000_000_000; // 1 billion tokens
  const logoURI = "https://example.com/logo.png";
  const description = "An example memecoin for testing";

  const token = await deployMRC20Token(
    tokenName,
    tokenSymbol,
    initialSupply,
    logoURI,
    description,
    deployer.address
  );

  console.log("Token deployed to:", token.target);
  console.log("Transaction hash:", token.deploymentTransaction()?.hash);
  console.log("\nVerify on explorer:");
  console.log("https://insectarium.blockscout.memecore.com/address/" + token.target);
}

/**
 * Deploy MRC-20 token contract
 */
export async function deployMRC20Token(
  name: string,
  symbol: string,
  initialSupply: number,
  logoURI: string,
  description: string,
  initialOwner: string
) {
  const MRC20Token = await ethers.getContractFactory("MRC20Token");

  const token = await MRC20Token.deploy(
    name,
    symbol,
    initialSupply,
    logoURI,
    description,
    initialOwner
  );

  await token.waitForDeployment();

  return token;
}

// Run if executed directly
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
