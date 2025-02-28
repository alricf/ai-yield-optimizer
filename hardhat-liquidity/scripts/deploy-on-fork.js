const { ethers } = require("hardhat");
require("dotenv").config();

// Addresses on Arbitrum
const USDC_ADDRESS = "0xaf88d065e77c8cC2239327C5EDb3A432268e5831";
const AAVE_V3_POOL = "0x794a61358D6845594F94dc1DB02A252b5b4814aD";
const AAVE_DATA_PROVIDER = "0x69FA688f1Dc47d4B5d8029D5a35FB7a548310654";
// Updated Compound V3 USDC market address for Arbitrum
const COMPOUND_V3_USDC_MARKET = "0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf";

async function main() {
  console.log("Deploying YieldOptimizerDirect to Arbitrum fork...");
  
  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log(`Deploying with account: ${deployer.address}`);
  
  // Deploy YieldOptimizerDirect
  const YieldOptimizerDirect = await ethers.getContractFactory("YieldOptimizerDirect");
  const optimizer = await YieldOptimizerDirect.deploy(
    AAVE_V3_POOL,
    AAVE_DATA_PROVIDER,
    COMPOUND_V3_USDC_MARKET,
    USDC_ADDRESS
  );
  
  // Wait for deployment to complete - ethers v6 way
  await optimizer.waitForDeployment();
  
  // Get the deployed contract address - ethers v6 way
  const optimizerAddress = await optimizer.getAddress();
  console.log(`YieldOptimizerDirect deployed to: ${optimizerAddress}`);
  
  // Try to get protocol rates with error handling
  try {
    console.log("Attempting to get Aave APY...");
    const aaveAPY = await optimizer.getAaveAPY();
    console.log(`Current Aave APY: ${aaveAPY / 100}%`);
  } catch (error) {
    console.error("Failed to get Aave APY:", error.message);
  }
  
  try {
    console.log("Attempting to get Compound APY...");
    const compoundAPY = await optimizer.getCompoundAPY();
    console.log(`Current Compound APY: ${compoundAPY / 100}%`);
  } catch (error) {
    console.error("Failed to get Compound APY:", error.message);
  }
  
  try {
    console.log("Attempting to get best protocol...");
    const bestProtocol = await optimizer.getBestProtocol();
    console.log(`Best protocol: ${bestProtocol == 1 ? "AAVE" : "COMPOUND"}`);
  } catch (error) {
    console.error("Failed to get best protocol:", error.message);
  }
  
  console.log("Deployment complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

  