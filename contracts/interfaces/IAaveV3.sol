// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IAaveV3 {
    function deposit(address asset, uint256 amount, address onBehalfOf, uint16 referralCode) external;
    function withdraw(address asset, uint256 amount, address to) external;
    function getInterestRate(address asset) external view returns (uint256);
    function getBalance(address user, address asset) external view returns (uint256);
}

