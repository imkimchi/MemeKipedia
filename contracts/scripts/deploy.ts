import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with account:", deployer.address);

  const initialSupply = 1_000_000;

  const MToken = await ethers.getContractFactory("MToken");
  const mToken = await MToken.deploy(initialSupply);
  await mToken.waitForDeployment();
  const mTokenAddress = await mToken.getAddress();
  console.log("MToken deployed to:", mTokenAddress);

  const BadgeNFT = await ethers.getContractFactory("BadgeNFT");
  const badgeNFT = await BadgeNFT.deploy("https://memekipedia.io/api/badge/");
  await badgeNFT.waitForDeployment();
  const badgeNFTAddress = await badgeNFT.getAddress();
  console.log("BadgeNFT deployed to:", badgeNFTAddress);

  const StakingContract = await ethers.getContractFactory("StakingContract");
  const stakingContract = await StakingContract.deploy(mTokenAddress);
  await stakingContract.waitForDeployment();
  const stakingContractAddress = await stakingContract.getAddress();
  console.log("StakingContract deployed to:", stakingContractAddress);

  const RewardDistributor = await ethers.getContractFactory("RewardDistributor");
  const rewardDistributor = await RewardDistributor.deploy(
    mTokenAddress,
    stakingContractAddress,
    badgeNFTAddress
  );
  await rewardDistributor.waitForDeployment();
  const rewardDistributorAddress = await rewardDistributor.getAddress();
  console.log("RewardDistributor deployed to:", rewardDistributorAddress);

  const fundAmount = ethers.parseEther("100000");
  await mToken.transfer(rewardDistributorAddress, fundAmount);
  console.log("Funded RewardDistributor with 100,000 M tokens");

  console.log("\n=== Deployment Complete ===");
  console.log("MToken:", mTokenAddress);
  console.log("BadgeNFT:", badgeNFTAddress);
  console.log("StakingContract:", stakingContractAddress);
  console.log("RewardDistributor:", rewardDistributorAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
