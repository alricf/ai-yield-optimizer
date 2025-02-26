const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying YieldOptimizer with the account:", deployer.address);

  // Hardcoding the addresses from your mock deployment
  const USDC_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const AAVE_ADDRESS = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
  const COMPOUND_ADDRESS = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";

  console.log("Using hardcoded addresses from previous mock deployment:");
  console.log(`USDC: ${USDC_ADDRESS}`);
  console.log(`Aave: ${AAVE_ADDRESS}`);
  console.log(`Compound: ${COMPOUND_ADDRESS}`);

  // Deploy YieldOptimizer
  const YieldOptimizer = await hre.ethers.getContractFactory("YieldOptimizer");
  const yieldOptimizer = await YieldOptimizer.deploy(
    AAVE_ADDRESS,
    COMPOUND_ADDRESS,
    USDC_ADDRESS
  );

  await yieldOptimizer.waitForDeployment();
  const yieldOptimizerAddress = await yieldOptimizer.getAddress();
  
  console.log("YieldOptimizer deployed to:", yieldOptimizerAddress);
  console.log("Configuration:");
  console.log({
    USDC: USDC_ADDRESS,
    AaveV3: AAVE_ADDRESS,
    CompoundV3: COMPOUND_ADDRESS,
    YieldOptimizer: yieldOptimizerAddress
  });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

  