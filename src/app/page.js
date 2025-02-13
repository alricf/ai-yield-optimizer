"use client"

import { useState } from "react";
import NetworkSelector from "../components/NetworkSelector";
import YieldTolerance from "../components/YieldTolerance";
import RebalancingHistory from "../components/RebalancingHistory";
import AIRebalanceToggle from "../components/AIRebalanceToggle";

export default function Home() {
  const [selection, setSelection] = useState({ networks: [], amms: [] });
  const [tolerance, setTolerance] = useState(5);
  const [autoRebalance, setAutoRebalance] = useState(false);

  // Logging whenever state updates
const handleSelectionChange = (newSelection) => {
  console.log("Selected Networks:", newSelection.networks);
  console.log("Selected AMMs:", newSelection.amms);
  setSelection(newSelection);
};


  const handleToleranceChange = (newTolerance) => {
    console.log("Updated Yield Difference Tolerance:", newTolerance);
    setTolerance(newTolerance);
  };

  const handleRebalanceToggle = (enabled) => {
    console.log("AI Auto-Rebalancing:", enabled ? "Enabled" : "Disabled");
    setAutoRebalance(enabled);
  };

  return (
    <main className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-6">
      <h1 className="text-3xl font-semibold mb-6">AI Yield Optimizer</h1>

      <div className="w-full max-w-lg bg-gray-800 p-6 rounded-lg shadow-lg">
        <NetworkSelector onSelectionChange={handleSelectionChange} />
        <YieldTolerance onToleranceChange={handleToleranceChange} />
        <AIRebalanceToggle onToggle={handleRebalanceToggle} />
        <RebalancingHistory />
      </div>
    </main>
  );
}

