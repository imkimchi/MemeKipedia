// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title BondingCurve
 * @notice Linear bonding curve for wiki memecoins (like pump.fun)
 * @dev Enables instant trading without liquidity pools
 *
 * Price Formula: price = basePrice + (tokensSold * slope / PRECISION)
 *
 * Features:
 * - Instant trading on token creation
 * - No liquidity needed
 * - Fair launch - price increases with demand
 * - Buy and sell anytime
 */
contract BondingCurve is Ownable, ReentrancyGuard {
    // The wiki token being traded
    IERC20 public immutable wikiToken;

    // The M token used for purchasing
    IERC20 public immutable mToken;

    // Bonding curve parameters
    uint256 public constant PRECISION = 1e18;
    uint256 public immutable basePrice;      // Starting price in M tokens (e.g., 0.0001 M per token)
    uint256 public immutable slope;          // Price increase per token sold

    // State
    uint256 public tokensSold;               // Total tokens sold from curve
    uint256 public mReserve;                 // M tokens collected from sales

    // Events
    event TokensPurchased(address indexed buyer, uint256 mPaid, uint256 tokensReceived, uint256 newPrice);
    event TokensSold(address indexed seller, uint256 tokensSold, uint256 mReceived, uint256 newPrice);
    event CurveInitialized(address indexed wikiToken, uint256 initialSupply, uint256 basePrice, uint256 slope);

    /**
     * @notice Initialize bonding curve
     * @param _wikiToken The wiki token contract
     * @param _mToken The M token contract (payment token)
     * @param _basePrice Starting price (in M tokens, 18 decimals)
     * @param _slope Price increase per token sold
     * @param initialOwner Owner of the contract
     */
    constructor(
        address _wikiToken,
        address _mToken,
        uint256 _basePrice,
        uint256 _slope,
        address initialOwner
    ) Ownable(initialOwner) {
        require(_wikiToken != address(0), "Invalid wiki token");
        require(_mToken != address(0), "Invalid M token");
        require(_basePrice > 0, "Base price must be > 0");
        require(_slope > 0, "Slope must be > 0");

        wikiToken = IERC20(_wikiToken);
        mToken = IERC20(_mToken);
        basePrice = _basePrice;
        slope = _slope;

        emit CurveInitialized(_wikiToken, wikiToken.balanceOf(address(this)), _basePrice, _slope);
    }

    /**
     * @notice Calculate current buy price for 1 token
     * @return Current price in M tokens (18 decimals)
     */
    function getCurrentPrice() public view returns (uint256) {
        return basePrice + (tokensSold * slope / PRECISION);
    }

    /**
     * @notice Calculate price after buying a certain amount
     * @param amount Number of tokens to buy
     * @return Price after purchase
     */
    function getPriceAfterBuy(uint256 amount) public view returns (uint256) {
        return basePrice + ((tokensSold + amount) * slope / PRECISION);
    }

    /**
     * @notice Calculate cost to buy a specific amount of tokens (with slippage)
     * @param tokensOut Amount of wiki tokens to buy
     * @return mCost Total M tokens needed
     */
    function calculateBuyCost(uint256 tokensOut) public view returns (uint256) {
        // Using integral of linear function:
        // Cost = basePrice * amount + (slope * amount * (2 * sold + amount)) / (2 * PRECISION)

        uint256 baseCost = basePrice * tokensOut;
        uint256 incrementalCost = (slope * tokensOut * (2 * tokensSold + tokensOut)) / (2 * PRECISION);

        return (baseCost + incrementalCost) / PRECISION;
    }

    /**
     * @notice Calculate M tokens received when selling tokens
     * @param tokensIn Amount of wiki tokens to sell
     * @return mOut M tokens to receive
     */
    function calculateSellReturn(uint256 tokensIn) public view returns (uint256) {
        require(tokensIn <= tokensSold, "Cannot sell more than sold");

        // Reverse of buy formula
        uint256 newSold = tokensSold - tokensIn;
        uint256 baseCost = basePrice * tokensIn;
        uint256 incrementalCost = (slope * tokensIn * (tokensSold + newSold)) / (2 * PRECISION);

        return (baseCost + incrementalCost) / PRECISION;
    }

    /**
     * @notice Buy wiki tokens with M tokens
     * @param tokensOut Amount of wiki tokens to buy
     * @param maxMIn Maximum M tokens willing to pay (slippage protection)
     * @return mCost Actual M tokens spent
     */
    function buy(uint256 tokensOut, uint256 maxMIn) external nonReentrant returns (uint256 mCost) {
        require(tokensOut > 0, "Must buy > 0 tokens");
        require(wikiToken.balanceOf(address(this)) >= tokensOut, "Insufficient curve supply");

        // Calculate cost
        mCost = calculateBuyCost(tokensOut);
        require(mCost <= maxMIn, "Slippage too high");
        require(mCost > 0, "Cost must be > 0");

        // Transfer M tokens from buyer
        require(mToken.transferFrom(msg.sender, address(this), mCost), "M transfer failed");

        // Update state
        tokensSold += tokensOut;
        mReserve += mCost;

        // Transfer wiki tokens to buyer
        require(wikiToken.transfer(msg.sender, tokensOut), "Token transfer failed");

        emit TokensPurchased(msg.sender, mCost, tokensOut, getCurrentPrice());
    }

    /**
     * @notice Sell wiki tokens for M tokens
     * @param tokensIn Amount of wiki tokens to sell
     * @param minMOut Minimum M tokens to receive (slippage protection)
     * @return mOut M tokens received
     */
    function sell(uint256 tokensIn, uint256 minMOut) external nonReentrant returns (uint256 mOut) {
        require(tokensIn > 0, "Must sell > 0 tokens");
        require(tokensIn <= tokensSold, "Cannot sell more than sold");

        // Calculate return
        mOut = calculateSellReturn(tokensIn);
        require(mOut >= minMOut, "Slippage too high");
        require(mOut > 0, "Return must be > 0");
        require(mReserve >= mOut, "Insufficient M reserve");

        // Transfer wiki tokens from seller
        require(wikiToken.transferFrom(msg.sender, address(this), tokensIn), "Token transfer failed");

        // Update state
        tokensSold -= tokensIn;
        mReserve -= mOut;

        // Transfer M tokens to seller
        require(mToken.transfer(msg.sender, mOut), "M transfer failed");

        emit TokensSold(msg.sender, tokensIn, mOut, getCurrentPrice());
    }

    /**
     * @notice Get bonding curve info
     * @return currentPrice Current token price in M tokens
     * @return sold Total tokens sold from curve
     * @return reserve M tokens collected from sales
     * @return availableSupply Tokens available in curve
     */
    function getCurveInfo() external view returns (
        uint256 currentPrice,
        uint256 sold,
        uint256 reserve,
        uint256 availableSupply
    ) {
        return (
            getCurrentPrice(),
            tokensSold,
            mReserve,
            wikiToken.balanceOf(address(this))
        );
    }

    /**
     * @notice Emergency withdraw (owner only) - for upgrading or migration
     * @dev Should only be used in emergencies
     */
    function emergencyWithdraw() external onlyOwner {
        uint256 tokenBalance = wikiToken.balanceOf(address(this));
        uint256 mBalance = mToken.balanceOf(address(this));

        if (tokenBalance > 0) {
            wikiToken.transfer(owner(), tokenBalance);
        }
        if (mBalance > 0) {
            mToken.transfer(owner(), mBalance);
        }
    }
}
