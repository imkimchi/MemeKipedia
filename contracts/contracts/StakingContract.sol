// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract StakingContract is Ownable, ReentrancyGuard {
    IERC20 public mToken;

    uint256 public lockPeriod = 7 days;
    uint256 public baseMultiplier = 100;

    struct Stake {
        uint256 amount;
        uint256 timestamp;
        uint256 unlockTime;
    }

    mapping(address => Stake) public stakes;

    event Staked(address indexed user, uint256 amount, uint256 unlockTime);
    event Unstaked(address indexed user, uint256 amount);

    constructor(address _mToken) Ownable(msg.sender) {
        mToken = IERC20(_mToken);
    }

    function stake(uint256 amount) external nonReentrant {
        require(amount > 0, "Cannot stake 0");
        require(stakes[msg.sender].amount == 0, "Already staked");

        require(mToken.transferFrom(msg.sender, address(this), amount), "Transfer failed");

        uint256 unlockTime = block.timestamp + lockPeriod;

        stakes[msg.sender] = Stake({
            amount: amount,
            timestamp: block.timestamp,
            unlockTime: unlockTime
        });

        emit Staked(msg.sender, amount, unlockTime);
    }

    function unstake() external nonReentrant {
        Stake memory userStake = stakes[msg.sender];
        require(userStake.amount > 0, "No stake found");
        require(block.timestamp >= userStake.unlockTime, "Stake is locked");

        uint256 amount = userStake.amount;
        delete stakes[msg.sender];

        require(mToken.transfer(msg.sender, amount), "Transfer failed");

        emit Unstaked(msg.sender, amount);
    }

    function getStake(address user) external view returns (Stake memory) {
        return stakes[user];
    }

    function getMultiplier(address user) external view returns (uint256) {
        if (stakes[user].amount == 0) {
            return 100;
        }
        return baseMultiplier + 50;
    }

    function setLockPeriod(uint256 _lockPeriod) external onlyOwner {
        lockPeriod = _lockPeriod;
    }
}
