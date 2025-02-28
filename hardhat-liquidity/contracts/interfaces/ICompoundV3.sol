// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ICompoundV3
 * @dev Simplified interface for Compound V3
 */
interface ICompoundV3 {
    function supply(address asset, uint256 amount) external;
    function redeem(uint256 amount) external;
    function getSupplyRate(address asset) external view returns (uint256);
    function getBalance(address user) external view returns (uint256);
}