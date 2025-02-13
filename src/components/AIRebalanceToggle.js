import { useState } from "react";

export default function AIRebalanceToggle({ onToggle }) {
  const [enabled, setEnabled] = useState(false);

  const handleToggle = () => {
    const newState = !enabled;
    setEnabled(newState);
    onToggle(newState);
  };

  return (
    <div className="p-4 bg-gray-900 rounded-xl text-white mt-4">
      <h2 className="text-lg font-bold mb-2">AI Auto-Rebalancing</h2>
      <div className="flex items-center gap-2">
        <span>On/Off</span>
        <button
          className={`px-4 py-2 rounded-lg transition ${
            enabled ? "bg-green-500" : "bg-gray-700"
          }`}
          onClick={handleToggle}
        >
          {enabled ? "Enabled" : "Disabled"}
        </button>
        
      </div>
    </div>
  );
}

