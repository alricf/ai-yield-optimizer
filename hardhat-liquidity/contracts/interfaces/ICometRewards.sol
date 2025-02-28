// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ICometRewards
 * @dev Interface for Compound V3's rewards contract
 */
interface ICometRewards {
    /**
     * @notice Claims rewards for a user
     * @param comet The address of the Comet market
     * @param src The address of the user
     * @param to The address to receive the rewards
     * @return The amount of rewards claimed
     */
    function claim(address comet, address src, bool to) external returns (uint);
    
    /**
     * @notice Returns the rewards accrued by a user
     * @param comet The address of the Comet market
     * @param account The address of the user
     * @return The amount of rewards accrued
     */
    function getRewardOwed(address comet, address account) external view returns (uint);
}
