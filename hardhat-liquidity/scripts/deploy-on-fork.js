const { ethers } = require("hardhat");
require("dotenv").config();

// Addresses on Arbitrum
const USDC_ADDRESS = "0xaf88d065e77c8cC2239327C5EDb3A432268e5831";
const AAVE_V3_POOL = "0x794a61358D6845594F94dc1DB02A252b5b4814aD";
const AAVE_DATA_PROVIDER = "0x69FA688f1Dc47d4B5d8029D5a35FB7a548310654";
const COMPOUND_V3_USDC_MARKET = "0xA5EDBDD9646f8dFF606d7448e414884C7d905dCA";

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
  
  await optimizer.deployed();
  console.log(`YieldOptimizerDirect deployed to: ${optimizer.address}`);
  
  // Get protocol rates
  const aaveAPY = await optimizer.getAaveAPY();
  const compoundAPY = await optimizer.getCompoundAPY();
  
  console.log(`Current Aave APY: ${aaveAPY / 100}%`);
  console.log(`Current Compound APY: ${compoundAPY / 100}%`);
  
  const bestProtocol = await optimizer.getBestProtocol();
  console.log(`Best protocol: ${bestProtocol == 1 ? "AAVE" : "COMPOUND"}`);
  
  console.log("Deployment and verification complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
  