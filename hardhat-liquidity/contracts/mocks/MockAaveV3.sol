// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../interfaces/IAaveV3.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title MockAaveV3
 * @dev A mock Aave V3 implementation for testing purposes
 */
contract MockAaveV3 is IAaveV3 {
    mapping(address => mapping(address => uint256)) private balances;
    mapping(address => uint256) private interestRates;
    
    // Mock interest rate that can be updated for testing
    function setInterestRate(address asset, uint256 rate) external {
        interestRates[asset] = rate;
    }
    
    function deposit(address asset, uint256 amount, address onBehalfOf, uint16 referralCode) external override {
        // Transfer tokens from user to this contract
        IERC20(asset).transferFrom(msg.sender, address(this), amount);
        
        // Update user balance
        balances[onBehalfOf][asset] += amount;
    }
    
    function withdraw(address asset, uint256 amount, address to) external override returns (uint256) {
        require(balances[msg.sender][asset] >= amount, "Insufficient balance");
        
        // Update balance
        balances[msg.sender][asset] -= amount;
        
        // Transfer tokens back to user
        IERC20(asset).transfer(to, amount);
        
        return amount;
    }
    
    function getInterestRate(address asset) external view override returns (uint256) {
        return interestRates[asset];
    }
    
    function getBalance(address user, address asset) external view override returns (uint256) {
        return balances[user][asset];
    }
    
    // Additional function to mimic interest accrual for testing
    function accrueInterest(address asset) external {
        // This function would apply interest to all users' balances
        // Left simple for demonstration purposes
    }
}

