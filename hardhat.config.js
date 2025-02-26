require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.20",
  paths: {
    artifacts: './src/artifacts',
  },
  networks: {
hardhat: {
  chainId: 1337,
  forking: {
    // Optional: Fork Arbitrum Sepolia for more realistic testing
    url: process.env.ARBITRUM_SEPOLIA_RPC_URL || "",
    enabled: false,
  }
  }
}
}