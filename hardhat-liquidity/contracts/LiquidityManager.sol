// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
import "@uniswap/v2-core/contracts/interfaces/IUniswapV2Factory.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract LiquidityManager is Ownable {
    using SafeERC20 for IERC20;

    address public immutable WBTC;
    address public immutable USDC;
    address public immutable router;
    address public immutable factory;
    mapping(address => uint256) public poolAPY;
    mapping(address => uint256) public userMigrationThreshold;
    
    struct UserBalance {
        uint256 WBTCBalance;
        uint256 USDCBalance;
    }

    mapping(address => UserBalance) public userBalances;
    
    event TokensDeposited(address indexed user, uint256 WBTCAmount, uint256 USDCAmount);
    event TokensWithdrawn(address indexed user, uint256 WBTCAmount, uint256 USDCAmount);
    event LiquidityMigrated(address indexed user, address fromPool, address toPool, uint256 amount);

    constructor(address _WBTC, address _USDC, address _router, address _factory) Ownable(msg.sender) {
        WBTC = _WBTC;
        USDC = _USDC;
        router = _router;
        factory = _factory;
    }

    function depositTokens(uint256 WBTCAmount, uint256 USDCAmount) external {
        require(WBTCAmount > 0 || USDCAmount > 0, "Cannot deposit zero tokens");

        UserBalance storage balance = userBalances[msg.sender];

        if (WBTCAmount > 0) {
            IERC20(WBTC).safeTransferFrom(msg.sender, address(this), WBTCAmount);
            balance.WBTCBalance += WBTCAmount;
        }
        if (USDCAmount > 0) {
            IERC20(USDC).safeTransferFrom(msg.sender, address(this), USDCAmount);
            balance.USDCBalance += USDCAmount;
        }
        emit TokensDeposited(msg.sender, WBTCAmount, USDCAmount);
    }

    function withdrawTokens(uint256 WBTCAmount, uint256 USDCAmount) external {
        require(userBalances[msg.sender].WBTCBalance >= WBTCAmount, "Not enough WBTC balance");
        require(userBalances[msg.sender].USDCBalance >= USDCAmount, "Not enough USDC balance");

        if (WBTCAmount > 0) {
            userBalances[msg.sender].WBTCBalance -= WBTCAmount;
            IERC20(WBTC).safeTransfer(msg.sender, WBTCAmount);
        }

        if (USDCAmount > 0) {
            userBalances[msg.sender].USDCBalance -= USDCAmount;
            IERC20(USDC).safeTransfer(msg.sender, USDCAmount);
        }
        emit TokensWithdrawn(msg.sender, WBTCAmount, USDCAmount);
    }

    function getUserBalance(address user) external view returns (uint256, uint256) {
        return (userBalances[user].WBTCBalance, userBalances[user].USDCBalance);
    }

    function setMigrationThreshold(uint256 threshold) external {
        require(threshold > 0, "Threshold must be greater than zero");
        userMigrationThreshold[msg.sender] = threshold;
    }

    function getAPYData(address pool) public view onlyOwner returns (uint256) {
        return poolAPY[pool];
    }

    function migrateLiquidity(address exitingPool, address enteringPool) external {
        uint256 exitingAPY = getAPYData(exitingPool);
        uint256 enteringAPY = getAPYData(enteringPool);
        
        uint256 userThreshold = userMigrationThreshold[msg.sender];
        require(userThreshold > 0, "Threshold not set");
        require(enteringAPY > exitingAPY + userThreshold, "APY threshold not met");

        uint256 WBTCBalance = userBalances[msg.sender].WBTCBalance;
        uint256 USDCBalance = userBalances[msg.sender].USDCBalance;
        require(WBTCBalance > 0 && USDCBalance > 0, "No liquidity available");

        _removeLiquidity(WBTC, USDC, WBTCBalance);
        _addLiquidity(WBTC, USDC, WBTCBalance, USDCBalance);

        emit LiquidityMigrated(msg.sender, exitingPool, enteringPool, WBTCBalance + USDCBalance);
    }

    function _removeLiquidity(
        address tokenA,
        address tokenB,
        uint256 liquidity
    ) internal {
        address lpTokenAddress = IUniswapV2Factory(factory).getPair(tokenA, tokenB);
        require(lpTokenAddress != address(0), "Pair does not exist");

        IERC20 lpToken = IERC20(lpTokenAddress);
        uint256 lpBalance = lpToken.balanceOf(address(this));
        require(lpBalance >= liquidity, "Insufficient LP balance");

        if (lpToken.allowance(address(this), router) < liquidity) {
            lpToken.approve(router, type(uint256).max);
        }

        IUniswapV2Router02(router).removeLiquidity(
            tokenA,
            tokenB,
            liquidity,
            0,
            0,
            address(this),
            block.timestamp
        );
    }

    function _addLiquidity(
        address tokenA,
        address tokenB,
        uint256 amountA,
        uint256 amountB
    ) internal {
        if (IERC20(tokenA).allowance(address(this), router) < amountA) {
            IERC20(tokenA).approve(router, type(uint256).max);
        }
        if (IERC20(tokenB).allowance(address(this), router) < amountB) {
            IERC20(tokenB).approve(router, type(uint256).max);
        }

        uint256 minAmountA = (amountA * 9800) / 10000;
        uint256 minAmountB = (amountB * 9800) / 10000;

        IUniswapV2Router02(router).addLiquidity(
            tokenA,
            tokenB,
            amountA,
            amountB,
            minAmountA,
            minAmountB,
            address(this),
            block.timestamp
        );
    }
}
