const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("Yield Optimizer Integration Tests", function () {
  // Define constants for tests
  const INITIAL_SUPPLY = ethers.parseUnits("1000000", 6); // 1M USDC
  const DEPOSIT_AMOUNT = ethers.parseUnits("50000", 6);   // 50K USDC
  
  // Rate constants
  const RATE_2_PERCENT = ethers.parseUnits("2", 8);
  const RATE_3_PERCENT = ethers.parseUnits("3", 8);
  const RATE_4_PERCENT = ethers.parseUnits("4", 8);
  const RATE_5_PERCENT = ethers.parseUnits("5", 8);

  async function deployFixture() {
    const [owner, user1, user2] = await ethers.getSigners();
    
    // Deploy contracts
    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    const usdc = await MockUSDC.deploy();
    
    const MockAaveV3 = await ethers.getContractFactory("MockAaveV3");
    const aave = await MockAaveV3.deploy();
    
    const MockCompoundV3 = await ethers.getContractFactory("MockCompoundV3");
    const compound = await MockCompoundV3.deploy();
    
    const YieldOptimizer = await ethers.getContractFactory("YieldOptimizer");
    const optimizer = await YieldOptimizer.deploy(
      await aave.getAddress(),
      await compound.getAddress(),
      await usdc.getAddress()
    );
    
    // Transfer USDC to users
    await usdc.transfer(user1.address, INITIAL_SUPPLY / 2n);
    await usdc.transfer(user2.address, INITIAL_SUPPLY / 4n);
    
    // Initial rates
    const usdcAddress = await usdc.getAddress();
    await aave.setInterestRate(usdcAddress, RATE_3_PERCENT);
    await compound.setSupplyRate(usdcAddress, RATE_2_PERCENT);
    
    return { usdc, aave, compound, optimizer, owner, user1, user2, usdcAddress };
  }

  it("Should handle a complete yield optimization lifecycle", async function () {
    const { usdc, aave, compound, optimizer, owner, user1, user2, usdcAddress } = await loadFixture(deployFixture);
    
    // STAGE 1: Initial deposits to Aave (best rate)
    console.log("Stage 1: Initial deposits to Aave");
    
    // Approve and deposit from user1
    await usdc.connect(user1).approve(await optimizer.getAddress(), DEPOSIT_AMOUNT);
    await optimizer.connect(user1).deposit(DEPOSIT_AMOUNT);
    
    // Verify deposit went to Aave
    expect(await optimizer.currentProtocol()).to.equal(1); // Protocol.AAVE
    expect(await aave.getBalance(await optimizer.getAddress(), usdcAddress)).to.equal(DEPOSIT_AMOUNT);
    
    console.log("Total balance after Stage 1:", await optimizer.getTotalBalance());
    
    // STAGE 2: Market conditions change, Compound now has better rate
    console.log("Stage 2: Market conditions change, Compound now has better rate");
    
    await compound.setSupplyRate(usdcAddress, RATE_4_PERCENT);
    
    // User2 deposits
    await usdc.connect(user2).approve(await optimizer.getAddress(), DEPOSIT_AMOUNT);
    await optimizer.connect(user2).deposit(DEPOSIT_AMOUNT);
    
    // Verify deposit went to Compound
    const compoundBalance = await compound.getBalance(await optimizer.getAddress());
    console.log(`Compound balance: ${compoundBalance}, Expected: ${DEPOSIT_AMOUNT}`);
    expect(compoundBalance).to.equal(DEPOSIT_AMOUNT);
    
    // Note: getTotalBalance() now returns the sum of balances across protocols
    console.log(`Aave balance: ${await aave.getBalance(await optimizer.getAddress(), usdcAddress)}`);
    console.log(`Compound balance: ${await compound.getBalance(await optimizer.getAddress())}`);
    console.log(`Current protocol: ${await optimizer.currentProtocol()}`);
    
    console.log("Total balance after Stage 2:", await optimizer.getTotalBalance());
    
    // STAGE 3: Rebalance all funds to the best protocol (Compound)
    console.log("Stage 3: Rebalance all funds to Compound");
    
    // Added debugging for Stage 3
    console.log("Pre-rebalance Aave balance:", await aave.getBalance(await optimizer.getAddress(), usdcAddress));
    console.log("Pre-rebalance Compound balance:", await compound.getBalance(await optimizer.getAddress()));
    console.log("Pre-rebalance current protocol:", await optimizer.currentProtocol());
    console.log("Best protocol before rebalance:", await optimizer.getBestProtocol());
    
    console.log("Checking contract implementation...");
    const implBytecode = await ethers.provider.getCode(await optimizer.getAddress());
    console.log("Contract bytecode length:", implBytecode.length);
    console.log("Contract is deployed:", implBytecode.length > 2);
    
    // Rebalance with event logging
    console.log("Calling rebalance...");
    const rebalanceTx = await optimizer.rebalance();
    const receipt = await rebalanceTx.wait();
    
    // Log rebalance events
    console.log("Rebalance events:");
    for (const log of receipt.logs) {
      try {
        const decodedLog = optimizer.interface.parseLog({
          topics: [...log.topics],
          data: log.data
        });
        console.log(`- Event: ${decodedLog.name}`);
        console.log(`  Arguments: ${decodedLog.args.toString()}`);
      } catch (e) {
        // Skip logs we can't decode
        console.log(`- Couldn't decode log: ${log.topics[0]}`);
      }
    }
    
    // Post-rebalance checks
    console.log("Post-rebalance USDC balance of contract:", await usdc.balanceOf(await optimizer.getAddress()));
    console.log("Post-rebalance Aave approval for optimizer:", await usdc.allowance(await optimizer.getAddress(), await aave.getAddress()));
    console.log("Post-rebalance Compound approval for optimizer:", await usdc.allowance(await optimizer.getAddress(), await compound.getAddress()));
    
    // Verify all funds are now in Compound
    const currentProtocol = await optimizer.currentProtocol();
    console.log(`Current protocol after rebalance: ${currentProtocol}`);
    expect(currentProtocol).to.equal(2); // Protocol.COMPOUND

    const compoundBalanceAfter = await compound.getBalance(await optimizer.getAddress());
    console.log(`Compound balance after rebalance: ${compoundBalanceAfter}, Expected: ${DEPOSIT_AMOUNT * 2n}`);
    expect(compoundBalanceAfter).to.equal(DEPOSIT_AMOUNT * 2n);

    const aaveBalanceAfter = await aave.getBalance(await optimizer.getAddress(), usdcAddress);
    console.log(`Aave balance after rebalance: ${aaveBalanceAfter}`);
    expect(aaveBalanceAfter).to.equal(0);
    
    console.log("Total balance after Stage 3:", await optimizer.getTotalBalance());
    
    // STAGE 4: Market conditions change again, Aave offers better rate
    console.log("Stage 4: Market conditions change again, Aave offers better rate");
    
    await aave.setInterestRate(usdcAddress, RATE_5_PERCENT);
    
    // User1 adds more funds
    await usdc.connect(user1).approve(await optimizer.getAddress(), DEPOSIT_AMOUNT);
    await optimizer.connect(user1).deposit(DEPOSIT_AMOUNT);
    
    // Check the total balance across all protocols
    const totalBalanceStage4 = await optimizer.getTotalBalance();
    console.log(`Total balance (should be Compound balance + new deposit): ${totalBalanceStage4}`);
    
    // IMPORTANT FIX: The test should expect 3x DEPOSIT_AMOUNT since there are now 3 deposits
    // Only now we're also tracking the Aave deposits properly
    
    // STAGE 5: Rebalance to move all funds to Aave
    console.log("Stage 5: Rebalance to move all funds to Aave");
    
    await optimizer.rebalance();
    
    // Verify all funds moved to Aave
    expect(await optimizer.currentProtocol()).to.equal(1); // Protocol.AAVE
    
    const aaveBalanceStage5 = await aave.getBalance(await optimizer.getAddress(), usdcAddress);
    console.log(`Aave balance after second rebalance: ${aaveBalanceStage5}, Expected: ${DEPOSIT_AMOUNT * 3n}`);
    
    // FIXED EXPECTATION: Changed from 2n to 3n to account for the 3 deposits
    expect(aaveBalanceStage5).to.equal(DEPOSIT_AMOUNT * 3n);
    
    const compoundBalanceStage5 = await compound.getBalance(await optimizer.getAddress());
    console.log(`Compound balance after second rebalance: ${compoundBalanceStage5}`);
    expect(compoundBalanceStage5).to.equal(0);
    
    // Check getTotalBalance now returns Aave balance since it's the current protocol
    expect(await optimizer.getTotalBalance()).to.equal(DEPOSIT_AMOUNT * 3n);
    
    // STAGE 6: Partial withdrawal
    console.log("Stage 6: Owner performs partial withdrawal");
    
    // Initial owner balance
    const initialOwnerBalance = await usdc.balanceOf(owner.address);
    
    // Withdraw half of the funds
    await optimizer.connect(owner).withdraw(DEPOSIT_AMOUNT * 3n / 2n);
    
    // Check owner received the funds
    const newOwnerBalance = await usdc.balanceOf(owner.address);
    expect(newOwnerBalance - initialOwnerBalance).to.equal(DEPOSIT_AMOUNT * 3n / 2n);
    
    // Check remaining balance
    expect(await optimizer.getTotalBalance()).to.equal(DEPOSIT_AMOUNT * 3n / 2n);
    
    // STAGE 7: Complete withdrawal
    console.log("Stage 7: Owner performs complete withdrawal");
    
    // Withdraw remaining funds
    const remainingBalance = await optimizer.getTotalBalance();
    await optimizer.connect(owner).withdraw(remainingBalance);
    
    // Verify all funds withdrawn
    expect(await optimizer.getTotalBalance()).to.equal(0);
    expect(await aave.getBalance(await optimizer.getAddress(), usdcAddress)).to.equal(0);
    
    // STAGE 8: Handling rate volatility
    console.log("Stage 8: Testing rate volatility handling");
    
    // Set rates to favor Compound
    await compound.setSupplyRate(usdcAddress, RATE_5_PERCENT);
    await aave.setInterestRate(usdcAddress, RATE_3_PERCENT);
    
    // New deposit
    await usdc.connect(user1).approve(await optimizer.getAddress(), DEPOSIT_AMOUNT);
    await optimizer.connect(user1).deposit(DEPOSIT_AMOUNT);
    
    // Verify funds went to Compound
    expect(await optimizer.currentProtocol()).to.equal(2); // Protocol.COMPOUND
    
    // Rapidly alternate rates several times
    console.log("Simulating market volatility with rapidly changing rates");
    
    // First flip - favor Aave
    await aave.setInterestRate(usdcAddress, RATE_5_PERCENT);
    await compound.setSupplyRate(usdcAddress, RATE_2_PERCENT);
    await optimizer.rebalance();
    expect(await optimizer.currentProtocol()).to.equal(1); // Protocol.AAVE
    
    // Second flip - favor Compound
    await compound.setSupplyRate(usdcAddress, RATE_5_PERCENT);
    await aave.setInterestRate(usdcAddress, RATE_2_PERCENT);
    await optimizer.rebalance();
    expect(await optimizer.currentProtocol()).to.equal(2); // Protocol.COMPOUND
    
    // Third flip - favor Aave again
    await aave.setInterestRate(usdcAddress, RATE_5_PERCENT);
    await compound.setSupplyRate(usdcAddress, RATE_4_PERCENT);
    await optimizer.rebalance();
    expect(await optimizer.currentProtocol()).to.equal(1); // Protocol.AAVE
    
    // Verify final balance after all operations
    expect(await optimizer.getTotalBalance()).to.equal(DEPOSIT_AMOUNT);
    expect(await aave.getBalance(await optimizer.getAddress(), usdcAddress)).to.equal(DEPOSIT_AMOUNT);
    
    console.log("Integration test completed successfully");
  });
});

