import { useState } from "react";

const networks = ["Ethereum", "NEAR", "Aurora", "Arbitrum", "Optimism"];
const amms = ["Uniswap", "SushiSwap", "Balancer", "Aave"];

export default function NetworkSelector({ onSelectionChange }) {
  const [selectedNetworks, setSelectedNetworks] = useState([]);
  const [selectedAMMs, setSelectedAMMs] = useState([]);

  const handleNetworkChange = (network) => {
    const newSelection = selectedNetworks.includes(network)
      ? selectedNetworks.filter((n) => n !== network)
      : [...selectedNetworks, network];

    setSelectedNetworks(newSelection);
    onSelectionChange({ networks: newSelection, amms: selectedAMMs });
  };

  const handleAMMChange = (amm) => {
    const newSelection = selectedAMMs.includes(amm)
      ? selectedAMMs.filter((a) => a !== amm)
      : [...selectedAMMs, amm];

    setSelectedAMMs(newSelection);
    onSelectionChange({ networks: selectedNetworks, amms: newSelection });
  };

  return (
    <div className="p-4 bg-gray-900 rounded-xl text-white">
      <h2 className="text-lg font-bold mb-2">Select Networks</h2>
      <div className="flex flex-wrap gap-2">
        {networks.map((network) => (
          <button
            key={network}
            className={`px-4 py-2 rounded-lg ${
              selectedNetworks.includes(network)
                ? "bg-blue-500"
                : "bg-gray-700 hover:bg-gray-600"
            }`}
            onClick={() => handleNetworkChange(network)}
          >
            {network}
          </button>
        ))}
      </div>

      <h2 className="text-lg font-bold mt-4 mb-2">Select AMMs</h2>
      <div className="flex flex-wrap gap-2">
        {amms.map((amm) => (
          <button
            key={amm}
            className={`px-4 py-2 rounded-lg ${
              selectedAMMs.includes(amm) ? "bg-green-500" : "bg-gray-700 hover:bg-gray-600"
            }`}
            onClick={() => handleAMMChange(amm)}
          >
            {amm}
          </button>
        ))}
      </div>
    </div>
  );
}
