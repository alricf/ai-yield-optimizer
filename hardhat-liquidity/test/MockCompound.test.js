const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MockCompoundV3 Test", function () {
  let mockUSDC, mockCompound;
  let owner, user;
  const depositAmount = ethers.parseUnits("1000", 6); // 1,000 USDC

  beforeEach(async function () {
    [owner, user] = await ethers.getSigners();

    // Deploy Mock USDC
    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    mockUSDC = await MockUSDC.deploy();
    await mockUSDC.waitForDeployment();

    // Deploy MockCompoundV3
    const MockCompoundV3 = await ethers.getContractFactory("MockCompoundV3");
    mockCompound = await MockCompoundV3.deploy();
    await mockCompound.waitForDeployment();

    // Transfer USDC to user
    await mockUSDC.transfer(user.address, depositAmount * 10n);
  });

  it("Should allow supply and redeem operations", async function () {
    const usdcAddress = await mockUSDC.getAddress();
    
    // User approves and supplies USDC to Compound
    await mockUSDC.connect(user).approve(await mockCompound.getAddress(), depositAmount);
    await mockCompound.connect(user).supply(usdcAddress, depositAmount);
    
    // Check user's balance in Compound
    expect(await mockCompound.getBalance(user.address)).to.equal(depositAmount);
    
    // User redeems half of their USDC
    await mockCompound.connect(user).redeem(depositAmount / 2n);
    
    // Check updated balances
    expect(await mockCompound.getBalance(user.address)).to.equal(depositAmount / 2n);
    
    // User redeems remaining USDC
    await mockCompound.connect(user).redeem(depositAmount / 2n);
    
    // Check final balances
    expect(await mockCompound.getBalance(user.address)).to.equal(0);
  });
});

