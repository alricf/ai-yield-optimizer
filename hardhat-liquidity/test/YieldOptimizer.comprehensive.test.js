const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("YieldOptimizer Comprehensive Tests", function () {
  // Define constants for tests
  const INITIAL_SUPPLY = ethers.parseUnits("1000000", 6); // 1M USDC
  const DEPOSIT_AMOUNT = ethers.parseUnits("10000", 6);   // 10K USDC
  const SMALL_AMOUNT = ethers.parseUnits("1", 6);         // 1 USDC
  const LARGE_AMOUNT = ethers.parseUnits("500000", 6);    // 500K USDC
  
  // Rate constants (using 8 decimals as in the contract)
  const RATE_3_PERCENT = ethers.parseUnits("3", 8);       // 3%
  const RATE_4_PERCENT = ethers.parseUnits("4", 8);       // 4%
  const RATE_5_PERCENT = ethers.parseUnits("5", 8);       // 5%
  const RATE_ZERO = ethers.parseUnits("0", 8);            // 0%

  // Test fixture to deploy contracts before each test
  async function deployContractsFixture() {
    // Get signers
    const [owner, user1, user2, user3] = await ethers.getSigners();
    
    // Deploy mock contracts
    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    const usdc = await MockUSDC.deploy();
    
    const MockAaveV3 = await ethers.getContractFactory("MockAaveV3");
    const aave = await MockAaveV3.deploy();
    
    const MockCompoundV3 = await ethers.getContractFactory("MockCompoundV3");
    const compound = await MockCompoundV3.deploy();
    
    // Deploy YieldOptimizer
    const YieldOptimizer = await ethers.getContractFactory("YieldOptimizer");
    const optimizer = await YieldOptimizer.deploy(
      await aave.getAddress(),
      await compound.getAddress(),
      await usdc.getAddress()
    );
    
    // Set initial interest rates
    const usdcAddress = await usdc.getAddress();
    await aave.setInterestRate(usdcAddress, RATE_3_PERCENT);
    await compound.setSupplyRate(usdcAddress, RATE_4_PERCENT);
    
    // Transfer some USDC to users for testing
    await usdc.transfer(user1.address, INITIAL_SUPPLY / 4n);
    await usdc.transfer(user2.address, INITIAL_SUPPLY / 4n);
    await usdc.transfer(user3.address, INITIAL_SUPPLY / 4n);
    
    return { usdc, aave, compound, optimizer, owner, user1, user2, user3, usdcAddress };
  }

  describe("Initialization and Setup", function () {
    it("Should correctly set protocol addresses and owner", async function () {
      const { usdc, aave, compound, optimizer, owner } = await loadFixture(deployContractsFixture);
      
      expect(await optimizer.aave()).to.equal(await aave.getAddress());
      expect(await optimizer.compound()).to.equal(await compound.getAddress());
      expect(await optimizer.usdc()).to.equal(await usdc.getAddress());
      expect(await optimizer.owner()).to.equal(owner.address);
    });
    
    it("Should start with Protocol.NONE as current protocol", async function () {
      const { optimizer } = await loadFixture(deployContractsFixture);
      
      expect(await optimizer.currentProtocol()).to.equal(0); // Protocol.NONE
    });
  });
  
  describe("Rate Comparison and Protocol Selection", function () {
    it("Should select Compound when it has higher rate", async function () {
      const { optimizer } = await loadFixture(deployContractsFixture);
      
      // Initial setup has Compound with higher rate (4% vs 3%)
      expect(await optimizer.getBestProtocol()).to.equal(2); // Protocol.COMPOUND
    });
    
    it("Should select Aave when it has higher rate", async function () {
      const { usdc, aave, optimizer, usdcAddress } = await loadFixture(deployContractsFixture);
      
      // Update rates to make Aave better
      await aave.setInterestRate(usdcAddress, RATE_5_PERCENT);
      
      expect(await optimizer.getBestProtocol()).to.equal(1); // Protocol.AAVE
    });
    
    it("Should select Compound when rates are equal (default preference)", async function () {
      const { usdc, aave, compound, optimizer, usdcAddress } = await loadFixture(deployContractsFixture);
      
      // Set equal rates
      await aave.setInterestRate(usdcAddress, RATE_4_PERCENT);
      await compound.setSupplyRate(usdcAddress, RATE_4_PERCENT);
      
      // Contract logic uses > comparison, so with equal rates it returns Compound (2)
      expect(await optimizer.getBestProtocol()).to.equal(2); // Protocol.COMPOUND
    });
    
    it("Should handle zero rates correctly", async function () {
      const { usdc, aave, compound, optimizer, usdcAddress } = await loadFixture(deployContractsFixture);
      
      // Test with zero rates for both
      await aave.setInterestRate(usdcAddress, RATE_ZERO);
      await compound.setSupplyRate(usdcAddress, RATE_ZERO);
      
      // Should default to Compound with equal (zero) rates
      expect(await optimizer.getBestProtocol()).to.equal(2); // Protocol.COMPOUND
      
      // Test with only Aave having non-zero rate
      await aave.setInterestRate(usdcAddress, RATE_3_PERCENT);
      
      expect(await optimizer.getBestProtocol()).to.equal(1); // Protocol.AAVE
    });
  });
  
  describe("Deposits", function () {
    it("Should revert deposit with zero amount", async function () {
      const { optimizer, user1 } = await loadFixture(deployContractsFixture);
      
      await expect(optimizer.connect(user1).deposit(0))
        .to.be.revertedWith("Amount must be greater than 0");
    });
    
    it("Should deposit to best protocol (Compound with initial setup)", async function () {
      const { usdc, compound, optimizer, user1 } = await loadFixture(deployContractsFixture);
      
      // Approve and deposit
      await usdc.connect(user1).approve(await optimizer.getAddress(), DEPOSIT_AMOUNT);
      await optimizer.connect(user1).deposit(DEPOSIT_AMOUNT);
      
      // Check balance in Compound
      expect(await compound.getBalance(await optimizer.getAddress())).to.equal(DEPOSIT_AMOUNT);
      
      // Check current protocol
      expect(await optimizer.currentProtocol()).to.equal(2); // Protocol.COMPOUND
    });
    
    it("Should deposit to Aave when it has better rate", async function () {
      const { usdc, aave, optimizer, user1, usdcAddress } = await loadFixture(deployContractsFixture);
      
      // Make Aave have better rate
      await aave.setInterestRate(usdcAddress, RATE_5_PERCENT);
      
      // Approve and deposit
      await usdc.connect(user1).approve(await optimizer.getAddress(), DEPOSIT_AMOUNT);
      await optimizer.connect(user1).deposit(DEPOSIT_AMOUNT);
      
      // Check balance in Aave
      expect(await aave.getBalance(await optimizer.getAddress(), usdcAddress)).to.equal(DEPOSIT_AMOUNT);
      
      // Check current protocol
      expect(await optimizer.currentProtocol()).to.equal(1); // Protocol.AAVE
    });
    
    it("Should handle multiple deposits correctly", async function () {
      const { usdc, compound, optimizer, user1 } = await loadFixture(deployContractsFixture);
      
      // First deposit
      await usdc.connect(user1).approve(await optimizer.getAddress(), DEPOSIT_AMOUNT * 3n);
      await optimizer.connect(user1).deposit(DEPOSIT_AMOUNT);
      
      // Second deposit
      await optimizer.connect(user1).deposit(DEPOSIT_AMOUNT);
      
      // Third deposit
      await optimizer.connect(user1).deposit(DEPOSIT_AMOUNT);
      
      // Check total balance
      expect(await compound.getBalance(await optimizer.getAddress())).to.equal(DEPOSIT_AMOUNT * 3n);
    });
    
    it("Should handle deposit approval failure", async function () {
      const { optimizer, user1 } = await loadFixture(deployContractsFixture);
      
      // Try to deposit without approval
      await expect(optimizer.connect(user1).deposit(DEPOSIT_AMOUNT))
        .to.be.reverted; // ERC20 reverts when not approved
    });
    
    it("Should handle deposits from multiple users", async function () {
      const { usdc, compound, optimizer, user1, user2, user3 } = await loadFixture(deployContractsFixture);
      
      // Approvals
      await usdc.connect(user1).approve(await optimizer.getAddress(), DEPOSIT_AMOUNT);
      await usdc.connect(user2).approve(await optimizer.getAddress(), DEPOSIT_AMOUNT);
      await usdc.connect(user3).approve(await optimizer.getAddress(), DEPOSIT_AMOUNT);
      
      // Deposits
      await optimizer.connect(user1).deposit(DEPOSIT_AMOUNT);
      await optimizer.connect(user2).deposit(DEPOSIT_AMOUNT);
      await optimizer.connect(user3).deposit(DEPOSIT_AMOUNT);
      
      // Check total balance
      expect(await compound.getBalance(await optimizer.getAddress())).to.equal(DEPOSIT_AMOUNT * 3n);
    });
  });
  
  describe("Withdrawals", function () {
    it("Should revert withdrawal with zero amount", async function () {
      const { optimizer, owner } = await loadFixture(deployContractsFixture);
      
      await expect(optimizer.connect(owner).withdraw(0))
        .to.be.revertedWith("Amount must be greater than 0");
    });
    
    it("Should revert when non-owner tries to withdraw", async function () {
      const { usdc, optimizer, user1 } = await loadFixture(deployContractsFixture);
      
      // Deposit first
      await usdc.connect(user1).approve(await optimizer.getAddress(), DEPOSIT_AMOUNT);
      await optimizer.connect(user1).deposit(DEPOSIT_AMOUNT);
      
      // Try to withdraw as non-owner
      await expect(optimizer.connect(user1).withdraw(DEPOSIT_AMOUNT))
        .to.be.reverted;
    });
    
    it("Should withdraw from Compound", async function () {
      const { usdc, optimizer, owner, user1 } = await loadFixture(deployContractsFixture);
      
      // Deposit first
      await usdc.connect(user1).approve(await optimizer.getAddress(), DEPOSIT_AMOUNT);
      await optimizer.connect(user1).deposit(DEPOSIT_AMOUNT);
      
      // Get initial balance
      const initialBalance = await usdc.balanceOf(owner.address);
      
      // Withdraw
      await optimizer.connect(owner).withdraw(DEPOSIT_AMOUNT);
      
      // Check owner received funds
      const finalBalance = await usdc.balanceOf(owner.address);
      expect(finalBalance - initialBalance).to.equal(DEPOSIT_AMOUNT);
    });
    
    it("Should withdraw from Aave", async function () {
      const { usdc, aave, optimizer, owner, user1, usdcAddress } = await loadFixture(deployContractsFixture);
      
      // Make Aave have better rate and deposit
      await aave.setInterestRate(usdcAddress, RATE_5_PERCENT);
      
      await usdc.connect(user1).approve(await optimizer.getAddress(), DEPOSIT_AMOUNT);
      await optimizer.connect(user1).deposit(DEPOSIT_AMOUNT);
      
      // Get initial balance
      const initialBalance = await usdc.balanceOf(owner.address);
      
      // Withdraw
      await optimizer.connect(owner).withdraw(DEPOSIT_AMOUNT);
      
      // Check owner received funds
      const finalBalance = await usdc.balanceOf(owner.address);
      expect(finalBalance - initialBalance).to.equal(DEPOSIT_AMOUNT);
    });
    
    it("Should revert withdrawal when no funds are deposited", async function () {
      const { optimizer, owner } = await loadFixture(deployContractsFixture);
      
      // Try to withdraw without any deposits
      await expect(optimizer.connect(owner).withdraw(DEPOSIT_AMOUNT))
        .to.be.revertedWith("No funds deposited");
    });
    
    it("Should revert withdrawal when amount exceeds balance", async function () {
      const { usdc, optimizer, owner, user1 } = await loadFixture(deployContractsFixture);
      
      // Deposit first
      await usdc.connect(user1).approve(await optimizer.getAddress(), DEPOSIT_AMOUNT);
      await optimizer.connect(user1).deposit(DEPOSIT_AMOUNT);
      
      // Try to withdraw more than deposited
      await expect(optimizer.connect(owner).withdraw(DEPOSIT_AMOUNT + 1n))
        .to.be.reverted;
    });
    
    it("Should handle partial withdrawals", async function () {
      const { usdc, compound, optimizer, owner, user1 } = await loadFixture(deployContractsFixture);
      
      // Deposit
      await usdc.connect(user1).approve(await optimizer.getAddress(), DEPOSIT_AMOUNT);
      await optimizer.connect(user1).deposit(DEPOSIT_AMOUNT);
      
      // Withdraw half
      await optimizer.connect(owner).withdraw(DEPOSIT_AMOUNT / 2n);
      
      // Check remaining balance
      expect(await compound.getBalance(await optimizer.getAddress())).to.equal(DEPOSIT_AMOUNT / 2n);
    });
  });
  
  describe("Rebalancing", function () {
    it("Should rebalance from Compound to Aave when rates change", async function () {
      const { usdc, aave, compound, optimizer, user1, usdcAddress } = await loadFixture(deployContractsFixture);
      
      // Deposit to Compound (initial best rate)
      await usdc.connect(user1).approve(await optimizer.getAddress(), DEPOSIT_AMOUNT);
      await optimizer.connect(user1).deposit(DEPOSIT_AMOUNT);
      
      // Verify in Compound
      expect(await optimizer.currentProtocol()).to.equal(2); // Protocol.COMPOUND
      
      // Change rates to favor Aave
      await aave.setInterestRate(usdcAddress, RATE_5_PERCENT);
      
      // Rebalance
      await optimizer.rebalance();
      
      // Verify moved to Aave
      expect(await optimizer.currentProtocol()).to.equal(1); // Protocol.AAVE
      expect(await aave.getBalance(await optimizer.getAddress(), usdcAddress)).to.equal(DEPOSIT_AMOUNT);
      expect(await compound.getBalance(await optimizer.getAddress())).to.equal(0);
    });
    
    it("Should rebalance from Aave to Compound when rates change", async function () {
      const { usdc, aave, compound, optimizer, user1, usdcAddress } = await loadFixture(deployContractsFixture);
      
      // Set Aave as best rate initially
      await aave.setInterestRate(usdcAddress, RATE_5_PERCENT);
      
      // Deposit to Aave
      await usdc.connect(user1).approve(await optimizer.getAddress(), DEPOSIT_AMOUNT);
      await optimizer.connect(user1).deposit(DEPOSIT_AMOUNT);
      
      // Verify in Aave
      expect(await optimizer.currentProtocol()).to.equal(1); // Protocol.AAVE
      
      // Change rates to favor Compound (slightly better than Aave)
      await compound.setSupplyRate(usdcAddress, RATE_5_PERCENT + 1n); 
      
      // Rebalance
      await optimizer.rebalance();
      
      // Verify moved to Compound
      expect(await optimizer.currentProtocol()).to.equal(2); // Protocol.COMPOUND
      expect(await compound.getBalance(await optimizer.getAddress())).to.equal(DEPOSIT_AMOUNT);
      expect(await aave.getBalance(await optimizer.getAddress(), usdcAddress)).to.equal(0);
    });
    
    it("Should not rebalance if already in best protocol", async function () {
      const { usdc, compound, optimizer, user1 } = await loadFixture(deployContractsFixture);
      
      // Deposit to Compound (initial best rate)
      await usdc.connect(user1).approve(await optimizer.getAddress(), DEPOSIT_AMOUNT);
      await optimizer.connect(user1).deposit(DEPOSIT_AMOUNT);
      
      // Verify in Compound
      expect(await optimizer.currentProtocol()).to.equal(2); // Protocol.COMPOUND
      
      // Try to rebalance (should be a no-op)
      await optimizer.rebalance();
      
      // Should still be in Compound
      expect(await optimizer.currentProtocol()).to.equal(2); // Protocol.COMPOUND
      expect(await compound.getBalance(await optimizer.getAddress())).to.equal(DEPOSIT_AMOUNT);
    });
    
    it("Should handle rebalance when no funds are deposited", async function () {
      const { optimizer } = await loadFixture(deployContractsFixture);
      
      // Should not revert
      await optimizer.rebalance();
      
      // Should still be in NONE
      expect(await optimizer.currentProtocol()).to.equal(0); // Protocol.NONE
    });
    
    it("Should handle rebalance with very small amounts", async function () {
      const { usdc, aave, compound, optimizer, user1, usdcAddress } = await loadFixture(deployContractsFixture);
      
      // Deposit tiny amount to Compound
      await usdc.connect(user1).approve(await optimizer.getAddress(), SMALL_AMOUNT);
      await optimizer.connect(user1).deposit(SMALL_AMOUNT);
      
      // Change rates to favor Aave
      await aave.setInterestRate(usdcAddress, RATE_5_PERCENT);
      
      // Rebalance
      await optimizer.rebalance();
      
      // Verify moved to Aave
      expect(await optimizer.currentProtocol()).to.equal(1); // Protocol.AAVE
      expect(await aave.getBalance(await optimizer.getAddress(), usdcAddress)).to.equal(SMALL_AMOUNT);
    });
    
it("Should handle rebalance with large amounts", async function () {
      const { usdc, aave, compound, optimizer, user1, usdcAddress } = await loadFixture(deployContractsFixture);
      
      // Use a smaller "large amount" that won't exceed user1's balance
      // User1 gets INITIAL_SUPPLY / 4n which is 250,000 USDC
      // Let's use 200,000 USDC to be safe
      const saferLargeAmount = ethers.parseUnits("200000", 6);
      
      // Approve and deposit large amount
      await usdc.connect(user1).approve(await optimizer.getAddress(), saferLargeAmount);
      await optimizer.connect(user1).deposit(saferLargeAmount);
      
      // Change rates to favor Aave
      await aave.setInterestRate(usdcAddress, RATE_5_PERCENT);
      
      // Rebalance
      await optimizer.rebalance();
      
      // Verify moved to Aave
      expect(await optimizer.currentProtocol()).to.equal(1); // Protocol.AAVE
      expect(await aave.getBalance(await optimizer.getAddress(), usdcAddress)).to.equal(saferLargeAmount);
    });
  });
  
  describe("GetTotalBalance", function () {
    it("Should return 0 when no funds are deposited", async function () {
      const { optimizer } = await loadFixture(deployContractsFixture);
      
      expect(await optimizer.getTotalBalance()).to.equal(0);
    });
    
    it("Should return correct balance for Compound deposits", async function () {
      const { usdc, optimizer, user1 } = await loadFixture(deployContractsFixture);
      
      // Deposit to Compound
      await usdc.connect(user1).approve(await optimizer.getAddress(), DEPOSIT_AMOUNT);
      await optimizer.connect(user1).deposit(DEPOSIT_AMOUNT);
      
      expect(await optimizer.getTotalBalance()).to.equal(DEPOSIT_AMOUNT);
    });
    
    it("Should return correct balance for Aave deposits", async function () {
      const { usdc, aave, optimizer, user1, usdcAddress } = await loadFixture(deployContractsFixture);
      
      // Make Aave have better rate
      await aave.setInterestRate(usdcAddress, RATE_5_PERCENT);
      
      // Deposit to Aave
      await usdc.connect(user1).approve(await optimizer.getAddress(), DEPOSIT_AMOUNT);
      await optimizer.connect(user1).deposit(DEPOSIT_AMOUNT);
      
      expect(await optimizer.getTotalBalance()).to.equal(DEPOSIT_AMOUNT);
    });
  });
  
  describe("Events", function () {
    it("Should emit Deposited event with correct parameters", async function () {
      const { usdc, optimizer, user1 } = await loadFixture(deployContractsFixture);
      
      // Approve first
      await usdc.connect(user1).approve(await optimizer.getAddress(), DEPOSIT_AMOUNT);
      
      // Check for event emission
      await expect(optimizer.connect(user1).deposit(DEPOSIT_AMOUNT))
        .to.emit(optimizer, "Deposited")
        .withArgs(user1.address, DEPOSIT_AMOUNT, 2); // user, amount, Protocol.COMPOUND
    });
    
    it("Should emit Withdrawn event with correct parameters", async function () {
      const { usdc, optimizer, owner, user1 } = await loadFixture(deployContractsFixture);
      
      // Deposit first
      await usdc.connect(user1).approve(await optimizer.getAddress(), DEPOSIT_AMOUNT);
      await optimizer.connect(user1).deposit(DEPOSIT_AMOUNT);
      
      // Check for event emission
      await expect(optimizer.connect(owner).withdraw(DEPOSIT_AMOUNT))
        .to.emit(optimizer, "Withdrawn")
        .withArgs(owner.address, DEPOSIT_AMOUNT);
    });
    
it("Should emit Rebalanced event with correct parameters", async function () {
      const { usdc, aave, optimizer, user1, usdcAddress } = await loadFixture(deployContractsFixture);
      
      // Verify the initial protocol selection
      expect(await optimizer.getBestProtocol()).to.equal(2); // Protocol.COMPOUND should be best initially
      
      // Deposit to Compound (initial best rate)
      await usdc.connect(user1).approve(await optimizer.getAddress(), DEPOSIT_AMOUNT);
      await optimizer.connect(user1).deposit(DEPOSIT_AMOUNT);
      
      // Verify deposit went to Compound
      expect(await optimizer.currentProtocol()).to.equal(2); // Protocol.COMPOUND
      
      // Change rates to favor Aave
      await aave.setInterestRate(usdcAddress, RATE_5_PERCENT);
      
      // Check for event emission - note the first argument should be the "from" protocol (2 = COMPOUND)
      await expect(optimizer.rebalance())
        .to.emit(optimizer, "Rebalanced")
        .withArgs(2, 1, DEPOSIT_AMOUNT); // from Protocol.COMPOUND to Protocol.AAVE with amount
    });
  });
});

