

import { useState } from "react";

const defaultTolerances = [2, 5, 10]; // Default thresholds in %

export default function YieldTolerance({ onToleranceChange }) {
  const [tolerance, setTolerance] = useState(5); // Default to 5%

  const handleChange = (value) => {
    setTolerance(value);
    onToleranceChange(value);
  };

  return (
    <div className="p-4 bg-gray-900 rounded-xl text-white mt-4">
      <h2 className="text-lg font-bold mb-2">Set Yield Difference Tolerance</h2>
      <div className="flex gap-2">
        {defaultTolerances.map((value) => (
          <button
            key={value}
            className={`px-4 py-2 rounded-lg ${
              tolerance === value ? "bg-blue-500" : "bg-gray-700 hover:bg-gray-600"
            }`}
            onClick={() => handleChange(value)}
          >
            {value}%
          </button>
        ))}
      </div>
      <input
        type="number"
        className="mt-3 p-2 bg-gray-800 rounded-lg text-white w-full"
        placeholder="Custom %"
        value={tolerance}
        onChange={(e) => handleChange(Number(e.target.value))}
      />
    </div>
  );
}

