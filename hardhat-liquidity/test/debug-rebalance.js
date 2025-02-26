const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("YieldOptimizer Rebalance Debug", function () {
  let mockUSDC, mockAave, mockCompound, yieldOptimizer;
  let owner, user;
  const depositAmount = ethers.parseUnits("50000", 6);  // 50,000 USDC
  const aaveRate = ethers.parseUnits("3", 8);      // 3%
  const compoundRate = ethers.parseUnits("4", 8);  // 4%

  beforeEach(async function () {
    [owner, user] = await ethers.getSigners();

    // Deploy Mock USDC
    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    mockUSDC = await MockUSDC.deploy();
    await mockUSDC.waitForDeployment();

    // Deploy Mock Aave
    const MockAaveV3 = await ethers.getContractFactory("MockAaveV3");
    mockAave = await MockAaveV3.deploy();
    await mockAave.waitForDeployment();

    // Deploy Mock Compound
    const MockCompoundV3 = await ethers.getContractFactory("MockCompoundV3");
    mockCompound = await MockCompoundV3.deploy();
    await mockCompound.waitForDeployment();

    // Deploy YieldOptimizer
    const YieldOptimizer = await ethers.getContractFactory("YieldOptimizer");
    yieldOptimizer = await YieldOptimizer.deploy(
      await mockAave.getAddress(),
      await mockCompound.getAddress(),
      await mockUSDC.getAddress()
    );
    await yieldOptimizer.waitForDeployment();

    // Transfer some USDC to user
    await mockUSDC.transfer(user.address, depositAmount * 10n);

    // Set initial interest rates - Aave better initially
    const usdcAddress = await mockUSDC.getAddress();
    await mockAave.setInterestRate(usdcAddress, aaveRate);
    await mockCompound.setSupplyRate(usdcAddress, ethers.parseUnits("2", 8)); // 2%
    
    // Approve YieldOptimizer to spend user's USDC
    await mockUSDC.connect(user).approve(await yieldOptimizer.getAddress(), depositAmount * 10n);
  });

  it("Should correctly rebalance from Aave to Compound", async function () {
    const usdcAddress = await mockUSDC.getAddress();
    console.log("USDC address:", usdcAddress);
    console.log("Aave address:", await mockAave.getAddress());
    console.log("Compound address:", await mockCompound.getAddress());
    console.log("YieldOptimizer address:", await yieldOptimizer.getAddress());
    
    // Initial deposit goes to Aave (highest rate initially)
    console.log("\n--- First deposit ---");
    await yieldOptimizer.connect(user).deposit(depositAmount);
    console.log("Current protocol after first deposit:", await yieldOptimizer.currentProtocol());
    console.log("Aave balance after first deposit:", await mockAave.getBalance(await yieldOptimizer.getAddress(), usdcAddress));
    
    // Change rates to make Compound better
    console.log("\n--- Change rates ---");
    await mockCompound.setSupplyRate(usdcAddress, compoundRate);
    console.log("Aave rate:", await mockAave.getInterestRate(usdcAddress));
    console.log("Compound rate:", await mockCompound.getSupplyRate(usdcAddress));
    console.log("Best protocol after rate change:", await yieldOptimizer.getBestProtocol());
    
    // Second deposit goes to Compound
    console.log("\n--- Second deposit ---");
    await yieldOptimizer.connect(user).deposit(depositAmount);
    console.log("Current protocol after second deposit:", await yieldOptimizer.currentProtocol());
    console.log("Compound balance after second deposit:", await mockCompound.getBalance(await yieldOptimizer.getAddress()));
    
    // Check balances before rebalance
    console.log("\n--- Before rebalance ---");
    console.log("Aave balance:", await mockAave.getBalance(await yieldOptimizer.getAddress(), usdcAddress));
    console.log("Compound balance:", await mockCompound.getBalance(await yieldOptimizer.getAddress()));
    
    // Now rebalance and see what happens
    console.log("\n--- Rebalance ---");
    const rebalanceTx = await yieldOptimizer.rebalance();
    const receipt = await rebalanceTx.wait();
    
    // Check for Rebalanced event
    const rebalancedEvent = receipt.logs.find(
      log => log.fragment && log.fragment.name === 'Rebalanced'
    );
    
    if (rebalancedEvent) {
      console.log("Rebalanced event:", rebalancedEvent.args);
    } else {
      console.log("No Rebalanced event found");
    }
    
    // Check balances after rebalance
    console.log("\n--- After rebalance ---");
    console.log("Current protocol after rebalance:", await yieldOptimizer.currentProtocol());
    console.log("Aave balance after rebalance:", await mockAave.getBalance(await yieldOptimizer.getAddress(), usdcAddress));
    console.log("Compound balance after rebalance:", await mockCompound.getBalance(await yieldOptimizer.getAddress()));
    
    // Verify all funds (2x deposit) moved to Compound
    const finalCompoundBalance = await mockCompound.getBalance(await yieldOptimizer.getAddress());
    console.log("Final Compound balance:", finalCompoundBalance);
    console.log("Expected balance:", depositAmount * 2n);
    expect(finalCompoundBalance).to.equal(depositAmount * 2n);
  });
});

