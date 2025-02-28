// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./interfaces/IAaveV3Pool.sol";
import "./interfaces/IComet.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title YieldOptimizerDirect
 * @dev A contract that optimizes yield between Aave V3 and Compound V3 on Arbitrum
 */
contract YieldOptimizerDirect is Ownable {
    // Protocol interfaces
    IAaveV3Pool public aavePool;
    IAaveProtocolDataProvider public aaveDataProvider;
    IComet public compoundComet;
    
    // Assets
    IERC20 public usdc;
    IAToken public aUSDC;
    
    // Constants
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
    
    /**
     * @dev Constructor
     * @param _aavePool Address of the Aave V3 Pool on Arbitrum
     * @param _aaveDataProvider Address of the Aave Protocol Data Provider
     * @param _compoundComet Address of the Compound V3 USDC market (Comet) on Arbitrum
     * @param _usdc Address of USDC on Arbitrum
     */
    constructor(
        address _aavePool,
        address _aaveDataProvider,
        address _compoundComet,
        address _usdc
    ) Ownable(msg.sender) {
        aavePool = IAaveV3Pool(_aavePool);
        aaveDataProvider = IAaveProtocolDataProvider(_aaveDataProvider);
        compoundComet = IComet(_compoundComet);
        usdc = IERC20(_usdc);
        currentProtocol = Protocol.NONE;
        
        // Get aUSDC token address from Aave
        (address aTokenAddress, , ) = aaveDataProvider.getReserveTokensAddresses(_usdc);
        aUSDC = IAToken(aTokenAddress);
        
        // Verify Compound base token is USDC
        require(compoundComet.baseToken() == _usdc, "Compound market base token must be USDC");
    }
    
    /**
     * @dev Deposit funds and allocate to the protocol with the best yield
     * @param amount The amount of USDC to deposit
     */
    function deposit(uint256 amount) external {
        require(amount > 0, "Amount must be greater than 0");
        
        // Transfer USDC from user to this contract
        usdc.transferFrom(msg.sender, address(this), amount);
        
        // Determine best protocol
        Protocol bestProtocol = getBestProtocol();
        
        // Approve and deposit to the best protocol
        if (bestProtocol == Protocol.AAVE) {
            usdc.approve(address(aavePool), amount);
            aavePool.supply(address(usdc), amount, address(this), AAVE_REFERRAL_CODE);
            currentProtocol = Protocol.AAVE;
        } else {
            usdc.approve(address(compoundComet), amount);
            compoundComet.supply(address(usdc), amount);
            currentProtocol = Protocol.COMPOUND;
        }
        
        emit Deposited(msg.sender, amount, bestProtocol);
    }
    
    /**
     * @dev Withdraw funds from the current protocol
     * @param amount The amount of USDC to withdraw
     */
    function withdraw(uint256 amount) external onlyOwner {
        require(amount > 0, "Amount must be greater than 0");
        
        // Withdraw from current protocol
        if (currentProtocol == Protocol.AAVE) {
            aavePool.withdraw(address(usdc), amount, address(this));
        } else if (currentProtocol == Protocol.COMPOUND) {
            compoundComet.withdraw(address(usdc), amount);
        } else {
            revert("No funds deposited");
        }
        
        // Transfer USDC to the owner
        usdc.transfer(owner(), amount);
        
        emit Withdrawn(msg.sender, amount);
    }
    
    /**
     * @dev Rebalance funds to the protocol with the best yield
     */
    function rebalance() external {
        Protocol bestProtocol = getBestProtocol();
        
        // Check AAVE balance and rebalance if needed
        uint256 aaveBalance = getAaveBalance();
        if (aaveBalance > 0 && bestProtocol != Protocol.AAVE) {
            // Withdraw from AAVE
            aavePool.withdraw(address(usdc), aaveBalance, address(this));
            emit Log("Withdrew from AAVE:", aaveBalance);
            
            // Deposit to the best protocol
            if (bestProtocol == Protocol.COMPOUND) {
                usdc.approve(address(compoundComet), aaveBalance);
                compoundComet.supply(address(usdc), aaveBalance);
                emit Log("Deposited to Compound:", aaveBalance);
                emit Rebalanced(Protocol.AAVE, Protocol.COMPOUND, aaveBalance);
            }
        }
        
        // Check Compound balance and rebalance if needed
        uint256 compoundBalance = getCompoundBalance();
        if (compoundBalance > 0 && bestProtocol != Protocol.COMPOUND) {
            // Withdraw from Compound
            compoundComet.withdraw(address(usdc), compoundBalance);
            emit Log("Redeemed from Compound:", compoundBalance);
            
            // Deposit to the best protocol (which must be AAVE in this case)
            usdc.approve(address(aavePool), compoundBalance);
            aavePool.supply(address(usdc), compoundBalance, address(this), AAVE_REFERRAL_CODE);
            emit Log("Deposited to AAVE:", compoundBalance);
            emit Rebalanced(Protocol.COMPOUND, Protocol.AAVE, compoundBalance);
        }
        
        // Update current protocol to the best one if we have any funds deposited
        if (getAaveBalance() > 0) {
            currentProtocol = Protocol.AAVE;
        } else if (getCompoundBalance() > 0) {
            currentProtocol = Protocol.COMPOUND;
        } else {
            currentProtocol = Protocol.NONE;
        }
    }
    
    /**
     * @dev Compare yields and determine the best protocol
     * @return The protocol with the highest yield
     */
    function getBestProtocol() public view returns (Protocol) {
        uint256 aaveRate = getAaveSupplyRate();
        uint256 compoundRate = compoundComet.supplyRate();
        
        // Return the protocol with the highest rate
        return aaveRate > compoundRate ? Protocol.AAVE : Protocol.COMPOUND;
    }
    
    /**
     * @dev Get total balance across all protocols
     * @return The total balance in USDC
     */
    function getTotalBalance() external view returns (uint256) {
        return getAaveBalance() + getCompoundBalance();
    }
    
    /**
     * @dev Get Aave supply rate
     * @return The supply rate from Aave
     */
    function getAaveSupplyRate() public view returns (uint256) {
        (, , , , , uint256 liquidityRate, , , , , , ) = aavePool.getReserveData(address(usdc));
        return liquidityRate;
    }
    
    /**
     * @dev Get balance in Aave
     * @return The balance in Aave
     */
    function getAaveBalance() public view returns (uint256) {
        return aUSDC.balanceOf(address(this));
    }
    
    /**
     * @dev Get balance in Compound
     * @return The balance in Compound
     */
    function getCompoundBalance() public view returns (uint256) {
        return compoundComet.balanceOf(address(this));
    }
    
    /**
     * @dev Get Aave APY
     * @return The APY from Aave as a percentage (scaled by 100)
     */
    function getAaveAPY() external view returns (uint256) {
        uint256 ratePerSecond = getAaveSupplyRate();
        // Ray is 10^27, convert to percentage APY
        // ((1 + ratePerSecond/10^27)^(365*24*60*60) - 1) * 100
        return ((((ratePerSecond / 1e25) * 31536000) / 100) + 100);
    }
    
    /**
     * @dev Get Compound APY
     * @return The APY from Compound as a percentage (scaled by 100)
     */
    function getCompoundAPY() external view returns (uint256) {
        uint256 ratePerSecond = compoundComet.supplyRate();
        // Compound rate is scaled by 1e18, convert to percentage APY
        // ((1 + ratePerSecond/10^18)^(365*24*60*60) - 1) * 100
        return ((((ratePerSecond / 1e16) * 31536000) / 100) + 100);
    }
}
