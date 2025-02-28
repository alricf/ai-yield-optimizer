const { ethers } = require("hardhat");

async function main() {
  console.log("Fetching protocol addresses on Arbitrum...");
  
  // Connect to the forked network
  const provider = new ethers.providers.JsonRpcProvider(process.env.ARBITRUM_SEPOLIA_RPC_URL);
  
  // USDC is a known address on Arbitrum
  const usdcAddress = "0xaf88d065e77c8cC2239327C5EDb3A432268e5831";
  console.log("USDC address:", usdcAddress);
  
  // Aave addresses can be found from the Aave address provider
  // This is the address provider for Aave V3 on Arbitrum
  const aaveAddressProvider = "0xa97684ead0e402dC232d5A977953DF7ECBaB3CDb";
  const addressProviderABI = [
    "function getPool() external view returns (address)",
    "function getReserveData(address asset) external view returns (tuple(uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint40))"
  ];
  
  const addressProvider = new ethers.Contract(aaveAddressProvider, addressProviderABI, provider);
  const aavePoolAddress = await addressProvider.getPool();
  console.log("Aave V3 Pool address:", aavePoolAddress);
  
  // For USDC aToken, we need to query the pool
  const aavePoolABI = [
    "function getReserveData(address asset) external view returns (tuple(uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint40))",
    "function getReserveTokensAddresses(address asset) external view returns (address aTokenAddress, address stableDebtTokenAddress, address variableDebtTokenAddress)"
  ];
  
  const aavePool = new ethers.Contract(aavePoolAddress, aavePoolABI, provider);
  
  try {
    const tokens = await aavePool.getReserveTokensAddresses(usdcAddress);
    console.log("USDC aToken address:", tokens.aTokenAddress);
  } catch (error) {
    console.log("Could not fetch aToken address. This may be due to differences in the Aave V3 interface.");
  }
  
  // Compound V3 on Arbitrum has comet deployments for each market
  const cometUSDC = "0xA5EDBDD9646f8dFF606d7448e414884C7d905dCA"; // This is the USDC market on Arbitrum
  console.log("Compound V3 USDC Comet address:", cometUSDC);
  
  // Getting some USDC holders to use for testing
  const usdcABI = [
    "function balanceOf(address account) external view returns (uint256)"
  ];
  
  const usdc = new ethers.Contract(usdcAddress, usdcABI, provider);
  
  // Large USDC holders on Arbitrum
  const potentialWhales = [
    "0x489ee077994B6658eAfA855C308275EAd8097C4A", // Arbitrum Bridge
    "0xB38e8c17e38363aF6EbdCb3dAE12e0243582891D", // Some exchange
    "0x0DBB0Ef6c85D7E5d8b2b4B034242f08E563799b3"  // Another holder
  ];
  
  console.log("\nChecking USDC balances for potential whales:");
  for (const whale of potentialWhales) {
    try {
      const balance = await usdc.balanceOf(whale);
      console.log(`${whale}: ${ethers.utils.formatUnits(balance, 6)} USDC`);
    } catch (error) {
      console.log(`Failed to check balance for ${whale}`);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
  