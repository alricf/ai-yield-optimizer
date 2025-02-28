const { expect } = require("chai");
const { ethers } = require("hardhat");

// Arbitrum Addresses (update these with actual addresses from Arbitrum)
const USDC_ADDRESS = "0xaf88d065e77c8cC2239327C5EDb3A432268e5831"; // USDC on Arbitrum
const AAVE_V3_POOL = "0x794a61358D6845594F94dc1DB02A252b5b4814aD"; // Aave V3 Pool on Arbitrum
const COMPOUND_V3_MARKET = "0xA5EDBDD9646f8dFF606d7448e414884C7d905dCA"; // Compound USDC Market on Arbitrum

// You'll need to set up WHALE_ADDRESS with an address that has USDC on Arbitrum
const WHALE_ADDRESS = "0x..."; // Address with USDC

describe("YieldOptimizer on Arbitrum Fork", function () {
  let yieldOptimizer;
  let usdc;
  let owner;
  let whale;
  
  before(async function () {
    // This test requires forking Arbitrum
    if (!process.env.ARBITRUM_SEPOLIA_RPC_URL) {
      console.log("Skipping tests: No Arbitrum RPC URL provided");
      this.skip();
    }
    
    [owner] = await ethers.getSigners();
    
    // Impersonate a whale account with USDC
    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [WHALE_ADDRESS],
    });
    whale = await ethers.getSigner(WHALE_ADDRESS);
    
    // Get USDC Contract
    usdc = await ethers.getContractAt("IERC20", USDC_ADDRESS);
    
    // Deploy YieldOptimizer
    const YieldOptimizer = await ethers.getContractFactory("YieldOptimizer");
    yieldOptimizer = await YieldOptimizer.deploy(
      AAVE_V3_POOL,
      COMPOUND_V3_MARKET,
      USDC_ADDRESS
    );
    await yieldOptimizer.deployed();
  });
  
  it("Should get the correct protocol with the best rate", async function () {
    const bestProtocol = await yieldOptimizer.getBestProtocol();
    console.log("Best Protocol:", bestProtocol === 1 ? "AAVE" : "COMPOUND");
  });
  
  it("Should deposit USDC to the best protocol", async function () {
    // Transfer some USDC to our contract
    const depositAmount = ethers.utils.parseUnits("1000", 6); // 1000 USDC
    
    // Approve USDC
    await usdc.connect(whale).approve(yieldOptimizer.address, depositAmount);
    
    // Deposit to optimizer
    await yieldOptimizer.connect(whale).deposit(depositAmount);
    
    // Check current protocol
    const currentProtocol = await yieldOptimizer.currentProtocol();
    console.log("Current Protocol:", currentProtocol === 1 ? "AAVE" : "COMPOUND");
    
    // Check balance
    const totalBalance = await yieldOptimizer.getTotalBalance();
    expect(totalBalance).to.be.at.least(depositAmount);
  });
  
  it("Should rebalance to the best protocol", async function () {
    // Get current protocol
    const currentProtocol = await yieldOptimizer.currentProtocol();
    
    // Manipulate rates to force rebalance (this would require mocking or direct storage manipulation)
    // For testing on fork, we would need to find a way to change protocol rates
    
    // Trigger rebalance
    await yieldOptimizer.rebalance();
    
    // Check if protocol changed
    const newProtocol = await yieldOptimizer.currentProtocol();
    console.log("Protocol after rebalance:", newProtocol === 1 ? "AAVE" : "COMPOUND");
  });
  
  it("Should allow owner to withdraw", async function () {
    const balance = await yieldOptimizer.getTotalBalance();
    const withdrawAmount = balance.div(2); // Withdraw half
    
    // Initial USDC balance
    const initialBalance = await usdc.balanceOf(owner.address);
    
    // Withdraw
    await yieldOptimizer.withdraw(withdrawAmount);
    
    // Check USDC received
    const newBalance = await usdc.balanceOf(owner.address);
    expect(newBalance.sub(initialBalance)).to.equal(withdrawAmount);
  });
});
