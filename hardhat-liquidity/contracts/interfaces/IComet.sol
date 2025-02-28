// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IComet
 * @dev Interface for Compound V3's Comet (individual market) contract
 */
interface IComet {
    /**
     * @notice Supplies an asset to the protocol
     * @param asset The address of the asset to supply
     * @param amount The amount to supply
     */
    function supply(address asset, uint amount) external;
    
    /**
     * @notice Supplies an asset to the protocol on behalf of another account
     * @param asset The address of the asset to supply
     * @param amount The amount to supply
     * @param from The address from which to transfer the asset
     */
    function supplyFrom(address from, address asset, uint amount) external;
    
    /**
     * @notice Supplies the base asset to the protocol
     * @param amount The amount to supply
     */
    function supplyTo(address to, uint amount) external;
    
    /**
     * @notice Withdraws an asset from the protocol
     * @param asset The address of the asset to withdraw
     * @param amount The amount to withdraw
     */
    function withdraw(address asset, uint amount) external;
    
    /**
     * @notice Withdraws an asset from the protocol to another account
     * @param asset The address of the asset to withdraw
     * @param amount The amount to withdraw
     * @param to The address to receive the asset
     */
    function withdrawTo(address to, address asset, uint amount) external;
    
    /**
     * @notice Withdraws the base asset from the protocol
     * @param amount The amount to withdraw
     * @param to The address to receive the asset
     */
    function withdrawFrom(address src, address to, uint amount) external;
    
    /**
     * @notice Returns the balance of the account
     * @param account The address of the account
     * @return The balance of the account
     */
    function balanceOf(address account) external view returns (uint256);
    
    /**
     * @notice Returns the borrow balance of the account
     * @param account The address of the account
     * @return The borrow balance of the account
     */
    function borrowBalanceOf(address account) external view returns (uint256);
    
    /**
     * @notice Returns the supply rate per second, scaled by 1e18
     * @return The supply rate per second
     */
    function getSupplyRate(uint utilization) external view returns (uint);
    
    /**
     * @notice Returns the current supply rate per second, scaled by 1e18
     * @return The current supply rate per second
     */
    function supplyRate() external view returns (uint);
    
    /**
     * @notice Returns the borrow rate per second, scaled by 1e18
     * @return The borrow rate per second
     */
    function getBorrowRate(uint utilization) external view returns (uint);
    
    /**
     * @notice Returns the current borrow rate per second, scaled by 1e18
     * @return The current borrow rate per second
     */
    function borrowRate() external view returns (uint);
    
    /**
     * @notice Returns the base token address (e.g., USDC)
     * @return The base token address
     */
    function baseToken() external view returns (address);
    
    /**
     * @notice Returns the base token scale
     * @return The base token scale (10^decimals)
     */
    function baseTokenScale() external view returns (uint256);
    
    /**
     * @notice Returns the collateral balances of the account
     * @param account The address of the account
     * @param asset The address of the asset
     * @return The collateral balance of the account
     */
    function collateralBalanceOf(address account, address asset) external view returns (uint128);
    
    /**
     * @notice Returns the utilization rate of the protocol
     * @return The utilization rate
     */
    function getUtilization() external view returns (uint);
    
    /**
     * @notice Returns whether the asset is supported as collateral
     * @param asset The address of the asset
     * @return Whether the asset is supported as collateral
     */
    function isSuppliedAsset(address asset) external view returns (bool);
}
