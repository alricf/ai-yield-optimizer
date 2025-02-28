const { ethers } = require("hardhat");
require("dotenv").config();

// Addresses on Arbitrum
const USDC_ADDRESS = "0xaf88d065e77c8cC2239327C5EDb3A432268e5831";
const AAVE_V3_POOL = "0x794a61358D6845594F94dc1DB02A252b5b4814aD";
const COMPOUND_V3_USDC_MARKET = "0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf";

async function main() {
  console.log("Deploying YieldOptimizer to Arbitrum fork...");
  
  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log(`Deploying with account: ${deployer.address}`);
  
  // Deploy YieldOptimizer with 3 parameters (not 4)
  const YieldOptimizer = await ethers.getContractFactory("YieldOptimizer");
  const optimizer = await YieldOptimizer.deploy(
    AAVE_V3_POOL,          // _aave
    COMPOUND_V3_USDC_MARKET, // _compound
    USDC_ADDRESS           // _usdc
  );
  
  // Wait for deployment to complete - ethers v6 way
  await optimizer.waitForDeployment();
  
  // Get the deployed contract address - ethers v6 way
  const optimizerAddress = await optimizer.getAddress();
  console.log(`YieldOptimizer deployed to: ${optimizerAddress}`);
  
  // Try to get protocol rates with error handling
  try {
    console.log("Attempting to get best protocol...");
    const bestProtocol = await optimizer.getBestProtocol();
    console.log(`Best protocol: ${bestProtocol == 1 ? "AAVE" : "COMPOUND"}`);
  } catch (error) {
    console.error("Failed to get best protocol:", error.message);
  }
  
  try {
    console.log("Attempting to get total balance...");
    const totalBalance = await optimizer.getTotalBalance();
    console.log(`Total balance: ${totalBalance}`);
  } catch (error) {
    console.error("Failed to get total balance:", error.message);
  }
  
  console.log("Deployment complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
  