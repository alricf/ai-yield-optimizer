import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import YieldOptimizerABI from '../artifacts/contracts/YieldOptimizer.sol/YieldOptimizer.json';
import MockUSDCABI from '../artifacts/contracts/mocks/MockUSDC.sol/MockUSDC.json';
import MockAaveV3ABI from '../artifacts/contracts/mocks/MockAaveV3.sol/MockAaveV3.json';
import MockCompoundV3ABI from '../artifacts/contracts/mocks/MockCompoundV3.sol/MockCompoundV3.json';

// These would be set after deployment
const YIELD_OPTIMIZER_ADDRESS = process.env.REACT_APP_YIELD_OPTIMIZER_ADDRESS;
const USDC_ADDRESS = process.env.REACT_APP_USDC_ADDRESS;
const AAVE_ADDRESS = process.env.REACT_APP_AAVE_ADDRESS;
const COMPOUND_ADDRESS = process.env.REACT_APP_COMPOUND_ADDRESS;

const YieldOptimizerComponent = () => {
  const [account, setAccount] = useState(null);
  const [amount, setAmount] = useState('');
  const [currentProtocol, setCurrentProtocol] = useState('None');
  const [aaveRate, setAaveRate] = useState(0);
  const [compoundRate, setCompoundRate] = useState(0);
  const [totalBalance, setTotalBalance] = useState(0);
  const [usdcBalance, setUsdcBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Connect to wallet
  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        setLoading(true);
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setAccount(accounts[0]);
        await loadData(accounts[0]);
        setLoading(false);
      } catch (error) {
        console.error("Error connecting to wallet:", error);
        setError("Failed to connect wallet. Please try again.");
        setLoading(false);
      }
    } else {
      setError("Ethereum wallet not detected. Please install MetaMask.");
    }
  };

  // Load contract data
  const loadData = async (account) => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      // Load contracts
      const yieldOptimizer = new ethers.Contract(YIELD_OPTIMIZER_ADDRESS, YieldOptimizerABI.abi, signer);
      const usdc = new ethers.Contract(USDC_ADDRESS, MockUSDCABI.abi, signer);
      const aave = new ethers.Contract(AAVE_ADDRESS, MockAaveV3ABI.abi, signer);
      const compound = new ethers.Contract(COMPOUND_ADDRESS, MockCompoundV3ABI.abi, signer);
      
      // Get current protocol
      const protocol = await yieldOptimizer.currentProtocol();
      const protocolNames = ['None', 'Aave', 'Compound'];
      setCurrentProtocol(protocolNames[protocol]);
      
      // Get interest rates
      const aaveRateRaw = await aave.getInterestRate(USDC_ADDRESS);
      const compoundRateRaw = await compound.getSupplyRate(USDC_ADDRESS);
      
      // Convert to percentage (assuming rates are stored as 1e8 basis points)
      setAaveRate(parseFloat(ethers.formatUnits(aaveRateRaw, 6)).toFixed(2));
      setCompoundRate(parseFloat(ethers.formatUnits(compoundRateRaw, 6)).toFixed(2));
      
      // Get balances
      const totalBalanceRaw = await yieldOptimizer.getTotalBalance();
      const usdcBalanceRaw = await usdc.balanceOf(account);
      
      setTotalBalance(parseFloat(ethers.formatUnits(totalBalanceRaw, 6)).toFixed(2));
      setUsdcBalance(parseFloat(ethers.formatUnits(usdcBalanceRaw, 6)).toFixed(2));
    } catch (error) {
      console.error("Error loading data:", error);
      setError("Failed to load protocol data. Please check your connection.");
    }
  };

  // Deposit USDC
  const handleDeposit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      setError("Please enter a valid amount.");
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      const usdc = new ethers.Contract(USDC_ADDRESS, MockUSDCABI.abi, signer);
      const yieldOptimizer = new ethers.Contract(YIELD_OPTIMIZER_ADDRESS, YieldOptimizerABI.abi, signer);
      
      // Convert amount to USDC units (6 decimals)
      const amountInWei = ethers.parseUnits(amount, 6);
      
      // Approve the YieldOptimizer to spend USDC
      const approveTx = await usdc.approve(YIELD_OPTIMIZER_ADDRESS, amountInWei);
      await approveTx.wait();
      
      // Deposit to YieldOptimizer
      const depositTx = await yieldOptimizer.deposit(amountInWei);
      await depositTx.wait();
      
      setSuccess(`Successfully deposited ${amount} USDC`);
      setAmount('');
      
      // Refresh data
      await loadData(account);
      setLoading(false);
    } catch (error) {
      console.error("Error depositing:", error);
      setError("Failed to deposit. Please try again.");
      setLoading(false);
    }
  };

  // Withdraw USDC
  const handleWithdraw = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      setError("Please enter a valid amount.");
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      const yieldOptimizer = new ethers.Contract(YIELD_OPTIMIZER_ADDRESS, YieldOptimizerABI.abi, signer);
      
      // Convert amount to USDC units (6 decimals)
      const amountInWei = ethers.parseUnits(amount, 6);
      
      // Withdraw from YieldOptimizer
      const withdrawTx = await yieldOptimizer.withdraw(amountInWei);
      await withdrawTx.wait();
      
      setSuccess(`Successfully withdrew ${amount} USDC`);
      setAmount('');
      
      // Refresh data
      await loadData(account);
      setLoading(false);
    } catch (error) {
      console.error("Error withdrawing:", error);
      setError("Failed to withdraw. Please check your permissions or balance.");
      setLoading(false);
    }
  };

  // Rebalance funds
  const handleRebalance = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      const yieldOptimizer = new ethers.Contract(YIELD_OPTIMIZER_ADDRESS, YieldOptimizerABI.abi, signer);
      
      // Rebalance
      const rebalanceTx = await yieldOptimizer.rebalance();
      await rebalanceTx.wait();
      
      setSuccess("Successfully rebalanced funds to the best yield protocol");
      
      // Refresh data
      await loadData(account);
      setLoading(false);
    } catch (error) {
      console.error("Error rebalancing:", error);
      setError("Failed to rebalance. Please try again.");
      setLoading(false);
    }
  };

  // For debugging/testing: Set mock rates
  const setMockRates = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      const aave = new ethers.Contract(AAVE_ADDRESS, MockAaveV3ABI.abi, signer);
      const compound = new ethers.Contract(COMPOUND_ADDRESS, MockCompoundV3ABI.abi, signer);
      
      // Toggle rates to make the other protocol better
      let newAaveRate, newCompoundRate;
      
      if (parseFloat(aaveRate) > parseFloat(compoundRate)) {
        newAaveRate = ethers.parseUnits("2", 8); // 2%
        newCompoundRate = ethers.parseUnits("4", 8); // 4%
      } else {
        newAaveRate = ethers.parseUnits("5", 8); // 5%
        newCompoundRate = ethers.parseUnits("3", 8); // 3%
      }
      
      // Set new rates
      await aave.setInterestRate(USDC_ADDRESS, newAaveRate);
      await compound.setSupplyRate(USDC_ADDRESS, newCompoundRate);
      
      setSuccess("Successfully updated mock interest rates");
      
      // Refresh data
      await loadData(account);
      setLoading(false);
    } catch (error) {
      console.error("Error setting mock rates:", error);
      setError("Failed to set mock rates. Please try again.");
      setLoading(false);
    }
  };

  // UI render
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">USDC Yield Optimizer</h1>
      
      {/* Connection */}
      {!account ? (
        <button 
          onClick={connectWallet} 
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-4"
          disabled={loading}
        >
          {loading ? 'Connecting...' : 'Connect Wallet'}
        </button>
      ) : (
        <>
          <p className="mb-4">Connected: {account.slice(0, 6)}...{account.slice(-4)}</p>
          
          <div className="bg-gray-100 p-4 rounded mb-4">
            <h2 className="text-xl font-semibold mb-2">Protocol Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p><strong>Current Protocol:</strong> {currentProtocol}</p>
                <p><strong>USDC Balance:</strong> {usdcBalance} USDC</p>
                <p><strong>Deposited Balance:</strong> {totalBalance} USDC</p>
              </div>
              <div>
                <p><strong>Aave Interest Rate:</strong> {aaveRate}%</p>
                <p><strong>Compound Interest Rate:</strong> {compoundRate}%</p>
                <p><strong>Best Protocol:</strong> {parseFloat(aaveRate) > parseFloat(compoundRate) ? 'Aave' : 'Compound'}</p>
              </div>
            </div>
          </div>
          
          <div className="mb-4">
            <h2 className="text-xl font-semibold mb-2">Deposit or Withdraw</h2>
            <div className="flex flex-col md:flex-row gap-4 mb-4">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Amount (USDC)"
                className="px-4 py-2 border rounded"
              />
              <button 
                onClick={handleDeposit} 
                className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
                disabled={loading}
              >
                {loading ? 'Processing...' : 'Deposit'}
              </button>
              <button 
                onClick={handleWithdraw} 
                className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                disabled={loading}
              >
                {loading ? 'Processing...' : 'Withdraw'}
              </button>
            </div>
          </div>
          
          <div className="mb-4">
            <h2 className="text-xl font-semibold mb-2">Optimization</h2>
            <button 
              onClick={handleRebalance} 
              className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded mr-4"
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Rebalance Funds'}
            </button>
            
            {/* Only show this in development */}
            {process.env.NODE_ENV === 'development' && (
              <button 
                onClick={setMockRates} 
                className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
                disabled={loading}
              >
                {loading ? 'Processing...' : 'Toggle Mock Rates (Testing Only)'}
              </button>
            )}
          </div>
          
          {/* Messages */}
          {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
          {success && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">{success}</div>}
        </>
      )}
    </div>
  );
};

export default YieldOptimizerComponent;

