const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // Deploy MockUSDC
  const MockUSDC = await hre.ethers.getContractFactory("MockUSDC");
  const mockUSDC = await MockUSDC.deploy();
  await mockUSDC.waitForDeployment();
  const mockUSDCAddress = await mockUSDC.getAddress();
  console.log("MockUSDC deployed to:", mockUSDCAddress);

  // Deploy MockAaveV3
  const MockAaveV3 = await hre.ethers.getContractFactory("MockAaveV3");
  const mockAaveV3 = await MockAaveV3.deploy();
  await mockAaveV3.waitForDeployment();
  const mockAaveV3Address = await mockAaveV3.getAddress();
  console.log("MockAaveV3 deployed to:", mockAaveV3Address);

  // Deploy MockCompoundV3
  const MockCompoundV3 = await hre.ethers.getContractFactory("MockCompoundV3");
  const mockCompoundV3 = await MockCompoundV3.deploy();
  await mockCompoundV3.waitForDeployment();
  const mockCompoundV3Address = await mockCompoundV3.getAddress();
  console.log("MockCompoundV3 deployed to:", mockCompoundV3Address);

  // Set initial interest rates for testing
  await mockAaveV3.setInterestRate(mockUSDCAddress, hre.ethers.parseUnits("3", 8)); // 3% APY
  await mockCompoundV3.setSupplyRate(mockUSDCAddress, hre.ethers.parseUnits("2.5", 8)); // 2.5% APY
  
  console.log("Mock interest rates set");

  // Save the contract addresses for easy access
  console.log({
    USDC: mockUSDCAddress,
    AaveV3: mockAaveV3Address,
    CompoundV3: mockCompoundV3Address
  });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

  