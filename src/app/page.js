"use client"
import { useState } from "react";
import NetworkSelector from "../components/NetworkSelector";

export default function Home() {
  const [selectedData, setSelectedData] = useState({
    networks: [],
    amms: [],
  });

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground p-6">
      <h1 className="text-3xl font-bold mb-6">AI Yield Optimizer</h1>

      <NetworkSelector
        onSelectionChange={(networks, amms) =>
          setSelectedData({ networks, amms })
        }
      />

      <div className="mt-6 p-4 bg-gray-800 text-white rounded-lg">
        <h2 className="text-lg font-semibold">Selected Networks & AMMs</h2>
        <p>Networks: {selectedData.networks.join(", ") || "None"}</p>
        <p>AMMs: {selectedData.amms.join(", ") || "None"}</p>
      </div>
    </div>
  );
}

