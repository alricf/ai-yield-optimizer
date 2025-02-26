const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("YieldOptimizer", function () {
  let mockUSDC, mockAave, mockCompound, yieldOptimizer;
  let owner, user;
  const initialAmount = ethers.parseUnits("100000", 6); // 100,000 USDC
  const depositAmount = ethers.parseUnits("10000", 6);  // 10,000 USDC

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

    // Transfer some USDC to user for testing
    await mockUSDC.transfer(user.address, initialAmount);

    // Set initial interest rates
    const usdcAddress = await mockUSDC.getAddress();
    await mockAave.setInterestRate(usdcAddress, ethers.parseUnits("3", 8));      // 3%
    await mockCompound.setSupplyRate(usdcAddress, ethers.parseUnits("2.5", 8));  // 2.5%
    
    // Approve the YieldOptimizer to spend user's USDC
    await mockUSDC.connect(user).approve(await yieldOptimizer.getAddress(), depositAmount);
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await yieldOptimizer.owner()).to.equal(owner.address);
    });

    it("Should set the correct protocol addresses", async function () {
      expect(await yieldOptimizer.aave()).to.equal(await mockAave.getAddress());
      expect(await yieldOptimizer.compound()).to.equal(await mockCompound.getAddress());
      expect(await yieldOptimizer.usdc()).to.equal(await mockUSDC.getAddress());
    });
  });

  describe("Protocol Selection", function () {
    it("Should select Aave when it has the higher rate", async function () {
      // Aave rate is already set to 3%, which is higher than Compound's 2.5%
      expect(await yieldOptimizer.getBestProtocol()).to.equal(1); // Protocol.AAVE
    });

    it("Should select Compound when it has the higher rate", async function () {
      // Set Compound to have a higher rate
      const usdcAddress = await mockUSDC.getAddress();
      await mockCompound.setSupplyRate(usdcAddress, ethers.parseUnits("4", 8)); // 4%
      expect(await yieldOptimizer.getBestProtocol()).to.equal(2); // Protocol.COMPOUND
    });
  });

  describe("Deposits", function () {
    it("Should deposit funds into Aave when it has the higher rate", async function () {
      // Initial rates have Aave with the higher rate
      await yieldOptimizer.connect(user).deposit(depositAmount);
      
      // Check that funds were deposited to Aave
      const usdcAddress = await mockUSDC.getAddress();
      const aaveBalance = await mockAave.getBalance(await yieldOptimizer.getAddress(), usdcAddress);
      expect(aaveBalance).to.equal(depositAmount);
      
      // Check current protocol
      expect(await yieldOptimizer.currentProtocol()).to.equal(1); // Protocol.AAVE
    });

    it("Should deposit funds into Compound when it has the higher rate", async function () {
      // Set Compound to have a higher rate
      const usdcAddress = await mockUSDC.getAddress();
      await mockCompound.setSupplyRate(usdcAddress, ethers.parseUnits("4", 8)); // 4%
      
      await yieldOptimizer.connect(user).deposit(depositAmount);
      
      // Check that funds were deposited to Compound
      const compoundBalance = await mockCompound.getBalance(await yieldOptimizer.getAddress());
      expect(compoundBalance).to.equal(depositAmount);
      
      // Check current protocol
      expect(await yieldOptimizer.currentProtocol()).to.equal(2); // Protocol.COMPOUND
    });
  });

  describe("Rebalancing", function () {
    it("Should rebalance funds from Aave to Compound when rates change", async function () {
      // Initial rates have Aave with the higher rate
      await yieldOptimizer.connect(user).deposit(depositAmount);
      
      // Verify funds are in Aave
      expect(await yieldOptimizer.currentProtocol()).to.equal(1); // Protocol.AAVE
      
      // Change rates to make Compound more attractive
      const usdcAddress = await mockUSDC.getAddress();
      await mockCompound.setSupplyRate(usdcAddress, ethers.parseUnits("5", 8)); // 5%
      
      // Rebalance
      await yieldOptimizer.rebalance();
      
      // Verify funds moved to Compound
      expect(await yieldOptimizer.currentProtocol()).to.equal(2); // Protocol.COMPOUND
      const compoundBalance = await mockCompound.getBalance(await yieldOptimizer.getAddress());
      expect(compoundBalance).to.equal(depositAmount);
    });
  });

  describe("Withdrawals", function () {
    it("Should allow owner to withdraw funds", async function () {
      // Deposit first
      await yieldOptimizer.connect(user).deposit(depositAmount);
      
      // Get initial balance
      const initialOwnerBalance = await mockUSDC.balanceOf(owner.address);
      
      // Owner withdraws
      await yieldOptimizer.withdraw(depositAmount);
      
      // Check owner received the funds
      const finalOwnerBalance = await mockUSDC.balanceOf(owner.address);
      expect(finalOwnerBalance - initialOwnerBalance).to.equal(depositAmount);
    });

    it("Should not allow non-owner to withdraw funds", async function () {
      // Deposit first
      await yieldOptimizer.connect(user).deposit(depositAmount);
      
      // User tries to withdraw (should fail)
      await expect(
        yieldOptimizer.connect(user).withdraw(depositAmount)
      ).to.be.reverted;
    });
  });
});


