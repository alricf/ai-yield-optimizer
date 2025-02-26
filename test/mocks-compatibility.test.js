const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("Mock Protocol Compatibility Tests", function () {
  // Define constants for tests
  const DEPOSIT_AMOUNT = ethers.parseUnits("1000", 6);
  const INTEREST_RATE = ethers.parseUnits("4", 8); // 4%
  
  async function deployMocksFixture() {
    const [deployer, user] = await ethers.getSigners();
    
    // Deploy mock contracts
    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    const usdc = await MockUSDC.deploy();
    
    const MockAaveV3 = await ethers.getContractFactory("MockAaveV3");
    const aave = await MockAaveV3.deploy();
    
    const MockCompoundV3 = await ethers.getContractFactory("MockCompoundV3");
    const compound = await MockCompoundV3.deploy();
    
    // Set initial rates
    const usdcAddress = await usdc.getAddress();
    await aave.setInterestRate(usdcAddress, INTEREST_RATE);
    await compound.setSupplyRate(usdcAddress, INTEREST_RATE);
    
    // Transfer some USDC to user
    await usdc.transfer(user.address, DEPOSIT_AMOUNT * 10n);
    
    return { usdc, aave, compound, deployer, user, usdcAddress };
  }
  
  describe("Aave V3 Mock Implementation", function () {
    it("Should correctly implement deposit and withdrawal flow", async function () {
      const { usdc, aave, user, usdcAddress } = await loadFixture(deployMocksFixture);
      
      // Approve and deposit
      await usdc.connect(user).approve(await aave.getAddress(), DEPOSIT_AMOUNT);
      await aave.connect(user).deposit(usdcAddress, DEPOSIT_AMOUNT, user.address, 0);
      
      // Verify balance
      expect(await aave.getBalance(user.address, usdcAddress)).to.equal(DEPOSIT_AMOUNT);
      
      // Withdraw partial
      await aave.connect(user).withdraw(usdcAddress, DEPOSIT_AMOUNT / 2n, user.address);
      
      // Verify updated balance
      expect(await aave.getBalance(user.address, usdcAddress)).to.equal(DEPOSIT_AMOUNT / 2n);
      expect(await usdc.balanceOf(user.address)).to.equal(DEPOSIT_AMOUNT * 10n - DEPOSIT_AMOUNT + DEPOSIT_AMOUNT / 2n);
      
      // Withdraw remaining
      await aave.connect(user).withdraw(usdcAddress, DEPOSIT_AMOUNT / 2n, user.address);
      
      // Verify all withdrawn
      expect(await aave.getBalance(user.address, usdcAddress)).to.equal(0);
    });
    
    it("Should correctly report interest rates", async function () {
      const { aave, usdcAddress } = await loadFixture(deployMocksFixture);
      
      // Check initial rate
      expect(await aave.getInterestRate(usdcAddress)).to.equal(INTEREST_RATE);
      
      // Update rate
      const newRate = ethers.parseUnits("5.5", 8); // 5.5%
      await aave.setInterestRate(usdcAddress, newRate);
      
      // Verify new rate
      expect(await aave.getInterestRate(usdcAddress)).to.equal(newRate);
    });
    
    it("Should handle multiple users correctly", async function () {
      const { usdc, aave, deployer, user, usdcAddress } = await loadFixture(deployMocksFixture);
      
      // Deposit from first user
      await usdc.connect(user).approve(await aave.getAddress(), DEPOSIT_AMOUNT);
      await aave.connect(user).deposit(usdcAddress, DEPOSIT_AMOUNT, user.address, 0);
      
      // Deposit from second user (deployer)
      await usdc.approve(await aave.getAddress(), DEPOSIT_AMOUNT * 2n);
      await aave.deposit(usdcAddress, DEPOSIT_AMOUNT * 2n, deployer.address, 0);
      
      // Verify balances
      expect(await aave.getBalance(user.address, usdcAddress)).to.equal(DEPOSIT_AMOUNT);
      expect(await aave.getBalance(deployer.address, usdcAddress)).to.equal(DEPOSIT_AMOUNT * 2n);
      
      // Each user withdraws their funds
      await aave.connect(user).withdraw(usdcAddress, DEPOSIT_AMOUNT, user.address);
      await aave.withdraw(usdcAddress, DEPOSIT_AMOUNT * 2n, deployer.address);
      
      // Verify all balances are 0
      expect(await aave.getBalance(user.address, usdcAddress)).to.equal(0);
      expect(await aave.getBalance(deployer.address, usdcAddress)).to.equal(0);
    });
  });
  
  describe("Compound V3 Mock Implementation", function () {
    it("Should correctly implement supply and redeem flow", async function () {
      const { usdc, compound, user, usdcAddress } = await loadFixture(deployMocksFixture);
      
      // Approve and supply
      await usdc.connect(user).approve(await compound.getAddress(), DEPOSIT_AMOUNT);
      await compound.connect(user).supply(usdcAddress, DEPOSIT_AMOUNT);
      
      // Verify balance
      expect(await compound.getBalance(user.address)).to.equal(DEPOSIT_AMOUNT);
      
      // Redeem partial
      await compound.connect(user).redeem(DEPOSIT_AMOUNT / 2n);
      
      // Verify updated balance
      expect(await compound.getBalance(user.address)).to.equal(DEPOSIT_AMOUNT / 2n);
      
      // Redeem remaining
      await compound.connect(user).redeem(DEPOSIT_AMOUNT / 2n);
      
      // Verify all redeemed
      expect(await compound.getBalance(user.address)).to.equal(0);
    });
    
    it("Should correctly report supply rates", async function () {
      const { compound, usdcAddress } = await loadFixture(deployMocksFixture);
      
      // Check initial rate
      expect(await compound.getSupplyRate(usdcAddress)).to.equal(INTEREST_RATE);
      
      // Update rate
      const newRate = ethers.parseUnits("6.25", 8); // 6.25%
      await compound.setSupplyRate(usdcAddress, newRate);
      
      // Verify new rate
      expect(await compound.getSupplyRate(usdcAddress)).to.equal(newRate);
    });
    
    it("Should handle multiple users correctly", async function () {
      const { usdc, compound, deployer, user, usdcAddress } = await loadFixture(deployMocksFixture);
      
      // Supply from first user
      await usdc.connect(user).approve(await compound.getAddress(), DEPOSIT_AMOUNT);
      await compound.connect(user).supply(usdcAddress, DEPOSIT_AMOUNT);
      
      // Supply from second user (deployer)
      await usdc.approve(await compound.getAddress(), DEPOSIT_AMOUNT * 2n);
      await compound.supply(usdcAddress, DEPOSIT_AMOUNT * 2n);
      
      // Verify balances
      expect(await compound.getBalance(user.address)).to.equal(DEPOSIT_AMOUNT);
      expect(await compound.getBalance(deployer.address)).to.equal(DEPOSIT_AMOUNT * 2n);
      
      // Each user redeems their funds
      await compound.connect(user).redeem(DEPOSIT_AMOUNT);
      await compound.redeem(DEPOSIT_AMOUNT * 2n);
      
      // Verify all balances are 0
      expect(await compound.getBalance(user.address)).to.equal(0);
      expect(await compound.getBalance(deployer.address)).to.equal(0);
    });
  });
  
  describe("Interface Compatibility", function () {
    it("Should implement IAaveV3 interface correctly", async function () {
      const { aave } = await loadFixture(deployMocksFixture);
      
      // Check that all required interface functions exist
      expect(typeof aave.deposit).to.equal('function');
      expect(typeof aave.withdraw).to.equal('function');
      expect(typeof aave.getInterestRate).to.equal('function');
      expect(typeof aave.getBalance).to.equal('function');
    });
    
    it("Should implement ICompoundV3 interface correctly", async function () {
      const { compound } = await loadFixture(deployMocksFixture);
      
      // Check that all required interface functions exist
      expect(typeof compound.supply).to.equal('function');
      expect(typeof compound.redeem).to.equal('function');
      expect(typeof compound.getSupplyRate).to.equal('function');
      expect(typeof compound.getBalance).to.equal('function');
    });
  });
  
  describe("Error Cases", function () {
    it("Should revert Aave withdrawal when amount exceeds balance", async function () {
      const { usdc, aave, user, usdcAddress } = await loadFixture(deployMocksFixture);
      
      // Deposit
      await usdc.connect(user).approve(await aave.getAddress(), DEPOSIT_AMOUNT);
      await aave.connect(user).deposit(usdcAddress, DEPOSIT_AMOUNT, user.address, 0);
      
      // Try to withdraw more than deposited
      await expect(
        aave.connect(user).withdraw(usdcAddress, DEPOSIT_AMOUNT * 2n, user.address)
      ).to.be.revertedWith("Insufficient balance");
    });
    
    it("Should revert Compound redemption when amount exceeds balance", async function () {
      const { usdc, compound, user, usdcAddress } = await loadFixture(deployMocksFixture);
      
      // Supply
      await usdc.connect(user).approve(await compound.getAddress(), DEPOSIT_AMOUNT);
      await compound.connect(user).supply(usdcAddress, DEPOSIT_AMOUNT);
      
      // Try to redeem more than supplied
      await expect(
        compound.connect(user).redeem(DEPOSIT_AMOUNT * 2n)
      ).to.be.revertedWith("Insufficient balance");
    });
  });
});

