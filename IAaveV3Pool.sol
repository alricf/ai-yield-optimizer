// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IAaveV3Pool
 * @dev Interface for the Aave V3 Pool contract
 */
interface IAaveV3Pool {
    /**
     * @notice Supplies an `amount` of underlying asset into the reserve, receiving in return overlying aTokens.
     * - E.g. User supplies 100 USDC and gets in return 100 aUSDC
     * @param asset The address of the underlying asset to supply
     * @param amount The amount to be supplied
     * @param onBehalfOf The address that will receive the aTokens
     * @param referralCode Code used to register the integrator originating the operation, for potential rewards
     */
    function supply(
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
     * @return amountWithdrawn The final amount withdrawn
     */
    function withdraw(
        address asset,
        uint256 amount,
        address to
    ) external returns (uint256 amountWithdrawn);

    /**
     * @notice Returns the state and configuration of the reserve
     * @param asset The address of the underlying asset
     * @return unbacked The amount of unbacked tokens
     * @return accruedToTreasuryScaled The accrued amount to treasury scaled
     * @return totalAToken The total supply of the aToken
     * @return totalStableDebt The total stable debt
     * @return totalVariableDebt The total variable debt
     * @return liquidityRate The liquidity rate
     * @return variableBorrowRate The variable borrow rate
     * @return stableBorrowRate The stable borrow rate
     * @return averageStableBorrowRate The average stable borrow rate
     * @return liquidityIndex The liquidity index
     * @return variableBorrowIndex The variable borrow index
     * @return lastUpdateTimestamp The timestamp of the last update
     */
    function getReserveData(address asset) external view returns (
        uint256 unbacked,
        uint256 accruedToTreasuryScaled,
        uint256 totalAToken,
        uint256 totalStableDebt,
        uint256 totalVariableDebt,
        uint256 liquidityRate,
        uint256 variableBorrowRate,
        uint256 stableBorrowRate,
        uint256 averageStableBorrowRate,
        uint256 liquidityIndex,
        uint256 variableBorrowIndex,
        uint40 lastUpdateTimestamp
    );

    /**
     * @notice Returns the address of the Aave Protocol Data Provider
     * @return provider The address of the ProtocolDataProvider contract
     */
    function getAddressesProvider() external view returns (address provider);

    /**
     * @notice Returns the normalized income of the reserve
     * @param asset The address of the underlying asset
     * @return income The reserve's normalized income
     */
    function getReserveNormalizedIncome(address asset) external view returns (uint256 income);
}

/**
 * @title IAToken
 * @dev Interface for the Aave aToken contract
 */
interface IAToken {
    /**
     * @notice Returns the address of the underlying asset
     * @return asset The address of the underlying asset
     */
    function UNDERLYING_ASSET_ADDRESS() external view returns (address asset);
    
    /**
     * @notice Returns the balance of the account
     * @param user The address of the account
     * @return balance The balance of the account
     */
    function balanceOf(address user) external view returns (uint256 balance);
    
    /**
     * @notice Returns the scaled balance of the user
     * @param user The address of the user
     * @return balance The scaled balance of the user
     */
    function scaledBalanceOf(address user) external view returns (uint256 balance);
}

/**
 * @title IAaveProtocolDataProvider
 * @dev Interface for the Aave Protocol Data Provider
 */
interface IAaveProtocolDataProvider {
    /**
     * @notice Returns the reserve data
     * @param asset The address of the underlying asset
     * @return unbacked The amount of unbacked tokens
     * @return accruedToTreasuryScaled The accrued amount to treasury scaled
     * @return totalAToken The total supply of the aToken
     * @return totalStableDebt The total stable debt
     * @return totalVariableDebt The total variable debt
     * @return liquidityRate The liquidity rate
     * @return variableBorrowRate The variable borrow rate
     * @return stableBorrowRate The stable borrow rate
     * @return averageStableBorrowRate The average stable borrow rate
     * @return liquidityIndex The liquidity index
     * @return variableBorrowIndex The variable borrow index
     * @return lastUpdateTimestamp The timestamp of the last update
     */
    function getReserveData(address asset) external view returns (
        uint256 unbacked,
        uint256 accruedToTreasuryScaled,
        uint256 totalAToken,
        uint256 totalStableDebt,
        uint256 totalVariableDebt,
        uint256 liquidityRate,
        uint256 variableBorrowRate,
        uint256 stableBorrowRate,
        uint256 averageStableBorrowRate,
        uint256 liquidityIndex,
        uint256 variableBorrowIndex,
        uint40 lastUpdateTimestamp
    );
    
    /**
     * @notice Returns the token addresses of the reserve
     * @param asset The address of the underlying asset
     * @return aTokenAddress The address of the aToken
     * @return stableDebtTokenAddress The address of the stable debt token
     * @return variableDebtTokenAddress The address of the variable debt token
     */
    function getReserveTokensAddresses(address asset) external view returns (
        address aTokenAddress,
        address stableDebtTokenAddress,
        address variableDebtTokenAddress
    );
    
    /**
     * @notice Returns the user reserve data
     * @param asset The address of the underlying asset
     * @param user The address of the user
     * @return currentATokenBalance The current aToken balance
     * @return currentStableDebt The current stable debt
     * @return currentVariableDebt The current variable debt
     * @return principalStableDebt The principal stable debt
     * @return scaledVariableDebt The scaled variable debt
     * @return stableBorrowRate The stable borrow rate
     * @return liquidityRate The liquidity rate
     * @return stableRateLastUpdated The timestamp of the last stable rate update
     * @return usageAsCollateralEnabled Whether the asset is enabled as collateral
     */
    function getUserReserveData(address asset, address user) external view returns (
        uint256 currentATokenBalance,
        uint256 currentStableDebt,
        uint256 currentVariableDebt,
        uint256 principalStableDebt,
        uint256 scaledVariableDebt,
        uint256 stableBorrowRate,
        uint256 liquidityRate,
        uint40 stableRateLastUpdated,
        bool usageAsCollateralEnabled
    );
}
