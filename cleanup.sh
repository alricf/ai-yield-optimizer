#!/bin/bash

# Clean the Hardhat cache and artifacts
echo "Cleaning Hardhat cache and artifacts..."
npx hardhat clean

# Print current directory structure
echo "Current directory structure:"
find contracts -type f | sort

# Compile the contracts
echo "Compiling contracts..."
npx hardhat compile
