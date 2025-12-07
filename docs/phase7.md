Continue development for Memekipedia.

=== GOAL ===
Implement blockchain features.

=== CONTRACTS (Hardhat) ===
1. MToken (ERC20)
2. BadgeNFT (ERC721)
3. StakingContract
4. RewardDistributor
   - pull-based reward claims
   - editors earn M tokens
   - staking multiplier
   - badge multiplier

=== FRONTEND (wagmi) ===
1. Staking page:
   - stake
   - unstake
   - view lock period
   - view pending rewards

2. Badge gallery:
   - display owned Badge NFTs

3. Reward Claim button:
   - call rewardDistributor.claim()

=== DELIVERABLES ===
- Full contracts
- Deployment scripts
- Wagmi hooks
- UI pages

Only output code.

