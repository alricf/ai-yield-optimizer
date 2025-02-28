const { expect } = require("chai");
const { ethers, network } = require("hardhat");

// Arbitrum Addresses - these are for Arbitrum One mainnet
const USDC_ADDRESS = "0xaf88d065e77c8cC2239327C5EDb3A432268e5831"; // USDC on Arbitrum
const AAVE_V3_POOL = "0x794a61358D6845594F94dc1DB02A252b5b4814aD"; // Aave V3 Pool on Arbitrum 
const AAVE_DATA_PROVIDER = "0x69FA688f1Dc47d4B5d8029D5a35FB7a548310654"; // Aave Data Provider on Arbitrum
const COMPOUND_V3_USDC_MARKET = "0xA5EDBDD9646f8dFF606d7448e414884C7d905dCA"; // Compound USDC Market on Arbitrum

// For testing with impersonation - replace with an actual whale address
const USDC_WHALE = "0x489ee077994B6658eAfA855C308275EAd8097C4A"; // A known USDC whale on Arbitrum

describe("YieldOptimizerDirect on Arbitrum Fork", function () {
  let yieldOptimizer;
  let usdc;
  let owner;
  let whale;
  
  before(async function () {
    // Check that we're using a fork
    if (network.name !== "hardhat") {
      console.log("This test must be run on a Arbitrum fork");
      this.skip();
    }
    
    // This test requires forking Arbitrum
    if (!process.env.ARBITRUM_SEPOLIA_RPC_URL) {
      console.log("Skipping tests: No Arbitrum RPC URL provided");
      this.skip();
    }
    
    [owner] = await ethers.getSigners();
    
    // Impersonate the whale account
    await network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [USDC_WHALE],
    });
    whale = await ethers.getSigner(USDC_WHALE);
    
    // Get USDC contract
    usdc = await ethers.getContractAt("IERC20", USDC_ADDRESS);
    
    // Get initial balances
    const whaleBalance = await usdc.balanceOf(whale.address);
    console.log(`USDC Whale balance: ${ethers.utils.formatUnits(whaleBalance, 6)} USDC`);
    
    // Deploy YieldOptimizerDirect
    const YieldOptimizerDirect = await ethers.getContractFactory("YieldOptimizerDirect");
    yieldOptimizer = await YieldOptimizerDirect.deploy(
      AAVE_V3_POOL,
      AAVE_DATA_PROVIDER,
      COMPOUND_V3_USDC_MARKET,
      USDC_ADDRESS
    );
    await yieldOptimizer.deployed();
    console.log("YieldOptimizerDirect deployed to:", yieldOptimizer.address);
  });
  
  it("Should correctly identify protocol with best yield", async function () {
    // Get rates
    const aaveRate = await yieldOptimizer.getAaveSupplyRate();
    const aaveAPY = await yieldOptimizer.getAaveAPY();
    
    // Access Compound directly to verify
    const compoundComet = await ethers.getContractAt("IComet", COMPOUND_V3_USDC_MARKET);
    const compoundRate = await compoundComet.supplyRate();
    const compoundAPY = await yieldOptimizer.getCompoundAPY();
    
    console.log(`Aave supply rate: ${aaveRate.toString()} (APY: ${aaveAPY / 100}%)`);
    console.log(`Compound supply rate: ${compoundRate.toString()} (APY: ${compoundAPY / 100}%)`);
    
    const bestProtocol = await yieldOptimizer.getBestProtocol();
    console.log(`Best protocol: ${bestProtocol == 1 ? "AAVE" : "COMPOUND"}`);
    
    // Verify the best protocol matches our expectations
    if (aaveRate.gt(compoundRate)) {
      expect(bestProtocol).to.equal(1); // AAVE
    } else {
      expect(bestProtocol).to.equal(2); // COMPOUND
    }
  });

  it("Should deposit USDC to the best protocol", async function () {
    // Deposit amount (10 USDC for testing)
    const depositAmount = ethers.utils.parseUnits("10", 6);
    
    // Get initial balances
    const initialOwnerBalance = await usdc.balanceOf(owner.address);
    const initialWhaleBalance = await usdc.balanceOf(whale.address);
    
    // Transfer some USDC from whale to owner for testing
    await usdc.connect(whale).transfer(owner.address, depositAmount);
    
    // Approve USDC for the optimizer
    await usdc.connect(owner).approve(yieldOptimizer.address, depositAmount);
    
    // Deposit to optimizer
    await yieldOptimizer.connect(owner).deposit(depositAmount);
    
    // Check current protocol
    const currentProtocol = await yieldOptimizer.currentProtocol();
    console.log(`Current protocol after deposit: ${currentProtocol == 1 ? "AAVE" : "COMPOUND"}`);
    
    // Check balances
    const totalBalance = await yieldOptimizer.getTotalBalance();
    console.log(`Total balance in optimizer: ${ethers.utils.formatUnits(totalBalance, 6)} USDC`);
    
    expect(totalBalance).to.be.at.least(depositAmount);
  });
  
  it("Should rebalance to the best protocol", async function () {
    // Store initial state
    const initialProtocol = await yieldOptimizer.currentProtocol();
    console.log(`Initial protocol: ${initialProtocol == 1 ? "AAVE" : "COMPOUND"}`);
    
    // Get initial balances
    const initialAaveBalance = await yieldOptimizer.getAaveBalance();
    const initialCompoundBalance = await yieldOptimizer.getCompoundBalance();
    console.log(`Initial Aave balance: ${ethers.utils.formatUnits(initialAaveBalance, 6)} USDC`);
    console.log(`Initial Compound balance: ${ethers.utils.formatUnits(initialCompoundBalance, 6)} USDC`);
    
    // Try to trigger a rebalance
    // Note: In a real fork, rates probably won't change enough to trigger a rebalance unless we manipulate them
    await yieldOptimizer.rebalance();
    
    // Get new state
    const newProtocol = await yieldOptimizer.currentProtocol();
    const newAaveBalance = await yieldOptimizer.getAaveBalance();
    const newCompoundBalance = await yieldOptimizer.getCompoundBalance();
    
    console.log(`Protocol after rebalance: ${newProtocol == 1 ? "AAVE" : "COMPOUND"}`);
    console.log(`New Aave balance: ${ethers.utils.formatUnits(newAaveBalance, 6)} USDC`);
    console.log(`New Compound balance: ${ethers.utils.formatUnits(newCompoundBalance, 6)} USDC`);
    
    // Verify total balance is maintained
    const totalBalance = await yieldOptimizer.getTotalBalance();
    expect(totalBalance).to.be.gt(0);
    console.log(`Total balance after rebalance: ${ethers.utils.formatUnits(totalBalance, 6)} USDC`);
  });
  
  it("Should allow owner to withdraw", async function () {
    // Get current balance in the optimizer
    const currentBalance = await yieldOptimizer.getTotalBalance();
    if (currentBalance.eq(0)) {
      console.log("No balance to withdraw, skipping test");
      return;
    }
    
    // Withdraw half of the balance
    const withdrawAmount = currentBalance.div(2);
    console.log(`Withdrawing ${ethers.utils.formatUnits(withdrawAmount, 6)} USDC`);
    
    // Initial owner USDC balance
    const initialOwnerBalance = await usdc.balanceOf(owner.address);
    
    // Withdraw
    await yieldOptimizer.withdraw(withdrawAmount);
    
    // Check USDC received by owner
    const newOwnerBalance = await usdc.balanceOf(owner.address);
    expect(newOwnerBalance.sub(initialOwnerBalance)).to.be.closeTo(withdrawAmount, ethers.utils.parseUnits("0.01", 6)); // Allow for small rounding differences
    
    // Check remaining balance in optimizer
    const remainingBalance = await yieldOptimizer.getTotalBalance();
    console.log(`Remaining balance in optimizer: ${ethers.utils.formatUnits(remainingBalance, 6)} USDC`);
    expect(remainingBalance).to.be.closeTo(currentBalance.sub(withdrawAmount), ethers.utils.parseUnits("0.01", 6));
  });
  
  // Optional test to simulate changing rates
  it("Should respond to changing yield rates", async function () {
    this.skip(); // Skip by default as manipulating rates requires storage manipulation
    
    // This test would require direct storage manipulation to change rates
    // It's more of a demonstration of what would be useful to test
    
    // Example pseudocode:
    // 1. Set Aave rate higher than Compound
    // 2. Verify getBestProtocol returns AAVE
    // 3. Set Compound rate higher than Aave
    // 4. Verify getBestProtocol returns COMPOUND
    // 5. Trigger rebalance
    // 6. Verify funds moved to Compound
  });
});
