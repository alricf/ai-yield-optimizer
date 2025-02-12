import { useState } from "react";

const networks = ["Ethereum", "NEAR", "Aurora", "Arbitrum", "Optimism"];
const amms = ["Uniswap", "SushiSwap", "Balancer", "Aave"];

export default function NetworkSelector({ onSelectionChange }) {
  const [selectedNetworks, setSelectedNetworks] = useState([]);
  const [selectedAMMs, setSelectedAMMs] = useState([]);

  const toggleSelection = (item, list, setList) => {
    setList((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  return (
    <div className="p-4 bg-gray-900 text-white rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-2">Select Networks</h2>
      <div className="flex flex-wrap gap-2">
        {networks.map((network) => (
          <button
            key={network}
            onClick={() => toggleSelection(network, selectedNetworks, setSelectedNetworks)}
            className={`px-3 py-1 rounded-lg ${
              selectedNetworks.includes(network) ? "bg-blue-500" : "bg-gray-700"
            }`}
          >
            {network}
          </button>
        ))}
      </div>

      <h2 className="text-xl font-bold mt-4 mb-2">Select AMMs</h2>
      <div className="flex flex-wrap gap-2">
        {amms.map((amm) => (
          <button
            key={amm}
            onClick={() => toggleSelection(amm, selectedAMMs, setSelectedAMMs)}
            className={`px-3 py-1 rounded-lg ${
              selectedAMMs.includes(amm) ? "bg-green-500" : "bg-gray-700"
            }`}
          >
            {amm}
          </button>
        ))}
      </div>

      <button
        onClick={() => onSelectionChange(selectedNetworks, selectedAMMs)}
        className="mt-4 bg-purple-600 px-4 py-2 rounded-lg"
      >
        Confirm Selection
      </button>
    </div>
  );
}


