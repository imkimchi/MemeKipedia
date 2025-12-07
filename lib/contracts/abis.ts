export const MTOKEN_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
] as const

export const STAKING_ABI = [
  'function stake(uint256 amount)',
  'function unstake()',
  'function getStake(address user) view returns (tuple(uint256 amount, uint256 timestamp, uint256 unlockTime))',
  'function lockPeriod() view returns (uint256)',
] as const

export const REWARD_DISTRIBUTOR_ABI = [
  'function claim()',
  'function getPendingRewards(address editor) view returns (uint256)',
  'function totalClaimed(address editor) view returns (uint256)',
] as const

export const BADGE_NFT_ABI = [
  'function getUserBadges(address user) view returns (uint256[])',
  'function tokenURI(uint256 tokenId) view returns (string)',
  'function balanceOf(address owner) view returns (uint256)',
] as const
