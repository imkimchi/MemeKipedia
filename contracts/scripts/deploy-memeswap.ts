import { ethers } from "hardhat";

async function main() {
  console.log("Deploying MemeSwap AMM contracts...");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  // Get account balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "M");

  // Deploy Factory
  console.log("\nDeploying MemeSwapFactory...");
  const Factory = await ethers.getContractFactory("MemeSwapFactory");
  const factory = await Factory.deploy();
  await factory.waitForDeployment();
  const factoryAddress = await factory.getAddress();
  console.log("✓ MemeSwapFactory deployed to:", factoryAddress);

  // Deploy Router
  console.log("\nDeploying MemeSwapRouter...");
  const Router = await ethers.getContractFactory("MemeSwapRouter");
  const router = await Router.deploy(factoryAddress);
  await router.waitForDeployment();
  const routerAddress = await router.getAddress();
  console.log("✓ MemeSwapRouter deployed to:", routerAddress);

  console.log("\n=== Deployment Summary ===");
  console.log("MemeSwapFactory:", factoryAddress);
  console.log("MemeSwapRouter:", routerAddress);
  console.log("\n=== Add these to your .env.local ===");
  console.log(`NEXT_PUBLIC_MEMESWAP_FACTORY_ADDRESS=${factoryAddress}`);
  console.log(`NEXT_PUBLIC_MEMESWAP_ROUTER_ADDRESS=${routerAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
