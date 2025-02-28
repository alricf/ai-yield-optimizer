require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      },
      viaIR: true // Add this to fix the "Stack too deep" error
    }
  },
  paths: {
    artifacts: './src/artifacts',
  },
  networks: {
    hardhat: {
      chainId: 42161, // Arbitrum One chainId
      forking: {
        url: process.env.ARBITRUM_SEPOLIA_RPC_URL || "",
        enabled: true, // Enable forking
        // Optional: You can specify a block number to fork from
        // blockNumber: 123456789, 
      }
    },
    arbitrum: {
      url: process.env.ARBITRUM_SEPOLIA_RPC_URL || "",
      // If you want to deploy to Arbitrum, add your private key here
      // accounts: [process.env.PRIVATE_KEY],
    }
  }
}

