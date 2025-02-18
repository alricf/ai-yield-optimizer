const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Liquidity Manager", function () {
  
  async function deployLiquidityManager() {
    // Contracts are deployed using the first signer/account by default
    const [owner] = await ethers.getSigners();

    const LiquidityManager = await ethers.getContractFactory("Lock");
    const liquidityManager = await LiquidityManager.deploy();

    return { liquidityManager };
  }

  describe("Deployment", function () {
    
  });

  