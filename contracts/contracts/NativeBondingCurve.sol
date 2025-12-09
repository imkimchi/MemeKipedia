// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title NativeBondingCurve
 * @notice Linear bonding curve for wiki memecoins using native M token
 * @dev Enables instant trading without liquidity pools, uses native M for payments
 *
 * Price Formula: price = basePrice + (tokensSold * slope / PRECISION)
 *
 * Features:
 * - Instant trading on token creation
 * - No liquidity needed
 * - Uses native M token (like ETH on Ethereum)
 * - Fair launch - price increases with demand
 * - Buy and sell anytime
 */
contract NativeBondingCurve is Ownable, ReentrancyGuard {
    // The wiki token being traded
    IERC20 public immutable wikiToken;

    // Bonding curve parameters
    uint256 public constant PRECISION = 1e18;
    uint256 public immutable basePrice;      // Starting price in M tokens (e.g., 0.0001 M per token)
    uint256 public immutable slope;          // Price increase per token sold

    // State
    uint256 public tokensSold;               // Total tokens sold from curve
    uint256 public mReserve;                 // Native M collected from sales

    // Events
    event TokensPurchased(address indexed buyer, uint256 mPaid, uint256 tokensReceived, uint256 newPrice);
    event TokensSold(address indexed seller, uint256 tokensSold, uint256 mReceived, uint256 newPrice);
    event CurveInitialized(address indexed wikiToken, uint256 initialSupply, uint256 basePrice, uint256 slope);

    /**
     * @notice Initialize bonding curve
     * @param _wikiToken The wiki token contract
     * @param _basePrice Starting price (in M tokens, 18 decimals)
     * @param _slope Price increase per token sold
     * @param initialOwner Owner of the contract
     */
    constructor(
        address _wikiToken,
        uint256 _basePrice,
        uint256 _slope,
        address initialOwner
    ) Ownable(initialOwner) {
        require(_wikiToken != address(0), "Invalid wiki token");
        require(_basePrice > 0, "Base price must be > 0");
        require(_slope > 0, "Slope must be > 0");

        wikiToken = IERC20(_wikiToken);
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
     * @notice Calculate M tokens received for selling tokens (accounting for slippage)
     * @param tokensIn Amount of wiki tokens to sell
     * @return mOut Total M tokens received
     */
    function calculateSellReturn(uint256 tokensIn) public view returns (uint256) {
        require(tokensIn <= tokensSold, "Cannot sell more than sold");

        uint256 baseCost = basePrice * tokensIn;
        uint256 incrementalCost = (slope * tokensIn * (2 * tokensSold - tokensIn)) / (2 * PRECISION);

        return (baseCost + incrementalCost) / PRECISION;
    }

    /**
     * @notice Get comprehensive curve information
     * @return currentPrice Current token price
     * @return sold Total tokens sold
     * @return reserve M token reserve
     * @return availableSupply Remaining tokens available
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
     * @notice Returns address(0) for native M token
     * @return address(0) to indicate native token
     */
    function mToken() external pure returns (address) {
        return address(0);
    }

    /**
     * @notice Buy wiki tokens with native M
     * @param tokensOut Amount of wiki tokens to buy
     * @param maxMIn Maximum M to spend (slippage protection)
     * @return mCost Actual M spent
     */
    function buy(uint256 tokensOut, uint256 maxMIn) external payable nonReentrant returns (uint256 mCost) {
        require(tokensOut > 0, "Must buy > 0 tokens");
        require(wikiToken.balanceOf(address(this)) >= tokensOut, "Insufficient token supply");

        // Calculate cost
        mCost = calculateBuyCost(tokensOut);
        require(mCost > 0, "Cost must be > 0");
        require(msg.value >= mCost, "Insufficient M sent");
        require(mCost <= maxMIn, "Slippage exceeded");

        // Update state
        tokensSold += tokensOut;
        mReserve += mCost;

        // Transfer wiki tokens to buyer
        require(wikiToken.transfer(msg.sender, tokensOut), "Token transfer failed");

        // Refund excess M
        if (msg.value > mCost) {
            (bool refundSuccess, ) = msg.sender.call{value: msg.value - mCost}("");
            require(refundSuccess, "Refund failed");
        }

        emit TokensPurchased(msg.sender, mCost, tokensOut, getCurrentPrice());
    }

    /**
     * @notice Sell wiki tokens for native M
     * @param tokensIn Amount of wiki tokens to sell
     * @param minMOut Minimum M to receive (slippage protection)
     * @return mOut Actual M received
     */
    function sell(uint256 tokensIn, uint256 minMOut) external nonReentrant returns (uint256 mOut) {
        require(tokensIn > 0, "Must sell > 0 tokens");
        require(tokensIn <= tokensSold, "Cannot sell more than sold");

        // Calculate return
        mOut = calculateSellReturn(tokensIn);
        require(mOut > 0, "Return must be > 0");
        require(mOut >= minMOut, "Slippage exceeded");
        require(address(this).balance >= mOut, "Insufficient M reserve");

        // Transfer wiki tokens from seller
        require(wikiToken.transferFrom(msg.sender, address(this), tokensIn), "Token transfer failed");

        // Update state
        tokensSold -= tokensIn;
        mReserve -= mOut;

        // Transfer native M to seller
        (bool success, ) = msg.sender.call{value: mOut}("");
        require(success, "M transfer failed");

        emit TokensSold(msg.sender, tokensIn, mOut, getCurrentPrice());
    }

    /**
     * @notice Emergency withdraw function (owner only)
     * @dev Allows owner to withdraw all tokens and M in emergency
     */
    function emergencyWithdraw() external onlyOwner {
        uint256 tokenBalance = wikiToken.balanceOf(address(this));
        uint256 mBalance = address(this).balance;

        if (tokenBalance > 0) {
            wikiToken.transfer(owner(), tokenBalance);
        }
        if (mBalance > 0) {
            (bool success, ) = owner().call{value: mBalance}("");
            require(success, "M transfer failed");
        }
    }

    // Allow contract to receive native M
    receive() external payable {}
}
