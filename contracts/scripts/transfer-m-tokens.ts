import { ethers } from "hardhat";
import * as dotenv from "dotenv";
dotenv.config({ path: "../.env.local" });

async function main() {
  const [deployer] = await ethers.getSigners();
  const M_TOKEN_ADDRESS = process.env.NEXT_PUBLIC_M_TOKEN_ADDRESS;

  if (!M_TOKEN_ADDRESS) {
    throw new Error("NEXT_PUBLIC_M_TOKEN_ADDRESS not set");
  }

  console.log("Deployer address:", deployer.address);
  console.log("M Token address:", M_TOKEN_ADDRESS);

  // Get M token contract
  const MToken = await ethers.getContractAt("MToken", M_TOKEN_ADDRESS);

  // Check deployer balance
  const deployerBalance = await MToken.balanceOf(deployer.address);
  console.log("Deployer M balance:", ethers.formatEther(deployerBalance));

  // Address to send M tokens to (your wallet)
  const RECIPIENT = "0x5698B5Dc"; // TODO: Replace with your FULL wallet address
  const AMOUNT = ethers.parseEther("10000"); // Send 10000 M tokens

  console.log(`\nTransferring ${ethers.formatEther(AMOUNT)} M tokens to ${RECIPIENT}...`);

  const tx = await MToken.transfer(RECIPIENT, AMOUNT);
  await tx.wait();

  console.log("Transfer successful!");
  console.log("Transaction hash:", tx.hash);

  // Check recipient balance
  const recipientBalance = await MToken.balanceOf(RECIPIENT);
  console.log("Recipient M balance:", ethers.formatEther(recipientBalance));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
