// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./interfaces/IAaveV3.sol";
import "./interfaces/ICompoundV3.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract YieldOptimizer is Ownable {
    IAaveV3 public aave;
    ICompoundV3 public compound;
    IERC20 public usdc;

    uint16 private constant AAVE_REFERRAL_CODE = 0;

    // Protocol identifiers
    enum Protocol { NONE, AAVE, COMPOUND }

    // Current protocol where funds are deposited
    Protocol public currentProtocol;

    // Events
    event Deposited(address indexed user, uint256 amount, Protocol protocol);
    event Withdrawn(address indexed user, uint256 amount);
    event Rebalanced(Protocol from, Protocol to, uint256 amount);
    event Log(string message, uint256 value);

    constructor(
        address _aave,
        address _compound,
        address _usdc
    ) Ownable(msg.sender) { // Pass the deployer's address to Ownable
        aave = IAaveV3(_aave);
        compound = ICompoundV3(_compound);
        usdc = IERC20(_usdc);
        currentProtocol = Protocol.NONE;
    }

    // Deposit funds and allocate to the protocol with the best yield
    function deposit(uint256 amount) external {
        require(amount > 0, "Amount must be greater than 0");

        // Transfer USDC from user to this contract
        usdc.transferFrom(msg.sender, address(this), amount);

        // Determine best protocol
        Protocol bestProtocol = getBestProtocol();

        // Approve and deposit to the best protocol
        if (bestProtocol == Protocol.AAVE) {
            usdc.approve(address(aave), amount);
            aave.deposit(address(usdc), amount, address(this), AAVE_REFERRAL_CODE);
            currentProtocol = Protocol.AAVE;
        } else {
            usdc.approve(address(compound), amount);
            compound.supply(address(usdc), amount);
            currentProtocol = Protocol.COMPOUND;
        }

        emit Deposited(msg.sender, amount, bestProtocol);
    }

    // Withdraw funds from the current protocol
    function withdraw(uint256 amount) external onlyOwner {
        require(amount > 0, "Amount must be greater than 0");

        // Withdraw from current protocol
        if (currentProtocol == Protocol.AAVE) {
            aave.withdraw(address(usdc), amount, address(this));
        } else if (currentProtocol == Protocol.COMPOUND) {
            compound.redeem(amount);
        } else {
            revert("No funds deposited");
        }

        // Transfer USDC to the owner
        usdc.transfer(owner(), amount);

        emit Withdrawn(msg.sender, amount);
    }

    // Rebalance funds to the protocol with the best yield
    function rebalance() external {
        Protocol bestProtocol = getBestProtocol();
        
        // Check AAVE balance and rebalance if needed
        uint256 aaveBalance = aave.getBalance(address(this), address(usdc));
        if (aaveBalance > 0 && bestProtocol != Protocol.AAVE) {
            // Withdraw from AAVE
            aave.withdraw(address(usdc), aaveBalance, address(this));
            emit Log("Withdrew from AAVE:", aaveBalance);
            
            // Deposit to the best protocol
            if (bestProtocol == Protocol.COMPOUND) {
                usdc.approve(address(compound), aaveBalance);
                compound.supply(address(usdc), aaveBalance);
                emit Log("Deposited to Compound:", aaveBalance);
                emit Rebalanced(Protocol.AAVE, Protocol.COMPOUND, aaveBalance);
            }
        }
        
        // Check Compound balance and rebalance if needed
        uint256 compoundBalance = compound.getBalance(address(this));
        if (compoundBalance > 0 && bestProtocol != Protocol.COMPOUND) {
            // Withdraw from Compound
            compound.redeem(compoundBalance);
            emit Log("Redeemed from Compound:", compoundBalance);
            
            // Deposit to the best protocol (which must be AAVE in this case)
            usdc.approve(address(aave), compoundBalance);
            aave.deposit(address(usdc), compoundBalance, address(this), AAVE_REFERRAL_CODE);
            emit Log("Deposited to AAVE:", compoundBalance);
            emit Rebalanced(Protocol.COMPOUND, Protocol.AAVE, compoundBalance);
        }
        
        // Update current protocol to the best one if we have any funds deposited
        if (aave.getBalance(address(this), address(usdc)) > 0) {
            currentProtocol = Protocol.AAVE;
        } else if (compound.getBalance(address(this)) > 0) {
            currentProtocol = Protocol.COMPOUND;
        } else {
            currentProtocol = Protocol.NONE;
        }
    }

    // Compare yields and determine the best protocol
    function getBestProtocol() public view returns (Protocol) {
        uint256 aaveRate = aave.getInterestRate(address(usdc));
        uint256 compoundRate = compound.getSupplyRate(address(usdc));

        // Return the protocol with the highest rate
        return aaveRate > compoundRate ? Protocol.AAVE : Protocol.COMPOUND;
    }

    // Fixed getTotalBalance function that sums balances across all protocols
    function getTotalBalance() external view returns (uint256) {
        uint256 aaveBalance = aave.getBalance(address(this), address(usdc));
        uint256 compoundBalance = compound.getBalance(address(this));
        
        // Return the sum of balances across all protocols
        return aaveBalance + compoundBalance;
    }
}

