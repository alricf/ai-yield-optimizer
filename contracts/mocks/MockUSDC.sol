// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockUSDC is ERC20 {
    uint8 private _decimals = 6; // USDC has 6 decimals

    constructor() ERC20("USD Coin", "USDC") {
        // Mint 1,000,000 USDC to the deployer for testing
        _mint(msg.sender, 1000000 * 10**_decimals);
    }

    function decimals() public view virtual override returns (uint8) {
        return _decimals;
    }

    // Function to mint more tokens for testing
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

