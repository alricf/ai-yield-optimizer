// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../interfaces/ICompoundV3.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract MockCompoundV3 is ICompoundV3 {
    mapping(address => uint256) private balances;
    mapping(address => uint256) private supplyRates;
    // Default USDC address - will be used when a specific asset is not provided
    address public defaultAsset;
    
    // Mock supply rate that can be updated for testing
    function setSupplyRate(address asset, uint256 rate) external {
        supplyRates[asset] = rate;
    }
    
    function supply(address asset, uint256 amount) external override {
        // Transfer tokens from user to this contract
        IERC20(asset).transferFrom(msg.sender, address(this), amount);
        
        // Update user balance
        balances[msg.sender] += amount;
        
        // Set default asset if needed
        if (defaultAsset == address(0)) {
            defaultAsset = asset;
        }
    }
    
    function redeem(uint256 amount) external override {
        require(balances[msg.sender] >= amount, "Insufficient balance");
        
        // Assumes only one asset type per user for simplicity
        address asset = defaultAsset;
        require(asset != address(0), "No asset defined");
        
        // Update balance
        balances[msg.sender] -= amount;
        
        // Transfer tokens back to user
        IERC20(asset).transfer(msg.sender, amount);
    }
    
    function getSupplyRate(address asset) external view override returns (uint256) {
        return supplyRates[asset];
    }
    
    function getBalance(address user) external view override returns (uint256) {
        return balances[user];
    }
    
    // Additional function to mimic interest accrual for testing
    function accrueInterest() external {
        // This function would apply interest to all users' balances
        // Left simple for demonstration purposes
    }
}

