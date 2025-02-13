import { useState } from "react";

const networks = ["Ethereum", "NEAR", "Aurora", "Arbitrum", "Optimism"];
const amms = ["Uniswap", "SushiSwap", "Balancer", "Aave"];

export default function NetworkSelector({ onSelectionChange }) {
  const [selectedNetworks, setSelectedNetworks] = useState([]);
  const [selectedAMMs, setSelectedAMMs] = useState([]);

  const toggleSelection = (item, list, setList) => {
    const newSelection = list.includes(item)
      ? list.filter((i) => i !== item)
      : [...list, item];
    setList(newSelection);
    onSelectionChange({ networks: selectedNetworks, amms: selectedAMMs });
  };

  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold mb-2">Select Networks</h2>
      <div className="flex flex-wrap gap-2">
        {networks.map((network) => (
          <button
            key={network}
            className={`px-4 py-2 rounded-md ${
              selectedNetworks.includes(network) ? "bg-blue-500" : "bg-gray-700 hover:bg-gray-600"
            } transition`}
            onClick={() => toggleSelection(network, selectedNetworks, setSelectedNetworks)}
          >
            {network}
          </button>
        ))}
      </div>

      <h2 className="text-lg font-semibold mt-4 mb-2">Select AMMs</h2>
      <div className="flex flex-wrap gap-2">
        {amms.map((amm) => (
          <button
            key={amm}
            className={`px-4 py-2 rounded-md ${
              selectedAMMs.includes(amm) ? "bg-green-500" : "bg-gray-700 hover:bg-gray-600"
            } transition`}
            onClick={() => toggleSelection(amm, selectedAMMs, setSelectedAMMs)}
          >
            {amm}
          </button>
        ))}
      </div>
    </div>
  );
}
