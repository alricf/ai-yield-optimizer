const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("YieldOptimizer Focused Rebalance Debug", function () {
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
    console.log("Deployed MockUSDC at:", await mockUSDC.getAddress());

    // Deploy Mock Aave
    const MockAaveV3 = await ethers.getContractFactory("MockAaveV3");
    mockAave = await MockAaveV3.deploy();
    await mockAave.waitForDeployment();
    console.log("Deployed MockAaveV3 at:", await mockAave.getAddress());

    // Deploy Mock Compound
    const MockCompoundV3 = await ethers.getContractFactory("MockCompoundV3");
    mockCompound = await MockCompoundV3.deploy();
    await mockCompound.waitForDeployment();
    console.log("Deployed MockCompoundV3 at:", await mockCompound.getAddress());

    // Deploy YieldOptimizer
    const YieldOptimizer = await ethers.getContractFactory("YieldOptimizer");
    yieldOptimizer = await YieldOptimizer.deploy(
      await mockAave.getAddress(),
      await mockCompound.getAddress(),
      await mockUSDC.getAddress()
    );
    await yieldOptimizer.waitForDeployment();
    console.log("Deployed YieldOptimizer at:", await yieldOptimizer.getAddress());

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
    console.log("YieldOptimizer address:", await yieldOptimizer.getAddress());
    
    // Test to verify if rebalance is properly updated
    console.log("\n--- Verifying rebalance function ---");
    // Let's read the rebalance function code to confirm
    const bytecode = await ethers.provider.getCode(await yieldOptimizer.getAddress());
    // This won't directly show us the code, but we can check if the contract is deployed
    console.log("Contract bytecode length:", bytecode.length);
    console.log("Contract deployed:", bytecode.length > 2);

    // Initial deposit goes to Aave (highest rate initially)
    console.log("\n--- First deposit ---");
    await yieldOptimizer.connect(user).deposit(depositAmount);
    
    // Log balances and protocols
    console.log("Current protocol after first deposit:", await yieldOptimizer.currentProtocol());
    const aaveBalanceFirst = await mockAave.getBalance(await yieldOptimizer.getAddress(), usdcAddress);
    console.log("Aave balance after first deposit:", aaveBalanceFirst);
    console.log("Aave balance in decimals:", ethers.formatUnits(aaveBalanceFirst, 6));
    
    // Change rates to make Compound better
    console.log("\n--- Change rates ---");
    await mockCompound.setSupplyRate(usdcAddress, compoundRate);
    console.log("Aave rate:", await mockAave.getInterestRate(usdcAddress));
    console.log("Compound rate:", await mockCompound.getSupplyRate(usdcAddress));
    console.log("Best protocol after rate change:", await yieldOptimizer.getBestProtocol());
    
    // Second deposit goes to Compound
    console.log("\n--- Second deposit ---");
    await yieldOptimizer.connect(user).deposit(depositAmount);
    
    // Log protocols and balances 
    console.log("Current protocol after second deposit:", await yieldOptimizer.currentProtocol());
    const compoundBalanceSecond = await mockCompound.getBalance(await yieldOptimizer.getAddress());
    console.log("Compound balance after second deposit:", compoundBalanceSecond);
    console.log("Compound balance in decimals:", ethers.formatUnits(compoundBalanceSecond, 6));
    
    // Check balances before rebalance
    console.log("\n--- Before rebalance ---");
    const aaveBalanceBefore = await mockAave.getBalance(await yieldOptimizer.getAddress(), usdcAddress);
    const compoundBalanceBefore = await mockCompound.getBalance(await yieldOptimizer.getAddress());
    console.log("Aave balance:", aaveBalanceBefore);
    console.log("Compound balance:", compoundBalanceBefore);
    
    // Now rebalance and see what happens
    console.log("\n--- Rebalance ---");
    const rebalanceTx = await yieldOptimizer.rebalance();
    const receipt = await rebalanceTx.wait();
    
    // Check for events
    console.log("\n--- Event logs ---");
    for (const log of receipt.logs) {
      try {
        // Try to decode the log
        const decodedLog = yieldOptimizer.interface.parseLog({ 
          topics: [...log.topics], 
          data: log.data 
        });
        console.log(`Event: ${decodedLog.name}`);
        if (decodedLog.args) {
          console.log("  Arguments:", decodedLog.args);
        }
      } catch (e) {
        // Skip logs we can't decode
        console.log("Could not decode log:", log.topics[0]);
      }
    }
    
    // Check balances after rebalance
    console.log("\n--- After rebalance ---");
    console.log("Current protocol after rebalance:", await yieldOptimizer.currentProtocol());
    const aaveBalanceAfter = await mockAave.getBalance(await yieldOptimizer.getAddress(), usdcAddress);
    const compoundBalanceAfter = await mockCompound.getBalance(await yieldOptimizer.getAddress());
    console.log("Aave balance after rebalance:", aaveBalanceAfter);
    console.log("Compound balance after rebalance:", compoundBalanceAfter);
    
    // Verify all funds moved to Compound
    const totalExpected = depositAmount * 2n;
    console.log("\n--- Verification ---");
    console.log("Compound balance after rebalance:", compoundBalanceAfter);
    console.log("Expected balance:", totalExpected);
    
    console.log("\nVerify USDC contract functionality");
    // Check if USDC transfers and approvals are working
    const contractUSDCBalance = await mockUSDC.balanceOf(await yieldOptimizer.getAddress());
    console.log("USDC balance of contract:", contractUSDCBalance);
    
    // If there's still an issue, try one more targeted approach
    if (compoundBalanceAfter !== totalExpected) {
      console.log("\n--- Attempt explicit fund movement ---");
      // Explicitly try to move funds from Aave to Compound
      if (aaveBalanceAfter > 0) {
        console.log("Trying explicit withdrawal from Aave");
        await mockAave.withdraw(usdcAddress, aaveBalanceAfter, await yieldOptimizer.getAddress());
        const contractUSDCAfterWithdraw = await mockUSDC.balanceOf(await yieldOptimizer.getAddress());
        console.log("USDC balance after explicit withdraw:", contractUSDCAfterWithdraw);
        
        console.log("Trying explicit deposit to Compound");
        await mockUSDC.approve(await mockCompound.getAddress(), contractUSDCAfterWithdraw);
        await mockCompound.supply(usdcAddress, contractUSDCAfterWithdraw);
        
        // Check final balances
        console.log("Final Aave balance:", await mockAave.getBalance(await yieldOptimizer.getAddress(), usdcAddress));
        console.log("Final Compound balance:", await mockCompound.getBalance(await yieldOptimizer.getAddress()));
      }
    }
    
    // Final verification
    if (compoundBalanceAfter === totalExpected) {
      console.log("\nSuccess! All funds moved to Compound");
    } else {
      console.log("\nStill having issues. Check mock contract implementations");
    }
  });
});

