// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./MemeSwapFactory.sol";
import "./MemeSwapPair.sol";

contract MemeSwapRouter {
    address public immutable factory;

    modifier ensure(uint256 deadline) {
        require(deadline >= block.timestamp, "MemeSwap: EXPIRED");
        _;
    }

    constructor(address _factory) {
        factory = _factory;
    }

    function _addLiquidity(
        address tokenA,
        address tokenB,
        uint256 amountADesired,
        uint256 amountBDesired,
        uint256 amountAMin,
        uint256 amountBMin
    ) internal returns (uint256 amountA, uint256 amountB) {
        address pair = MemeSwapFactory(factory).getPair(tokenA, tokenB);
        if (pair == address(0)) {
            MemeSwapFactory(factory).createPair(tokenA, tokenB);
            pair = MemeSwapFactory(factory).getPair(tokenA, tokenB);
        }

        (uint112 reserveA, uint112 reserveB,) = MemeSwapPair(pair).getReserves();
        (address token0,) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
        (reserveA, reserveB) = tokenA == token0 ? (reserveA, reserveB) : (reserveB, reserveA);

        if (reserveA == 0 && reserveB == 0) {
            (amountA, amountB) = (amountADesired, amountBDesired);
        } else {
            uint256 amountBOptimal = (amountADesired * reserveB) / reserveA;
            if (amountBOptimal <= amountBDesired) {
                require(amountBOptimal >= amountBMin, "MemeSwap: INSUFFICIENT_B_AMOUNT");
                (amountA, amountB) = (amountADesired, amountBOptimal);
            } else {
                uint256 amountAOptimal = (amountBDesired * reserveA) / reserveB;
                require(amountAOptimal <= amountADesired && amountAOptimal >= amountAMin, "MemeSwap: INSUFFICIENT_A_AMOUNT");
                (amountA, amountB) = (amountAOptimal, amountBDesired);
            }
        }
    }

    function addLiquidity(
        address tokenA,
        address tokenB,
        uint256 amountADesired,
        uint256 amountBDesired,
        uint256 amountAMin,
        uint256 amountBMin,
        address to,
        uint256 deadline
    ) external ensure(deadline) returns (uint256 amountA, uint256 amountB, uint256 liquidity) {
        (amountA, amountB) = _addLiquidity(tokenA, tokenB, amountADesired, amountBDesired, amountAMin, amountBMin);
        address pair = MemeSwapFactory(factory).getPair(tokenA, tokenB);

        IERC20(tokenA).transferFrom(msg.sender, pair, amountA);
        IERC20(tokenB).transferFrom(msg.sender, pair, amountB);
        liquidity = MemeSwapPair(pair).mint(to);
    }

    function removeLiquidity(
        address tokenA,
        address tokenB,
        uint256 liquidity,
        uint256 amountAMin,
        uint256 amountBMin,
        address to,
        uint256 deadline
    ) external ensure(deadline) returns (uint256 amountA, uint256 amountB) {
        address pair = MemeSwapFactory(factory).getPair(tokenA, tokenB);
        IERC20(pair).transferFrom(msg.sender, pair, liquidity);
        (uint256 amount0, uint256 amount1) = MemeSwapPair(pair).burn(to);
        (address token0,) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
        (amountA, amountB) = tokenA == token0 ? (amount0, amount1) : (amount1, amount0);
        require(amountA >= amountAMin, "MemeSwap: INSUFFICIENT_A_AMOUNT");
        require(amountB >= amountBMin, "MemeSwap: INSUFFICIENT_B_AMOUNT");
    }

    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external ensure(deadline) returns (uint256[] memory amounts) {
        amounts = getAmountsOut(amountIn, path);
        require(amounts[amounts.length - 1] >= amountOutMin, "MemeSwap: INSUFFICIENT_OUTPUT_AMOUNT");
        IERC20(path[0]).transferFrom(msg.sender, MemeSwapFactory(factory).getPair(path[0], path[1]), amounts[0]);
        _swap(amounts, path, to);
    }

    function swapTokensForExactTokens(
        uint256 amountOut,
        uint256 amountInMax,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external ensure(deadline) returns (uint256[] memory amounts) {
        amounts = getAmountsIn(amountOut, path);
        require(amounts[0] <= amountInMax, "MemeSwap: EXCESSIVE_INPUT_AMOUNT");
        IERC20(path[0]).transferFrom(msg.sender, MemeSwapFactory(factory).getPair(path[0], path[1]), amounts[0]);
        _swap(amounts, path, to);
    }

    function _swap(uint256[] memory amounts, address[] memory path, address _to) internal {
        for (uint256 i; i < path.length - 1; i++) {
            (address input, address output) = (path[i], path[i + 1]);
            (address token0,) = input < output ? (input, output) : (output, input);
            uint256 amountOut = amounts[i + 1];
            (uint256 amount0Out, uint256 amount1Out) = input == token0 ? (uint256(0), amountOut) : (amountOut, uint256(0));
            address to = i < path.length - 2 ? MemeSwapFactory(factory).getPair(output, path[i + 2]) : _to;
            MemeSwapPair(MemeSwapFactory(factory).getPair(input, output)).swap(amount0Out, amount1Out, to);
        }
    }

    function quote(uint256 amountA, uint256 reserveA, uint256 reserveB) public pure returns (uint256 amountB) {
        require(amountA > 0, "MemeSwap: INSUFFICIENT_AMOUNT");
        require(reserveA > 0 && reserveB > 0, "MemeSwap: INSUFFICIENT_LIQUIDITY");
        amountB = (amountA * reserveB) / reserveA;
    }

    function getAmountOut(uint256 amountIn, uint256 reserveIn, uint256 reserveOut) public pure returns (uint256 amountOut) {
        require(amountIn > 0, "MemeSwap: INSUFFICIENT_INPUT_AMOUNT");
        require(reserveIn > 0 && reserveOut > 0, "MemeSwap: INSUFFICIENT_LIQUIDITY");
        uint256 amountInWithFee = amountIn * 997; // 0.3% fee
        uint256 numerator = amountInWithFee * reserveOut;
        uint256 denominator = (reserveIn * 1000) + amountInWithFee;
        amountOut = numerator / denominator;
    }

    function getAmountIn(uint256 amountOut, uint256 reserveIn, uint256 reserveOut) public pure returns (uint256 amountIn) {
        require(amountOut > 0, "MemeSwap: INSUFFICIENT_OUTPUT_AMOUNT");
        require(reserveIn > 0 && reserveOut > 0, "MemeSwap: INSUFFICIENT_LIQUIDITY");
        uint256 numerator = reserveIn * amountOut * 1000;
        uint256 denominator = (reserveOut - amountOut) * 997;
        amountIn = (numerator / denominator) + 1;
    }

    function getAmountsOut(uint256 amountIn, address[] memory path) public view returns (uint256[] memory amounts) {
        require(path.length >= 2, "MemeSwap: INVALID_PATH");
        amounts = new uint256[](path.length);
        amounts[0] = amountIn;
        for (uint256 i; i < path.length - 1; i++) {
            address pair = MemeSwapFactory(factory).getPair(path[i], path[i + 1]);
            require(pair != address(0), "MemeSwap: PAIR_NOT_FOUND");
            (uint112 reserveIn, uint112 reserveOut,) = MemeSwapPair(pair).getReserves();
            (address token0,) = path[i] < path[i + 1] ? (path[i], path[i + 1]) : (path[i + 1], path[i]);
            (reserveIn, reserveOut) = path[i] == token0 ? (reserveIn, reserveOut) : (reserveOut, reserveIn);
            amounts[i + 1] = getAmountOut(amounts[i], reserveIn, reserveOut);
        }
    }

    function getAmountsIn(uint256 amountOut, address[] memory path) public view returns (uint256[] memory amounts) {
        require(path.length >= 2, "MemeSwap: INVALID_PATH");
        amounts = new uint256[](path.length);
        amounts[amounts.length - 1] = amountOut;
        for (uint256 i = path.length - 1; i > 0; i--) {
            address pair = MemeSwapFactory(factory).getPair(path[i - 1], path[i]);
            require(pair != address(0), "MemeSwap: PAIR_NOT_FOUND");
            (uint112 reserveIn, uint112 reserveOut,) = MemeSwapPair(pair).getReserves();
            (address token0,) = path[i - 1] < path[i] ? (path[i - 1], path[i]) : (path[i], path[i - 1]);
            (reserveIn, reserveOut) = path[i - 1] == token0 ? (reserveIn, reserveOut) : (reserveOut, reserveIn);
            amounts[i - 1] = getAmountIn(amounts[i], reserveIn, reserveOut);
        }
    }
}
