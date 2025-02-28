// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IAaveV3
 * @dev Interface for Aave V3 Pool
 */
interface IAaveV3 {
    /**
     * @notice Supplies an `amount` of underlying asset into the reserve, receiving in return overlying aTokens.
     * - E.g. User supplies 100 USDC and gets in return 100 aUSDC
     * @param asset The address of the underlying asset to supply
     * @param amount The amount to be supplied
     * @param onBehalfOf The address that will receive the aTokens
     * @param referralCode Code used to register the integrator originating the operation, for potential rewards
     */
    function deposit(
        address asset,
        uint256 amount,
        address onBehalfOf,
        uint16 referralCode
    ) external;

    /**
     * @notice Withdraws an `amount` of underlying asset from the reserve, burning the equivalent aTokens owned
     * @param asset The address of the underlying asset to withdraw
     * @param amount The underlying amount to be withdrawn
     * @param to The address that will receive the underlying
     * @return The final amount withdrawn
     */
    function withdraw(
        address asset,
        uint256 amount,
        address to
    ) external returns (uint256);

    /**
     * @notice Returns the state and configuration of the reserve
     * @param asset The address of the underlying asset
     * @return The supply rate, scaled by 1e27 (RAY)
     */
    function getInterestRate(address asset) external view returns (uint256);

    /**
     * @notice Returns the balance of a user in the protocol
     * @param user The address of the user
     * @param asset The address of the underlying asset
     * @return The balance of the user
     */
    function getBalance(address user, address asset) external view returns (uint256);
}

