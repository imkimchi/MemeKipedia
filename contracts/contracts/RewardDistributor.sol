// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./StakingContract.sol";
import "./BadgeNFT.sol";

contract RewardDistributor is Ownable, ReentrancyGuard {
    IERC20 public mToken;
    StakingContract public stakingContract;
    BadgeNFT public badgeNFT;

    uint256 public baseRewardPerEdit = 10 * 10**18;

    mapping(address => uint256) public pendingRewards;
    mapping(address => uint256) public totalClaimed;

    event RewardAdded(address indexed editor, uint256 amount);
    event RewardClaimed(address indexed editor, uint256 amount);

    constructor(
        address _mToken,
        address _stakingContract,
        address _badgeNFT
    ) Ownable(msg.sender) {
        mToken = IERC20(_mToken);
        stakingContract = StakingContract(_stakingContract);
        badgeNFT = BadgeNFT(_badgeNFT);
    }

    function addReward(address editor) external onlyOwner {
        uint256 stakingMultiplier = stakingContract.getMultiplier(editor);
        uint256 badgeMultiplier = getBadgeMultiplier(editor);

        uint256 reward = (baseRewardPerEdit * stakingMultiplier * badgeMultiplier) / 10000;

        pendingRewards[editor] += reward;

        emit RewardAdded(editor, reward);
    }

    function claim() external nonReentrant {
        uint256 amount = pendingRewards[msg.sender];
        require(amount > 0, "No rewards to claim");

        pendingRewards[msg.sender] = 0;
        totalClaimed[msg.sender] += amount;

        require(mToken.transfer(msg.sender, amount), "Transfer failed");

        emit RewardClaimed(msg.sender, amount);
    }

    function getPendingRewards(address editor) external view returns (uint256) {
        return pendingRewards[editor];
    }

    function getBadgeMultiplier(address user) public view returns (uint256) {
        uint256[] memory badges = badgeNFT.getUserBadges(user);

        if (badges.length == 0) {
            return 100;
        } else if (badges.length < 3) {
            return 110;
        } else if (badges.length < 5) {
            return 125;
        } else {
            return 150;
        }
    }

    function setBaseRewardPerEdit(uint256 _baseRewardPerEdit) external onlyOwner {
        baseRewardPerEdit = _baseRewardPerEdit;
    }

    function withdrawTokens(uint256 amount) external onlyOwner {
        require(mToken.transfer(owner(), amount), "Transfer failed");
    }
}
