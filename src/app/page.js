"use client"
import { useState } from "react";
import NetworkSelector from "../components/NetworkSelector";
import YieldTolerance from "../components/YieldTolerance";

export default function Home() {
  const [selection, setSelection] = useState({ networks: [], amms: [] });
  const [tolerance, setTolerance] = useState(5);

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-bold mb-4">AI Yield Optimizer</h1>
      <NetworkSelector onSelectionChange={setSelection} />
      <YieldTolerance onToleranceChange={setTolerance} />
      
      <div className="mt-4 text-center">
        <h2 className="text-lg font-bold">Selected Networks</h2>
        <p>{selection.networks.length ? selection.networks.join(", ") : "None"}</p>

        <h2 className="text-lg font-bold mt-2">Selected AMMs</h2>
        <p>{selection.amms.length ? selection.amms.join(", ") : "None"}</p>

        <h2 className="text-lg font-bold mt-2">Yield Difference Tolerance</h2>
        <p>{tolerance}%</p>
      </div>
    </main>
  );
}

